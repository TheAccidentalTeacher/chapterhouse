/**
 * Reddit OAuth Client
 *
 * Uses client_credentials flow (script app type) to search Reddit.
 * Requires REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET env vars.
 */

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const response = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) return null;

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.token;
}

export interface RedditResult {
  url: string;
  title: string;
  content: string;
  subreddit: string;
  score: number;
  commentCount: number;
  author: string;
  createdUtc: number;
}

export async function searchReddit(
  query: string,
  limit: number = 5
): Promise<RedditResult[]> {
  const token = await getAccessToken();
  if (!token) return [];

  const response = await fetch(
    `https://oauth.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&limit=${limit}&type=link`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "Chapterhouse/1.0 by /u/TheAccidentalTeacher",
      },
      signal: AbortSignal.timeout(8_000),
    }
  );

  if (!response.ok) return [];

  const data = await response.json();
  const children = data?.data?.children ?? [];

  return children.map(
    (child: {
      data: {
        permalink: string;
        title: string;
        selftext: string;
        subreddit: string;
        score: number;
        num_comments: number;
        author: string;
        created_utc: number;
      };
    }) => ({
      url: `https://www.reddit.com${child.data.permalink}`,
      title: child.data.title,
      content: child.data.selftext?.slice(0, 2000) || child.data.title,
      subreddit: child.data.subreddit,
      score: child.data.score,
      commentCount: child.data.num_comments,
      author: child.data.author,
      createdUtc: child.data.created_utc,
    })
  );
}
