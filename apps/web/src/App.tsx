import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedLayout } from './components/layout/ProtectedLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetails } from './pages/ProjectDetails';
import { Queues } from './pages/Queues';
import { QueueDetails } from './pages/QueueDetails';
import { Jobs } from './pages/Jobs';
import { JobDetails } from './pages/JobDetails';
import { Workers } from './pages/Workers';
import { DLQ } from './pages/DLQ';
import { Analytics } from './pages/Analytics';
import { Monitoring } from './pages/Monitoring';
import { Notifications } from './pages/Notifications';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<ProtectedLayout />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/queues" element={<Queues />} />
            <Route path="/queues/:id" element={<QueueDetails />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetails />} />
            <Route path="/workers" element={<Workers />} />
            <Route path="/dlq" element={<DLQ />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}