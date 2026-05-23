import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import VerificationsPage from './pages/VerificationsPage';
import OrdersPage from './pages/OrdersPage';
import PatientsPage from './pages/PatientsPage';
import DoctorsPage from './pages/DoctorsPage';
import InventoryPage from './pages/InventoryPage';
import PharmaciesPage from './pages/PharmaciesPage';
import RevenuePage from './pages/RevenuePage';
import SettingsPage from './pages/SettingsPage';
import LabTestsPage from './pages/LabTestsPage';
import MediPage from './pages/MediPage';
import AppointmentsPage from './pages/AppointmentsPage';
import SpecialtiesPage from './pages/SpecialtiesPage';
import PrescriptionsPage from './pages/PrescriptionsPage';
import AdminsPage from './pages/AdminsPage';
import BroadcastPage from './pages/BroadcastPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/verifications" element={<VerificationsPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/doctors" element={<DoctorsPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/pharmacies" element={<PharmaciesPage />} />
              <Route path="/revenue" element={<RevenuePage />} />
              <Route path="/lab-tests" element={<LabTestsPage />} />
              <Route path="/medi" element={<MediPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/specialties" element={<SpecialtiesPage />} />
              <Route path="/audit-prescriptions" element={<PrescriptionsPage />} />
              <Route path="/admins" element={<AdminsPage />} />
              <Route path="/broadcast" element={<BroadcastPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
