import React from 'react';
import { useAuth } from '../../context/AuthContext';
import NoPage from '../../pages/NoPage';

const PermissionGuard = ({ 
  children, 
  requiredPermission, 
  fallbackMessage = "Bu sahifaga kirish uchun ruxsat yo'q" 
}) => {
  const { user, permissions } = useAuth();

  // Agar user yo'q bo'lsa, login sahifasiga yo'naltirish
  if (!user) {
    return <NoPage message="Avtorizatsiya talab qilinadi" />;
  }

  // Agar ruxsat yo'q bo'lsa, NoPage ko'rsatish
  if (requiredPermission && !permissions.includes(requiredPermission)) {
    return <NoPage message={fallbackMessage} />;
  }

  // Agar barcha shartlar bajarilsa, children render qilish
  return children;
};

export default PermissionGuard;

