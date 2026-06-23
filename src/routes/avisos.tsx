import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout, PageHeader, Container } from "@/components/site/SiteLayout";
import { AvisoCard } from "@/components/site/AvisoCard";
import { AVISO_CATEGORIAS } from "@/lib/site-config";

const avisosQO = queryOptions({
  queryKey: ["avisos", "todos"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("avisos")
      .select("id, titulo, contenido, categoria, destacado, publicado_en")
      .order("publicado_en", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/avisos")({
  head: () => ({
    meta: [
      { title: "Avisos · Escuela Secundaria Técnica" },
      { name: "description", content: "Avisos institucionales, del Centro de Estudiantes y para las familias." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(avisosQO),
  component: AvisosPage,
});

function AvisosPage() {
  const { data: avisos } = useSuspenseQuery(avisosQO);
  const [filtro, setFiltro] = useState<"todos" | "institucional" | "centro_estudiantes" | "familias">("todos");

  const visibles = filtro === "todos" ? avisos : avisos.filter((a) => a.categoria === filtro);

  return (
    <SiteLayout>
      <PageHeader title="Avisos" lead="Comunicados oficiales de la escuela, el Centro de Estudiantes y avisos para familias." />
      <Container>
        <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por categoría">
          {[
            { value: "todos", label: "Todos" },
            ...AVISO_CATEGORIAS,
          ].map((opt) => (
            <button
              key={opt.value}
              role="tab"
              aria-selected={filtro === opt.value}
              onClick={() => setFiltro(opt.value as typeof filtro)}
              className={
                "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors " +
                (filtro === opt.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary")
              }
            >
              {opt.label}
            </button>
          ))}
        </div>

        {visibles.length === 0 ? (
          <p className="text-muted-foreground">No hay avisos en esta categoría.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visibles.map((a) => (
              <AvisoCard key={a.id} aviso={a} />
            ))}
          </div>
        )}
      </Container>
    </SiteLayout>
  );
}
