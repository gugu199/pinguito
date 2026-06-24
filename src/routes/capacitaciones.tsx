import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { GraduationCap, MapPin, Clock, User, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout, PageHeader, Container } from "@/components/site/SiteLayout";

const capacitacionesQO = queryOptions({
  queryKey: ["capacitaciones", "publicas"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("capacitaciones")
      .select("id, nombre, descripcion, aula, dias, horario, responsable, destinatarios, cupo, estado, destacado, orden")
      .order("destacado", { ascending: false })
      .order("orden", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/capacitaciones")({
  head: () => ({ meta: [{ title: "Capacitaciones especiales · Escuela" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(capacitacionesQO),
  component: Page,
});

const ESTADO_LABEL: Record<string, string> = {
  abierta: "Inscripción abierta",
  en_curso: "En curso",
  cerrada: "Cerrada",
};

function Page() {
  const { data } = useSuspenseQuery(capacitacionesQO);

  return (
    <SiteLayout>
      <PageHeader
        title="Capacitaciones especiales"
        lead="Cursos, talleres y propuestas formativas que complementan la oferta académica."
      />
      <Container>
        {data.length === 0 ? (
          <p className="text-muted-foreground">No hay capacitaciones publicadas en este momento.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.map((c) => (
              <article key={c.id} className="rounded-md border border-border bg-card p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-secondary text-primary">
                      <GraduationCap className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <h2 className="font-serif text-lg font-semibold">{c.nombre}</h2>
                      {c.destinatarios && <p className="text-xs text-muted-foreground">Para: {c.destinatarios}</p>}
                    </div>
                  </div>
                  <span className="rounded bg-secondary px-2 py-1 text-xs text-foreground">{ESTADO_LABEL[c.estado] ?? c.estado}</span>
                </div>
                {c.descripcion && <p className="mt-3 text-sm text-muted-foreground">{c.descripcion}</p>}
                <dl className="mt-4 grid gap-1.5 text-sm">
                  {c.aula && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" aria-hidden /><span><span className="text-foreground">Aula:</span> {c.aula}</span></div>}
                  {(c.dias || c.horario) && <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" aria-hidden /><span><span className="text-foreground">Horario:</span> {[c.dias, c.horario].filter(Boolean).join(" · ")}</span></div>}
                  {c.responsable && <div className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" aria-hidden /><span><span className="text-foreground">A cargo:</span> {c.responsable}</span></div>}
                  {c.cupo != null && <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" aria-hidden /><span><span className="text-foreground">Cupo:</span> {c.cupo}</span></div>}
                </dl>
              </article>
            ))}
          </div>
        )}
      </Container>
    </SiteLayout>
  );
}
