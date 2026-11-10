import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import GridSkeleton from "../components/GridSkeleton";

type Item = { id: string; title: string | null; type: string };

export default function Home() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    setItems(null);
    const { data, error: err } = await supabase
      .from("items")
      .select("id,title,type")
      .order("saved_at", { ascending: false })
      .limit(60);
    if (err) {
      setError(true);
      return;
    }
    setItems(data as Item[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageHeader title="Home" />
      {error ? (
        <div className="mx-auto max-w-md px-4 py-24 text-center" role="alert">
          <p className="font-semibold">Your items could not load.</p>
          <p className="mt-1 text-ink-muted">Check your connection, then try again.</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-6 min-h-11 rounded-control bg-accent px-5 font-medium text-on-accent hover:bg-accent-hover"
          >
            Try again
          </button>
        </div>
      ) : items === null ? (
        <GridSkeleton />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="columns-2 gap-4 p-4 md:columns-3 md:p-8 xl:columns-4">
          {items.map((item) => (
            <article key={item.id} className="mb-4 break-inside-avoid rounded-card border border-line bg-surface p-4">
              <p className="font-medium">{item.title ?? "Untitled"}</p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
