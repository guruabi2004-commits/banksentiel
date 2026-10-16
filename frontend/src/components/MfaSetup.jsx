import React, { useState } from 'react';
import axios from 'axios';
import { Lock, Landmark, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function MfaSetup({ email, password, onMfaSuccess }) {
    const [token, setToken] = useState('');
    const [error, setError] = useState('');

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // லாகின் ஏபிஐ-க்கே இப்போ டோக்கனையும் சேர்த்து அனுப்புறோம்
            const res = await axios.post('http://localhost:5000/api/auth/login', { email, password, token });
            // வெரிஃபிகேஷன் சக்சஸ் ஆனா டோக்கன் மற்றும் யூசர் டேட்டாவை மெயின் ஆப்பிற்கு அனுப்புறோம்
            onMfaSuccess(res.data.token, res.data.user);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid 2FA Token. Please try again.');
        }
    };

    return (
        <main className="auth-page">
            <section className="auth-story" aria-label="BankSentinel security">
                <a className="brand-lockup" href="/" aria-label="BankSentinel home"><span className="brand-mark"><Landmark size={20} /></span><span>BankSentinel</span></a>
                <div className="story-copy"><span className="eyebrow">One more step</span><h1>Security that<br /><em>stays with you.</em></h1><p>Confirm it’s really you to continue to your account.</p><div className="story-points"><span><ShieldCheck size={16} /> Multi-factor protection</span><span><Lock size={15} /> Your account stays private</span></div></div>
                <div className="story-footer"><Lock size={14} /> Your information is protected with bank-level security</div>
            </section>
            <section className="auth-panel">
                <div className="auth-form-wrap">
                    <div className="mobile-brand brand-lockup"><span className="brand-mark"><Landmark size={20} /></span><span>BankSentinel</span></div>
                    <button type="button" className="back-link" onClick={() => window.history.back()}><ArrowLeft size={15} /> Back</button>
                    <div className="auth-heading"><span className="eyebrow">Identity verification</span><h2>Check your authenticator</h2><p>Enter the 6-digit code from your authenticator app to securely sign in.</p></div>
                    {error && <p className="form-alert form-alert-error" role="alert">{error}</p>}
                    <form onSubmit={handleVerify} className="bank-form">
                        <div className="field-group"><label htmlFor="verification-code">6-digit verification code</label><input id="verification-code" className="verification-input" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={token} onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))} placeholder="000000" required /></div>
                        <button type="submit" className="primary-action">Verify and continue <ShieldCheck size={17} /></button>
                    </form>
                    <div className="secure-note"><Lock size={14} /><span>Never share your verification code</span></div>
                </div>
                <footer className="auth-legal">© 2026 BankSentinel <span>·</span> Member support <a href="mailto:support@banksentinel.com">Contact us</a></footer>
            </section>
        </main>
    );
}