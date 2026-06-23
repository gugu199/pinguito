import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout, PageHeader, Container } from "@/components/site/SiteLayout";

const eventosQO = queryOptions({
  queryKey: ["eventos", "todos"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("eventos_calendario")
      .select("id, titulo, descripcion, tipo, fecha_inicio, fecha_fin")
      .order("fecha_inicio", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Calendario · Escuela Secundaria Técnica" },
      { name: "description", content: "Exámenes, actividades y eventos institucionales." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(eventosQO),
  component: CalendarioPage,
});

const TIPO_STYLE: Record<string, string> = {
  examen: "bg-cdec text-cdec-foreground",
  actividad: "bg-primary text-primary-foreground",
  evento: "bg-familias text-familias-foreground",
};
const TIPO_LABEL: Record<string, string> = {
  examen: "Examen",
  actividad: "Actividad",
  evento: "Evento",
};

function CalendarioPage() {
  const { data: eventos } = useSuspenseQuery(eventosQO);
  const ahora = new Date();
  const proximos = eventos.filter((e) => new Date(e.fecha_inicio) >= ahora);
  const pasados = eventos.filter((e) => new Date(e.fecha_inicio) < ahora).reverse();

  return (
    <SiteLayout>
      <PageHeader title="Calendario" lead="Exámenes, actividades y eventos institucionales." />
      <Container>
        <section>
          <h2 className="font-serif text-xl font-semibold">Próximos</h2>
          <EventList items={proximos} />
        </section>
        <section className="mt-10">
          <h2 className="font-serif text-xl font-semibold">Pasados</h2>
          <EventList items={pasados} empty="Sin registros anteriores." />
        </section>
      </Container>
    </SiteLayout>
  );
}

function EventList({ items, empty = "Sin eventos." }: { items: Array<{ id: string; titulo: string; descripcion: string | null; tipo: string; fecha_inicio: string; fecha_fin: string | null }>; empty?: string }) {
  if (items.length === 0) return <p className="mt-3 text-muted-foreground">{empty}</p>;
  return (
    <ul className="mt-4 divide-y divide-border rounded-md border border-border bg-card">
      {items.map((e) => (
        <li key={e.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
          <div className="flex w-16 flex-col items-center rounded-md bg-secondary py-2 text-center">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {new Date(e.fecha_inicio).toLocaleDateString("es-AR", { month: "short" })}
            </span>
            <span className="font-serif text-2xl font-semibold text-primary">
              {new Date(e.fecha_inicio).getDate()}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${TIPO_STYLE[e.tipo]}`}>
                {TIPO_LABEL[e.tipo] ?? e.tipo}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(e.fecha_inicio).toLocaleString("es-AR", { dateStyle: "long", timeStyle: "short" })}
              </span>
            </div>
            <h3 className="mt-1 font-medium text-foreground">{e.titulo}</h3>
            {e.descripcion ? <p className="mt-1 text-sm text-muted-foreground">{e.descripcion}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
