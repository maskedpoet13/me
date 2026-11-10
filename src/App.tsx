import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./lib/auth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import { Placeholder } from "./pages/Placeholder";
import Settings from "./pages/Settings";

function RequireAuth() {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center text-ink-muted" role="status">
        Loading
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route
            path="search"
            element={<Placeholder title="Search" body="Search arrives with AI moods in Milestone 3." />}
          />
          <Route
            path="boxes"
            element={<Placeholder title="Boxes" body="Boxes arrive with manual add in Milestone 2." />}
          />
          <Route
            path="add"
            element={<Placeholder title="Add" body="Adding items by hand arrives in Milestone 2." />}
          />
          <Route
            path="imports"
            element={<Placeholder title="Imports" body="Imports arrive in Milestone 6." />}
          />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
