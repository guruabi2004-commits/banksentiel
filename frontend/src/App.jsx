import React, { useState } from 'react';
import Login from './components/Login';
import MfaSetup from './components/MfaSetup';
import Dashboard from './components/Dashboard'; 
import HoneypotDashboard from './components/HoneypotDashboard'; 
import AdminDashboard from './components/AdminDashboard';

export default function App() {
    const [token, setToken] = useState(localStorage.getItem('jwtToken') || localStorage.getItem('token') || null);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
    const [mfaData, setMfaData] = useState(null); 

    const handleLoginSuccess = (jwtToken, userData) => {
        localStorage.setItem('jwtToken', jwtToken);
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(jwtToken);
        setUser(userData);
        setMfaData(null);
    };

    const handleMfaRequired = (email, password) => {
        setMfaData({ email, password });
    };

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tempEmail');
        setToken(null);
        setUser(null);
        setMfaData(null);
    };

    // 🎯 IDDS RULE 1: தப்பான OTP அல்லது Brute force வழியா நுழைந்தால் (isHacker = true), Decoy Screen
    if (token && user && user.isHacker) {
        return <HoneypotDashboard jwtToken={token} user={user} onLogout={handleLogout} isDecoyView={true} />;
    }

    // 🎯 ADMIN VIEW: Admin / Bank Admin லாகின் செய்தால் Central Monitoring Command Panel
    if (token && user && (user.role === 'admin' || user.role === 'bank_admin')) {
        return <AdminDashboard jwtToken={token} user={user} onLogout={handleLogout} />;
    }

    // 🎯 CUSTOMER VIEW: சாதாரண பயனர் நேரடி பார்வை
    if (token && user) {
        return <Dashboard jwtToken={token} user={user} onLogout={handleLogout} />;
    }

    // 🎯 MFA VERIFICATION STEP
    if (mfaData) {
        return (
            <MfaSetup 
                email={mfaData.email} 
                password={mfaData.password} 
                onMfaSuccess={handleLoginSuccess} 
            />
        );
    }

    // 🎯 DEFAULT: LOGIN / REGISTER PAGE
    return (
        <Login 
            onLoginSuccess={handleLoginSuccess} 
            onMfaRequired={handleMfaRequired} 
        />
    );
}