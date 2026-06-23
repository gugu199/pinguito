import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, MailOpen, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/mensajes")({
  component: AdminMensajes,
});

function AdminMensajes() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin", "mensajes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("mensajes_contacto").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, leido }: { id: string; leido: boolean }) => {
      const { error } = await supabase.from("mensajes_contacto").update({ leido }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "mensajes"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("mensajes_contacto").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Mensaje eliminado"); qc.invalidateQueries({ queryKey: ["admin", "mensajes"] }); },
  });

  return (
    <section>
      <h1 className="font-serif text-2xl font-semibold">Mensajes recibidos</h1>
      <p className="text-sm text-muted-foreground">Mensajes enviados desde el formulario de contacto.</p>

      <ul className="mt-6 divide-y divide-border rounded-md border border-border bg-card">
        {data.length === 0 ? <li className="p-6 text-muted-foreground">Sin mensajes.</li> : data.map((m) => (
          <li key={m.id} className={"flex items-start gap-4 p-4 " + (m.leido ? "opacity-60" : "")}>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("es-AR")}</p>
              <h3 className="font-medium">{m.asunto}</h3>
              <p className="text-sm text-muted-foreground">De: {m.nombre} · {m.email}</p>
              <p className="mt-2 whitespace-pre-line text-sm">{m.mensaje}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button size="sm" variant="outline" onClick={() => toggle.mutate({ id: m.id, leido: !m.leido })} aria-label={m.leido ? "Marcar como no leído" : "Marcar como leído"}>
                {m.leido ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { if (confirm("¿Eliminar mensaje?")) del.mutate(m.id); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
