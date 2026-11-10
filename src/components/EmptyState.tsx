import { Link } from "react-router-dom";
import { Inbox } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <Inbox className="size-10 text-ink-muted" aria-hidden={true} />
      <h2 className="mt-4 text-lg font-semibold">Nothing saved yet</h2>
      <p className="mt-1 text-ink-muted">Add a link, image or quote.</p>
      <Link
        to="/add"
        className="mt-6 inline-flex min-h-11 items-center rounded-control bg-accent px-5 font-medium text-on-accent transition-colors hover:bg-accent-hover"
      >
        Add something
      </Link>
    </div>
  );
}
