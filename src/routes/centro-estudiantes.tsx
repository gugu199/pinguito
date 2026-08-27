import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout, PageHeader, Container } from "@/components/site/SiteLayout";
import { AvisoCard } from "@/components/site/AvisoCard";
import { useConfigSitio } from "@/hooks/use-config-sitio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const ceQO = queryOptions({
  queryKey: ["centro", "publico"],
  queryFn: async () => {
    const [avisos, integrantes] = await Promise.all([
      supabase
        .from("avisos")
        .select("id, titulo, contenido, categoria, destacado, publicado_en")
        .eq("categoria", "centro_estudiantes")
        .order("destacado", { ascending: false })
        .order("publicado_en", { ascending: false })
        .limit(8),
      supabase
        .from("centro_integrantes")
        .select("id, nombre, cargo, anio, foto_url, orden")
        .order("orden", { ascending: true }),
    ]);
    if (avisos.error) throw avisos.error;
    if (integrantes.error) throw integrantes.error;
    return { avisos: avisos.data ?? [], integrantes: integrantes.data ?? [] };
  },
});

export const Route = createFileRoute("/centro-estudiantes")({
  head: () => ({ meta: [
    { title: "Centro de Estudiantes · Escuela Secundaria Técnica" },
    { name: "description", content: "Anuncios, integrantes, actividades y formulario de propuestas del Centro de Estudiantes." },
    { property: "og:title", content: "Centro de Estudiantes · Escuela Secundaria Técnica" },
    { property: "og:description", content: "Anuncios, integrantes, actividades y formulario de propuestas del Centro de Estudiantes." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(ceQO),
  component: Page,
});

const schema = z.object({
  nombre: z.string().trim().min(1, "Ingresá tu nombre").max(120),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  curso: z.string().trim().max(60).optional().or(z.literal("")),
  mensaje: z.string().trim().min(5, "El mensaje es muy corto").max(4000),
});

function Page() {
  const config = useConfigSitio();
  const { data } = useSuspenseQuery(ceQO);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      nombre: form.get("nombre"),
      email: form.get("email"),
      curso: form.get("curso"),
      mensaje: form.get("mensaje"),
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setEnviando(true);
    const { error } = await supabase.from("propuestas_centro").insert({
      nombre: parsed.data.nombre,
      email: parsed.data.email || null,
      curso: parsed.data.curso || null,
      mensaje: parsed.data.mensaje,
    });
    setEnviando(false);
    if (error) { toast.error("No pudimos enviar la propuesta."); return; }
    toast.success("¡Gracias! Tu propuesta fue enviada al Centro.");
    e.currentTarget.reset();
  }

  return (
    <SiteLayout>
      <PageHeader title="Centro de Estudiantes" lead={config("centro_presentacion")} />
      <Container>
        <div className="grid gap-10 lg:grid-cols-3">
          <section className="lg:col-span-2 space-y-10">
            <div>
              <h2 className="font-serif text-2xl font-semibold">Anuncios del Centro</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {data.avisos.length === 0 ? (
                  <p className="text-muted-foreground">Todavía no hay anuncios publicados.</p>
                ) : data.avisos.map((a) => <AvisoCard key={a.id} aviso={a} compact />)}
              </div>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-semibold">Integrantes</h2>
              {data.integrantes.length === 0 ? (
                <p className="mt-3 text-muted-foreground">Próximamente publicaremos a las y los integrantes.</p>
              ) : (
                <ul className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {data.integrantes.map((i) => (
                    <li key={i.id} className="flex items-center gap-3 rounded-md border border-border bg-card p-4">
                      {i.foto_url ? (
                        <img src={i.foto_url} alt={i.nombre} className="h-12 w-12 rounded-full object-cover" loading="lazy" />
                      ) : (
                        <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary font-serif text-lg text-primary">
                          {i.nombre.slice(0, 1)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium">{i.nombre}</p>
                        <p className="truncate text-xs text-muted-foreground">{i.cargo}{i.anio ? ` · ${i.anio}` : ""}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <aside>
            <h2 className="font-serif text-xl font-semibold">Propuestas y contacto</h2>
            <p className="mt-1 text-sm text-muted-foreground">Compartí ideas, propuestas o consultas con el Centro.</p>
            <form onSubmit={onSubmit} className="mt-4 space-y-3 rounded-md border border-border bg-card p-5">
              <div className="space-y-1.5">
                <Label htmlFor="ce_nombre">Nombre</Label>
                <Input id="ce_nombre" name="nombre" required maxLength={120} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ce_curso">Curso (opcional)</Label>
                <Input id="ce_curso" name="curso" maxLength={60} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ce_email">Email (opcional)</Label>
                <Input id="ce_email" name="email" type="email" maxLength={255} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ce_mensaje">Propuesta o mensaje</Label>
                <Textarea id="ce_mensaje" name="mensaje" rows={5} required maxLength={4000} />
              </div>
              <Button type="submit" disabled={enviando}>{enviando ? "Enviando…" : "Enviar"}</Button>
            </form>
          </aside>
        </div>
      </Container>
    </SiteLayout>
  );
}
