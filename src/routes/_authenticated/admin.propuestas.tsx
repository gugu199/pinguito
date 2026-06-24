import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, MailOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/propuestas")({
  component: AdminPropuestas,
});

type Propuesta = { id: string; nombre: string; email: string | null; curso: string | null; mensaje: string; leido: boolean; created_at: string };

function AdminPropuestas() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["admin", "propuestas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("propuestas_centro")
        .select("id, nombre, email, curso, mensaje, leido, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Propuesta[];
    },
  });

  const toggle = useMutation({
    mutationFn: async (p: Propuesta) => {
      const { error } = await supabase.from("propuestas_centro").update({ leido: !p.leido }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "propuestas"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("propuestas_centro").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Eliminada"); qc.invalidateQueries({ queryKey: ["admin", "propuestas"] }); },
  });

  return (
    <section>
      <h1 className="font-serif text-2xl font-semibold">Propuestas al Centro</h1>
      <p className="text-sm text-muted-foreground">Mensajes enviados desde el formulario público del Centro de Estudiantes.</p>
      <div className="mt-6 overflow-hidden rounded-md border border-border bg-card">
        {rows.length === 0 ? (
          <p className="p-6 text-muted-foreground">Sin propuestas recibidas.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((p) => (
              <li key={p.id} className={"flex items-start gap-4 p-4 " + (p.leido ? "opacity-70" : "")}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{p.nombre}</span>
                    {p.curso && <span>· {p.curso}</span>}
                    {p.email && <a href={`mailto:${p.email}`} className="text-primary hover:underline">{p.email}</a>}
                    <span>· {new Date(p.created_at).toLocaleString("es-AR")}</span>
                    {!p.leido && <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] uppercase text-primary-foreground">Nuevo</span>}
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm">{p.mensaje}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggle.mutate(p)} title={p.leido ? "Marcar como no leído" : "Marcar como leído"}>
                    <MailOpen className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { if (confirm("¿Eliminar propuesta?")) del.mutate(p.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
