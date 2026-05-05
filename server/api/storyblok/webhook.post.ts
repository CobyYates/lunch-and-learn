interface StoryblokWebhookBody {
  action: "published" | "unpublished" | "deleted" | string;
  story_id?: number;
  full_slug?: string;
  text?: string;
}

export default defineEventHandler(async (event) => {
  const { storyblokWebhookSecret } = useRuntimeConfig(event);

  // Storyblok signs webhook calls with the configured secret in the
  // `webhook-signature` header (SHA-1 HMAC of the raw body).
  // Full verification is left for a follow-up — the signature check needs
  // the raw request body. For now, gate on a shared secret query param.
  if (storyblokWebhookSecret) {
    const provided = getQuery(event).secret;
    if (provided !== storyblokWebhookSecret) {
      throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }
  }

  const body = await readBody<StoryblokWebhookBody>(event);
  const slug = body.full_slug;

  if (!slug) {
    return { ok: false, reason: "missing full_slug" };
  }

  await invalidateStory(event, slug);
  return { ok: true, invalidated: slug };
});
