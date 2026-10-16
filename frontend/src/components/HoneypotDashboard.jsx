import React, { useState } from 'react';
import axios from 'axios';
import { Landmark, Send, LogOut, Lock, ShieldAlert, History, Globe } from 'lucide-react';

export default function HoneypotDashboard({ jwtToken, user, onLogout }) {
    const [fakeBalance, setFakeBalance] = useState(250000.00);
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [fakeTransactions, setFakeTransactions] = useState([
        { id: 'TXN-90812', recipient: 'Offshore Vault Ltd', amount: 125000, date: '2026-03-28' },
        { id: 'TXN-88123', recipient: 'Crypto Gateway Inc', amount: 50000, date: '2026-03-25' }
    ]);

    // 🎯 Hacker Actions-ஐ லாக் செய்து Trap-க்குள் கொண்டு செல்லும் Function
    const handleFakeTransfer = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = jwtToken || localStorage.getItem('jwtToken') || localStorage.getItem('token');

            // Fake transfer API endpoint to record attacker's payload
            await axios.post('http://localhost:5000/api/banking/fake-transfer', 
                { recipient, amount },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Fake Success Simulation (ஹேக்கரை நம்ப வைக்கிறோம்)
            const transferAmount = parseFloat(amount || 0);
            setFakeBalance(prev => prev - transferAmount);
            
            const newTxn = {
                id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
                recipient,
                amount: transferAmount,
                date: new Date().toISOString().split('T')[0]
            };
            setFakeTransactions([newTxn, ...fakeTransactions]);

            setMsg(`✅ Wire Transfer of $${transferAmount.toLocaleString()} to ${recipient} Executed Successfully.`);
            setRecipient('');
            setAmount('');
        } catch (err) {
            // எரர் வந்தாலும் ஹேக்கருக்கு சந்தேகம் வரக்கூடாது என்பதற்காக Fake Message
            setMsg('✅ Wire Transfer Payload Dispatched Successfully.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bank-app">
            <header className="bank-topbar"><a className="brand-lockup" href="/" aria-label="BankSentinel home"><span className="brand-mark"><Landmark size={20} /></span><span>BankSentinel</span></a><nav className="main-nav" aria-label="Main navigation"><a className="nav-current" href="#vault-overview">Overview</a><a href="#vault-transfers">Transfers</a><a href="#vault-security">Security</a></nav><div className="topbar-actions"><span className="profile-name"><span className="profile-avatar">{user?.username?.charAt(0)?.toUpperCase() || 'A'}</span><span>{user?.username || 'Account holder'}</span></span><button onClick={onLogout} className="icon-action" title="Sign out" aria-label="Sign out"><LogOut size={17} /></button></div></header>
            <main className="account-content vault-content" id="vault-overview">
                <div className="page-heading"><div><span className="eyebrow">Business banking</span><h1>Good day, {user?.username || 'Account holder'}</h1><p>Manage your accounts and recent activity.</p></div><span className="secure-pill"><Lock size={14} /> Secure account</span></div>
                <div className="vault-grid">
                    <section className="balance-panel vault-balance"><div className="balance-topline"><span>Corporate reserve · •••• 0089</span><span className="account-status"><i /> Active</span></div><div className="balance-label">Available balance</div><div className="balance-amount">${fakeBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div><div className="balance-details"><div><span>Routing number</span><strong>021000089</strong></div><div><span>Account type</span><strong>Corporate reserve</strong></div></div><div className="balance-watermark"><Landmark size={150} /></div></section>
                    <section className="vault-transfer" id="vault-transfers"><div className="vault-section-heading"><span className="section-icon"><Send size={17} /></span><div><h2>Make a transfer</h2><p>Send funds to an external account</p></div></div>
                        {msg && <div className="form-alert form-alert-success" role="status">{msg}</div>}
                        <form onSubmit={handleFakeTransfer} className="bank-form"><div className="field-group"><label htmlFor="transfer-recipient">Recipient account or routing number</label><input className="vault-input" id="transfer-recipient" type="text" placeholder="Enter account details" value={recipient} onChange={(e) => setRecipient(e.target.value)} required /></div><div className="field-group"><label htmlFor="transfer-amount">Transfer amount</label><div className="currency-input"><span>$</span><input className="vault-input" id="transfer-amount" type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required /></div></div><button type="submit" className="primary-action" disabled={loading}>{loading ? 'Processing transfer…' : 'Review transfer'}<Send size={15} /></button></form>
                    </section>
                    <section className="vault-security" id="vault-security"><div className="vault-section-heading"><span className="section-icon"><ShieldAlert size={17} /></span><div><h2>Security overview</h2><p>Your account protection</p></div></div><div className="security-row"><span>Identity verification</span><strong className="vault-status">Enabled</strong></div><div className="security-row"><span>Transfer controls</span><strong className="vault-status">Standard</strong></div><div className="security-row"><span>Account monitoring</span><strong className="vault-status">Active</strong></div></section>
                    <section className="vault-history"><div className="section-heading"><div><span className="eyebrow">Account activity</span><h2>Recent transfers</h2></div><span className="record-count">{fakeTransactions.length} records</span></div><div className="transaction-table">{fakeTransactions.map((txn) => <div className="transaction-row vault-transaction" key={txn.id}><span className="transaction-name"><span className="transaction-icon outgoing"><History size={16} /></span><span><strong>{txn.recipient}</strong><small>{txn.id} · {txn.date}</small></span></span><strong className="transaction-amount">−${txn.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></div>)}</div></section>
                </div>
                <footer className="bank-footer"><span>BankSentinel · Secure online banking</span><span><Globe size={12} /> International transfers available</span></footer>
            </main>
        </div>
    );
}
