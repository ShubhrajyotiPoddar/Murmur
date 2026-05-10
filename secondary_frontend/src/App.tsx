/**
 * App.tsx — Router root
 *
 * Route map:
 *   /login    → LoginPage    (public)
 *   /register → RegisterPage (public)
 *   /         → ChatPage     (protected — redirects to /login if no token)
 *
 * The ProtectedRoute wrapper reads the Zustand auth store synchronously
 * (hydrated from localStorage on first render) so there is no flash of
 * unauthenticated content.
 */

import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { useAuthStore } from './store/authStore';
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage     from './pages/ChatPage';

/* ── Protected route wrapper ── */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

/* ── App ── */
const App: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      {/* Catch-all — redirect unknown paths to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Router>
);

export default App;
