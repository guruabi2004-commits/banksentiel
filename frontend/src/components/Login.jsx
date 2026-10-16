import React, { useState } from 'react';
import axios from 'axios';
import { Key, Mail, UserPlus, User, Lock, ArrowUpRight, Check, Landmark } from 'lucide-react';

export default function Login({ onLoginSuccess, onMfaRequired }) {
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            
            if (res.status === 202 && res.data.mfaRequired) {
                if (onMfaRequired) {
                    onMfaRequired(email, password);
                } else {
                    localStorage.setItem('tempEmail', email);
                    window.location.href = '/mfa-verify';
                }
            } else {
                const token = res.data.token;
                const user = res.data.user;

                localStorage.setItem('jwtToken', token);
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));

                if (onLoginSuccess) {
                    onLoginSuccess(token, user);
                } else {
                    if (user.role === 'admin' || user.role === 'bank_admin') {
                        window.location.href = '/admin/dashboard';
                    } else if (user.isHacker) {
                        window.location.href = '/customer/fake-dashboard';
                    } else {
                        window.location.href = '/customer/dashboard';
                    }
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Invalid Credentials.');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', { username, email, password });
            setMessage(res.data.message + ' 🛡️ Now you can login.');
            setIsRegister(false);
            setUsername('');
            setPassword('');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Try again.');
        }
    };

    return (
        <main className="auth-page">
            <section className="auth-story" aria-label="BankSentinel">
                <a className="brand-lockup" href="/" aria-label="BankSentinel home">
                    <span className="brand-mark"><Landmark size={20} strokeWidth={1.8} /></span>
                    <span>BankSentinel</span>
                </a>
                <div className="story-copy">
                    <span className="eyebrow">Banking, with peace of mind</span>
                    <h1>Your money.<br /><em>In good hands.</em></h1>
                    <p>Everyday banking, thoughtfully protected. A clearer view of your money starts here.</p>
                    <div className="story-points">
                        <span><Check size={15} /> Always-on account monitoring</span>
                        <span><Check size={15} /> Secure sign-in at every step</span>
                    </div>
                </div>
                <div className="story-footer"><Lock size={14} /> Your information is protected with bank-level security</div>
                <div className="story-art" aria-hidden="true"><span>BS</span><div className="art-line" /><div className="art-line short" /></div>
            </section>

            <section className="auth-panel">
                <div className="auth-form-wrap">
                    <div className="mobile-brand brand-lockup">
                        <span className="brand-mark"><Landmark size={20} strokeWidth={1.8} /></span>
                        <span>BankSentinel</span>
                    </div>
                    <div className="auth-heading">
                        <span className="eyebrow">{isRegister ? 'Get started' : 'Welcome back'}</span>
                        <h2>{isRegister ? 'Open your account' : 'Sign in to your account'}</h2>
                        <p>{isRegister ? 'A few details and you’re ready to go.' : 'Enter your details to securely access your banking.'}</p>
                    </div>

                    {error && <p className="form-alert form-alert-error" role="alert">{error}</p>}
                    {message && <p className="form-alert form-alert-success" role="status">{message}</p>}

                    <form onSubmit={isRegister ? handleRegister : handleLogin} className="bank-form">
                        {isRegister && <div className="field-group">
                            <label htmlFor="username">Full name</label>
                            <div className="field-wrap"><UserPlus size={17} /><input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your name" autoComplete="name" required /></div>
                        </div>}
                        <div className="field-group">
                            <label htmlFor="email">{isRegister ? 'Email address' : 'Email or username'}</label>
                            <div className="field-wrap">{isRegister ? <Mail size={17} /> : <User size={17} />}<input id="email" type={isRegister ? 'email' : 'text'} value={email} onChange={(e) => setEmail(e.target.value)} placeholder={isRegister ? 'name@example.com' : 'Enter your email or username'} autoComplete="username" required /></div>
                        </div>
                        <div className="field-group">
                            <label htmlFor="password">Password</label>
                            <div className="field-wrap"><Key size={17} /><input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete={isRegister ? 'new-password' : 'current-password'} required /></div>
                        </div>
                        <button type="submit" className="primary-action">{isRegister ? 'Create account' : 'Sign in'}<ArrowUpRight size={17} /></button>
                    </form>

                    <div className="auth-switch">
                        <span>{isRegister ? 'Already have an account?' : 'New to BankSentinel?'}</span>
                        <button onClick={() => { setIsRegister(!isRegister); setError(''); setMessage(''); }}>
                            {isRegister ? 'Sign in' : 'Create an account'}
                        </button>
                    </div>
                    <div className="secure-note"><Lock size={14} /><span>Protected by 256-bit encryption</span></div>
                </div>
                <footer className="auth-legal">© 2026 BankSentinel <span>·</span> Member support <a href="mailto:support@banksentinel.com">Contact us</a></footer>
            </section>
        </main>
    );
}
