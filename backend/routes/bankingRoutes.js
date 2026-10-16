const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const trackHackerActivity = require('../middleware/trackHackerActivity');
const aiAnomalyDetector = require('../middleware/aiAnomalyDetector');
const IntrusionLog = require('../models/IntrusionLog');
const User = require('../models/User');

router.get('/dashboard', auth, aiAnomalyDetector, trackHackerActivity, async (req, res) => {
    try {
        if (req.user && req.user.isHacker) {
            return res.json({
                message: "Welcome to your Secure BankSentinel Dashboard! 🛡️ (DECOY NODE ACTIVE)",
                accountDetails: { accountNumber: "XXXX-XXXX-9999", balance: "$1,450,230,000.00", accountType: "Super Elite Swiss Vault" },
                recentTransactions: [{ id: 1, type: "Wire Transfer", amount: "-$50,000,000.00", status: "Completed" }],
                isHacker: true
            });
        }

        res.json({
            message: "Welcome to your Secure BankSentinel Dashboard! 🛡️",
            accountDetails: { accountNumber: "9876543210", balance: "$25,450.00", accountType: "Premium Savings" },
            recentTransactions: [
                { id: 1, type: "Transfer", amount: "-$120.00", status: "Success" },
                { id: 2, type: "Deposit", amount: "+$1,500.00", status: "Success" }
            ],
            isHacker: false
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/transfer', auth, aiAnomalyDetector, trackHackerActivity, async (req, res) => {
    try {
        const { recipient, amount } = req.body;
        res.json({
            status: "success",
            message: `Successfully transferred $${amount} to ${recipient}`,
            transactionId: "TXN_" + Math.floor(100000 + Math.random() * 900000)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/change-password', auth, aiAnomalyDetector, trackHackerActivity, async (req, res) => {
    try {
        res.json({ status: "success", message: "Password changed successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/download-statement', auth, aiAnomalyDetector, trackHackerActivity, async (req, res) => {
    try {
        res.json({ status: "success", message: "Statement downloaded successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/admin/logs', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'bank_admin') {
            return res.status(403).json({ message: "Access Denied. BankSide Admin Only." });
        }

        const logs = await IntrusionLog.find().sort({ timestamp: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/admin/block-hacker', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'bank_admin') {
            return res.status(403).json({ message: "Access Denied." });
        }

        const { hackerEmail } = req.body;
        await User.findOneAndUpdate(
            { $or: [{ email: hackerEmail }, { username: hackerEmail }] }, 
            { role: 'blocked_hacker' }
        );

        res.json({ message: `Hacker ${hackerEmail} has been successfully isolated and blocked from BankSentinel Network! 🚫` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;