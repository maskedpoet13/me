import PageHeader from "../components/PageHeader";

export function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <>
      <PageHeader title={title} />
      <p className="px-4 py-10 text-ink-muted md:px-8">{body}</p>
    </>
  );
}
