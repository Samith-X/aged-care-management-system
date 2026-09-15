import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Facilities from './pages/Facilities';
import Inventory from './pages/Inventory';
import Login from './pages/Login';
import Medication from './pages/Medication';
import MemberProfile from './pages/MemberProfile';
import Members from './pages/Members';
import NotFound from './pages/NotFound';
import Reports from './pages/Reports';
import Scheduling from './pages/Scheduling';
import Services from './pages/Services';
import Settings from './pages/Settings';
import Staff from './pages/Staff';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/members" element={<Members />} />
        <Route path="/members/:id" element={<MemberProfile />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/services" element={<Services />} />
        <Route path="/scheduling" element={<Scheduling />} />
        <Route path="/facilities" element={<Facilities />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/medication" element={<Medication />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
