import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { FileText, Video, BookOpen, ClipboardList, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout, PageHeader, Container } from "@/components/site/SiteLayout";
import { RECURSO_TIPOS } from "@/lib/site-config";

const materiaQO = (id: string) =>
  queryOptions({
    queryKey: ["materia", id],
    queryFn: async () => {
      const { data: materia } = await supabase
        .from("materias")
        .select("id, nombre, anio, descripcion, especialidad")
        .eq("id", id)
        .maybeSingle();
      if (!materia) return null;
      const { data: recursos, error } = await supabase
        .from("recursos")
        .select("id, tipo, titulo, descripcion, url, archivo_path, etiquetas, created_at")
        .eq("materia_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return { materia, recursos: recursos ?? [] };
    },
  });

export const Route = createFileRoute("/materias/$especialidad/$materiaId")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(materiaQO(params.materiaId));
    if (!data) throw notFound();
  },
  component: MateriaPage,
  notFoundComponent: () => <SiteLayout><Container><p>Materia no encontrada.</p></Container></SiteLayout>,
  errorComponent: ({ error }) => <SiteLayout><Container><p role="alert">{error.message}</p></Container></SiteLayout>,
});

const TIPO_ICON: Record<string, typeof FileText> = {
  apunte: FileText,
  guia: ClipboardList,
  video: Video,
  bibliografia: BookOpen,
};

function MateriaPage() {
  const { especialidad, materiaId } = Route.useParams();
  const { data } = useSuspenseQuery(materiaQO(materiaId));
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");

  if (!data) return null;
  const recursos = tipoFiltro === "todos" ? data.recursos : data.recursos.filter((r) => r.tipo === tipoFiltro);

  return (
    <SiteLayout>
      <PageHeader title={`${data.materia.nombre} · ${data.materia.anio}º año`} lead={data.materia.descripcion ?? undefined} />
      <Container>
        <Link to="/materias/$especialidad" params={{ especialidad }} className="mb-4 inline-block text-sm text-primary hover:underline">
          ← Volver a la especialidad
        </Link>

        <div className="mb-6 flex flex-wrap gap-2">
          {[{ value: "todos", label: "Todos" }, ...RECURSO_TIPOS].map((t) => (
            <button
              key={t.value}
              onClick={() => setTipoFiltro(t.value)}
              className={
                "rounded-md border px-3 py-1.5 text-sm font-medium " +
                (tipoFiltro === t.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary")
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {recursos.length === 0 ? (
          <p className="text-muted-foreground">No hay recursos cargados para este filtro.</p>
        ) : (
          <ul className="space-y-3">
            {recursos.map((r) => {
              const Icon = TIPO_ICON[r.tipo] ?? FileText;
              const href = r.url || (r.archivo_path ? archivoUrl(r.archivo_path) : "#");
              return (
                <li key={r.id} className="flex gap-4 rounded-md border border-border bg-card p-4">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-secondary text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{r.tipo}</p>
                    <h3 className="font-medium text-foreground">{r.titulo}</h3>
                    {r.descripcion && <p className="mt-1 text-sm text-muted-foreground">{r.descripcion}</p>}
                    {r.etiquetas?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {r.etiquetas.map((e) => (
                          <span key={e} className="rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{e}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {(r.url || r.archivo_path) && (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="self-center text-sm font-medium text-primary hover:underline"
                    >
                      Abrir <ExternalLink className="inline h-3 w-3" aria-hidden />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </SiteLayout>
  );
}

function archivoUrl(path: string) {
  const { data } = supabase.storage.from("recursos").getPublicUrl(path);
  return data.publicUrl;
}
