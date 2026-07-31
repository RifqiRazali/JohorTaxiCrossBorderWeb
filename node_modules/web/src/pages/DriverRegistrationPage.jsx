import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Car, ShieldCheck, CheckCircle2, User, Phone, FileText, MapPin, DollarSign, Send, MessageCircle, AlertCircle } from 'lucide-react';
import { DEFAULT_WHATSAPP_NUMBER as ADMIN_WHATSAPP } from '../data/fleetData';
import logoImg from '../assets/logo.png';

const DriverRegistrationPage = () => {
  const [formData, setFormData] = useState({
    driverName: '',
    whatsappNumber: '',
    licenseNumber: '',
    vehicleModel: '',
    plateNumber: '',
    seats: '4 Passengers',
    luggage: '3 Bags',
    expectedRate: '$150 per trip',
    operatingArea: 'Singapore ↔ All Johor',
    notes: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.driverName || !formData.whatsappNumber || !formData.vehicleModel || !formData.plateNumber) {
      alert('Please fill in all required driver and vehicle fields.');
      return;
    }

    const applicationText = 
`🚖 *DRIVER & VEHICLE REGISTRATION APPLICATION*
----------------------------------------
👤 *Driver Name:* ${formData.driverName}
📱 *Driver WhatsApp:* ${formData.whatsappNumber}
🪪 *License/Permit No:* ${formData.licenseNumber || 'N/A'}

🚗 *Vehicle Model:* ${formData.vehicleModel}
🔢 *Plate Number:* ${formData.plateNumber}
👥 *Capacity:* ${formData.seats} | 🧳 ${formData.luggage}
💰 *Quoted Rate:* ${formData.expectedRate}
📍 *Operating Area:* ${formData.operatingArea}
📝 *Notes:* ${formData.notes || 'None'}

Please review my vehicle registration for the Taxi Johor Cross Border website.`;

    const waUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(applicationText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-200">
      <Helmet>
        <title>Driver &amp; Vehicle Registration | Taxi Johor Cross Border</title>
        <meta name="description" content="Register your licensed Singapore-Johor cross-border taxi or vehicle to join the Taxi Johor Cross Border network and receive direct passenger bookings." />
      </Helmet>

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto flex max-w-[85rem] items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-3 text-white transition hover:opacity-90">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-slate-700 p-1 shadow-md ring-2 ring-emerald-400">
              <img src={logoImg} alt="Taxi Johor Cross Border Logo" className="h-full w-full object-contain rounded-lg" />
            </div>
            <div>
              <span className="font-display text-lg font-bold tracking-tight block leading-none">Taxi Johor Cross Border</span>
              <span className="text-[11px] text-emerald-400 font-medium tracking-wide">Driver Onboarding Portal</span>
            </div>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-700 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Website
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          {/* Page Banner */}
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400 ring-1 ring-emerald-400/40">
              <ShieldCheck className="h-3.5 w-3.5" /> Licensed Driver Network
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Register Your Vehicle &amp; Driver Account
            </h1>
            <p className="mt-4 text-base text-slate-400 max-w-2xl mx-auto">
              Are you a licensed Singapore ↔ Johor cross-border taxi driver? Register your vehicle details below to join our website and receive direct passenger booking deals on WhatsApp.
            </p>
          </div>

          {/* Submission Success Box */}
          {submitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-10 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 p-6 text-center shadow-2xl"
            >
              <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
              <h3 className="mt-3 font-display text-xl font-bold text-white">Application Sent to Admin!</h3>
              <p className="mt-2 text-sm text-emerald-200">
                Your driver &amp; vehicle details have been formatted and sent to Admin Dispatch on WhatsApp. We will review your license and activate your car listing shortly.
              </p>
            </motion.div>
          )}

          {/* Driver Registration Form */}
          <form onSubmit={handleSubmit} className="mt-12 space-y-8">
            {/* Section 1: Driver Information */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-400" /> Driver Information
              </h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Full Driver Name <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="driverName"
                    required
                    value={formData.driverName}
                    onChange={handleChange}
                    placeholder="e.g. Uncle Tan / Abang Johari"
                    className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    WhatsApp Phone Number <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="whatsappNumber"
                    required
                    value={formData.whatsappNumber}
                    onChange={handleChange}
                    placeholder="e.g. +60138728630 or +6591234567"
                    className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Cross-Border Taxi Permit / License No. (Optional)
                  </label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    placeholder="e.g. SG-MY Cross Border Permit #12345"
                    className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Vehicle Details */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                <Car className="h-5 w-5 text-emerald-400" /> Vehicle Details
              </h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Vehicle Brand &amp; Model <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="vehicleModel"
                    required
                    value={formData.vehicleModel}
                    onChange={handleChange}
                    placeholder="e.g. Toyota Alphard / Innova / Staria"
                    className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Vehicle Plate Number <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="plateNumber"
                    required
                    value={formData.plateNumber}
                    onChange={handleChange}
                    placeholder="e.g. WAA 1234 A"
                    className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Seating Capacity
                  </label>
                  <select
                    name="seats"
                    value={formData.seats}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="4 Passengers">4 Passengers (Sedan)</option>
                    <option value="5 Passengers">5 Passengers (SUV)</option>
                    <option value="6 Passengers">6 Passengers (MPV / Alphard)</option>
                    <option value="7 Passengers">7 Passengers (Large MPV)</option>
                    <option value="10 Passengers">10 Passengers (Van)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Luggage Capacity
                  </label>
                  <select
                    name="luggage"
                    value={formData.luggage}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="2 Large Bags">2 Large Bags</option>
                    <option value="4 Large Bags">4 Large Bags</option>
                    <option value="5 Large Bags">5 Large Bags</option>
                    <option value="8 Large Bags">8 Large Bags</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Standard Trip Rate (All-Inclusive)
                  </label>
                  <input
                    type="text"
                    name="expectedRate"
                    value={formData.expectedRate}
                    onChange={handleChange}
                    placeholder="e.g. $150 per trip"
                    className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Primary Route / Operating Area
                  </label>
                  <input
                    type="text"
                    name="operatingArea"
                    value={formData.operatingArea}
                    onChange={handleChange}
                    placeholder="e.g. Singapore ↔ JB / Desaru / Legoland"
                    className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Additional Driver Notes or Vehicle Features
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="e.g. Captain seats, child seat available, leather interior..."
                  className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Submit CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8">
              <div>
                <h3 className="font-display text-lg font-bold text-white">Ready to register your taxi?</h3>
                <p className="text-xs text-slate-400">Clicking below will format your details and open WhatsApp to Admin Dispatch.</p>
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 py-3.5 font-bold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 active:scale-95 shrink-0"
              >
                <Send className="h-5 w-5" />
                Submit Application via WhatsApp
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default DriverRegistrationPage;
