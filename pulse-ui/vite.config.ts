import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// In production Pulse is served by the Uptime Kuma Express server at /v2/.
// In dev we run vite standalone on :5180 with mock fixtures.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/v2/" : "/",
  plugins: [react(), tailwindcss()],
  server: {
    port: 5180,
    // Forward auth + REST + sockets to the running backend if PULSE_BACKEND is set
    // (e.g. PULSE_BACKEND=http://localhost:3001 npm run dev). Without it, dev runs
    // standalone on mock data.
    proxy: process.env.PULSE_BACKEND
      ? {
          "/auth": process.env.PULSE_BACKEND,
          "/api": process.env.PULSE_BACKEND,
          "/socket.io": { target: process.env.PULSE_BACKEND, ws: true },
        }
      : undefined,
  },
}));
