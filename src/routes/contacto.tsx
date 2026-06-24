import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout, PageHeader, Container } from "@/components/site/SiteLayout";
import { SchoolMap } from "@/components/site/SchoolMap";
import { useConfigSitio } from "@/hooks/use-config-sitio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto · Escuela Secundaria Técnica" },
      { name: "description", content: "Formulario de contacto y datos de la institución." },
    ],
  }),
  component: ContactoPage,
});

const schema = z.object({
  nombre: z.string().trim().min(1, "Ingresá tu nombre").max(120),
  email: z.string().trim().email("Email inválido").max(255),
  asunto: z.string().trim().min(1, "Ingresá un asunto").max(200),
  mensaje: z.string().trim().min(5, "El mensaje es muy corto").max(4000),
});

function ContactoPage() {
  const config = useConfigSitio();
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      nombre: form.get("nombre"),
      email: form.get("email"),
      asunto: form.get("asunto"),
      mensaje: form.get("mensaje"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setEnviando(true);
    const { error } = await supabase.from("mensajes_contacto").insert(parsed.data);
    setEnviando(false);
    if (error) {
      toast.error("No pudimos enviar el mensaje. Intentá nuevamente.");
      return;
    }
    toast.success("Mensaje enviado. Te responderemos a la brevedad.");
    e.currentTarget.reset();
  }

  return (
    <SiteLayout>
      <PageHeader title="Contacto" lead="Escribinos por consultas administrativas, inscripciones o información general." />
      <Container>
        <div className="grid gap-10 lg:grid-cols-3">
          <aside className="space-y-4">
            <h2 className="font-serif text-xl font-semibold">Datos de la institución</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 text-primary" aria-hidden /><span>{config("direccion")}</span></li>
              <li className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 text-primary" aria-hidden /><span>{config("telefono")}</span></li>
              <li className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 text-primary" aria-hidden /><span>{config("email")}</span></li>
              <li className="flex gap-3"><Clock className="mt-0.5 h-4 w-4 text-primary" aria-hidden /><span>{config("horario")}</span></li>
            </ul>
            <div className="mt-4">
              <SchoolMap
                direccion={config("direccion")}
                lat={config("mapa_lat")}
                lng={config("mapa_lng")}
                zoom={config("mapa_zoom")}
              />
            </div>
          </aside>
          <form onSubmit={onSubmit} className="lg:col-span-2 space-y-4 rounded-md border border-border bg-card p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nombre">Nombre y apellido</Label>
                <Input id="nombre" name="nombre" required maxLength={120} autoComplete="name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required maxLength={255} autoComplete="email" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="asunto">Asunto</Label>
              <Input id="asunto" name="asunto" required maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mensaje">Mensaje</Label>
              <Textarea id="mensaje" name="mensaje" required rows={6} maxLength={4000} />
            </div>
            <Button type="submit" disabled={enviando}>
              {enviando ? "Enviando…" : "Enviar mensaje"}
            </Button>
          </form>
        </div>
      </Container>
    </SiteLayout>
  );
}
