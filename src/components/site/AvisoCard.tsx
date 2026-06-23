import { Badge } from "@/components/ui/badge";

type Aviso = {
  id: string;
  titulo: string;
  contenido: string;
  categoria: "institucional" | "centro_estudiantes" | "familias";
  destacado: boolean;
  publicado_en: string;
};

const CATEGORIA_LABEL: Record<Aviso["categoria"], string> = {
  institucional: "Institucional",
  centro_estudiantes: "Centro de Estudiantes",
  familias: "Familias",
};

const CATEGORIA_STYLE: Record<Aviso["categoria"], { border: string; chip: string }> = {
  institucional: { border: "border-l-primary", chip: "bg-primary text-primary-foreground" },
  centro_estudiantes: { border: "border-l-cdec", chip: "bg-cdec text-cdec-foreground" },
  familias: { border: "border-l-familias", chip: "bg-familias text-familias-foreground" },
};

export function AvisoCard({ aviso, compact = false }: { aviso: Aviso; compact?: boolean }) {
  const style = CATEGORIA_STYLE[aviso.categoria];
  return (
    <article
      className={`flex flex-col rounded-md border border-border border-l-4 bg-card p-5 ${style.border}`}
    >
      <div className="flex items-center gap-2 text-xs">
        <span className={`inline-flex items-center rounded px-2 py-0.5 font-medium ${style.chip}`}>
          {CATEGORIA_LABEL[aviso.categoria]}
        </span>
        {aviso.destacado && <Badge variant="outline">Destacado</Badge>}
        <span className="ml-auto text-muted-foreground">
          {new Date(aviso.publicado_en).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
        </span>
      </div>
      <h3 className="mt-2 font-serif text-lg font-semibold text-foreground">{aviso.titulo}</h3>
      <p className={"mt-2 whitespace-pre-line text-sm text-muted-foreground " + (compact ? "line-clamp-3" : "")}>
        {aviso.contenido}
      </p>
    </article>
  );
}
