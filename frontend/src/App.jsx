import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import HackathonsPage from './pages/HackathonsPage';
import HackathonDetailsPage from './pages/HackathonDetailsPage';
import TeamsPage from './pages/TeamsPage';
import TeamDetailsPage from './pages/TeamDetailsPage';
import UsersPage from './pages/UsersPage';
import RequestsPage from './pages/RequestsPage';
import ProfilePage from './pages/ProfilePage';
import RecommendationsPage from './pages/RecommendationsPage';

const App = () => {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/hackathons" element={<HackathonsPage />} />
          <Route path="/hackathons/:id" element={<HackathonDetailsPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/teams/:id" element={<TeamDetailsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
        </Routes>
      </AppLayout>
    </Router>
  );
};

export default App;
