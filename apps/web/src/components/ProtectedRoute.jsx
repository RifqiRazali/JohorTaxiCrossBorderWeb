import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AlertTriangle, MessageCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AUTH_ROLES, getDashboardPathForRole } from '../lib/authRoles';
import { calculateRenewalTimer } from '../lib/utils';
import { DEFAULT_MANAGEMENT_WHATSAPP_NUMBER } from '../data/fleetData';

const AccountExpiredScreen = ({ onSignOut }) => {
  const message = encodeURIComponent(
    'Hello, my Taxi Johor Cross Border driver account has expired. Please help me renew it.'
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border-2 border-red-500/30 text-red-400 mb-6">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="font-display text-2xl font-extrabold text-white">Account Renewal Required</h1>
      <p className="mt-3 max-w-md text-sm text-slate-400 leading-relaxed">
        Your driver account has expired and dashboard access is locked. Please contact your administrator to renew your account.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <a
          href={`https://wa.me/${DEFAULT_MANAGEMENT_WHATSAPP_NUMBER}?text=${message}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 active:scale-95"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Contact Admin on WhatsApp</span>
        </a>
        <button
          onClick={onSignOut}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-700"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, profile, role, loading, logout } = useAuth();
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
    if (role === AUTH_ROLES.DRIVER || role === AUTH_ROLES.ADMIN) {
      return <Navigate to={getDashboardPathForRole(role)} replace />;
    }

    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Drivers lose dashboard access once their renewal window has lapsed.
  // Admins are never subject to this -- they're the only ones who can renew a driver,
  // so locking them out on their own expiry would be a self-lockout with no recovery path.
  if (role === AUTH_ROLES.DRIVER && calculateRenewalTimer(profile?.expires_at).status === 'expired') {
    return <AccountExpiredScreen onSignOut={logout} />;
  }

  return children;
};

export default ProtectedRoute;
