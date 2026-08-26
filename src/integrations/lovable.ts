import { supabase } from "@/integrations/supabase/client";

function isPreviewSurface() {
  if (typeof window === "undefined") return false;
  const host = location.hostname;
  const PREVIEW_ZONES = ["lovableproject.com", "lovableproject-dev.com", "lovable.app", "gpt-eng.com", "gptengineer.run"];
  return PREVIEW_ZONES.some((z) => host === z || host.endsWith("." + z));
}

function editorOrigins(): string[] {
  if (typeof window === "undefined") return [];
  const host = location.hostname;
  const dev = host.endsWith(".lovableproject-dev.com") || host.endsWith(".gpt-eng.com");
  const ancestor = (location.ancestorOrigins && location.ancestorOrigins[0]) || (document.referrer ? new URL(document.referrer).origin : "");
  const EDITOR = dev
    ? /^https:\/\/([a-z0-9-]+\.)*(lovable\.dev|gptengineer\.app)$|^http:\/\/localhost:3000$/
    : /^https:\/\/([a-z0-9-]+\.)*(lovable\.dev|gptengineer\.app)$/;
  if (ancestor && EDITOR.test(ancestor)) return [ancestor];
  return dev ? ["https://lovable.dev", "http://localhost:3000"] : ["https://lovable.dev"];
}

async function signInWithOAuthPreview(provider: string, redirect_uri: string) {
  return new Promise<void>((resolve, reject) => {
    const requestId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const timeout = setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(new Error("Timeout esperando inicio de OAuth"));
    }, 5000);

    const handler = (e: MessageEvent) => {
      if (!editorOrigins().includes(e.origin)) return;
      const d = e.data;
      if (d?.type === "lovable-preview-auth:oauth-result" && d.requestId === requestId) {
        clearTimeout(timeout);
        window.removeEventListener("message", handler);
        if (d.error) reject(new Error(d.error));
        else resolve();
      }
    };

    window.addEventListener("message", handler);
    const msg = {
      type: "lovable-preview-auth:oauth",
      requestId,
      provider,
      redirect_uri,
    };
    for (const origin of editorOrigins()) {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(msg, origin);
      }
    }
  });
}

export const lovable = {
  auth: {
    async signInWithOAuth(provider: "google" | "apple" | "microsoft", { redirect_uri }: { redirect_uri: string }) {
      if (isPreviewSurface() && window.parent && window.parent !== window) {
        await signInWithOAuthPreview(provider, redirect_uri);
        return;
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirect_uri },
      });
      if (error) throw error;
    },
  },
};
