import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, GuestRoute } from '@routes/RouteGuards';
import AuthInitializer from '@features/auth/AuthInitializer';

// Auth Pages
import LoginPage from '@pages/auth/LoginPage';
import RegisterPage from '@pages/auth/RegisterPage';
import ForgotPasswordPage from '@pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@pages/auth/ResetPasswordPage';
import VerifyEmailPage from '@pages/auth/VerifyEmailPage';

// Settings
import SettingsPage from '@pages/settings/SettingsPage';

// Placeholder pages (filled in per module)
const DashboardPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
    <div className="text-center">
      <div className="text-5xl mb-4">🐝</div>
      <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Dashboard</h1>
      <p className="text-surface-400 mt-2">Coming in Module 9</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthInitializer>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* ─── Guest-only auth routes ────────────────────── */}
        <Route element={<GuestRoute />}>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Email verification (accessible always) */}
        <Route path="/auth/verify-email" element={<VerifyEmailPage />} />

        {/* ─── Protected app routes ──────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          {/* More routes added per module */}
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthInitializer>
  );
}

export default App;