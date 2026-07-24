import type { NextRequest } from "next/server";

/**
 * Relais same-origin pour la vidéo "matériaux" de Notre histoire.
 *
 * `NotreHistoire.tsx` dessine la vidéo sur un `<canvas>` pour en détourer
 * le fond pixel par pixel (`getImageData`). Le CDN Higgsfield d'origine
 * (CloudFront) ne renvoie pas d'en-têtes CORS lisibles côté navigateur : le
 * canvas devient "taintée" dès qu'on y dessine une frame cross-origin, et
 * toute lecture de pixels lève une `SecurityError` — c'est exactement ce
 * qui faisait échouer silencieusement le détourage (fond toujours visible,
 * confirmé par un retour client). En sortant la vidéo par cette route sous
 * notre propre origine, le navigateur la traite comme same-origin et
 * l'accès aux pixels fonctionne normalement.
 */

const SOURCE_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_3AOufDgdu5BZqUoyRdkQOitlUqQ/hf_20260723_190609_0a1973fa-f788-4814-8e66-ab39572d87b8.mp4";

export async function GET(request: NextRequest) {
  const range = request.headers.get("range");

  let upstream: Response;
  try {
    upstream = await fetch(SOURCE_URL, {
      headers: range ? { range } : undefined,
    });
  } catch {
    return new Response("Vidéo indisponible", { status: 502 });
  }

  if (!upstream.ok && upstream.status !== 206) {
    return new Response("Vidéo indisponible", { status: 502 });
  }

  const headers = new Headers();
  headers.set("Content-Type", upstream.headers.get("content-type") ?? "video/mp4");
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  const contentLength = upstream.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);
  const contentRange = upstream.headers.get("content-range");
  if (contentRange) headers.set("Content-Range", contentRange);

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
