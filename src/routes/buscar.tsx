import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout, PageHeader, Container } from "@/components/site/SiteLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({ q: z.string().optional().default("") });

export const Route = createFileRoute("/buscar")({
  validateSearch: searchSchema,
  head: () => ({ meta: [
    { title: "Buscar · Escuela Secundaria Técnica" },
    { name: "description", content: "Buscá avisos, materias, recursos y eventos publicados en el sitio de la escuela." },
    { property: "og:title", content: "Buscar · Escuela Secundaria Técnica" },
    { property: "og:description", content: "Buscá avisos, materias, recursos y eventos publicados en el sitio de la escuela." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: BuscarPage,
});

function BuscarPage() {
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [term, setTerm] = useState(q);

  const { data, isLoading } = useQuery({
    queryKey: ["buscar", q],
    enabled: q.trim().length > 1,
    queryFn: async () => {
      const like = `%${q.trim()}%`;
      const [avisos, materias, recursos, eventos] = await Promise.all([
        supabase.from("avisos").select("id, titulo, categoria").or(`titulo.ilike.${like},contenido.ilike.${like}`).limit(20),
        supabase.from("materias").select("id, nombre, especialidad, anio").ilike("nombre", like).limit(20),
        supabase.from("recursos").select("id, titulo, materia_id, tipo").or(`titulo.ilike.${like},descripcion.ilike.${like}`).limit(20),
        supabase.from("eventos_calendario").select("id, titulo, tipo, fecha_inicio").or(`titulo.ilike.${like},descripcion.ilike.${like}`).limit(20),
      ]);
      return {
        avisos: avisos.data ?? [],
        materias: materias.data ?? [],
        recursos: recursos.data ?? [],
        eventos: eventos.data ?? [],
      };
    },
  });

  return (
    <SiteLayout>
      <PageHeader title="Buscar" lead="Encontrá avisos, materias, recursos y eventos por palabra clave." />
      <Container>
        <form
          onSubmit={(e) => { e.preventDefault(); navigate({ search: { q: term } }); }}
          className="mb-8 flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Escribí lo que querés buscar…" className="pl-9" aria-label="Texto de búsqueda" />
          </div>
          <Button type="submit">Buscar</Button>
        </form>

        {q.trim().length < 2 ? (
          <p className="text-muted-foreground">Escribí al menos 2 caracteres.</p>
        ) : isLoading ? (
          <p className="text-muted-foreground">Buscando…</p>
        ) : (
          <div className="space-y-8">
            <ResultSection title="Avisos" items={data?.avisos ?? []} renderItem={(a: any) => (
              <Link to="/avisos" className="font-medium text-foreground hover:underline">{a.titulo}</Link>
            )} />
            <ResultSection title="Materias" items={data?.materias ?? []} renderItem={(m: any) => (
              <Link to="/materias/$especialidad/$materiaId" params={{ especialidad: m.especialidad, materiaId: m.id }} className="font-medium text-foreground hover:underline">
                {m.nombre} · {m.anio}º año
              </Link>
            )} />
            <ResultSection title="Recursos" items={data?.recursos ?? []} renderItem={(r: any) => (
              <span className="font-medium text-foreground">{r.titulo} <span className="text-xs text-muted-foreground">({r.tipo})</span></span>
            )} />
            <ResultSection title="Eventos" items={data?.eventos ?? []} renderItem={(e: any) => (
              <Link to="/calendario" className="font-medium text-foreground hover:underline">{e.titulo}</Link>
            )} />
          </div>
        )}
      </Container>
    </SiteLayout>
  );
}

function ResultSection({ title, items, renderItem }: { title: string; items: any[]; renderItem: (i: any) => React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-xl font-semibold">{title} <span className="text-sm font-normal text-muted-foreground">({items.length})</span></h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Sin resultados.</p>
      ) : (
        <ul className="mt-2 divide-y divide-border rounded-md border border-border bg-card">
          {items.map((it) => <li key={it.id} className="p-3">{renderItem(it)}</li>)}
        </ul>
      )}
    </section>
  );
}
