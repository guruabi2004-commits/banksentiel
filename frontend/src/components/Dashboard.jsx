import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LogOut, User, Landmark, ArrowUpRight, ArrowDownLeft, Shield, CreditCard, Bell, ChevronRight, LockKeyhole } from 'lucide-react';

export default function Dashboard({ jwtToken, user, onLogout }) {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Digital key (JWT)-ah headers-la anupuroam
                const res = await axios.get('http://localhost:5000/api/banking/dashboard', {
                    headers: { Authorization: `Bearer ${jwtToken}` }
                });

                // 😈 IDDS Frontend Check: Oruவேளை backend dashboard response-la 
                // hacker-nu data vandha, local state-ai update panni straight-ah reload panna veikuroam
                if (res.data && res.data.isHacker) {
                    const updatedUser = { ...user, isHacker: true };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    window.location.reload(); // App.jsx fresh-ah intercept panni Honeypot-ku thallidum
                    return;
                }

                setData(res.data);
            } catch (err) {
                console.error("Dashboard fetch error details:", err.response || err);
                setError('Failed to fetch dashboard data.');
            }
        };

        if (jwtToken) {
            fetchDashboardData();
        }
    }, [jwtToken, user]);

    if (error) return <main className="state-page"><div className="state-panel"><Shield size={26} /><h1>We couldn't load your account</h1><p>{error} Check your connection and try again.</p><button className="primary-action" onClick={onLogout}>Return to sign in</button></div></main>;
    if (!data) return <main className="state-page"><div className="loading-state"><span className="loading-spinner" /><p>Loading your secure account…</p></div></main>;

    return (
        <div className="bank-app">
            <header className="bank-topbar">
                <a className="brand-lockup" href="/" aria-label="BankSentinel home"><span className="brand-mark"><Landmark size={20} /></span><span>BankSentinel</span></a>
                <nav className="main-nav" aria-label="Main navigation"><a className="nav-current" href="#overview">Overview</a><a href="#transactions">Transactions</a><a href="#security">Security</a></nav>
                <div className="topbar-actions"><button className="icon-action" title="Notifications" aria-label="Notifications"><Bell size={18} /></button><span className="profile-name"><span className="profile-avatar">{user?.username?.charAt(0)?.toUpperCase() || <User size={16} />}</span><span>{user?.username}</span></span><button className="icon-action" onClick={onLogout} title="Sign out" aria-label="Sign out"><LogOut size={17} /></button></div>
            </header>

            <main className="account-content" id="overview">
                <div className="page-heading"><div><span className="eyebrow">Personal banking</span><h1>{data.message || `Good day, ${user?.username || 'there'}`}</h1><p>Here’s your financial overview at a glance.</p></div><div className="secure-pill"><LockKeyhole size={14} /> Secure session</div></div>

                <section className="account-grid" aria-label="Account overview">
                    <div className="balance-panel">
                        <div className="balance-topline"><span>Everyday account</span><span className="account-status"><i /> Account active</span></div>
                        <div className="balance-label">Available balance</div>
                        <div className="balance-amount">{data.accountDetails?.balance ?? '—'}</div>
                        <div className="balance-details"><div><span>Account number</span><strong>{data.accountDetails?.accountNumber ?? '—'}</strong></div><div><span>Account type</span><strong>{data.accountDetails?.accountType ?? '—'}</strong></div></div>
                        <div className="balance-watermark" aria-hidden="true"><Landmark size={150} /></div>
                    </div>

                    <aside className="security-panel" id="security"><div className="section-title"><span className="section-icon"><Shield size={17} /></span><div><h2>Account security</h2><p>Protection is up to date</p></div></div>
                        <div className="security-row"><span>Sign-in session</span><strong className="status-positive"><i /> Verified</strong></div>
                        <div className="security-row"><span>Data encryption</span><strong>AES-256</strong></div>
                        <div className="security-row"><span>Account monitoring</span><strong className="status-positive">Active</strong></div>
                        <a className="text-link" href="#security">Review security settings <ChevronRight size={15} /></a>
                    </aside>
                </section>

                <section className="transactions-section" id="transactions"><div className="section-heading"><div><span className="eyebrow">Your activity</span><h2>Recent transactions</h2></div><span className="record-count">{data.recentTransactions?.length || 0} transactions</span></div>
                    <div className="transaction-table"><div className="transaction-head"><span>Transaction</span><span>Status</span><span className="amount-column">Amount</span></div>
                        {data.recentTransactions?.length ? data.recentTransactions.map((tx) => {
                            const outgoing = tx.amount.startsWith('-');
                            return <div className="transaction-row" key={tx.id}><span className="transaction-name"><span className={`transaction-icon ${outgoing ? 'outgoing' : 'incoming'}`}>{outgoing ? <ArrowUpRight size={17} /> : <ArrowDownLeft size={17} />}</span><span><strong>{tx.type}</strong><small>Account activity</small></span></span><span><i className={`transaction-status ${tx.status === 'Completed' ? 'complete' : 'pending'}`} />{tx.status}</span><strong className={`transaction-amount ${outgoing ? '' : 'credit'}`}>{tx.amount}</strong></div>;
                        }) : <div className="empty-transactions"><CreditCard size={20} /><span>No recent transactions</span></div>}
                    </div>
                </section>
                <footer className="bank-footer"><span>BankSentinel · Secure online banking</span><span>Need help? <a href="mailto:support@banksentinel.com">Contact support</a></span></footer>
            </main>
        </div>
    );
}
