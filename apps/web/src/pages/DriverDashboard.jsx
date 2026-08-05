import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Car, LogOut, Upload, Check, Users, Briefcase, Phone, MessageSquare, ShieldCheck, Sparkles, Trash2, Image as ImageIcon, Clock, KeyRound, Move, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { fleetService } from '../services/fleetService';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';
import { fleetEditSchema, changePasswordSchema, getValidationMessage } from '../lib/zodSchemas';
import { calculateRenewalTimer, formatCountLabel, extractCount } from '../lib/utils';
import logoImg from '../assets/logo.png';

const DriverDashboard = () => {
  const { user, profile, logout } = useAuth();

  const [fleet, setFleet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [now, setNow] = useState(() => new Date());

  // Change Password State
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    driverName: '',
    rate: '',
    seats: '',
    luggage: '',
    whatsappNumber: '',
    imageUrl: '',
    imagePositionX: 50,
    imagePositionY: 50,
    galleryUrls: [],
    description: '',
    direction: 'jb-sg',
  });

  const imageFrameRef = useRef(null);

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
            imagePositionX: data.imagePositionX ?? 50,
            imagePositionY: data.imagePositionY ?? 50,
            galleryUrls: data.galleryUrls || [],
            description: data.description || '',
            direction: data.direction || 'jb-sg',
          });
        }
      } catch (err) {
        console.error('Error loading driver fleet:', err);
        toast.error('Failed to load assigned vehicle record.');
      } finally {
        setLoading(false);
      }
    };

    fetchFleetData();
  }, [user, profile]);

  // Keep the account renewal countdown live without needing a page reload
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const renewalTimer = calculateRenewalTimer(profile?.expires_at, now);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleWhatsAppChange = (e) => {
    setFormData((prev) => ({ ...prev, whatsappNumber: e.target.value.replace(/\D/g, '') }));
  };

  const handleSeatsCountChange = (e) => {
    const count = e.target.value.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, seats: count ? formatCountLabel(count, 'Seater', 'Seater') : '' }));
  };

  const handleLuggageCountChange = (e) => {
    const count = e.target.value.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, luggage: count ? formatCountLabel(count, 'large bag', 'large bags') : '' }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { publicUrl, error } = await storageService.uploadFleetImage(file, `fleets/${user.id}`);
      if (error) throw error;

      if (publicUrl) {
        // If an earlier upload this session was never saved, it's not referenced by
        // the DB yet, so it's safe to clean up immediately (unlike the persisted photo).
        const previousUnsavedUrl = formData.imageUrl && formData.imageUrl !== fleet?.image ? formData.imageUrl : null;

        setFormData((prev) => ({ ...prev, imageUrl: publicUrl, imagePositionX: 50, imagePositionY: 50 }));
        toast.success('Vehicle photo uploaded & compressed successfully!');

        if (previousUnsavedUrl) {
          storageService.removeFleetImages([previousUnsavedUrl]).catch((err) => {
            console.warn('Failed to clean up unsaved photo upload from Storage:', err);
          });
        }
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      toast.error(err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const updateImagePositionFromEvent = (e) => {
    const frame = imageFrameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    setFormData((prev) => ({ ...prev, imagePositionX: Math.round(x), imagePositionY: Math.round(y) }));
  };

  const handleImagePositionPointerUp = () => {
    window.removeEventListener('pointermove', updateImagePositionFromEvent);
    window.removeEventListener('pointerup', handleImagePositionPointerUp);
  };

  const handleImagePositionPointerDown = (e) => {
    e.preventDefault();
    updateImagePositionFromEvent(e);
    window.addEventListener('pointermove', updateImagePositionFromEvent);
    window.addEventListener('pointerup', handleImagePositionPointerUp);
  };

  const handleResetImagePosition = () => {
    setFormData((prev) => ({ ...prev, imagePositionX: 50, imagePositionY: 50 }));
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentCount = formData.galleryUrls.length;
    if (currentCount >= 10) {
      toast.error('Maximum limit of 10 credibility photos reached. Remove an existing photo to upload a new one.');
      return;
    }

    const availableSlots = 10 - currentCount;
    const filesToUpload = files.slice(0, availableSlots);

    setUploadingGallery(true);

    try {
      const newUrls = [];
      for (const file of filesToUpload) {
        const { publicUrl, error } = await storageService.uploadFleetImage(file, `fleets/gallery/${user.id}`);
        if (error) throw error;
        if (publicUrl) newUrls.push(publicUrl);
      }

      if (newUrls.length > 0) {
        const updatedGallery = [...formData.galleryUrls, ...newUrls];
        setFormData((prev) => ({ ...prev, galleryUrls: updatedGallery }));
        
        // Persist gallery immediately
        if (fleet?.id) {
          await fleetService.updateDriverFleet(fleet.id, { ...formData, galleryUrls: updatedGallery });
        }

        toast.success(
          `Added ${newUrls.length} compressed photo(s) to your credibility gallery (${updatedGallery.length}/10 photos).`
        );
      }
    } catch (err) {
      console.error('Gallery upload failed:', err);
      toast.error(err.message || 'Gallery photo upload failed. Please try again.');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleRemoveGalleryImage = async (indexToRemove) => {
    const removedUrl = formData.galleryUrls[indexToRemove];
    const updatedGallery = formData.galleryUrls.filter((_, idx) => idx !== indexToRemove);
    setFormData((prev) => ({ ...prev, galleryUrls: updatedGallery }));

    try {
      if (fleet?.id) {
        await fleetService.updateDriverFleet(fleet.id, { ...formData, galleryUrls: updatedGallery });
      }
      toast.success('Photo removed from gallery.');
    } catch (err) {
      console.error('Error updating gallery:', err);
      toast.error('Failed to remove photo. Please try again.');
      return;
    }

    // Now that the removal is safely saved, delete the actual file from Storage
    if (removedUrl) {
      storageService.removeFleetImages([removedUrl]).catch((err) => {
        console.warn('Failed to delete removed gallery photo from Storage:', err);
      });
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fleet?.id) {
      toast.error('No vehicle is currently linked to your driver account. Contact Admin.');
      return;
    }

    // Validate using Zod
    const validation = fleetEditSchema.safeParse(formData);
    if (!validation.success) {
      toast.error(getValidationMessage(validation));
      return;
    }

    const previousImageUrl = fleet.image;

    setSaving(true);
    try {
      await fleetService.updateDriverFleet(fleet.id, formData);
      toast.success('Vehicle profile updated successfully!');
      setFleet((prev) => ({ ...prev, ...formData, image: formData.imageUrl }));
    } catch (err) {
      console.error('Error saving fleet profile:', err);
      toast.error(err.message || 'Failed to update vehicle details.');
      return;
    } finally {
      setSaving(false);
    }

    // Now that the new photo is safely saved, clean up the replaced one from Storage
    if (previousImageUrl && previousImageUrl !== formData.imageUrl) {
      storageService.removeFleetImages([previousImageUrl]).catch((err) => {
        console.warn('Failed to clean up replaced vehicle photo from Storage:', err);
      });
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
            <div className="min-w-0">
              <span className="font-display text-lg font-bold text-white block leading-tight">Driver Workspace</span>
              <span className="text-xs text-emerald-400 font-medium block break-words">Welcome back, {formData.driverName || profile?.full_name || 'Driver'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {profile?.expires_at && (
              <span
                className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold whitespace-nowrap ${
                  renewalTimer.status === 'expired'
                    ? 'bg-red-500/10 text-red-300 border-red-500/30'
                    : renewalTimer.status === 'warning'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                }`}
                title="Account renewal status"
              >
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>{renewalTimer.text}</span>
              </span>
            )}
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-full bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
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
            {profile?.expires_at && (
              <div
                className={`sm:hidden lg:col-span-3 flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-bold ${
                  renewalTimer.status === 'expired'
                    ? 'bg-red-500/10 text-red-300 border-red-500/30'
                    : renewalTimer.status === 'warning'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                }`}
              >
                <Clock className="h-4 w-4 shrink-0" />
                <span>Account renewal: {renewalTimer.text}</span>
              </div>
            )}
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
                    style={{ objectPosition: `${formData.imagePositionX}% ${formData.imagePositionY}%` }}
                  />
                  <div className="p-5">
                    <h3 className="font-display text-xl font-bold text-white break-words">{formData.name || 'Vehicle Name'}</h3>
                    <p className="mt-1 text-xs text-slate-400 flex items-center gap-1 min-w-0">
                      <Car className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> <span className="break-words">Driver: {formData.driverName || 'Not set'}</span>
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-300">
                      <span className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1 flex items-center gap-1 max-w-full break-words">
                        <Users className="h-3 w-3 text-emerald-400 shrink-0" /> {formData.seats || 'Seats'}
                      </span>
                      <span className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1 flex items-center gap-1 max-w-full break-words">
                        <Briefcase className="h-3 w-3 text-emerald-400 shrink-0" /> {formData.luggage || 'Luggage'}
                      </span>
                    </div>

                    {formData.description && (
                      <p className="mt-3 text-xs leading-relaxed text-slate-400 border-t border-slate-800/80 pt-3 break-words whitespace-pre-line">
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
                    <Car className="h-6 w-6 text-emerald-400" /> Edit Fleet Details
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Update your cross-border taxi specs, driver info, and vehicle picture.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                  {/* Media Upload */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Vehicle Image
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      <div className="w-full sm:max-w-xs">
                        <div
                          ref={imageFrameRef}
                          onPointerDown={handleImagePositionPointerDown}
                          className="relative w-full aspect-[16/10] overflow-hidden rounded-xl border border-slate-800 bg-slate-950 cursor-crosshair touch-none select-none"
                        >
                          <img
                            src={formData.imageUrl || '/images/fleet/vellfiretaxi.jpeg'}
                            alt="Position preview"
                            draggable={false}
                            className="h-full w-full object-cover pointer-events-none"
                            style={{ objectPosition: `${formData.imagePositionX}% ${formData.imagePositionY}%` }}
                          />
                          <div
                            className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-500/80 shadow-lg"
                            style={{ left: `${formData.imagePositionX}%`, top: `${formData.imagePositionY}%` }}
                          />
                        </div>
                        <p className="mt-2 text-[11px] text-slate-500 flex items-start gap-1.5">
                          <Move className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Click or drag inside the photo to position it — this is exactly how it'll appear on the site.</span>
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 w-full sm:w-48 shrink-0">
                        <label className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700 active:scale-95">
                          <Upload className="h-4 w-4 text-emerald-400" />
                          <span>{uploadingImage ? 'Uploading...' : 'Upload New Photo'}</span>
                          <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
                        </label>
                        <button
                          type="button"
                          onClick={handleResetImagePosition}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-slate-800"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Reset to Center</span>
                        </button>
                        <p className="text-[11px] text-slate-500">Supported formats: JPG, PNG, WEBP up to 5MB.</p>
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
                        Route Direction
                      </label>
                      <select
                        name="direction"
                        value={formData.direction}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="jb-sg">Johor &rarr; Singapore</option>
                        <option value="sg-jb">Singapore &rarr; Johor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        WhatsApp Number (Country Code)
                      </label>
                      <input
                        type="tel"
                        name="whatsappNumber"
                        value={formData.whatsappNumber}
                        onChange={handleWhatsAppChange}
                        placeholder="e.g. 60138728630"
                        required
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      />
                      <p className="mt-1 text-[10px] text-slate-500">Digits only, include country code, no + or spaces (e.g. 60138728630)</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Passenger Capacity
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          value={extractCount(formData.seats)}
                          onChange={handleSeatsCountChange}
                          placeholder="e.g. 4"
                          required
                          className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-4 pr-20 text-sm text-white focus:border-emerald-500 focus:outline-none"
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">Seater</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Luggage Capacity
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={extractCount(formData.luggage)}
                          onChange={handleLuggageCountChange}
                          placeholder="e.g. 4"
                          required
                          className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-4 pr-24 text-sm text-white focus:border-emerald-500 focus:outline-none"
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">large bags</span>
                      </div>
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

                  {/* Additional Credibility Photos Gallery (Max 10) */}
                  <div className="border-t border-slate-800 pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Credibility &amp; Additional Photos Gallery
                        </label>
                        <p className="text-[11px] text-slate-400">
                          Upload up to 10 compressed photos of your car interior, exterior, or happy customers to build trust.
                        </p>
                      </div>
                      <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
                        formData.galleryUrls.length >= 10
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-slate-950 text-emerald-400 border-slate-800'
                      }`}>
                        {formData.galleryUrls.length} / 10 photos
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {formData.galleryUrls.map((url, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video">
                          <img src={url} alt={`Gallery photo ${idx + 1}`} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryImage(idx)}
                            className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/90 text-white opacity-90 transition hover:bg-red-600 hover:scale-110"
                            title="Remove photo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}

                      {formData.galleryUrls.length < 10 && (
                        <label className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed ${
                          uploadingGallery ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-800 bg-slate-950 hover:border-emerald-500/50 hover:bg-slate-900'
                        } aspect-video cursor-pointer transition p-3 text-center`}>
                          <Upload className="h-5 w-5 text-emerald-400 mb-1" />
                          <span className="text-[11px] font-bold text-white">
                            {uploadingGallery ? 'Compressing...' : 'Add Photo'}
                          </span>
                          <span className="text-[10px] text-slate-500">Auto-compressed</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleGalleryUpload}
                            disabled={uploadingGallery || formData.galleryUrls.length >= 10}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
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

        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl"
          >
            <div className="border-b border-slate-800 pb-5">
              <h2 className="font-display text-xl font-extrabold text-white flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-emerald-400" /> Change Password
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Update your login password. Your current password is required to confirm.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="mt-6 grid gap-4 sm:grid-cols-3 max-w-2xl">
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
        )}
      </main>
    </div>
  );
};

export default DriverDashboard;
