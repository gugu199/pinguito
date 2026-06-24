import { MapPin, ExternalLink } from "lucide-react";

type Props = {
  direccion: string;
  lat?: string | null;
  lng?: string | null;
  zoom?: string | null;
};

export function SchoolMap({ direccion, lat, lng, zoom }: Props) {
  const hasCoords = !!(lat && lng);
  const q = hasCoords ? `${lat},${lng}` : direccion;
  const z = zoom ?? "16";
  // Iframe embed sin API key (Google Maps básico)
  const embedSrc = `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=${z}&output=embed`;
  const openUrl = `https://www.google.com/maps?q=${encodeURIComponent(q)}`;

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <div className="relative w-full" style={{ paddingTop: "50%" }}>
        <iframe
          src={embedSrc}
          title="Ubicación de la escuela"
          className="absolute inset-0 h-full w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-3 text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" aria-hidden /> {direccion}
        </span>
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
        >
          Abrir en Google Maps <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>
    </div>
  );
}
