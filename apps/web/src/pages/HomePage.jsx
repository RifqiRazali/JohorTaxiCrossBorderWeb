import React, { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Briefcase, ShieldCheck, Clock, BadgeDollarSign, ArrowRight, MapPin, Car, MessageCircle, User, CheckCircle2, ChevronDown, Sparkles, Menu, X } from 'lucide-react';
import { FLEET, SERVICES, DESTINATIONS, DEFAULT_WHATSAPP_NUMBER as WHATSAPP_NUMBER } from '../data/fleetData';
import logoImg from '../assets/logo.png';

const HERO_IMG = 'https://images.hostinger.com/c44df599-dcaf-4e88-9c66-5b43829ed26b.png';

const openDriverWhatsApp = (car) => {
  const targetNumber = car?.whatsappNumber || WHATSAPP_NUMBER;
  if (!targetNumber || targetNumber === '1234567890') {
    alert('WhatsApp number is not configured yet for this taxi.');
    return;
  }
  const driverText = car.driverName ? ` (Driver: ${car.driverName})` : '';
  const plateText = car.plateNumber ? ` [Plate: ${car.plateNumber}]` : '';
  const text = `Hello! I am interested in booking the Johor ⟶ Singapore Taxi *${car.name}* (${car.rate})${driverText}${plateText}.\n\nPlease let me know availability and details for my travel date.`;
  const url = `https://wa.me/${targetNumber}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

const openDestinationWhatsApp = (dest) => {
  const text = `Hello! I am interested in a Johor ⟶ Singapore taxi transfer to/from *${dest.name}* (${dest.location}).\n\nPlease quote the fare and availability.`;
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

const openDriverRegistrationWhatsApp = () => {
  const text = `Hello! I am a licensed cross-border taxi driver and I would like to register my vehicle to join the Taxi Johor Cross Border network.\n\nPlease guide me on how to list my car on your website.`;
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

const FAQS = [
  {
    q: 'Do passengers need to alight (get out) of the taxi at Singapore & Malaysia customs?',
    a: 'No! You stay comfortably inside the taxi during both Singapore (Woodlands/Tuas) and Malaysia passport clearance. Your driver handles passport submission directly through the vehicle lane.'
  },
  {
    q: 'Are Singapore/Malaysia highway tolls, VEP, and checkpoint fees included in the price?',
    a: 'Yes! All rates quoted are fixed and all-inclusive. They cover Singapore & Malaysia highway tolls, VEP fees, driver fee, and fuel. There are zero hidden surcharges.'
  },
  {
    q: 'Can I request custom pick-up addresses anywhere in Singapore or Johor?',
    a: 'Yes, we provide door-to-door service! Pick-up can be any residential address, hotel, office, or airport terminal in Singapore or anywhere across Johor State.'
  },
  {
    q: 'How do I confirm my booking and pay?',
    a: 'Simply click any taxi or destination button to open a direct WhatsApp chat with your driver. You can agree on departure times, pick-up address, and payment method directly with the driver on WhatsApp.'
  }
];

const HomePage = () => {
  const [activeTab, setActiveTab] = useState('johor');
  const [openFaq, setOpenFaq] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-200">
      <Helmet>
        <title>Taxi Johor Cross Border | Johor ⟶ Singapore Taxi Service</title>
        <meta name="description" content="Taxi Johor Cross Border provides official Johor ⟶ Singapore cross-border taxi transfers covering Johor Bahru, Desaru, Legoland, Senai, Mersing and all Johor destinations. Airport transfers, corporate jobs, private tours &amp; outstation trips." />
        <link rel="canonical" href="https://taxijohorcrossborder.com/" />
        <meta property="og:title" content="Taxi Johor Cross Border | Johor ⟶ Singapore Taxi Service" />
        <meta property="og:description" content="Taxi Johor Cross Border provides official Johor ⟶ Singapore cross-border taxi transfers covering Johor Bahru, Desaru, Legoland, Senai, Mersing and all Johor destinations." />
        <meta property="og:url" content="https://taxijohorcrossborder.com/" />
        <meta property="og:site_name" content="Taxi Johor Cross Border" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Taxi Johor Cross Border | Johor ⟶ Singapore Taxi Service" />
        <meta name="twitter:description" content="Official Johor ⟶ Singapore cross-border taxi transfers. Airport transfers, corporate jobs, private tours &amp; outstation trips." />
        <link rel="icon" type="image/png" href="/images/logo.png" />
      </Helmet>

      {/* 1. Header Navigation */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-[90rem] items-center justify-between px-4 py-4 sm:px-8">
          <div className="flex items-center gap-3 sm:gap-4 text-white">
            <div className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-slate-900 border-2 border-slate-700 p-1 shadow-2xl ring-2 ring-emerald-400">
              <img src={logoImg} alt="Taxi Johor Cross Border Logo" className="h-full w-full object-contain rounded-lg sm:rounded-xl" />
            </div>
            <div>
              <span className="font-display text-base sm:text-2xl font-extrabold tracking-tight block leading-tight text-white">Taxi Johor Cross Border</span>
              <span className="text-[11px] sm:text-sm text-emerald-400 font-semibold tracking-wide block">Johor ⟶ Singapore Taxi</span>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-white/90">
            <button onClick={() => scrollToSection('services')} className="transition hover:text-emerald-400">Services</button>
            <button onClick={() => scrollToSection('fleet')} className="transition hover:text-emerald-400">Available Taxis</button>
            <button onClick={() => scrollToSection('destinations')} className="transition hover:text-emerald-400">Destinations</button>
            <button onClick={() => scrollToSection('why-us')} className="transition hover:text-emerald-400">Why Us</button>
            <button onClick={() => scrollToSection('faq')} className="transition hover:text-emerald-400">FAQ</button>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={openDriverRegistrationWhatsApp}
              className="hidden sm:inline-block rounded-full bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20 border border-white/10"
            >
              Driver &amp; Car Registration
            </button>
            <button
              onClick={() => scrollToSection('fleet')}
              className="rounded-full bg-emerald-500 px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold text-slate-950 transition hover:bg-emerald-400 active:scale-95 shadow-lg shadow-emerald-500/25"
            >
              Select Johor-SG Taxi
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/90 border border-slate-700 text-white lg:hidden hover:bg-slate-800 focus:outline-none active:scale-95"
            >
              {mobileMenuOpen ? <X className="h-5 w-5 text-emerald-400" /> : <Menu className="h-5 w-5 text-white" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-x-0 top-full bg-slate-950/95 border-b border-slate-800 backdrop-blur-2xl px-6 py-6 shadow-2xl lg:hidden flex flex-col gap-4 z-40"
            >
              <button onClick={() => { scrollToSection('services'); setMobileMenuOpen(false); }} className="text-left font-bold text-base text-white hover:text-emerald-400 py-1.5 transition border-b border-slate-900">Services</button>
              <button onClick={() => { scrollToSection('fleet'); setMobileMenuOpen(false); }} className="text-left font-bold text-base text-white hover:text-emerald-400 py-1.5 transition border-b border-slate-900">Available Taxis &amp; Fares</button>
              <button onClick={() => { scrollToSection('destinations'); setMobileMenuOpen(false); }} className="text-left font-bold text-base text-white hover:text-emerald-400 py-1.5 transition border-b border-slate-900">Popular Destinations</button>
              <button onClick={() => { scrollToSection('why-us'); setMobileMenuOpen(false); }} className="text-left font-bold text-base text-white hover:text-emerald-400 py-1.5 transition border-b border-slate-900">Why Choose Us</button>
              <button onClick={() => { scrollToSection('faq'); setMobileMenuOpen(false); }} className="text-left font-bold text-base text-white hover:text-emerald-400 py-1.5 transition border-b border-slate-900">FAQ</button>
              <button onClick={() => { openDriverRegistrationWhatsApp(); setMobileMenuOpen(false); }} className="text-left font-extrabold text-base text-emerald-400 py-2 flex items-center justify-between rounded-xl bg-emerald-950/60 border border-emerald-500/30 px-4">
                <span>Driver &amp; Car Registration (WhatsApp)</span>
                <MessageCircle className="h-5 w-5 text-emerald-400" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 2. Hero Section */}
      <section className="relative min-h-[100dvh] w-full overflow-hidden">
        <img src={HERO_IMG} alt="Johor to Singapore highway cross-border taxi" decoding="async" fetchpriority="high" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/90 to-emerald-950/80" />
        <div className="relative mx-auto flex min-h-[100dvh] max-w-[90rem] flex-col justify-center px-5 pb-28 pt-32 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/25 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300 ring-1 ring-emerald-400/50">
              <MapPin className="h-3.5 w-3.5" /> Johor ⟶ Singapore &amp; All Destinations
            </span>
            <h1 className="mt-5 sm:mt-6 font-display text-3xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.08] sm:leading-[1.03] tracking-tight text-white">
              Johor ⟶ Singapore{' '}
              <span className="relative inline-block text-emerald-400">
                Door-To-Door
              </span>{' '}
              Cross-Border Taxi
            </h1>
            <p className="mt-5 sm:mt-7 max-w-xl text-base sm:text-xl leading-relaxed text-slate-100">
              Comfortable direct taxi transfers between Johor and Singapore covering all destinations across Johor State (Johor Bahru, Desaru, Legoland, Senai, Mersing &amp; more). <strong className="text-white">Stay inside the taxi at Woodlands &amp; Tuas customs</strong> — no lugging bags through immigration counters.
            </p>
            <div className="mt-7 sm:mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={() => scrollToSection('fleet')}
                className="group inline-flex min-h-[50px] sm:min-h-[52px] items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 sm:px-8 text-sm sm:text-base font-bold text-slate-950 shadow-xl shadow-emerald-500/25 transition hover:bg-emerald-400 active:scale-[0.98]"
              >
                View Johor-SG Taxis &amp; Drivers
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <span className="text-xs sm:text-sm font-medium text-slate-200 text-center sm:text-left">Woodlands &amp; Tuas Clearance Included</span>
            </div>

            <dl className="mt-10 sm:mt-14 grid max-w-xl grid-cols-3 gap-2 sm:gap-6 border-t border-white/15 pt-5 sm:pt-7">
              {[['Stay in Taxi', 'At SG-MY Customs'], ['Fixed Fares', 'Tolls Included'], ['All Johor', 'Destinations Covered']].map(([v, l]) => (
                <div key={l} className="text-center sm:text-left">
                  <dt className="font-display text-sm sm:text-2xl font-bold text-white leading-snug">{v}</dt>
                  <dd className="mt-1 text-[11px] sm:text-sm text-slate-300 leading-tight">{l}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </div>
      </section>

      {/* 3. Our Services Section (Matching Dark Professional Design) */}
      <section id="services" className="bg-slate-950 py-24 text-white scroll-mt-12">
        <div className="mx-auto max-w-[85rem] px-5 sm:px-8">
          <div className="text-center">
            <p className="text-xs font-bold tracking-[0.3em] uppercase text-emerald-400">Professional Taxi Service</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight uppercase sm:text-6xl text-white">Our Service</h2>
            <p className="mt-3 text-slate-400 text-base max-w-lg mx-auto">We Provide Professional &amp; Efficient Service To Our Client</p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((srv) => (
              <motion.div
                key={srv.id || srv.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group relative flex flex-col overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 transition duration-300 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10"
              >
                <div className="relative h-64 w-full overflow-hidden">
                  <img
                    src={srv.image}
                    alt={srv.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                </div>
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <h3 className="font-display text-xl font-extrabold uppercase tracking-wide text-white group-hover:text-emerald-400 transition">{srv.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300">{srv.desc}</p>
                  </div>
                  <button
                    onClick={() => scrollToSection('fleet')}
                    className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 text-xs font-bold uppercase tracking-wider text-emerald-400 transition hover:bg-emerald-600 hover:text-white"
                  >
                    <span>View Available Taxis</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Fleet Section */}
      <section id="fleet" className="scroll-mt-16 bg-slate-50 py-20 sm:py-28">
        <div className="mx-auto max-w-[80rem] px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Johor ⟶ Singapore Fleet</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Pick your Johor-SG taxi &amp; chat on WhatsApp</h2>
            <p className="mt-4 text-lg text-slate-600">Every rate below covers the full door-to-door taxi trip between Johor and Singapore: taxi driver, fuel, Woodlands/Tuas tolls and border clearance.</p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FLEET.map((car, i) => (
              <motion.article
                key={car.id || car.name}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: 'easeOut' }}
                className="group flex flex-col h-full overflow-hidden rounded-3xl bg-white shadow-[0_2px_20px_-8px_rgba(15,42,35,0.25)] ring-1 ring-slate-900/5 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_50px_-20px_rgba(15,42,35,0.4)]"
              >
                <div className="relative overflow-hidden bg-slate-100">
                  <img
                    src={typeof car.image === 'string' ? car.image : (car.image?.default || car.image)}
                    alt={`${car.name} Johor to Singapore cross border taxi`}
                    loading="lazy"
                    className={`h-52 w-full transition-transform duration-500 group-hover:scale-105 ${car.imageFit === 'contain' ? 'object-contain p-2' : 'object-cover'} ${car.imagePosition ? `object-${car.imagePosition}` : 'object-center'}`}
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-slate-950/85 px-3 py-1 text-xs font-bold text-emerald-300 backdrop-blur">{car.rate}</span>
                </div>
                <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
                  <div>
                    <h3 className="font-display text-xl font-bold text-slate-900">{car.name}</h3>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                      {car.driverName && (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-800 bg-emerald-50 rounded-md px-2 py-1"><User className="h-3.5 w-3.5 text-emerald-600 shrink-0" />Driver: {car.driverName}</span>
                      )}
                      <span className="inline-flex items-center gap-1.5 bg-slate-100 rounded-md px-2 py-1"><Users className="h-3.5 w-3.5 text-emerald-600 shrink-0" />{car.seats}</span>
                      <span className="inline-flex items-center gap-1.5 bg-slate-100 rounded-md px-2 py-1"><Briefcase className="h-3.5 w-3.5 text-emerald-600 shrink-0" />{car.luggage}</span>
                      {car.plateNumber && (
                        <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-slate-700 bg-slate-100 rounded-md px-2 py-1"><Car className="h-3.5 w-3.5 text-emerald-600 shrink-0" />{car.plateNumber}</span>
                      )}
                    </div>
                    {car.desc && <p className="mt-4 text-sm leading-relaxed text-slate-600">{car.desc}</p>}
                  </div>
                  
                  {/* Fixed Bottom-Aligned WhatsApp CTA Button */}
                  <button
                    onClick={() => openDriverWhatsApp(car)}
                    className="mt-6 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition duration-200 hover:bg-emerald-700 active:scale-[0.98]"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" />
                    <span>Book via WhatsApp</span>
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Popular Tourist Destinations */}
      <section id="destinations" className="scroll-mt-16 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-[80rem] px-5 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Popular Cross-Border Routes</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Top Tourist Destinations</h2>
              <p className="mt-3 text-slate-600 text-lg max-w-xl">We provide direct door-to-door taxi transfers from Johor to Singapore and popular attractions.</p>
            </div>
            
            {/* Tab Selector */}
            <div className="grid grid-cols-2 w-full md:w-auto items-center gap-1 sm:gap-2 rounded-2xl bg-slate-100 p-1.5 ring-1 ring-slate-200/80">
              <button
                onClick={() => setActiveTab('johor')}
                className={`rounded-xl px-3 sm:px-5 py-2.5 text-xs sm:text-sm font-bold transition text-center ${activeTab === 'johor' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Johor Attractions
              </button>
              <button
                onClick={() => setActiveTab('singapore')}
                className={`rounded-xl px-3 sm:px-5 py-2.5 text-xs sm:text-sm font-bold transition text-center ${activeTab === 'singapore' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Singapore Attractions
              </button>
            </div>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {DESTINATIONS[activeTab].map((dest) => (
              <motion.div
                key={dest.id || dest.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group flex flex-col overflow-hidden rounded-3xl bg-slate-50 border border-slate-200 transition duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="relative h-52 w-full overflow-hidden bg-slate-200">
                  <img
                    src={dest.image}
                    alt={dest.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-bold text-emerald-300 backdrop-blur">{dest.tag}</span>
                </div>
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <h3 className="font-display text-xl font-bold text-slate-900">{dest.name}</h3>
                    <p className="mt-2 text-sm font-medium text-slate-500 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-emerald-600 shrink-0" /> {dest.location}
                    </p>
                  </div>
                  <button
                    onClick={() => scrollToSection('fleet')}
                    className="mt-6 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-emerald-600 active:scale-[0.98]"
                  >
                    <Car className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>Select Taxi for Trip</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Why Johor ⟶ Singapore Travellers Choose Us (Accurate & Professional Feature Grid) */}
      <section id="why-us" className="scroll-mt-16 bg-slate-50 py-24 sm:py-32">
        <div className="mx-auto max-w-[85rem] px-5 sm:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-800 ring-1 ring-emerald-300">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Why Passengers Choose Us
            </span>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Why Passengers Choose Our Service
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Reliable door-to-door cross-border taxi transfers from Johor to Singapore.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: CheckCircle2,
                title: 'Stay Inside Taxi at Customs',
                desc: 'Passport inspection is conducted while you stay inside the vehicle at both Singapore and Malaysia checkpoints.',
                badge: 'Customs Clearance'
              },
              {
                icon: MessageCircle,
                title: 'Direct WhatsApp Connection',
                desc: 'Connect directly with your taxi driver on WhatsApp to arrange your travel schedule and pick-up details.',
                badge: 'Direct Booking'
              },
              {
                icon: BadgeDollarSign,
                title: 'Fixed All-Inclusive Fares',
                desc: 'Rates quoted include Singapore and Malaysia highway tolls, VEP fees, and fuel with zero hidden charges.',
                badge: 'Fixed Pricing'
              },
              {
                icon: ShieldCheck,
                title: 'Licensed Cross-Border Fleet',
                desc: 'Cross-border taxis with experienced drivers familiar with Johor and Singapore highway routes.',
                badge: 'Permitted Fleet'
              },
              {
                icon: Clock,
                title: '24/7 Service Availability',
                desc: 'Available for early morning, late night, or scheduled airport and hotel transfers.',
                badge: 'Flexible Hours'
              },
              {
                icon: MapPin,
                title: 'Door-To-Door Pick Up',
                desc: 'Direct pick-up from your location in Johor and drop-off at your specified destination in Singapore.',
                badge: 'Direct Transfers'
              },
            ].map(({ icon: Icon, title, desc, badge }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25 }}
                className="group relative flex flex-col justify-between rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-900/5 transition duration-300 hover:shadow-xl hover:ring-emerald-500/30"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                      <Icon className="h-6 w-6" strokeWidth={2} />
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-800 transition">
                      {badge}
                    </span>
                  </div>
                  <h3 className="mt-6 font-display text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. How It Works (3 Steps) */}
      <section className="bg-emerald-900 py-20 text-white">
        <div className="mx-auto max-w-[72rem] px-5 sm:px-8">
          <div className="text-center max-w-xl mx-auto">
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-emerald-300">Simple Process</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl text-white">How To Book In 3 Easy Steps</h2>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {[
              { step: '01', title: 'Pick Your Taxi', desc: 'Browse our vehicle fleet & drivers, then click the WhatsApp button.' },
              { step: '02', title: 'Chat With Driver', desc: 'Confirm your travel date, pick-up time, and Singapore/Johor addresses.' },
              { step: '03', title: 'Enjoy Your Ride', desc: 'Your driver arrives at your door. Sit back & stay inside the taxi at customs!' },
            ].map((s) => (
              <div key={s.step} className="relative rounded-2xl bg-white/5 p-8 backdrop-blur border border-white/10">
                <span className="font-display text-4xl font-extrabold text-emerald-400">{s.step}</span>
                <h3 className="mt-4 font-display text-xl font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-emerald-100/80 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQ Section (Accordion) */}
      <section id="faq" className="scroll-mt-16 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-[50rem] px-5 sm:px-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Got Questions?</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Frequently Asked Questions</h2>
            <p className="mt-3 text-slate-600 text-lg">Everything you need to know about Johor ⟶ Singapore cross-border taxi rides.</p>
          </div>

          <div className="mt-12 divide-y divide-slate-200 border-y border-slate-200">
            {FAQS.map((faq, index) => (
              <div key={faq.q} className="py-5">
                <button
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between text-left font-display text-lg font-bold text-slate-900 transition hover:text-emerald-700"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-emerald-600 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="mt-3 text-slate-600 leading-relaxed text-sm">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="bg-slate-950 py-14 text-slate-400 border-t border-slate-900">
        <div className="mx-auto flex max-w-[72rem] flex-col gap-8 px-5 sm:px-8 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-2xl bg-slate-900 border-2 border-slate-700 p-2 shadow-2xl shadow-emerald-500/30 ring-2 ring-emerald-400">
              <img src={logoImg} alt="Taxi Johor Cross Border Logo" className="h-full w-full object-contain rounded-xl" />
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold text-white leading-none">Taxi Johor Cross Border</p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed">Johor ⟶ Singapore cross-border taxi service. Connect directly with taxi drivers 24 hours a day.</p>
              <p className="mt-3 text-[11px] text-slate-500 max-w-md leading-relaxed">
                *Disclaimer: Taxi Johor Cross Border operates as an online booking directory and dispatch service connecting passengers directly with licensed Singapore (LTA) &amp; Malaysia (APAD) cross-border transport operators.
              </p>
            </div>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-white">Johor ⟶ Singapore Taxi Dispatch</p>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="transition hover:text-emerald-400">+60 13-872 8630</a>
            <p className="mt-4 text-xs text-slate-500">© {new Date().getFullYear()} Taxi Johor Cross Border. All rights reserved.</p>
          </div>
        </div>
      </footer>
      {/* 10. Sticky Floating WhatsApp Button */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello! I have a question regarding Johor ⟶ Singapore cross-border taxi services.\n\nPlease help answer my inquiry.')}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ask a Question on WhatsApp"
        className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 sm:gap-3 rounded-full bg-emerald-500 px-4 sm:px-5 py-3 sm:py-3.5 text-slate-950 font-extrabold shadow-2xl shadow-emerald-500/40 ring-4 ring-slate-950/20 transition duration-300 hover:bg-emerald-400 hover:scale-105 active:scale-95"
      >
        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 fill-slate-950" />
        <span className="text-xs sm:text-sm font-extrabold">Ask a Question</span>
      </a>
    </div>
  );
};

export default HomePage;
