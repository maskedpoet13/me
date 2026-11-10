import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { ALLOWED_EMAIL, isAllowedEmail } from "../lib/allowedEmail";
import { useAuth } from "../lib/auth";

type Status = "idle" | "sending" | "sent";

export default function Login() {
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  if (!loading && session) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!supabaseConfigured) {
      setError("ME is not connected to its database yet. The Supabase settings are missing.");
      return;
    }
    if (!isAllowedEmail(email, ALLOWED_EMAIL)) {
      setError("This email address is not allowed to sign in to ME.");
      return;
    }
    setStatus("sending");
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false, emailRedirectTo: window.location.origin },
    });
    if (err) {
      setStatus("idle");
      setError("The sign-in link could not be sent. Wait a minute and try again.");
      return;
    }
    setStatus("sent");
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-card border border-line bg-surface p-6">
        <span className="grid size-10 place-items-center rounded-control bg-accent text-base font-bold text-on-accent" aria-hidden="true">
          ME
        </span>
        <h1 className="mt-4 text-xl font-semibold">Sign in to ME</h1>

        {status === "sent" ? (
          <div className="mt-4" role="status">
            <p>Check your email for a sign-in link.</p>
            <p className="mt-1 text-sm text-ink-muted">You can close this tab. The link opens ME.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-4" noValidate>
            <label htmlFor="email" className="block text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "email-error" : undefined}
              className="mt-1 min-h-11 w-full rounded-control border border-line bg-surface px-3 text-base"
            />
            {error && (
              <p id="email-error" role="alert" className="mt-2 text-sm text-danger">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={status === "sending" || email.trim() === ""}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-accent px-5 font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              <Mail className="size-5" aria-hidden={true} />
              {status === "sending" ? "Sending" : "Send sign-in link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
