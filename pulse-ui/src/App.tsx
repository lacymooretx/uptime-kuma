import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import MonitorsList from "./pages/MonitorsList";
import MonitorDetail from "./pages/MonitorDetail";
import Incidents from "./pages/Incidents";
import StatusPageComposer from "./pages/StatusPageComposer";
import Maintenance from "./pages/Maintenance";
import Notifications from "./pages/Notifications";
import SettingsPage from "./pages/Settings";
import Team from "./pages/Team";
import Integrations from "./pages/Integrations";
import IntegrationConnectWise from "./pages/IntegrationConnectWise";

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
        <Route path="/monitors" element={<MonitorsList />} />
        <Route path="/monitors/:slug" element={<MonitorDetail />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/status-pages/:slug" element={<StatusPageComposer />} />
        <Route path="/status-pages" element={<Navigate to="/status-pages/aspendora" replace />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/integrations/connectwise" element={<IntegrationConnectWise />} />
        <Route path="/team" element={<Team />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
