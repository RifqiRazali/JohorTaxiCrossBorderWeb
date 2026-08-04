import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ShieldCheck, LogIn, ArrowLeft, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getValidationMessage, loginSchema } from '../lib/zodSchemas';
import { isSupabaseConfigured, REMEMBER_ME_KEY } from '../lib/supabaseClient';
import { getDashboardPathForRole, AUTH_ROLES } from '../lib/authRoles';
import logoImg from '../assets/logo.png';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, role, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect to respective dashboard
  React.useEffect(() => {
    if (user && role) {
      navigate(getDashboardPathForRole(role), { replace: true });
    }
  }, [user, role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Zod Validation
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setErrorMsg(getValidationMessage(validation));
      return;
    }

    setIsSubmitting(true);
    try {
      // Must be set before login() so the very first session write already
      // lands in the right storage (localStorage vs sessionStorage).
      window.localStorage.setItem(REMEMBER_ME_KEY, rememberMe ? 'true' : 'false');

      const data = await login(email, password);
      const userRole = data?.profile?.role || role;
      const targetDashboard = getDashboardPathForRole(userRole);

      const from = location.state?.from?.pathname;
      if (from && from !== '/login' && from !== '/') {
        if (userRole === AUTH_ROLES.ADMIN && from === '/admin') {
          navigate('/admin', { replace: true });
          return;
        }
        if (userRole === AUTH_ROLES.DRIVER && from === '/driver') {
          navigate('/driver', { replace: true });
          return;
        }
      }

      navigate(targetDashboard, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      let msg = 'Invalid login credentials. Please try again.';
      if (typeof err === 'string' && err.trim().length > 0) {
        msg = err;
      } else if (err && typeof err.message === 'string' && err.message.trim().length > 0) {
        msg = err.message;
      } else if (err && typeof err.error_description === 'string' && err.error_description.trim().length > 0) {
        msg = err.error_description;
      }
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-emerald-500/30">
      <Helmet>
        <title>Login | Taxi Johor Cross Border Portal</title>
        <meta name="description" content="Driver & Admin Portal Login for Taxi Johor Cross Border" />
      </Helmet>

      {/* Header Back Button */}
      <header className="p-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 text-emerald-400" />
          <span>Back to Taxi Service</span>
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md rounded-3xl bg-slate-900/90 border border-slate-800 p-8 shadow-2xl backdrop-blur-xl ring-1 ring-white/10"
        >
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 border-2 border-slate-800 p-1 shadow-lg ring-2 ring-emerald-400">
              <img src={logoImg} alt="Taxi Johor Cross Border Logo" className="h-full w-full object-contain rounded-xl" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-white">
              Portal Access
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Authorized Driver &amp; Admin Sign In
            </p>
          </div>

          {/* Dev-only setup hint — stripped from production builds so a misconfiguration
              never shows raw env var / backend-provider names to a real visitor. */}
          {import.meta.env.DEV && !isSupabaseConfigured && (
            <div className="mt-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-300 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Backend credentials pending setup</p>
                <p className="mt-1 leading-relaxed text-amber-300/80">
                  Please set <code className="bg-slate-950 px-1 py-0.5 rounded font-mono text-[10px]">VITE_SUPABASE_URL</code> &amp; <code className="bg-slate-950 px-1 py-0.5 rounded font-mono text-[10px]">VITE_SUPABASE_ANON_KEY</code> in <code className="bg-slate-950 px-1 py-0.5 rounded font-mono text-[10px]">apps/web/.env</code> to connect live authentication.
                </p>
              </div>
            </div>
          )}

          {/* Test Credentials Helper Box — dev-only, stripped from production builds so
              real demo account credentials are never shipped to the public login page. */}
          {import.meta.env.DEV && (
            <div className="mt-5 rounded-2xl bg-slate-950/80 border border-slate-800 p-3.5 text-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2 font-semibold text-[11px] uppercase tracking-wider">
                <span>Demo Test Accounts</span>
                <span className="text-emerald-400 font-mono">Password: Password123!</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setEmail('admin@taxijohor.com'); setPassword('Password123!'); }}
                  className="rounded-xl bg-slate-900 border border-slate-700/80 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 transition hover:bg-slate-800 hover:text-emerald-400 text-left"
                >
                  <span className="font-bold text-white block">Admin Test</span>
                  <span className="text-[10px] text-slate-400 truncate block">admin@taxijohor.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('driver@taxijohor.com'); setPassword('Password123!'); }}
                  className="rounded-xl bg-slate-900 border border-slate-700/80 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 transition hover:bg-slate-800 hover:text-emerald-400 text-left"
                >
                  <span className="font-bold text-white block">Driver Test</span>
                  <span className="text-[10px] text-slate-400 truncate block">driver@taxijohor.com</span>
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-xs text-red-300 flex items-center gap-3"
            >
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{typeof errorMsg === 'string' ? errorMsg : String(errorMsg?.message || 'Invalid login credentials. Please try again.')}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="driver@taxijohor.com"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 py-2.5 text-xs font-medium text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:ring-offset-0 accent-emerald-500"
              />
              <span>Remember me on this device</span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {isSubmitting ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-800/80 pt-6 text-center text-xs text-slate-400">
            <p className="flex items-center justify-center gap-1.5 font-medium text-slate-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Protected RBAC Portal
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              Self-registration is disabled. Driver accounts are issued directly by the system Admin.
            </p>
          </div>
        </motion.div>
      </main>

      <footer className="p-6 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Taxi Johor Cross Border. Secure Portal.
      </footer>
    </div>
  );
};

export default LoginPage;
