import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export { AuthContext };

// JWT tokenni decode qilish uchun funksiya
function decodeJWT(token) {
  if (!token) return null;
  const payload = token.split('.')[1];
  if (!payload) return null;
  // Base64Url decode
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [permissions, setPermissions] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      return u.permissions || (u.info && u.info.permissions) || [];
    }
    return [];
  });
  const navigate = useNavigate();

  // 401 event listener
  useEffect(() => {
    const handleTokenExpired = () => {
      logout();
    };
    window.addEventListener('token-expired', handleTokenExpired);
    return () => window.removeEventListener('token-expired', handleTokenExpired);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  // Universal login
  // type: 'admin' | 'shop-owner' | 'agent' (agent hali yo'q)
  // phone parami faqat shop-owner uchun ishlatiladi
  const login = async (usernameOrPhone, password, type = 'admin', phone = '') => {
    try {
      let endpoint = '';
      let body = {};
      if (type === 'shop-owner') {
        endpoint = 'http://localhost:3000/api/shop-owner/login';
        // Har doim ikkalasini yuboramiz, backend o'zi hal qiladi
        body = {
          username: usernameOrPhone || undefined,
          phone: phone || undefined,
          password
        };
      } else {
        endpoint = 'http://localhost:3000/api/admin/login';
        body = { username: usernameOrPhone, password };
      }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      console.log('LOGIN RESPONSE:', data);
      console.log('BODY:', body);
      if (data.success && data.token) {
        const decoded = decodeJWT(data.token);
        console.log('Decoded token data:', decoded);
        
        if (!decoded) {
          throw new Error('Invalid token format');
        }

        // Common user object structure for all user types
        const userObj = {
          id: decoded.id,
          username: decoded.username,
          name: decoded.name,
          phone: decoded.phone,
          status: decoded.status,
          role: decoded.role || type,
          type: type,
          loginTime: new Date().toISOString(),
          permissions: Array.isArray(decoded.permissions) ? decoded.permissions : []
        };

        console.log('Created user object:', userObj);
        
        // Update state and storage
        setUser(userObj);
        setPermissions(userObj.permissions);
        setToken(data.token);
        localStorage.setItem('user', JSON.stringify(userObj));
        localStorage.setItem('token', data.token);
        
        // Log the decoded token for debugging
        console.log('Decoded JWT:', decoded);
        
        // Navigate to home
        navigate('/');
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setPermissions([]);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isAuthenticated = () => {
    return !!token;
  };

  return (
    <AuthContext.Provider value={{ user, token, permissions, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
