import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { GlassSpinner } from './components/common/LoadingOverlay';
import api from './utils/api';

// Lazy load pages
const Home = lazy(() => import('./pages/public/Home'));
const Login = lazy(() => import('./pages/public/Login'));
const Register = lazy(() => import('./pages/public/Register'));
const ForgotPassword = lazy(() => import('./pages/public/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/public/ResetPassword'));
const ConfirmEmail = lazy(() => import('./pages/public/ConfirmEmail'));
const ModuleSelection = lazy(() => import('./pages/public/ModuleSelection'));
const OADRDashboard = lazy(() => import('./pages/public/OADRDashboard'));
const ProbateDashboard = lazy(() => import('./pages/public/ProbateDashboard'));
const Verification = lazy(() => import('./pages/public/Verification'));

const StaffLogin = lazy(() => import('./pages/staff/StaffLogin'));
const AdminDashboard = lazy(() => import('./pages/staff/AdminDashboard'));
const CFODashboard = lazy(() => import('./pages/staff/CFODashboard'));
const CRDashboard = lazy(() => import('./pages/staff/CRDashboard'));
const PRDashboard = lazy(() => import('./pages/staff/PRDashboard'));
const JuratDashboard = lazy(() => import('./pages/staff/JuratDashboard'));
const PDDashboard = lazy(() => import('./pages/staff/PDDashboard'));
const ClerkDashboard = lazy(() => import('./pages/staff/ClerkDashboard'));

const AnimatedRoutes = ({ user, setUser, staff, setStaff }) => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Suspense fallback={<GlassSpinner message="Loading Page..." />}>
                <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<Home />} />
                    <Route path="/verify/:type" element={<Verification />} />
                    {/* Public Portal */}
                    <Route path="/login" element={<Login setUser={(u) => {
                        localStorage.setItem('user', JSON.stringify(u));
                        setUser(u);
                    }} />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/confirm-email" element={<ConfirmEmail />} />
                    <Route path="/modules" element={user ? <ModuleSelection user={user} /> : <Navigate to="/login" />} />
                    <Route path="/oadr/*" element={user ? <OADRDashboard user={user} /> : <Navigate to="/login" />} />
                    <Route path="/probate/*" element={user ? <ProbateDashboard user={user} /> : <Navigate to="/login" />} />

                    {/* Staff Portal */}
                    <Route path="/staff/login" element={<StaffLogin setStaff={(s) => {
                        localStorage.setItem('staff', JSON.stringify(s));
                        setStaff(s);
                    }} />} />

                    <Route path="/staff/admin" element={staff && staff.role === 'admin' ? <AdminDashboard staff={staff} /> : <Navigate to="/staff/login" />} />
                    <Route path="/staff/cfo" element={staff && staff.role === 'cfo' ? <CFODashboard staff={staff} /> : <Navigate to="/staff/login" />} />
                    <Route path="/staff/cr" element={staff && staff.role === 'cr' ? <CRDashboard staff={staff} /> : <Navigate to="/staff/login" />} />
                    <Route path="/staff/pr" element={staff && (staff.role === 'registrar' || staff.role === 'pr') ? <PRDashboard staff={staff} /> : <Navigate to="/staff/login" />} />
                    <Route path="/staff/jurat" element={staff && staff.role === 'jurat' ? <JuratDashboard staff={staff} /> : <Navigate to="/staff/login" />} />
                    <Route path="/staff/pd" element={staff && staff.role === 'pd' ? <PDDashboard staff={staff} /> : <Navigate to="/staff/login" />} />
                    <Route path="/staff/clerk" element={staff && staff.role === 'clerk' ? <ClerkDashboard staff={staff} /> : <Navigate to="/staff/login" />} />

                    {/* Catch-all redirect for staff base path */}
                    <Route path="/staff" element={!staff || !staff.role ? <Navigate to="/staff/login" /> : <Navigate to={`/staff/${(staff.role === 'registrar' || staff.role === 'pr') ? 'pr' : staff.role}`} />} />
                </Routes>
            </Suspense>
        </AnimatePresence>
    );
};

const App = () => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });
    const [staff, setStaff] = useState(() => {
        const saved = localStorage.getItem('staff');
        return saved ? JSON.parse(saved) : null;
    });

    const logout = (reason) => {
        // Find which session is being logged out based on the current path or context
        const isStaffPath = window.location.pathname.startsWith('/staff');

        if (isStaffPath) {
            localStorage.removeItem('staffToken');
            localStorage.removeItem('staff');
            setStaff(null);
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
        }

        const loginPath = isStaffPath ? '/staff/login' : '/login';
        window.location.href = typeof reason === 'string' ? `${loginPath}?reason=${reason}` : loginPath;
    };

    // Session Timeout Logic (1 hour of inactivity)
    useEffect(() => {
        let timeout;
        const INACTIVITY_TIME = 60 * 60 * 1000; // 1 hour

        const resetTimer = () => {
            if (timeout) clearTimeout(timeout);
            if (user || staff) {
                timeout = setTimeout(() => {
                    console.log('Session expired due to inactivity');
                    logout('timeout');
                }, INACTIVITY_TIME);
            }
        };

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => document.addEventListener(event, resetTimer));

        resetTimer(); // Initialize timer

        return () => {
            if (timeout) clearTimeout(timeout);
            events.forEach(event => document.removeEventListener(event, resetTimer));
        };
    }, [user, staff]);

    // Refresh Session Profiles on load
    useEffect(() => {
        const fetchProfiles = async () => {
            const token = localStorage.getItem('token');
            const staffToken = localStorage.getItem('staffToken');

            // Refresh Public Session
            if (token && localStorage.getItem('user')) {
                try {
                    const res = await api.get('/public/profile');
                    const updatedData = res.data;
                    updatedData.firstName = updatedData.first_name;
                    updatedData.middleName = updatedData.middle_name;
                    localStorage.setItem('user', JSON.stringify(updatedData));
                    setUser(updatedData);
                } catch (err) {
                    console.error('Failed to refresh public profile:', err);
                    if (err.response?.status === 401) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setUser(null);
                    }
                }
            }

            // Refresh Staff Session
            if (staffToken && localStorage.getItem('staff')) {
                try {
                    const res = await api.get('/staff/profile');
                    const updatedData = res.data;
                    localStorage.setItem('staff', JSON.stringify(updatedData));
                    setStaff(updatedData);
                } catch (err) {
                    console.error('Failed to refresh staff profile:', err);
                    if (err.response?.status === 401) {
                        localStorage.removeItem('staffToken');
                        localStorage.removeItem('staff');
                        setStaff(null);
                    }
                }
            }
        };
        fetchProfiles();
    }, []);

    return (
        <Router>
            <AnimatedRoutes user={user} setUser={setUser} staff={staff} setStaff={setStaff} />
        </Router>
    );
};

export default App;
