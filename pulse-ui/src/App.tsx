import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import MonitorDetail from "./pages/MonitorDetail";
import Incidents from "./pages/Incidents";
import StatusPageComposer from "./pages/StatusPageComposer";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/monitors/:slug" element={<MonitorDetail />} />
        <Route path="/monitors" element={<Navigate to="/monitors/service-log" replace />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/status-pages/:slug" element={<StatusPageComposer />} />
        <Route path="/status-pages" element={<Navigate to="/status-pages/aspendora" replace />} />
      </Route>
    </Routes>
  );
}
