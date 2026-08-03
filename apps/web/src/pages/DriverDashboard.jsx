import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Car, LogOut, Upload, Check, AlertCircle, Users, Briefcase, Phone, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fleetService } from '../services/fleetService';
import { storageService } from '../services/storageService';
import { fleetEditSchema } from '../lib/zodSchemas';
import logoImg from '../assets/logo.png';

const DriverDashboard = () => {
  const { user, profile, logout } = useAuth();

  const [fleet, setFleet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    driverName: '',
    rate: '',
    seats: '',
    luggage: '',
    whatsappNumber: '',
    imageUrl: '',
    description: '',
  });

  useEffect(() => {
    const fetchFleetData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const data = await fleetService.getDriverFleet(user.id);
        if (data) {
          setFleet(data);
          setFormData({
            name: data.name || '',
            driverName: data.driverName || profile?.full_name || '',
            rate: data.rate || '',
            seats: data.seats || '',
            luggage: data.luggage || '',
            whatsappNumber: data.whatsappNumber || '',
            imageUrl: data.image || '',
            description: data.description || '',
          });
        }
      } catch (err) {
        console.error('Error loading driver fleet:', err);
        setMessage({ type: 'error', text: 'Failed to load assigned vehicle record.' });
      } finally {
        setLoading(false);
      }
    };

    fetchFleetData();
  }, [user, profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setMessage({ type: '', text: '' });
    try {
      const { publicUrl, error } = await storageService.uploadFleetImage(file, `fleets/${user.id}`);
      if (error) throw error;

      if (publicUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: publicUrl }));
        setMessage({ type: 'success', text: 'Image uploaded successfully to Supabase storage!' });
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      setMessage({ type: 'error', text: 'Image upload failed. Please try again.' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!fleet?.id) {
      setMessage({ type: 'error', text: 'No vehicle is currently linked to your driver account. Contact Admin.' });
      return;
    }

    // Validate using Zod
    const validation = fleetEditSchema.safeParse(formData);
    if (!validation.success) {
      setMessage({ type: 'error', text: validation.error.errors[0].message });
      return;
    }

    setSaving(true);
    try {
      await fleetService.updateDriverFleet(fleet.id, formData);
      setMessage({ type: 'success', text: 'Vehicle profile updated successfully!' });
      setFleet((prev) => ({ ...prev, ...formData, image: formData.imageUrl }));
    } catch (err) {
      console.error('Error saving fleet profile:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to update vehicle details.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      <Helmet>
        <title>Driver Dashboard | Taxi Johor Cross Border</title>
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/90 border-b border-slate-800 backdrop-blur-xl px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 p-1 ring-1 ring-emerald-400">
              <img src={logoImg} alt="Logo" className="h-full w-full object-contain rounded-lg" />
            </div>
            <div>
              <span className="font-display text-lg font-bold text-white block leading-tight">Driver Workspace</span>
              <span className="text-xs text-emerald-400 font-medium">Welcome back, {profile?.full_name || 'Driver'}</span>
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

      {/* Content Body */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            <p className="mt-4 text-sm text-slate-400">Loading your vehicle details...</p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column: Current Live Card Preview */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" /> Public Website Preview
                  </span>
                  <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                    {fleet?.isPublished ? 'Published' : 'Hidden'}
                  </span>
                </div>

                <div className="overflow-hidden rounded-2xl bg-slate-950 border border-slate-800">
                  <img
                    src={formData.imageUrl || '/images/fleet/toyotainnovapa.jpeg'}
                    alt={formData.name || 'Vehicle'}
                    className="h-48 w-full object-cover"
                  />
                  <div className="p-5">
                    <span className="inline-block rounded-full bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-300">
                      {formData.rate || 'SGD 0 per trip'}
                    </span>
                    <h3 className="mt-3 font-display text-xl font-bold text-white">{formData.name || 'Vehicle Name'}</h3>
                    <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                      <Car className="h-3.5 w-3.5 text-emerald-400" /> Driver: {formData.driverName || 'Not set'}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-300">
                      <span className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1 flex items-center gap-1">
                        <Users className="h-3 w-3 text-emerald-400" /> {formData.seats || 'Seats'}
                      </span>
                      <span className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1 flex items-center gap-1">
                        <Briefcase className="h-3 w-3 text-emerald-400" /> {formData.luggage || 'Luggage'}
                      </span>
                    </div>

                    {formData.description && (
                      <p className="mt-3 text-xs leading-relaxed text-slate-400 border-t border-slate-800/80 pt-3">
                        {formData.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Edit Vehicle Profile Form */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl"
              >
                <div className="border-b border-slate-800 pb-5">
                  <h2 className="font-display text-2xl font-extrabold text-white flex items-center gap-2">
                    <Car className="h-6 w-6 text-emerald-400" /> Edit Fleet Details &amp; Rates
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Update your cross-border taxi specs, rates, driver info, and vehicle picture.
                  </p>
                </div>

                {message.text && (
                  <div
                    className={`mt-6 rounded-2xl p-4 text-xs font-semibold flex items-center gap-3 border ${
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

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                  {/* Media Upload */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Vehicle Image
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <img
                        src={formData.imageUrl || '/images/fleet/vellfiretaxi.jpeg'}
                        alt="Preview"
                        className="h-24 w-36 object-cover rounded-xl border border-slate-800 bg-slate-950"
                      />
                      <div className="flex-1 w-full">
                        <label className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700 active:scale-95">
                          <Upload className="h-4 w-4 text-emerald-400" />
                          <span>{uploadingImage ? 'Uploading...' : 'Upload New Photo (Supabase)'}</span>
                          <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
                        </label>
                        <p className="mt-2 text-[11px] text-slate-500">Supported formats: JPG, PNG, WEBP up to 5MB.</p>
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
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Toyota Innova"
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
                        name="driverName"
                        value={formData.driverName}
                        onChange={handleChange}
                        placeholder="e.g. Mr. Razali"
                        required
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Rate (Per Trip)
                      </label>
                      <input
                        type="text"
                        name="rate"
                        value={formData.rate}
                        onChange={handleChange}
                        placeholder="e.g. SGD 120 per trip"
                        required
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        WhatsApp Number (Country Code)
                      </label>
                      <input
                        type="text"
                        name="whatsappNumber"
                        value={formData.whatsappNumber}
                        onChange={handleChange}
                        placeholder="e.g. 60138728630"
                        required
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Passenger Capacity
                      </label>
                      <input
                        type="text"
                        name="seats"
                        value={formData.seats}
                        onChange={handleChange}
                        placeholder="e.g. 5 passengers"
                        required
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Luggage Capacity
                      </label>
                      <input
                        type="text"
                        name="luggage"
                        value={formData.luggage}
                        onChange={handleChange}
                        placeholder="e.g. 2 large bags"
                        required
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Vehicle &amp; Service Description (Optional)
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Add details about vehicle features, child seat availability, or special services..."
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="border-t border-slate-800 pt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                    >
                      <Check className="h-4 w-4" />
                      <span>{saving ? 'Saving Changes...' : 'Save Fleet Details'}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DriverDashboard;
