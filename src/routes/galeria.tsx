import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout, PageHeader, Container } from "@/components/site/SiteLayout";

const albumesQO = queryOptions({
  queryKey: ["galeria_albumes"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("galeria_albumes")
      .select("id, titulo, descripcion, fecha, cover_path")
      .order("fecha", { ascending: false, nullsFirst: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/galeria")({
  head: () => ({
    meta: [
      { title: "Galería · Escuela Secundaria Técnica" },
      { name: "description", content: "Fotos de actividades, proyectos y eventos." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(albumesQO),
  component: GaleriaPage,
});

function GaleriaPage() {
  const { data: albumes } = useSuspenseQuery(albumesQO);
  return (
    <SiteLayout>
      <PageHeader title="Galería" lead="Imágenes de actividades, proyectos y eventos de la escuela." />
      <Container>
        {albumes.length === 0 ? (
          <p className="text-muted-foreground">
            Todavía no hay álbumes publicados. El equipo a cargo cargará las fotos próximamente.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {albumes.map((a) => (
              <Link key={a.id} to="/galeria" className="group block overflow-hidden rounded-md border border-border bg-card">
                <div className="aspect-[4/3] w-full bg-secondary">
                  {a.cover_path ? (
                    <img src={publicUrl(a.cover_path)} alt={a.titulo} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">Sin portada</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-lg font-semibold">{a.titulo}</h3>
                  {a.fecha && <p className="text-xs text-muted-foreground">{new Date(a.fecha).toLocaleDateString("es-AR")}</p>}
                  {a.descripcion && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{a.descripcion}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </SiteLayout>
  );
}

function publicUrl(path: string) {
  const { data } = supabase.storage.from("galeria").getPublicUrl(path);
  return data.publicUrl;
}
