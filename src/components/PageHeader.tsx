import type { ReactNode } from "react";

export default function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="flex min-h-16 items-center justify-between gap-4 border-b border-line bg-surface px-4 md:px-8">
      <h1 className="text-xl font-semibold">{title}</h1>
      {children}
    </header>
  );
}
