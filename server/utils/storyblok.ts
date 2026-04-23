import type { H3Event } from "h3";

const STORYBLOK_API = "https://api.storyblok.com/v2/cdn";
const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24h — refreshed by webhook on publish

export interface StoryblokStory {
  story: unknown;
  cv: number;
  rels: unknown[];
  links: unknown[];
}

export function getStoryblokKV(event: H3Event): KVNamespace | null {
  const env = event.context.cloudflare?.env as
    | { STORYBLOK_CACHE?: KVNamespace }
    | undefined;
  return env?.STORYBLOK_CACHE ?? null;
}

export async function fetchStoryFromStoryblok(
  slug: string,
  token: string,
  version: "published" | "draft" = "published",
): Promise<StoryblokStory> {
  const url = `${STORYBLOK_API}/stories/${slug}?token=${token}&version=${version}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw createError({
      statusCode: res.status,
      statusMessage: `Storyblok: ${res.statusText}`,
    });
  }
  return (await res.json()) as StoryblokStory;
}

export async function getStoryCached(
  event: H3Event,
  slug: string,
  token: string,
): Promise<StoryblokStory> {
  const kv = getStoryblokKV(event);
  const key = `story:${slug}`;

  if (kv) {
    const cached = await kv.get(key, "json");
    if (cached) return cached as StoryblokStory;
  }

  const data = await fetchStoryFromStoryblok(slug, token, "published");

  if (kv) {
    event.waitUntil(
      kv.put(key, JSON.stringify(data), { expirationTtl: CACHE_TTL_SECONDS }),
    );
  }

  return data;
}

export async function invalidateStory(event: H3Event, slug: string) {
  const kv = getStoryblokKV(event);
  if (!kv) return;
  await kv.delete(`story:${slug}`);
}
