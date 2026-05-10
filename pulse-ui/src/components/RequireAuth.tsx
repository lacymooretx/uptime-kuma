import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken, readTokenFromUrl } from "../lib/auth";

// Wraps protected routes. In dev mode (vite dev) the guard is skipped so the
// mock fixtures keep rendering without a backend. In production it requires a
// JWT — either freshly delivered via ?token= from the OIDC callback, or
// already in localStorage from a prior session.
export default function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV) {
      setAuthed(true);
      setReady(true);
      return;
    }
    // Pick up token from the URL if the OIDC callback just landed us here.
    readTokenFromUrl();
    setAuthed(!!getToken());
    setReady(true);
  }, []);

  if (!ready) return null;
  if (!authed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
