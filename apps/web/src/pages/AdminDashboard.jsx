import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ShieldCheck, LogOut, UserPlus, Car, Eye, EyeOff, RefreshCw, Key, KeyRound, Mail, User, Phone, Upload, Copy, Image, Clock, Trash2, RotateCw, AlertTriangle, Search, X, Pencil, Move, RotateCcw, Users, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { fleetService } from '../services/fleetService';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';
import { getValidationMessage, provisionDriverSchema, changePasswordSchema, fleetEditSchema } from '../lib/zodSchemas';
import { calculateRenewalTimer, formatCountLabel, extractCount } from '../lib/utils';
import logoImg from '../assets/logo.png';

const DEFAULT_PROVISION_FORM = {
  fullName: '',
  phoneNumber: '',
  email: '',
  password: '',
  carName: '',
  carSeats: '4',
  carLargeBags: '4',
  carRate: '',
  carImageUrl: '',
  carDescription: '',
  direction: 'jb-sg',
};

const createTemporaryPassword = () =>
  `TJ-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const DRIVER_EMAIL_DOMAIN = '@taxijohor.com';

const buildDriverEmail = (rawUsername) => {
  const withoutDomain = rawUsername.replace(/@taxijohor\.com$/i, '');
  const cleanUsername = withoutDomain.toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return cleanUsername ? `${cleanUsername}${DRIVER_EMAIL_DOMAIN}` : '';
};

const buildCredentialMessage = ({ email, password }) => {
  const portalUrl = `${window.location.origin}/login`;
  return `Taxi Johor Driver Portal Login\n\nEmail: ${email}\nTemporary password: ${password}\nPortal: ${portalUrl}\n\nPlease sign in and update your vehicle details if needed.`;
};

const buildPasswordResetMessage = ({ password }) => {
  const portalUrl = `${window.location.origin}/login`;
  return `Taxi Johor Driver Portal — Password Reset\n\nYour new temporary password: ${password}\nPortal: ${portalUrl}\n\nPlease sign in and update your password from your dashboard.`;
};

const AdminDashboard = () => {
  const { user, profile, logout } = useAuth();

  const [fleets, setFleets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fleets'); // 'fleets' | 'provision'
  const [now, setNow] = useState(() => new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState('all'); // 'all' | 'jb-sg' | 'sg-jb'

  // Change Password State
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  // Provisioning Form State
  const [provisionForm, setProvisionForm] = useState(DEFAULT_PROVISION_FORM);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageInputKey, setImageInputKey] = useState(0);
  const [lastProvisionedCredentials, setLastProvisionedCredentials] = useState(null);
  const [credentialsCopied, setCredentialsCopied] = useState(false);
  const [provisioning, setProvisioning] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const data = await fleetService.getAllFleetsAdmin();
      setFleets(data);
    } catch (err) {
      console.error('Error fetching admin fleets:', err);
      toast.error('Failed to load system fleet records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Keep the renewal countdowns live without needing a page reload
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const [driverToDelete, setDriverToDelete] = useState(null);
  const [driverToResetPassword, setDriverToResetPassword] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetPasswordResult, setResetPasswordResult] = useState(null);
  const [resetCredentialsCopied, setResetCredentialsCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleOpenResetPassword = (car) => {
    setDriverToResetPassword(car);
    setResetPasswordValue(createTemporaryPassword());
  };

  // Edit Vehicle Modal State
  const [editingFleet, setEditingFleet] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const editImageFrameRef = useRef(null);

  const handleOpenEdit = (car) => {
    setEditingFleet(car);
    setEditForm({
      name: car.name || '',
      driverName: car.driverName || '',
      rate: car.rate || '',
      seats: car.seats || '',
      luggage: car.luggage || '',
      whatsappNumber: car.whatsappNumber || '',
      imageUrl: car.image || '',
      imagePositionX: car.imagePositionX ?? 50,
      imagePositionY: car.imagePositionY ?? 50,
      galleryUrls: car.galleryUrls || [],
      description: car.description || '',
      direction: car.direction || 'jb-sg',
      isPublished: car.isPublished,
    });
  };

  const handleCloseEdit = () => {
    setEditingFleet(null);
    setEditForm(null);
  };

  const handleEditFieldChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSeatsChange = (e) => {
    const count = e.target.value.replace(/\D/g, '');
    setEditForm((prev) => ({ ...prev, seats: count ? formatCountLabel(count, 'Seater', 'Seater') : '' }));
  };

  const handleEditLuggageChange = (e) => {
    const count = e.target.value.replace(/\D/g, '');
    setEditForm((prev) => ({ ...prev, luggage: count ? formatCountLabel(count, 'large bag', 'large bags') : '' }));
  };

  const handleEditWhatsAppChange = (e) => {
    setEditForm((prev) => ({ ...prev, whatsappNumber: e.target.value.replace(/\D/g, '') }));
  };

  const handleEditImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingEditImage(true);
    try {
      const { publicUrl, error } = await storageService.uploadFleetImage(file, `fleets/${editingFleet.driverId || editingFleet.id}`);
      if (error) throw error;

      if (publicUrl) {
        setEditForm((prev) => ({ ...prev, imageUrl: publicUrl, imagePositionX: 50, imagePositionY: 50 }));
        toast.success('Vehicle photo uploaded & compressed successfully!');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      toast.error(err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploadingEditImage(false);
    }
  };

  const updateEditImagePositionFromEvent = (e) => {
    const frame = editImageFrameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    setEditForm((prev) => ({ ...prev, imagePositionX: Math.round(x), imagePositionY: Math.round(y) }));
  };

  const handleEditImagePositionPointerUp = () => {
    window.removeEventListener('pointermove', updateEditImagePositionFromEvent);
    window.removeEventListener('pointerup', handleEditImagePositionPointerUp);
  };

  const handleEditImagePositionPointerDown = (e) => {
    e.preventDefault();
    updateEditImagePositionFromEvent(e);
    window.addEventListener('pointermove', updateEditImagePositionFromEvent);
    window.addEventListener('pointerup', handleEditImagePositionPointerUp);
  };

  const handleResetEditImagePosition = () => {
    setEditForm((prev) => ({ ...prev, imagePositionX: 50, imagePositionY: 50 }));
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editingFleet || !editForm) return;

    const validation = fleetEditSchema.safeParse(editForm);
    if (!validation.success) {
      toast.error(getValidationMessage(validation));
      return;
    }

    setSavingEdit(true);
    try {
      await fleetService.updateDriverFleet(editingFleet.id, editForm);
      setFleets((prev) => prev.map((f) => (f.id === editingFleet.id ? { ...f, ...editForm, image: editForm.imageUrl } : f)));
      toast.success('Vehicle details updated successfully!');
      handleCloseEdit();
    } catch (err) {
      console.error('Error updating vehicle:', err);
      toast.error(err.message || 'Failed to update vehicle details.');
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredFleets = (() => {
    const query = searchQuery.trim().toLowerCase();
    return fleets
      .filter((car) => directionFilter === 'all' || (car.direction || 'jb-sg') === directionFilter)
      .filter((car) =>
        !query ||
        [car.name, car.driverName, car.assignedDriverName, car.id]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(query))
      );
  })();

  const handleTogglePublish = async (fleetId, currentStatus) => {
    try {
      await fleetService.toggleFleetPublishStatus(fleetId, !currentStatus);
      setFleets((prev) =>
        prev.map((f) => (f.id === fleetId ? { ...f, isPublished: !currentStatus } : f))
      );
      toast.success('Updated visibility status for vehicle.');
    } catch (err) {
      console.error('Error toggling publish status:', err);
      toast.error(err.message || 'Failed to update visibility.');
    }
  };

  const handleRenewDriver = async (driverId, currentExpiresAt) => {
    if (!driverId) {
      toast.error('No driver account is currently assigned to this vehicle.');
      return;
    }

    try {
      setActionLoading(true);
      const newExpiry = await authService.adminRenewDriver(driverId, currentExpiresAt);
      setFleets((prev) =>
        prev.map((f) => (f.driverId === driverId ? { ...f, expiresAt: newExpiry } : f))
      );
      toast.success('Driver account renewed for +1 year successfully!');
    } catch (err) {
      console.error('Error renewing driver account:', err);
      toast.error(err.message || 'Failed to renew driver account.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPasswordConfirm = async () => {
    if (!driverToResetPassword) return;

    if (resetPasswordValue.trim().length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    try {
      setActionLoading(true);
      const newPassword = resetPasswordValue.trim();
      await authService.adminResetDriverPassword(driverToResetPassword.driverId, newPassword);
      setResetPasswordResult({
        driverName: driverToResetPassword.driverName || driverToResetPassword.assignedDriverName || 'Driver',
        password: newPassword,
      });
      setResetCredentialsCopied(false);
      toast.success('Driver password reset successfully!');
      setDriverToResetPassword(null);
    } catch (err) {
      console.error('Error resetting driver password:', err);
      toast.error(err.message || 'Failed to reset driver password.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyResetPassword = async () => {
    if (!resetPasswordResult) return;

    try {
      await navigator.clipboard.writeText(buildPasswordResetMessage(resetPasswordResult));
      setResetCredentialsCopied(true);
      setTimeout(() => setResetCredentialsCopied(false), 2500);
    } catch (err) {
      console.error('Reset credential copy failed:', err);
      toast.error('Could not copy credentials. Please copy the password manually.');
    }
  };

  const handleDeleteDriverConfirm = async () => {
    if (!driverToDelete) return;

    try {
      setActionLoading(true);
      await authService.adminDeleteDriver(driverToDelete.driverId, driverToDelete.id, {
        imageUrl: driverToDelete.image,
        galleryUrls: driverToDelete.galleryUrls,
      });
      setFleets((prev) => prev.filter((f) => f.id !== driverToDelete.id && f.driverId !== driverToDelete.driverId));
      toast.success(`Driver "${driverToDelete.driverName || 'Driver'}" and vehicle record deleted successfully.`);
      setDriverToDelete(null);
    } catch (err) {
      console.error('Error deleting driver:', err);
      toast.error(err.message || 'Failed to delete driver account.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePasswordFieldChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    const validation = changePasswordSchema.safeParse(passwordForm);
    if (!validation.success) {
      toast.error(getValidationMessage(validation));
      return;
    }

    setChangingPassword(true);
    try {
      await authService.updatePassword(user.email, passwordForm.currentPassword, passwordForm.newPassword);
      toast.success('Password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Error changing password:', err);
      toast.error(err.message || 'Failed to update password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleProvisionChange = (field, value) => {
    setProvisionForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDriverUsernameChange = (value) => {
    handleProvisionChange('email', buildDriverEmail(value));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setSelectedImage(file);
    if (file) {
      setProvisionForm((prev) => ({ ...prev, carImageUrl: '' }));
    }
  };

  const handleCopyCredentials = async () => {
    if (!lastProvisionedCredentials) return;

    try {
      await navigator.clipboard.writeText(buildCredentialMessage(lastProvisionedCredentials));
      setCredentialsCopied(true);
      setTimeout(() => setCredentialsCopied(false), 2500);
    } catch (err) {
      console.error('Credential copy failed:', err);
      toast.error('Could not copy credentials. Please copy the email and password manually.');
    }
  };

  const handleProvisionSubmit = async (e) => {
    e.preventDefault();
    setCredentialsCopied(false);

    // Zod validation
    const validation = provisionDriverSchema.safeParse(provisionForm);
    if (!validation.success) {
      toast.error(getValidationMessage(validation));
      return;
    }

    if (!selectedImage && !provisionForm.carImageUrl.trim()) {
      toast.error('Please upload the initial car picture.');
      return;
    }

    setProvisioning(true);
    try {
      let carImageUrl = provisionForm.carImageUrl;
      if (selectedImage) {
        const { publicUrl, error } = await storageService.uploadFleetImage(selectedImage, 'fleets/new-drivers');
        if (error) throw error;
        carImageUrl = publicUrl;
      }

      await authService.adminProvisionDriver({ ...provisionForm, carImageUrl });
      const credentials = {
        email: provisionForm.email.trim().toLowerCase(),
        password: provisionForm.password,
      };
      setLastProvisionedCredentials(credentials);
      toast.success(`Driver account (${credentials.email}) and vehicle profile created successfully.`);
      setProvisionForm(DEFAULT_PROVISION_FORM);
      setSelectedImage(null);
      setImageInputKey((prev) => prev + 1);
      await fetchAdminData();
    } catch (err) {
      console.error('Provisioning error:', err);
      toast.error(err.message || 'Failed to provision driver account.');
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
            <div className="min-w-0">
              <span className="font-display text-lg font-bold text-white block leading-tight flex items-center gap-1.5">
                Admin Command Center <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </span>
              <span className="text-xs text-slate-400 font-medium block break-words">Logged in as Administrator ({profile?.full_name || 'Admin'})</span>
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
            <div className="p-6 border-b border-slate-800 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="font-display text-xl font-extrabold text-white">System Fleet Registry</h2>
                <p className="mt-1 text-xs text-slate-400">Control vehicle publishing status and inspect linked drivers.</p>
              </div>
              <div className="relative w-full sm:w-72 shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by vehicle, driver, or ID..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-9 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="px-6 pt-4 pb-2 border-b border-slate-800 flex items-center gap-2">
              {[
                { value: 'all', label: 'All Routes' },
                { value: 'jb-sg', label: 'Johor → Singapore' },
                { value: 'sg-jb', label: 'Singapore → Johor' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDirectionFilter(opt.value)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    directionFilter === opt.value
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500 text-sm">Loading fleet items...</div>
            ) : filteredFleets.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                {searchQuery ? (
                  <>
                    No vehicles match &quot;{searchQuery}&quot;.{' '}
                    <button type="button" onClick={() => setSearchQuery('')} className="text-emerald-400 hover:underline font-semibold">
                      Clear search
                    </button>
                  </>
                ) : (
                  <>
                    No vehicles on this route yet.{' '}
                    <button type="button" onClick={() => setDirectionFilter('all')} className="text-emerald-400 hover:underline font-semibold">
                      Show all routes
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-4">Vehicle</th>
                      <th className="p-4">Route</th>
                      <th className="p-4">Driver Name</th>
                      <th className="p-4">Annual Renewal (1-Yr Timer)</th>
                      <th className="p-4">Fare &amp; Specs</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredFleets.map((car) => {
                      const timer = calculateRenewalTimer(car.expiresAt, now);
                      return (
                        <tr key={car.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-4 flex items-center gap-3">
                            <img src={car.image} alt={car.name} className="h-12 w-16 object-cover rounded-lg bg-slate-950 border border-slate-800 shrink-0" />
                            <div className="min-w-0">
                              <span className="font-bold text-white text-sm block break-words">{car.name}</span>
                              <span className="text-[11px] font-mono text-slate-500 block truncate" title={car.id}>{car.id}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold whitespace-nowrap ${
                              (car.direction || 'jb-sg') === 'sg-jb'
                                ? 'bg-sky-500/15 text-sky-300 border border-sky-500/25'
                                : 'bg-violet-500/15 text-violet-300 border border-violet-500/25'
                            }`}>
                              {(car.direction || 'jb-sg') === 'sg-jb' ? 'SG → JB' : 'JB → SG'}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-slate-200">
                            <div className="break-words">{car.driverName || 'Unassigned'}</div>
                            {car.assignedDriverName && (
                              <span className="block text-[10px] text-emerald-400 font-mono break-words">Linked: {car.assignedDriverName}</span>
                            )}
                          </td>
                          <td className="p-4">
                            {car.driverId ? (
                              <div className="flex flex-col items-start gap-1">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                    timer.status === 'expired'
                                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                      : timer.status === 'warning'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                  }`}
                                >
                                  <Clock className="h-3.5 w-3.5 shrink-0" />
                                  <span>{timer.text}</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRenewDriver(car.driverId, car.expiresAt)}
                                  disabled={actionLoading}
                                  className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline transition disabled:opacity-50"
                                >
                                  <RotateCw className="h-3 w-3" />
                                  <span>Renew (+1 Year)</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500 italic">No active driver</span>
                            )}
                          </td>
                          <td className="p-4 text-[11px] max-w-[160px]">
                            {car.rate && <div className="font-bold text-emerald-400 text-xs break-words">{car.rate}</div>}
                            <div className="text-slate-400 break-words">{car.seats} · {car.luggage}</div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col items-start gap-1">
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
                              {car.isPublished && car.isDriverExpired && (
                                <span
                                  className="inline-flex items-center gap-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 text-[9px] font-bold uppercase"
                                  title="This vehicle is not actually visible on the public site because the driver's account has expired."
                                >
                                  <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                                  Hidden: driver expired
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEdit(car)}
                                className="rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 active:scale-95 flex items-center gap-1"
                                title="Edit Vehicle Details"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleTogglePublish(car.id, car.isPublished)}
                                className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 active:scale-95"
                              >
                                {car.isPublished ? 'Hide' : 'Publish'}
                              </button>
                              {car.driverId && (
                                <button
                                  onClick={() => handleOpenResetPassword(car)}
                                  className="rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 active:scale-95 flex items-center gap-1"
                                  title="Reset Driver Password"
                                >
                                  <Key className="h-3.5 w-3.5" />
                                  <span>Reset Password</span>
                                </button>
                              )}
                              {car.driverId && (
                                <button
                                  onClick={() => setDriverToDelete(car)}
                                  className="rounded-lg bg-red-500/10 border border-red-500/30 px-2.5 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 active:scale-95 flex items-center gap-1"
                                  title="Delete Driver Account"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Provision Driver Account */}
        {activeTab === 'provision' && (
          <div className="mx-auto max-w-4xl rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl sm:p-8">
            <div className="border-b border-slate-800 pb-5">
              <h2 className="font-display text-2xl font-extrabold text-white flex items-center gap-2">
                <UserPlus className="h-6 w-6 text-emerald-400" /> Create Driver &amp; Vehicle
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Add the driver login, WhatsApp number, and first vehicle profile in one step.
              </p>
            </div>

            {lastProvisionedCredentials && (
              <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Driver Login Ready</p>
                    <div className="mt-3 space-y-1 font-mono text-xs text-white">
                      <p className="break-words">Email: {lastProvisionedCredentials.email}</p>
                      <p className="break-words">Temporary password: {lastProvisionedCredentials.password}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCredentials}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 active:scale-95 shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                    <span>{credentialsCopied ? 'Copied' : 'Copy Login Details'}</span>
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleProvisionSubmit} className="mt-6 space-y-8">
              <section>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-slate-200">
                  <User className="h-4 w-4 text-emerald-400" /> Driver Details
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Driver Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        value={provisionForm.fullName}
                        onChange={(e) => handleProvisionChange('fullName', e.target.value)}
                        placeholder="e.g. Mr. Razali"
                        required
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Phone / WhatsApp Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="tel"
                        value={provisionForm.phoneNumber}
                        onChange={(e) => handleProvisionChange('phoneNumber', e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 60123456789"
                        required
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">Digits only, include country code, no + or spaces (e.g. 60123456789)</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Driver Username
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        value={provisionForm.email.replace(DRIVER_EMAIL_DOMAIN, '')}
                        onChange={(e) => handleDriverUsernameChange(e.target.value)}
                        placeholder="razali"
                        required
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-32 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      />
                      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">{DRIVER_EMAIL_DOMAIN}</span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">Login username only — the domain is added automatically.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Temporary Password
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Key className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                        <input
                          type="text"
                          value={provisionForm.password}
                          onChange={(e) => handleProvisionChange('password', e.target.value)}
                          placeholder="TJ-ABCD-1234"
                          required
                          className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleProvisionChange('password', createTemporaryPassword())}
                        className="rounded-xl border border-slate-700 bg-slate-800 px-3 text-xs font-bold text-white transition hover:bg-slate-700"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-slate-200">
                  <Car className="h-4 w-4 text-emerald-400" /> Vehicle Details
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Car Name
                    </label>
                    <input
                      type="text"
                      value={provisionForm.carName}
                      onChange={(e) => handleProvisionChange('carName', e.target.value)}
                      placeholder="e.g. Toyota Innova"
                      required
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Passenger Seats
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={provisionForm.carSeats}
                        onChange={(e) => handleProvisionChange('carSeats', e.target.value)}
                        required
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-4 pr-20 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">Seater</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Large Bags
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={provisionForm.carLargeBags}
                        onChange={(e) => handleProvisionChange('carLargeBags', e.target.value)}
                        required
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-4 pr-24 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">large bags</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Route Direction
                    </label>
                    <select
                      value={provisionForm.direction}
                      onChange={(e) => handleProvisionChange('direction', e.target.value)}
                      required
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="jb-sg">Johor &rarr; Singapore</option>
                      <option value="sg-jb">Singapore &rarr; Johor</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Initial Car Picture
                  </label>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950 px-4 py-8 text-center transition hover:border-emerald-500/70 hover:bg-slate-900">
                    {selectedImage ? (
                      <>
                        <Image className="h-8 w-8 text-emerald-400" />
                        <span className="mt-3 text-sm font-bold text-white">{selectedImage.name}</span>
                        <span className="mt-1 text-xs text-slate-500">Ready to upload</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-slate-500" />
                        <span className="mt-3 text-sm font-bold text-white">Upload car photo</span>
                        <span className="mt-1 text-xs text-slate-500">JPG, PNG, or WEBP</span>
                      </>
                    )}
                    <input key={imageInputKey} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              </section>

              <div className="border-t border-slate-800 pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={provisioning}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>{provisioning ? 'Creating Account...' : 'Create Driver Account'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 mx-auto max-w-4xl rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl sm:p-8"
        >
          <div className="border-b border-slate-800 pb-5">
            <h2 className="font-display text-xl font-extrabold text-white flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-emerald-400" /> Change Password
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Update your own login password. Your current password is required to confirm.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="mt-6 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => handlePasswordFieldChange('currentPassword', e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                New Password
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => handlePasswordFieldChange('newPassword', e.target.value)}
                placeholder="At least 6 characters"
                required
                className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => handlePasswordFieldChange('confirmPassword', e.target.value)}
                placeholder="Repeat new password"
                required
                className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={changingPassword}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 hover:border-emerald-600 active:scale-95 disabled:opacity-50"
              >
                <KeyRound className="h-4 w-4" />
                <span>{changingPassword ? 'Updating...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </main>

      {/* Delete Confirmation Modal */}
      {driverToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="font-display text-xl font-bold text-white">Delete Driver Account?</h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed break-words">
              Are you sure you want to permanently delete driver <strong className="text-white">{driverToDelete.driverName || driverToDelete.assignedDriverName || 'Driver'}</strong> and remove their vehicle record (<span className="font-mono text-emerald-400">{driverToDelete.name}</span>)?
            </p>
            <p className="mt-2 text-[11px] text-red-400 font-semibold">
              This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDriverToDelete(null)}
                disabled={actionLoading}
                className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDriverConfirm}
                disabled={actionLoading}
                className="rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-red-400 transition shadow-lg shadow-red-500/20 flex items-center gap-1.5"
              >
                {actionLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {editingFleet && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto py-8">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0">
              <h3 className="font-display text-xl font-extrabold text-white flex items-center gap-2">
                <Pencil className="h-5 w-5 text-emerald-400" /> Edit Vehicle Details
              </h3>
              <button
                onClick={handleCloseEdit}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSave} className="overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Vehicle Image
                </label>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="w-full sm:max-w-xs">
                    <div
                      ref={editImageFrameRef}
                      onPointerDown={handleEditImagePositionPointerDown}
                      className="relative w-full aspect-[16/10] overflow-hidden rounded-xl border border-slate-800 bg-slate-950 cursor-crosshair touch-none select-none"
                    >
                      <img
                        src={editForm.imageUrl || '/images/fleet/vellfiretaxi.jpeg'}
                        alt="Position preview"
                        draggable={false}
                        className="h-full w-full object-cover pointer-events-none"
                        style={{ objectPosition: `${editForm.imagePositionX}% ${editForm.imagePositionY}%` }}
                      />
                      <div
                        className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-500/80 shadow-lg"
                        style={{ left: `${editForm.imagePositionX}%`, top: `${editForm.imagePositionY}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500 flex items-start gap-1.5">
                      <Move className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Click or drag inside the photo to position it.</span>
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 w-full sm:w-48 shrink-0">
                    <label className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700 active:scale-95">
                      <Upload className="h-4 w-4 text-emerald-400" />
                      <span>{uploadingEditImage ? 'Uploading...' : 'Upload New Photo'}</span>
                      <input type="file" accept="image/*" onChange={handleEditImageUpload} disabled={uploadingEditImage} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={handleResetEditImagePosition}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-slate-800"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset to Center</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Vehicle Model / Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleEditFieldChange('name', e.target.value)}
                    required
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Driver Display Name
                  </label>
                  <input
                    type="text"
                    value={editForm.driverName}
                    onChange={(e) => handleEditFieldChange('driverName', e.target.value)}
                    required
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Route Direction
                  </label>
                  <select
                    value={editForm.direction}
                    onChange={(e) => handleEditFieldChange('direction', e.target.value)}
                    required
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="jb-sg">Johor &rarr; Singapore</option>
                    <option value="sg-jb">Singapore &rarr; Johor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    WhatsApp Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="tel"
                      value={editForm.whatsappNumber}
                      onChange={handleEditWhatsAppChange}
                      required
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Passenger Capacity
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="number"
                      min="0"
                      value={extractCount(editForm.seats)}
                      onChange={handleEditSeatsChange}
                      required
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-24 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">Seater</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Luggage Capacity
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="number"
                      min="0"
                      value={extractCount(editForm.luggage)}
                      onChange={handleEditLuggageChange}
                      required
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-24 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">large bags</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Rate (Internal — not shown publicly)
                  </label>
                  <input
                    type="text"
                    value={editForm.rate}
                    onChange={(e) => handleEditFieldChange('rate', e.target.value)}
                    placeholder="e.g. SGD 120 per trip"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Vehicle &amp; Service Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => handleEditFieldChange('description', e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="border-t border-slate-800 pt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="rounded-xl bg-slate-800 border border-slate-700 px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Confirmation Modal */}
      {driverToResetPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">
              <Key className="h-6 w-6" />
            </div>
            <h3 className="font-display text-xl font-bold text-white">Reset Driver Password?</h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed break-words">
              Set a new password for <strong className="text-white">{driverToResetPassword.driverName || driverToResetPassword.assignedDriverName || 'Driver'}</strong>, replacing their current password immediately.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                New Password
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder="TJ-ABCD-1234"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setResetPasswordValue(createTemporaryPassword())}
                  className="shrink-0 rounded-xl border border-slate-700 bg-slate-800 px-3 text-xs font-bold text-white transition hover:bg-slate-700"
                >
                  Generate
                </button>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">At least 6 characters. Type your own or click Generate for a random one.</p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDriverToResetPassword(null)}
                disabled={actionLoading}
                className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPasswordConfirm}
                disabled={actionLoading}
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
              >
                {actionLoading ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Result Modal */}
      {resetPasswordResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
              <Key className="h-6 w-6" />
            </div>
            <h3 className="font-display text-xl font-bold text-white">Password Reset Successfully</h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed break-words">
              Share this new temporary password with <strong className="text-white">{resetPasswordResult.driverName}</strong>. Their login email stays the same.
            </p>
            <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 font-mono text-sm text-white break-words">
              {resetPasswordResult.password}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setResetPasswordResult(null)}
                className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleCopyResetPassword}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{resetCredentialsCopied ? 'Copied' : 'Copy Login Details'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
