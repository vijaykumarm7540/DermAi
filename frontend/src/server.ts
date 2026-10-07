// Simplified server.ts for local Vite development
// The Lovable.dev SSR server entry is not needed in standard Vite dev mode.

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

export function handleServerError(error: unknown): Response {
  console.error(consumeLastCapturedError() ?? error);
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(_request: Request) {
    return new Response(renderErrorPage("SSR not available in local dev mode"), {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
};
