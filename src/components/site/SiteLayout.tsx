import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHeader({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="border-b border-border bg-secondary/50">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="font-serif text-3xl font-semibold text-foreground md:text-4xl">{title}</h1>
        {lead ? <p className="mt-2 max-w-2xl text-muted-foreground">{lead}</p> : null}
      </div>
    </div>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={"mx-auto max-w-7xl px-4 py-8 " + className}>{children}</div>;
}
