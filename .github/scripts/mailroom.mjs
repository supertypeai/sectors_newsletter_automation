// Shared spine for the newsletter CI scripts: fail-loudly exit, and one place that
// knows how to talk to the mailroom API. Both callers run unattended in a GitHub
// Action, where a half-understood failure is worse than a stopped job, so every
// helper here either succeeds or exits non-zero with the server's own message.

/** Print and exit non-zero. Every failure path in these scripts goes through here. */
export const die = (msg) => {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
};

/**
 * POST to mailroom and return the parsed JSON body.
 *
 * `body` may be a FormData (sent as multipart, boundary set by fetch) or a plain
 * object (sent as JSON). The Authorization header is added here so no caller has to
 * remember the Bearer prefix, and a non-2xx response is fatal rather than returned,
 * since neither caller has a meaningful way to continue without the response.
 */
export async function postToMailroom(url, { apiKey, body, headers = {}, what = "request" }) {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      // Let fetch set Content-Type for FormData: it has to include the multipart
      // boundary, and setting it by hand produces a body the server can't parse.
      ...(isForm ? {} : { "content-type": "application/json" }),
      ...headers,
    },
    body: isForm ? body : JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) die(`${what} failed (${res.status}): ${text}`);

  try {
    return JSON.parse(text);
  } catch {
    die(`${what} returned unparseable JSON: ${text}`);
  }
}
