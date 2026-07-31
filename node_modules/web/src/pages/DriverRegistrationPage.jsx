import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, CheckCircle2, MessageCircle, Car, User, Sparkles, PhoneCall } from 'lucide-react';
import { DEFAULT_WHATSAPP_NUMBER as ADMIN_WHATSAPP } from '../data/fleetData';
import logoImg from '../assets/logo.png';

const openRegistrationWhatsApp = () => {
  const applicationText = `Hello! I am a licensed cross-border taxi driver and I would like to register my vehicle to join the Taxi Johor Cross Border network.\n\nPlease guide me on how to list my car on your website.`;
  const waUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(applicationText)}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');
};

const DriverRegistrationPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-200">
      <Helmet>
        <title>Driver &amp; Vehicle Registration | Taxi Johor Cross Border</title>
        <meta name="description" content="Register your licensed Singapore-Johor cross-border taxi or vehicle directly via WhatsApp to join the Taxi Johor Cross Border network." />
        <link rel="canonical" href="https://taxijohorcrossborder.com/register-driver" />
        <meta property="og:title" content="Driver &amp; Vehicle Registration | Taxi Johor Cross Border" />
        <meta property="og:description" content="Register your licensed Singapore-Johor cross-border taxi or vehicle directly via WhatsApp." />
        <meta property="og:url" content="https://taxijohorcrossborder.com/register-driver" />
        <meta property="og:site_name" content="Taxi Johor Cross Border" />
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
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          {/* Page Header */}
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400 ring-1 ring-emerald-400/40">
              <ShieldCheck className="h-3.5 w-3.5" /> Licensed Driver Network
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Driver &amp; Car Registration
            </h1>
            <p className="mt-4 text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
              No forms needed! Chat directly with our Admin Dispatch on WhatsApp to list your cross-border taxi, set your rates, and receive passenger bookings.
            </p>
          </div>

          {/* Main Direct WhatsApp Registration Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-10 rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <MessageCircle className="h-48 w-48 text-emerald-400" />
            </div>

            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto ring-4 ring-emerald-500/10">
              <MessageCircle className="h-10 w-10" />
            </div>

            <h2 className="mt-6 font-display text-2xl font-bold text-white">
              Instant Driver &amp; Car Registration
            </h2>
            <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
              Click the button below to open a direct WhatsApp chat with Admin Dispatch (<strong className="text-emerald-400">+60 13-872 8630</strong>).
            </p>

            <button
              onClick={openRegistrationWhatsApp}
              className="mt-8 inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-8 py-4 text-base font-extrabold text-slate-950 shadow-2xl shadow-emerald-500/30 ring-4 ring-emerald-500/20 transition duration-300 hover:bg-emerald-400 active:scale-95"
            >
              <MessageCircle className="h-6 w-6 fill-slate-950" />
              <span>Driver &amp; Car Registration on WhatsApp</span>
            </button>

            {/* Quick checklist of details */}
            <div className="mt-12 border-t border-slate-800 pt-8 text-left max-w-lg mx-auto">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> What to share on WhatsApp:
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Driver Name &amp; Contact:</strong> Your full name &amp; phone number.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Vehicle Details:</strong> Car model (e.g. Alphard / Innova / Sedan) &amp; plate number.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Capacity &amp; Rate:</strong> Seating capacity &amp; trip rate.</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default DriverRegistrationPage;
