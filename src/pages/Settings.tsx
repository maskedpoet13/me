import { LogOut } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../lib/auth";

export default function Settings() {
  const { session, signOut } = useAuth();
  return (
    <>
      <PageHeader title="Settings" />
      <section className="max-w-xl px-4 py-8 md:px-8">
        <h2 className="text-lg font-semibold">Account</h2>
        <p className="mt-1 text-ink-muted">Signed in as {session?.user.email}</p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-control border border-line bg-surface px-4 font-medium hover:bg-canvas"
        >
          <LogOut className="size-5" aria-hidden={true} />
          Sign out
        </button>
        <p className="mt-10 text-sm text-ink-muted">
          AI spending, storage usage and API tokens will appear here in later milestones.
        </p>
      </section>
    </>
  );
}
