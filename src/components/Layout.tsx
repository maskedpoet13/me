import { NavLink, Outlet } from "react-router-dom";
import { Home, Search, Box, Plus, Download, Settings } from "lucide-react";
import type { ComponentType } from "react";

type NavItem = { to: string; label: string; icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>; end?: boolean };

const sidebarItems: NavItem[] = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/boxes", label: "Boxes", icon: Box },
  { to: "/imports", label: "Imports", icon: Download },
  { to: "/settings", label: "Settings", icon: Settings },
];

const bottomItems: NavItem[] = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/search", label: "Search", icon: Search },
  { to: "/boxes", label: "Boxes", icon: Box },
  { to: "/add", label: "Add", icon: Plus },
];

const linkBase =
  "flex min-h-11 items-center gap-3 rounded-control px-3 text-base font-medium transition-colors";

function Wordmark() {
  return (
    <div className="flex items-center gap-2 px-3 py-4">
      <span className="grid size-8 place-items-center rounded-control bg-accent text-sm font-bold text-on-accent" aria-hidden="true">
        ME
      </span>
      <span className="sr-only">ME</span>
    </div>
  );
}

export default function Layout() {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16rem_1fr]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-surface focus:px-4 focus:py-2 focus:shadow-pop"
      >
        Skip to main content
      </a>

      {/* Desktop sidebar: search pinned at the top */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface md:flex" aria-label="Primary">
        <Wordmark />
        <div className="px-3 pb-3">
          <NavLink
            to="/search"
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-2 rounded-control border border-line px-3 text-base ${
                isActive ? "bg-accent-muted text-accent" : "bg-canvas text-ink-muted hover:text-ink"
              }`
            }
          >
            <Search className="size-5" aria-hidden={true} />
            Search
          </NavLink>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {sidebarItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `${linkBase} ${isActive ? "bg-accent-muted text-accent" : "text-ink-muted hover:bg-canvas hover:text-ink"}`
              }
            >
              <Icon className="size-5" aria-hidden={true} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 px-6 text-sm text-ink-muted">
          <p className="font-medium text-ink">Your Boxes</p>
          <p className="mt-1">No Boxes yet.</p>
        </div>
      </aside>

      <main id="main" tabIndex={-1} className="min-w-0 pb-24 md:pb-0">
        <Outlet />
      </main>

      {/* Phone bottom bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Primary"
      >
        {bottomItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                isActive ? "text-accent" : "text-ink-muted"
              }`
            }
          >
            <Icon className="size-6" aria-hidden={true} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
