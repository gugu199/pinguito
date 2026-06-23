import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHeader, Container } from "@/components/site/SiteLayout";
import { useConfigSitio } from "@/hooks/use-config-sitio";

export const Route = createFileRoute("/institucional")({
  head: () => ({
    meta: [
      { title: "Información institucional · Escuela Secundaria Técnica" },
      { name: "description", content: "Quiénes somos, propuesta educativa y autoridades de la escuela." },
    ],
  }),
  component: InstitucionalPage,
});

function InstitucionalPage() {
  const config = useConfigSitio();
  return (
    <SiteLayout>
      <PageHeader
        title="Información institucional"
        lead={`Conocé ${config("nombre_escuela")}: nuestra propuesta, especialidades y autoridades.`}
      />
      <Container>
        <article className="prose prose-slate max-w-3xl">
          <section>
            <h2 className="font-serif text-2xl font-semibold">Quiénes somos</h2>
            <p className="mt-2 text-muted-foreground">
              Somos una escuela de educación secundaria técnica con un Ciclo Básico común y tres
              especialidades: Informática, Alimentos y Electrónica. Formamos estudiantes para el
              mundo del trabajo y la continuidad de estudios superiores.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="font-serif text-2xl font-semibold">Propuesta educativa</h2>
            <p className="mt-2 text-muted-foreground">
              Articulamos formación general, técnica y prácticas profesionalizantes a lo largo de
              los siete años. Cada especialidad cuenta con laboratorios, talleres y proyectos
              propios.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="font-serif text-2xl font-semibold">Datos de contacto</h2>
            <ul className="mt-2 list-none space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">Dirección:</strong> {config("direccion")}</li>
              <li><strong className="text-foreground">Teléfono:</strong> {config("telefono")}</li>
              <li><strong className="text-foreground">Email:</strong> {config("email")}</li>
              <li><strong className="text-foreground">Horario:</strong> {config("horario")}</li>
            </ul>
          </section>
        </article>
      </Container>
    </SiteLayout>
  );
}
