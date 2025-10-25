import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/Login/LoginForm';
import Layout from './components/Layout/Layout';
import PermissionGuard from './components/Common/PermissionGuard';
import Dashboard from './pages/Dashboard';
import Admins from './pages/Admins';
import Tariffs from './pages/Tariffs';
import Stores from './pages/Stores';
import StoreOwners from './pages/StoreOwners';
import Categories from './pages/Categories';
import Products from './pages/Products';
import Orders from './pages/Orders';
import InstallmentPayments from './pages/InstallmentPayments';
import Sellers from './pages/Sellers';
import Agents from './pages/Agents';
import Regions from './pages/Regions';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <PermissionGuard requiredPermission="view_dashboard">
                  <Dashboard />
                </PermissionGuard>
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/admins" element={
            <PrivateRoute>
              <Layout>
                <PermissionGuard requiredPermission="manage_admins">
                  <Admins />
                </PermissionGuard>
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/tariffs" element={
            <PrivateRoute>
              <Layout>
                <Tariffs />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/stores" element={
            <PrivateRoute>
              <Layout>
                <PermissionGuard requiredPermission="manage_stores">
                  <Stores />
                </PermissionGuard>
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/sellers" element={
            <PrivateRoute>
              <Layout>
                <PermissionGuard requiredPermission="manage_sellers">
                  <Sellers />
                </PermissionGuard>
              </Layout>
            </PrivateRoute>
          } />
          {/* Store Owners */}
          <Route path="/store-owners" element={
            <PrivateRoute>
              <Layout>
                <PermissionGuard requiredPermission="manage_shop_owners">
                  <StoreOwners />
                </PermissionGuard>
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/categories" element={
            <PrivateRoute>
              <Layout>
                <PermissionGuard requiredPermission="manage_categories">
                  <Categories />
                </PermissionGuard>
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/products" element={
            <PrivateRoute>
              <Layout>
                <PermissionGuard requiredPermission="manage_products">
                  <Products />
                </PermissionGuard>
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/orders" element={
            <PrivateRoute>
              <Layout>
                <PermissionGuard requiredPermission="manage_orders">
                  <Orders />
                </PermissionGuard>
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/installments" element={
            <PrivateRoute>
              <Layout>
                <PermissionGuard requiredPermission="manage_installments">
                  <InstallmentPayments />
                </PermissionGuard>
              </Layout>
            </PrivateRoute>
          } />
          <Route path='/agents' element={
            <PrivateRoute>
              <Layout>
                <Agents />
              </Layout>
            </PrivateRoute>
          } 
          />
          <Route path="/regions" element={
            <PrivateRoute>
              <Layout>
                <PermissionGuard requiredPermission="manage_regions">
                  <Regions />
                </PermissionGuard>
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/statistics" element={
            <PrivateRoute>
              <Layout>
                <PermissionGuard requiredPermission="view_statistics">
                  <Statistics />
                </PermissionGuard>
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/settings" element={
            <PrivateRoute>
              <Layout>
                <PermissionGuard requiredPermission="manage_settings">
                  <Settings />
                </PermissionGuard>
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/notifications" element={
            <PrivateRoute>
              <Layout>
                <PermissionGuard requiredPermission="manage_notifications">
                  <Notifications />
                </PermissionGuard>
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
