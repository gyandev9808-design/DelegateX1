import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TrainingPage from './pages/TrainingPage';
import CommitteePage from './pages/CommitteePage';
import RoomPage from './pages/RoomPage';
import MeetLandingPage from './pages/MeetLandingPage';
import MeetRoomPage from './pages/MeetRoomPage';
import AiDoubtClarifierPage from './pages/AiDoubtClarifierPage';
import DashboardPage from './pages/DashboardPage';
import DashboardAreaPage from './pages/DashboardAreaPage';
import AdminPage from './pages/AdminPage';
import AdminAreaPage from './pages/AdminAreaPage';
import AuthPage from './pages/AuthPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/meet" element={<MeetLandingPage />} />
        <Route path="/meet/:roomId" element={<MeetRoomPage />} />
        <Route path="/training" element={<TrainingPage />} />
        <Route path="/committee" element={<CommitteePage />} />
        <Route path="/room/:id" element={<MeetRoomPage />} />
        <Route path="/ai-doubt-clarifier" element={<AiDoubtClarifierPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/:area" element={<DashboardAreaPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/:area" element={<AdminAreaPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
