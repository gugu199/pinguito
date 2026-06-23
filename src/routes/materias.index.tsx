import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout, PageHeader, Container } from "@/components/site/SiteLayout";

const especialidadesQO = queryOptions({
  queryKey: ["especialidades"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("especialidades")
      .select("codigo, nombre, descripcion, orden")
      .order("orden");
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/materias/")({
  head: () => ({
    meta: [
      { title: "Materias y especialidades · Escuela Secundaria Técnica" },
      { name: "description", content: "Ciclo Básico y especialidades en Informática, Alimentos y Electrónica." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(especialidadesQO),
  component: MateriasHub,
});

function MateriasHub() {
  const { data } = useSuspenseQuery(especialidadesQO);
  return (
    <SiteLayout>
      <PageHeader
        title="Materias y especialidades"
        lead="Ciclo Básico común (1º a 3º) y tres especialidades a partir de 4º año."
      />
      <Container>
        <div className="grid gap-6 md:grid-cols-2">
          {data.map((e) => (
            <Link
              key={e.codigo}
              to="/materias/$especialidad"
              params={{ especialidad: e.codigo }}
              className="rounded-md border border-border bg-card p-6 transition-colors hover:border-primary"
            >
              <h2 className="font-serif text-2xl font-semibold text-foreground">{e.nombre}</h2>
              {e.descripcion && <p className="mt-2 text-muted-foreground">{e.descripcion}</p>}
              <span className="mt-4 inline-block text-sm font-medium text-primary">Ver materias →</span>
            </Link>
          ))}
        </div>
      </Container>
    </SiteLayout>
  );
}
