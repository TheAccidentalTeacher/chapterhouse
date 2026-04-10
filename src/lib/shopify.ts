/**
 * Shopify client for NCHO store — client credentials grant with auto-refreshing tokens.
 * Adapted from ncho-tools pattern. Read-only product/collection/blog access for
 * Chapterhouse social content strategy + product intelligence.
 */

// ── Token cache ──────────────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

const REFRESH_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before expiry

function getStoreUrl(): string {
  const store = process.env.SHOPIFY_STORE;
  if (!store) throw new Error("SHOPIFY_STORE env var is missing");
  return `https://${store}`;
}

function getApiVersion(): string {
  return process.env.SHOPIFY_API_VERSION || "2026-01";
}

/**
 * Client-credentials grant: POST to Shopify, cache the token for ~24h.
 * Auto-refreshes 5 minutes before expiry.
 */
async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - REFRESH_BUFFER_MS) {
    return cachedToken;
  }

  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET are required");
  }

  const res = await fetch(`${getStoreUrl()}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify token request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  // Shopify client-credential tokens expire in 24h
  tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;

  return cachedToken!;
}

// ── GraphQL helper ───────────────────────────────────────────

interface GqlResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
  extensions?: { cost?: { requestedQueryCost: number; actualQueryCost: number; throttleStatus: { maximumAvailable: number; currentlyAvailable: number; restoreRate: number } } };
}

/**
 * Execute a Shopify Admin GraphQL query with retry on 429.
 */
export async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const token = await getToken();
  const url = `${getStoreUrl()}/admin/api/${getApiVersion()}/graphql.json`;

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("Retry-After") || "2");
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      continue;
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Shopify GraphQL error (${res.status}): ${text}`);
    }

    const json = (await res.json()) as GqlResponse<T>;

    if (json.errors?.length && !json.data) {
      throw new Error(`Shopify GraphQL errors: ${json.errors.map((e) => e.message).join("; ")}`);
    }

    return json.data as T;
  }

  throw new Error("Shopify GraphQL: max retries exceeded (429)");
}

/**
 * Paginate a Shopify GraphQL connection query.
 * The query must contain `__AFTER__` placeholder where the cursor goes
 * and return a connection with `edges[].node` + `pageInfo.hasNextPage` + `pageInfo.endCursor`.
 *
 * @param query - GraphQL query string with `__AFTER__` placeholder
 * @param extractConnection - function to pull the connection object from the response
 * @param maxPages - safety cap (default 20)
 */
export async function paginateGql<TNode>(
  query: string,
  extractConnection: (data: Record<string, unknown>) => {
    edges: Array<{ node: TNode }>;
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  },
  maxPages = 20,
): Promise<TNode[]> {
  const allNodes: TNode[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < maxPages; page++) {
    const paginatedQuery = cursor
      ? query.replace("__AFTER__", `, after: "${cursor}"`)
      : query.replace("__AFTER__", "");

    const data = await gql<Record<string, unknown>>(paginatedQuery);
    const connection = extractConnection(data);

    for (const edge of connection.edges) {
      allNodes.push(edge.node);
    }

    if (!connection.pageInfo.hasNextPage || !connection.pageInfo.endCursor) break;
    cursor = connection.pageInfo.endCursor;

    // courtesy delay between pages
    if (page < maxPages - 1 && connection.pageInfo.hasNextPage) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return allNodes;
}

// ── REST helper (for endpoints not in GraphQL) ───────────────

export async function restGet<T>(path: string): Promise<T> {
  const token = await getToken();
  const url = `${getStoreUrl()}/admin/api/${getApiVersion()}${path}`;

  const res = await fetch(url, {
    headers: { "X-Shopify-Access-Token": token },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify REST error (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}

// ── Product queries ──────────────────────────────────────────

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  status: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  featuredImage: { url: string; altText: string | null } | null;
  seo: { title: string | null; description: string | null };
  variants: { edges: Array<{ node: { price: string; compareAtPrice: string | null } }> };
}

const PRODUCTS_QUERY = `query {
  products(first: 50 __AFTER__) {
    edges {
      node {
        id title handle status descriptionHtml vendor productType tags
        createdAt updatedAt
        featuredImage { url altText }
        seo { title description }
        variants(first: 3) { edges { node { price compareAtPrice } } }
      }
    }
    pageInfo { hasNextPage endCursor }
  }
}`;

type ProductConnection = {
  edges: Array<{ node: ShopifyProduct }>;
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
};

export async function fetchProducts(): Promise<ShopifyProduct[]> {
  return paginateGql<ShopifyProduct>(
    PRODUCTS_QUERY,
    (data) => (data as { products: ProductConnection }).products,
  );
}

export interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  descriptionHtml: string;
  productsCount: { count: number };
  image: { url: string; altText: string | null } | null;
}

const COLLECTIONS_QUERY = `query {
  collections(first: 50 __AFTER__) {
    edges {
      node {
        id title handle descriptionHtml
        productsCount { count }
        image { url altText }
      }
    }
    pageInfo { hasNextPage endCursor }
  }
}`;

export async function fetchCollections(): Promise<ShopifyCollection[]> {
  return paginateGql<ShopifyCollection>(
    COLLECTIONS_QUERY,
    (data) => (data as { collections: { edges: Array<{ node: ShopifyCollection }>; pageInfo: { hasNextPage: boolean; endCursor: string | null } } }).collections,
  );
}

// ── Shop info ────────────────────────────────────────────────

export interface ShopInfo {
  shop: {
    name: string;
    email: string;
    myshopifyDomain: string;
    plan: { displayName: string };
    currencyCode: string;
    primaryDomain: { url: string };
  };
}

export async function fetchShopInfo(): Promise<ShopInfo> {
  return gql<ShopInfo>(`query {
    shop {
      name email myshopifyDomain
      plan { displayName }
      currencyCode
      primaryDomain { url }
    }
  }`);
}

// ── Blog queries ─────────────────────────────────────────────

export interface ShopifyBlog {
  id: string;
  title: string;
  handle: string;
}

export interface ShopifyArticle {
  id: string;
  title: string;
  handle: string;
  body: string;
  summary: string | null;
  tags: string[];
  publishedAt: string | null;
  createdAt: string;
  blog: { id: string; title: string };
  seo: { title: string | null; description: string | null };
  image: { url: string; altText: string | null } | null;
}

/**
 * Fetch all blogs on the store. NCHO typically has one ("News").
 */
export async function fetchBlogs(): Promise<ShopifyBlog[]> {
  const data = await gql<{ blogs: { edges: Array<{ node: ShopifyBlog }> } }>(`query {
    blogs(first: 10) {
      edges { node { id title handle } }
    }
  }`);
  return data.blogs.edges.map((e) => e.node);
}

/**
 * Fetch articles from a specific blog.
 */
export async function fetchArticles(blogId: string, limit = 50): Promise<ShopifyArticle[]> {
  const data = await gql<{ blog: { articles: { edges: Array<{ node: ShopifyArticle }> } } | null }>(`query($id: ID!) {
    blog(id: $id) {
      articles(first: ${limit}, sortKey: PUBLISHED_AT, reverse: true) {
        edges {
          node {
            id title handle body summary tags publishedAt createdAt
            blog { id title }
            seo { title description }
            image { url altText }
          }
        }
      }
    }
  }`, { id: blogId });
  return data.blog?.articles.edges.map((e) => e.node) ?? [];
}

export interface CreateArticleInput {
  title: string;
  body: string;
  summary?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  isPublished?: boolean;
}

interface ArticleCreateResult {
  articleCreate: {
    article: { id: string; handle: string; title: string; onlineStoreUrl: string | null } | null;
    userErrors: Array<{ field: string[]; message: string }>;
  };
}

/**
 * Create an article on the NCHO Shopify blog.
 * Auto-fetches the first blog ID if not provided.
 */
export async function createArticle(
  input: CreateArticleInput,
  blogId?: string,
): Promise<{ articleId: string; handle: string; url: string | null }> {
  // Auto-fetch blog ID
  if (!blogId) {
    const blogs = await fetchBlogs();
    if (blogs.length === 0) throw new Error("No blogs found on Shopify store");
    blogId = blogs[0].id;
  }

  const mutation = `mutation articleCreate($article: ArticleCreateInput!) {
    articleCreate(article: $article) {
      article {
        id
        handle
        title
        onlineStoreUrl
      }
      userErrors {
        field
        message
      }
    }
  }`;

  const variables = {
    article: {
      blogId,
      title: input.title,
      body: input.body,
      summary: input.summary || undefined,
      tags: input.tags || [],
      author: { name: "Next Chapter Homeschool Outpost" },
      isPublished: input.isPublished ?? false,
      seo: (input.seoTitle || input.seoDescription)
        ? { title: input.seoTitle, description: input.seoDescription }
        : undefined,
    },
  };

  const result = await gql<ArticleCreateResult>(mutation, variables);

  if (result.articleCreate.userErrors.length > 0) {
    const errMsg = result.articleCreate.userErrors
      .map((e) => `${e.field.join(".")}: ${e.message}`)
      .join("; ");
    throw new Error(`Shopify articleCreate errors: ${errMsg}`);
  }

  if (!result.articleCreate.article) {
    throw new Error("Shopify articleCreate returned no article and no errors");
  }

  return {
    articleId: result.articleCreate.article.id,
    handle: result.articleCreate.article.handle,
    url: result.articleCreate.article.onlineStoreUrl,
  };
}

// ── Quick health check ───────────────────────────────────────

export async function shopifyHealthCheck(): Promise<{ ok: boolean; shopName?: string; error?: string }> {
  try {
    const info = await fetchShopInfo();
    return { ok: true, shopName: info.shop.name };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
