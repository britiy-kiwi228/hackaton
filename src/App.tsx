import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from 'src/context/AuthContext.tsx';
import { ProtectedRoute } from 'src/components/ProtectedRoute';
import AuthPage from 'src/pages/auth/index';
import DashboardPage from '@/pages/participant/dashboard';
import BrowsePage from '@/pages/participant/browse';
import ProfilePage from '@/pages/participant/profile';
import RequestsPage from '@/pages/participant/requests';
import TeamsPage from '@/pages/participant/teams';

// Organizer pages
import OrganizerDashboard from '@/pages/organizer/dashboard';
import OrganizerHackathons from '@/pages/organizer/hackathons';
import OrganizerParticipants from '@/pages/organizer/participants';
import OrganizerTeams from '@/pages/organizer/teams';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/browse"
            element={
              <ProtectedRoute>
                <BrowsePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <RequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams"
            element={
              <ProtectedRoute>
                <TeamsPage />
              </ProtectedRoute>
            }
          />
          
          {/* Organizer routes */}
          <Route
            path="/organizer/dashboard"
            element={
              <ProtectedRoute>
                <OrganizerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/hackathons"
            element={
              <ProtectedRoute>
                <OrganizerHackathons />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/participants"
            element={
              <ProtectedRoute>
                <OrganizerParticipants />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/teams"
            element={
              <ProtectedRoute>
                <OrganizerTeams />
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
