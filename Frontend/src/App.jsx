import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/Login/LoginForm';
import Layout from './components/Layout/Layout';
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
                <Dashboard />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/admins" element={
            <PrivateRoute>
              <Layout>
                <Admins />
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
                <Stores />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/sellers" element={
            <PrivateRoute>
              <Layout>
                <Sellers />
              </Layout>
            </PrivateRoute>
          } />
          {/* Store Owners */}
          <Route path="/store-owners" element={
            <PrivateRoute>
              <Layout>
                <StoreOwners />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/categories" element={
            <PrivateRoute>
              <Layout>
                <Categories />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/products" element={
            <PrivateRoute>
              <Layout>
                <Products />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/orders" element={
            <PrivateRoute>
              <Layout>
                <Orders />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/installments" element={
            <PrivateRoute>
              <Layout>
                <InstallmentPayments />
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
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
