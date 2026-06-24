import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout, PageHeader, Container } from "@/components/site/SiteLayout";
import { VideoEmbed } from "@/components/site/VideoEmbed";

const especialidadQO = (codigo: string) =>
  queryOptions({
    queryKey: ["especialidad", codigo],
    queryFn: async () => {
      const { data: esp } = await supabase
        .from("especialidades")
        .select("codigo, nombre, descripcion, video_url, salida_laboral")
        .eq("codigo", codigo as any)
        .maybeSingle();
      if (!esp) return null;
      const { data: materias, error } = await supabase
        .from("materias")
        .select("id, nombre, anio, orden")
        .eq("especialidad", codigo as any)
        .order("anio")
        .order("orden");
      if (error) throw error;
      const { data: proyectos } = await supabase
        .from("proyectos")
        .select("id, titulo, descripcion, autores, anio, foto_url, destacado")
        .eq("especialidad", codigo)
        .order("destacado", { ascending: false })
        .order("orden", { ascending: true })
        .limit(12);
      return { especialidad: esp, materias: materias ?? [], proyectos: proyectos ?? [] };
    },
  });

export const Route = createFileRoute("/materias/$especialidad")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(especialidadQO(params.especialidad));
    if (!data) throw notFound();
  },
  head: ({ params }) => ({
    meta: [{ title: `${params.especialidad.replace("_", " ")} · Materias` }],
  }),
  component: EspecialidadPage,
  notFoundComponent: () => (
    <SiteLayout><Container><p>Especialidad no encontrada.</p></Container></SiteLayout>
  ),
  errorComponent: ({ error }) => (
    <SiteLayout><Container><p role="alert">{error.message}</p></Container></SiteLayout>
  ),
});

function EspecialidadPage() {
  const { especialidad } = Route.useParams();
  const { data } = useSuspenseQuery(especialidadQO(especialidad));
  if (!data) return null;

  const porAnio = new Map<number, typeof data.materias>();
  for (const m of data.materias) {
    if (!porAnio.has(m.anio)) porAnio.set(m.anio, []);
    porAnio.get(m.anio)!.push(m);
  }
  const anios = Array.from(porAnio.keys()).sort((a, b) => a - b);

  return (
    <SiteLayout>
      <PageHeader title={data.especialidad.nombre} lead={data.especialidad.descripcion ?? undefined} />
      <Container>
        <div className="space-y-12">
          {(data.especialidad.video_url || data.especialidad.salida_laboral) && (
            <section className="grid gap-6 lg:grid-cols-2">
              {data.especialidad.video_url && (
                <div>
                  <h2 className="font-serif text-xl font-semibold">Video introductorio</h2>
                  <div className="mt-3">
                    <VideoEmbed url={data.especialidad.video_url} title={data.especialidad.nombre} />
                  </div>
                </div>
              )}
              {data.especialidad.salida_laboral && (
                <div>
                  <h2 className="font-serif text-xl font-semibold">Perfil del egresado y salida laboral</h2>
                  <p className="mt-3 whitespace-pre-line text-muted-foreground">{data.especialidad.salida_laboral}</p>
                </div>
              )}
            </section>
          )}

          <section>
            <h2 className="font-serif text-2xl font-semibold">Materias por año</h2>
            {anios.length === 0 ? (
              <p className="mt-3 text-muted-foreground">Todavía no se cargaron materias.</p>
            ) : (
              <div className="mt-4 space-y-8">
                {anios.map((anio) => (
                  <div key={anio}>
                    <h3 className="font-serif text-lg font-semibold">{anio}º año</h3>
                    <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {porAnio.get(anio)!.map((m) => (
                        <li key={m.id}>
                          <Link
                            to="/materias/$especialidad/$materiaId"
                            params={{ especialidad, materiaId: m.id }}
                            className="block rounded-md border border-border bg-card p-4 transition-colors hover:border-primary"
                          >
                            <h4 className="font-medium">{m.nombre}</h4>
                            <span className="text-xs text-muted-foreground">Ver recursos →</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold">Proyectos de alumnos</h2>
            {data.proyectos.length === 0 ? (
              <p className="mt-3 text-muted-foreground">Próximamente publicaremos proyectos de la especialidad.</p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.proyectos.map((p) => (
                  <article key={p.id} className="overflow-hidden rounded-md border border-border bg-card">
                    {p.foto_url && (
                      <img src={p.foto_url} alt={p.titulo} loading="lazy" className="aspect-video w-full object-cover" />
                    )}
                    <div className="p-4">
                      <h3 className="font-serif text-lg font-semibold">{p.titulo}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[p.anio && `${p.anio}`, p.autores].filter(Boolean).join(" · ")}
                      </p>
                      <p className="mt-2 line-clamp-4 text-sm text-muted-foreground">{p.descripcion}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </Container>
    </SiteLayout>
  );
}
