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

// ── Quick health check ───────────────────────────────────────

export async function shopifyHealthCheck(): Promise<{ ok: boolean; shopName?: string; error?: string }> {
  try {
    const info = await fetchShopInfo();
    return { ok: true, shopName: info.shop.name };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
