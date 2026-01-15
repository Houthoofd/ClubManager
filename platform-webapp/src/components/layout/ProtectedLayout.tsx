import React from 'react';
import { Outlet } from 'react-router-dom';
import AuthGuard from '../auth/AuthGuard';

const ProtectedLayout: React.FC = () => {
  return (
    <AuthGuard>
      <Outlet />
    </AuthGuard>
  );
};

export default ProtectedLayout;
