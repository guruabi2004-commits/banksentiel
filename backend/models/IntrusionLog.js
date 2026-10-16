const mongoose = require('mongoose');

const IntrusionLogSchema = new mongoose.Schema({
    email: { type: String, required: true },
    ipAddress: { type: String, default: 'Unknown' },
    userAgent: { type: String }, 
    detectionType: { type: String, default: 'MFA_DECEPTION_HONEYPOT' },
    severity: { type: String, default: 'CRITICAL' },
    timestamp: { type: Date, default: Date.now },
    actionsLogged: [{ type: String }] 
});

module.exports = mongoose.model('IntrusionLog', IntrusionLogSchema);