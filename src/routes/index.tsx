import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Calendar, Megaphone, BookOpen, Mail, Camera, Newspaper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout, Container } from "@/components/site/SiteLayout";
import { AvisoCard } from "@/components/site/AvisoCard";
import { useConfigSitio } from "@/hooks/use-config-sitio";

const avisosRecientesQO = queryOptions({
  queryKey: ["avisos", "recientes"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("avisos")
      .select("id, titulo, contenido, categoria, destacado, publicado_en")
      .order("destacado", { ascending: false })
      .order("publicado_en", { ascending: false })
      .limit(4);
    if (error) throw error;
    return data ?? [];
  },
});

const proximosEventosQO = queryOptions({
  queryKey: ["eventos", "proximos"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("eventos_calendario")
      .select("id, titulo, tipo, fecha_inicio")
      .gte("fecha_inicio", new Date().toISOString())
      .order("fecha_inicio", { ascending: true })
      .limit(4);
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inicio · Escuela Secundaria Técnica" },
      { name: "description", content: "Avisos, calendario y accesos directos del sitio institucional." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(avisosRecientesQO);
    context.queryClient.ensureQueryData(proximosEventosQO);
  },
  component: Index,
  errorComponent: ({ error }) => (
    <SiteLayout>
      <Container><p role="alert">{error.message}</p></Container>
    </SiteLayout>
  ),
});

const ACCESOS = [
  { to: "/avisos", icon: Megaphone, title: "Avisos", desc: "Comunicados institucionales y del Centro de Estudiantes" },
  { to: "/calendario", icon: Calendar, title: "Calendario", desc: "Exámenes, actividades y eventos" },
  { to: "/materias", icon: BookOpen, title: "Materias", desc: "Recursos por especialidad y año" },
  { to: "/galeria", icon: Camera, title: "Galería", desc: "Fotos de actividades escolares" },
  { to: "/institucional", icon: Newspaper, title: "Institucional", desc: "Información sobre la escuela" },
  { to: "/contacto", icon: Mail, title: "Contacto", desc: "Formulario y datos de contacto" },
] as const;

function Index() {
  const config = useConfigSitio();
  const { data: avisos } = useSuspenseQuery(avisosRecientesQO);
  const { data: eventos } = useSuspenseQuery(proximosEventosQO);

  return (
    <SiteLayout>
      {/* Hero institucional */}
      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-14 md:py-20">
          <p className="text-sm uppercase tracking-widest text-primary-foreground/80">
            Educación secundaria técnica
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold md:text-5xl">
            {config("nombre_escuela")}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-primary-foreground/90 md:text-lg">
            {config("lema")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/institucional"
              className="inline-flex items-center rounded-md bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
            >
              Conocé la escuela
            </Link>
            <Link
              to="/materias"
              className="inline-flex items-center rounded-md border border-primary-foreground/40 px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-dark"
            >
              Materias y especialidades
            </Link>
          </div>
        </div>
      </section>

      <Container>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Avisos recientes */}
          <section className="lg:col-span-2">
            <div className="flex items-end justify-between">
              <h2 className="font-serif text-2xl font-semibold">Avisos recientes</h2>
              <Link to="/avisos" className="text-sm font-medium text-primary hover:underline">
                Ver todos →
              </Link>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {avisos.length === 0 ? (
                <p className="text-muted-foreground">Todavía no hay avisos publicados.</p>
              ) : (
                avisos.map((a) => <AvisoCard key={a.id} aviso={a} compact />)
              )}
            </div>
          </section>

          {/* Próximos eventos */}
          <aside>
            <h2 className="font-serif text-2xl font-semibold">Próximos en el calendario</h2>
            <ul className="mt-4 divide-y divide-border rounded-md border border-border bg-card">
              {eventos.length === 0 ? (
                <li className="p-4 text-sm text-muted-foreground">Sin eventos próximos.</li>
              ) : (
                eventos.map((e) => (
                  <li key={e.id} className="flex items-start gap-3 p-4">
                    <div className="flex w-14 flex-col items-center rounded-md bg-secondary py-1 text-center">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {new Date(e.fecha_inicio).toLocaleDateString("es-AR", { month: "short" })}
                      </span>
                      <span className="font-serif text-xl font-semibold text-primary">
                        {new Date(e.fecha_inicio).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{e.tipo}</p>
                      <p className="truncate font-medium text-foreground">{e.titulo}</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
            <Link to="/calendario" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
              Ver calendario completo →
            </Link>
          </aside>
        </div>

        {/* Accesos directos */}
        <section className="mt-12">
          <h2 className="font-serif text-2xl font-semibold">Accesos directos</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ACCESOS.map(({ to, icon: Icon, title, desc }) => (
              <Link
                key={to}
                to={to}
                className="group flex gap-4 rounded-md border border-border bg-card p-5 transition-colors hover:border-primary"
              >
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-md bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </Container>
    </SiteLayout>
  );
}
