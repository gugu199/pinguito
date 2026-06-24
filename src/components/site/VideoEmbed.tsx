function parseEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host === "youtube.com" && u.pathname.startsWith("/embed/")) return url;
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    if (host === "player.vimeo.com") return url;
    return url; // fallback: try as-is
  } catch {
    return null;
  }
}

export function VideoEmbed({ url, title }: { url: string; title?: string }) {
  const src = parseEmbed(url);
  if (!src) return null;
  return (
    <div className="relative w-full overflow-hidden rounded-md border border-border bg-card" style={{ paddingTop: "56.25%" }}>
      <iframe
        src={src}
        title={title ?? "Video"}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
