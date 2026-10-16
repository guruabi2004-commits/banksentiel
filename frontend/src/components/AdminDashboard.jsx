import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ShieldAlert, LogOut, Terminal, RefreshCw, Activity, UserX, Radio, AlertTriangle } from 'lucide-react';

export default function AdminDashboard({ jwtToken, onLogout }) {
    const [logs, setLogs] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionMsg, setActionMsg] = useState('');

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:5000/api/banking/admin/logs', {
                headers: { Authorization: `Bearer ${jwtToken}` }
            });
            setLogs(res.data);
            setError('');
        } catch (err) {
            console.error("Admin logs fetch error:", err);
            setError('Failed to fetch intrusion logs.');
        } finally {
            setLoading(false);
        }
    };

    const handleBlockHacker = async (hackerEmail) => {
        try {
            const res = await axios.post('http://localhost:5000/api/banking/admin/block-hacker', 
                { hackerEmail },
                { headers: { Authorization: `Bearer ${jwtToken}` } }
            );
            setActionMsg(res.data.message);
            setTimeout(() => setActionMsg(''), 5000);
            fetchLogs();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to block target.');
        }
    };

    useEffect(() => {
        if (jwtToken) {
            fetchLogs();
        }
    }, [jwtToken]);

    return (
        <div className="admin-app">
            <header className="bank-topbar"><a className="brand-lockup" href="/" aria-label="BankSentinel home"><span className="brand-mark"><ShieldAlert size={19} /></span><span>BankSentinel</span></a><span className="admin-label">Security operations</span><div className="topbar-actions"><span className="secure-pill"><Radio size={14} /> Monitoring active</span><button className="icon-action" onClick={onLogout} title="Sign out" aria-label="Sign out"><LogOut size={17} /></button></div></header>
            <main className="admin-content">
                <div className="admin-heading"><div><span className="eyebrow">Risk &amp; security</span><h1>Threat monitoring</h1><p>Review detected activity and manage account access.</p></div><button className="refresh-action" onClick={fetchLogs} disabled={loading}><RefreshCw size={15} className={loading ? 'refreshing' : ''} /> Refresh activity</button></div>
                <section className="monitor-summary"><div className="monitor-status"><span className="monitor-icon"><Activity size={19} /></span><div><span>Network perimeter</span><strong>Protected</strong></div></div><div className="summary-divider" /><div className="monitor-stat"><span>Threats intercepted</span><strong>{logs.length}</strong></div><div className="summary-divider" /><div className="monitor-stat"><span>Review status</span><strong className="status-positive">{logs.length ? 'Action may be required' : 'All clear'}</strong></div></section>
                {actionMsg && <div className="admin-notice notice-success" role="status">{actionMsg}</div>}
                {error && <div className="admin-notice notice-error" role="alert"><AlertTriangle size={16} />{error}</div>}
                {loading ? <div className="admin-empty"><span className="loading-spinner" /><p>Loading security activity…</p></div> : logs.length === 0 ? <div className="admin-empty"><span className="empty-shield"><ShieldAlert size={25} /></span><h2>No suspicious activity detected</h2><p>There are no intrusion events to review at this time.</p></div> : <section className="threat-section"><div className="section-heading"><div><span className="eyebrow">Security events</span><h2>Recent detections</h2></div><span className="record-count">{logs.length} event{logs.length !== 1 ? 's' : ''}</span></div>
                    <div className="threat-list">{logs.map((log) => <article className="threat-item" key={log._id}>
                        <div className="threat-header"><div><span className="threat-type"><i />{log.detectionType}</span><h3>{log.email}</h3></div><button className="block-action" onClick={() => handleBlockHacker(log.email)} title="Block this account"><UserX size={15} /> Block account</button></div>
                        <div className="threat-meta"><span><small>IP address</small><strong>{log.ipAddress}</strong></span><span><small>Detected</small><strong>{new Date(log.timestamp).toLocaleString()}</strong></span></div>
                        <div className="activity-log"><h4><Terminal size={14} /> Recorded activity</h4><ul>{log.actionsLogged.map((action, index) => <li key={`${log._id}-${index}`}>{action}</li>)}</ul></div>
                    </article>)}</div>
                </section>}
            </main>
        </div>
    );
}
