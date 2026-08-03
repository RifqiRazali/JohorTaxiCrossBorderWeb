import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="mt-4 text-slate-400 font-medium text-sm">Verifying permissions...</p>
      </div>
    );
  }

  // Not logged in -> Redirect to /login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles.length > 0 && (!role || !allowedRoles.includes(role))) {
    // If driver tries to access admin -> redirect to /driver
    if (role === 'driver') {
      return <Navigate to="/driver" replace />;
    }
    // Default redirect to home
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
