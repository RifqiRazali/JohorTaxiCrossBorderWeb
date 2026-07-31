import React, { Suspense, lazy } from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './pages/HomePage';

const DriverRegistrationPage = lazy(() => import('./pages/DriverRegistrationPage'));

function App() {
    return (
        <Router>
            <ScrollToTop />
            <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 font-bold">Loading...</div>}>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/register-driver" element={<DriverRegistrationPage />} />
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;
