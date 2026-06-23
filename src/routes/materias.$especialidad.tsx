import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout, PageHeader, Container } from "@/components/site/SiteLayout";

const especialidadQO = (codigo: string) =>
  queryOptions({
    queryKey: ["especialidad", codigo],
    queryFn: async () => {
      const { data: esp } = await supabase
        .from("especialidades")
        .select("codigo, nombre, descripcion")
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
      return { especialidad: esp, materias: materias ?? [] };
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
        {anios.length === 0 ? (
          <p className="text-muted-foreground">Todavía no se cargaron materias.</p>
        ) : (
          <div className="space-y-8">
            {anios.map((anio) => (
              <section key={anio}>
                <h2 className="font-serif text-xl font-semibold">{anio}º año</h2>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {porAnio.get(anio)!.map((m) => (
                    <li key={m.id}>
                      <Link
                        to="/materias/$especialidad/$materiaId"
                        params={{ especialidad, materiaId: m.id }}
                        className="block rounded-md border border-border bg-card p-4 transition-colors hover:border-primary"
                      >
                        <h3 className="font-medium">{m.nombre}</h3>
                        <span className="text-xs text-muted-foreground">Ver recursos →</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Container>
    </SiteLayout>
  );
}
