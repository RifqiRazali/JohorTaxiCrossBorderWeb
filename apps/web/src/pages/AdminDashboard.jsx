import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ShieldCheck, LogOut, UserPlus, Car, Eye, EyeOff, Check, AlertCircle, Plus, RefreshCw, Key, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fleetService } from '../services/fleetService';
import { authService } from '../services/authService';
import { provisionDriverSchema } from '../lib/zodSchemas';
import logoImg from '../assets/logo.png';

const AdminDashboard = () => {
  const { profile, logout } = useAuth();

  const [fleets, setFleets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('fleets'); // 'fleets' | 'provision'

  // Provisioning Form State
  const [provisionForm, setProvisionForm] = useState({
    email: '',
    password: '',
    fullName: '',
    fleetId: '',
  });
  const [provisioning, setProvisioning] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const data = await fleetService.getAllFleetsAdmin();
      setFleets(data);
      if (data.length > 0 && !provisionForm.fleetId) {
        setProvisionForm((prev) => ({ ...prev, fleetId: data[0].id }));
      }
    } catch (err) {
      console.error('Error fetching admin fleets:', err);
      setMessage({ type: 'error', text: 'Failed to load system fleet records.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleTogglePublish = async (fleetId, currentStatus) => {
    try {
      await fleetService.toggleFleetPublishStatus(fleetId, !currentStatus);
      setFleets((prev) =>
        prev.map((f) => (f.id === fleetId ? { ...f, isPublished: !currentStatus } : f))
      );
      setMessage({ type: 'success', text: `Updated visibility status for vehicle.` });
    } catch (err) {
      console.error('Error toggling publish status:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to update visibility.' });
    }
  };

  const handleProvisionSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Zod validation
    const validation = provisionDriverSchema.safeParse(provisionForm);
    if (!validation.success) {
      setMessage({ type: 'error', text: validation.error.errors[0].message });
      return;
    }

    setProvisioning(true);
    try {
      await authService.adminProvisionDriver(provisionForm);
      setMessage({
        type: 'success',
        text: `Driver account (${provisionForm.email}) created & linked to vehicle successfully!`,
      });
      setProvisionForm({
        email: '',
        password: '',
        fullName: '',
        fleetId: fleets[0]?.id || '',
      });
      await fetchAdminData();
    } catch (err) {
      console.error('Provisioning error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to provision driver account.' });
    } finally {
      setProvisioning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      <Helmet>
        <title>Admin Dashboard | Taxi Johor Cross Border</title>
      </Helmet>

      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 border-b border-slate-800 backdrop-blur-xl px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 p-1 ring-1 ring-emerald-400">
              <img src={logoImg} alt="Logo" className="h-full w-full object-contain rounded-lg" />
            </div>
            <div>
              <span className="font-display text-lg font-bold text-white block leading-tight flex items-center gap-1.5">
                Admin Command Center <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </span>
              <span className="text-xs text-slate-400 font-medium">Logged in as Administrator ({profile?.full_name || 'Admin'})</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-full bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        {/* Quick Metrics Bar */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Car className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-white">{fleets.length}</span>
              <span className="block text-xs text-slate-400 font-medium uppercase tracking-wider">Total Fleet Vehicles</span>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Eye className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-white">{fleets.filter((f) => f.isPublished).length}</span>
              <span className="block text-xs text-slate-400 font-medium uppercase tracking-wider">Published on Website</span>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-white">{fleets.filter((f) => f.driverId).length}</span>
              <span className="block text-xs text-slate-400 font-medium uppercase tracking-wider">Assigned Driver Accounts</span>
            </div>
          </div>
        </div>

        {/* Global Alert Notification */}
        {message.text && (
          <div
            className={`mb-6 rounded-2xl p-4 text-xs font-semibold flex items-center gap-3 border ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 mb-8 pb-4">
          <button
            onClick={() => setActiveTab('fleets')}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
              activeTab === 'fleets'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Car className="h-4 w-4" />
            <span>Manage All Fleets</span>
          </button>
          <button
            onClick={() => setActiveTab('provision')}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
              activeTab === 'provision'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            <span>Provision Driver Account</span>
          </button>
          <button
            onClick={fetchAdminData}
            title="Refresh Data"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Tab 1: Fleets Overview & Management */}
        {activeTab === 'fleets' && (
          <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800">
              <h2 className="font-display text-xl font-extrabold text-white">System Fleet Registry</h2>
              <p className="mt-1 text-xs text-slate-400">Control vehicle publishing status and inspect linked drivers.</p>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500 text-sm">Loading fleet items...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-4">Vehicle</th>
                      <th className="p-4">Driver Name</th>
                      <th className="p-4">Fare Rate</th>
                      <th className="p-4">Specs</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {fleets.map((car) => (
                      <tr key={car.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4 flex items-center gap-3">
                          <img src={car.image} alt={car.name} className="h-12 w-16 object-cover rounded-lg bg-slate-950 border border-slate-800 shrink-0" />
                          <div>
                            <span className="font-bold text-white text-sm block">{car.name}</span>
                            <span className="text-[11px] font-mono text-slate-500">{car.id}</span>
                          </div>
                        </td>
                        <td className="p-4 font-medium text-slate-200">
                          {car.driverName || 'Unassigned'}
                          {car.assignedDriverName && (
                            <span className="block text-[10px] text-emerald-400 font-mono">Linked: {car.assignedDriverName}</span>
                          )}
                        </td>
                        <td className="p-4 font-bold text-emerald-400">{car.rate}</td>
                        <td className="p-4 text-[11px] text-slate-400">
                          <div>{car.seats}</div>
                          <div>{car.luggage}</div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                              car.isPublished
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {car.isPublished ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            {car.isPublished ? 'Published' : 'Hidden'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleTogglePublish(car.id, car.isPublished)}
                            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 active:scale-95"
                          >
                            {car.isPublished ? 'Hide' : 'Publish'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Provision Driver Account */}
        {activeTab === 'provision' && (
          <div className="max-w-2xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-xl">
            <div className="border-b border-slate-800 pb-5">
              <h2 className="font-display text-2xl font-extrabold text-white flex items-center gap-2">
                <UserPlus className="h-6 w-6 text-emerald-400" /> Generate Driver Account
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Self-registration is disabled. Provision an official driver account and assign it to a vehicle.
              </p>
            </div>

            <form onSubmit={handleProvisionSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Driver Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={provisionForm.fullName}
                    onChange={(e) => setProvisionForm({ ...provisionForm, fullName: e.target.value })}
                    placeholder="e.g. Mr. Razali"
                    required
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Driver Email Address (Sign In Credential)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={provisionForm.email}
                    onChange={(e) => setProvisionForm({ ...provisionForm, email: e.target.value })}
                    placeholder="razali@taxijohor.com"
                    required
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Temporary Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    value={provisionForm.password}
                    onChange={(e) => setProvisionForm({ ...provisionForm, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Assign Vehicle Fleet Item
                </label>
                <select
                  value={provisionForm.fleetId}
                  onChange={(e) => setProvisionForm({ ...provisionForm, fleetId: e.target.value })}
                  required
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                >
                  {fleets.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.name} ({car.driverName}) [{car.id}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-slate-800 pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={provisioning}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>{provisioning ? 'Provisioning Account...' : 'Create & Link Driver Account'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
