/*
 * SEMANTIC ANALYSIS
 * Mattar — automation platform for "what matters today"
 * Routes:
 *   /login         → Standalone sign-in (auth shell, outside AppShell)
 *   /today         → Radar command center (signature moment) [protected]
 *   /integrations  → Platform connections (Slack, Gmail, Granola) [protected]
 *   /inputs        → Input triggers per platform [protected]
 *   /matter        → Matter agent prompt configuration [protected]
 *   /outputs       → Output agents per platform [protected]
 */
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import TodayPage from '@/pages/TodayPage';
import IntegrationsPage from '@/pages/IntegrationsPage';
import InputsPage from '@/pages/InputsPage';
import MatterPage from '@/pages/MatterPage';
import OutputsPage from '@/pages/OutputsPage';
import LoginPage from '@/pages/LoginPage';
import AuthCallbackPage from '@/pages/AuthCallbackPage';

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="auth/callback" element={<AuthCallbackPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/today" replace />} />
          <Route path="today" element={<TodayPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="inputs" element={<InputsPage />} />
          <Route path="matter" element={<MatterPage />} />
          <Route path="outputs" element={<OutputsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
  );
}
