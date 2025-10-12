import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import authService from './services/authService';

// Import pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MealEntryPage from './pages/MealEntryPage';
import AddSnackPage from './pages/AddSnackPage';
import WeeklyReviewPage from './pages/WeeklyReviewPage';
import RecommendationsPage from './pages/RecommendationsPage';
import CompliancePage from './pages/CompliancePage';  // 🆕

// Protected Route Component
function ProtectedRoute({ children }) {
  const isAuth = authService.isAuthenticated();

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/meal-entry"
          element={
            <ProtectedRoute>
              <MealEntryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-snack"
          element={
            <ProtectedRoute>
              <AddSnackPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/weekly-review"
          element={
            <ProtectedRoute>
              <WeeklyReviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recommendations"
          element={
            <ProtectedRoute>
              <RecommendationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/compliance"
          element={
            <ProtectedRoute>
              <CompliancePage />  {/* 🆕 */}
            </ProtectedRoute>
          }
        />

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;