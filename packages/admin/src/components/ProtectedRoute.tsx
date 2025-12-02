import React from 'react';
import {Navigate} from 'react-router-dom';
import {isAuthenticated} from '../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({children}) => {
  if (!isAuthenticated()) {
    // 未登录时重定向到登录页
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
