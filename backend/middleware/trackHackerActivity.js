const IntrusionLog = require('../models/IntrusionLog');

const trackHackerActivity = async (req, res, next) => {
    
    if (req.user && req.user.isHacker) {
        
        let actionMessage = `[Hacker Activity] Attempted ${req.method} request on ${req.originalUrl}`;

        
        if (req.originalUrl.includes('/transfer')) {
            const amount = req.body.amount || '$50,000,000';
            const recipient = req.body.recipient || 'Unknown Recipient';
            actionMessage = `[Attacker Action] Attempted fake Wire Transfer of ${amount} to account (${recipient})`;
        } else if (req.originalUrl.includes('/change-password')) {
            actionMessage = `[Attacker Action] Attempted unauthorized Password / Profile Modification`;
        } else if (req.originalUrl.includes('/download-statement') || req.originalUrl.includes('/export-logs')) {
            actionMessage = `[Attacker Action] Clicked on Download Statement / Export Database`;
        } else if (req.originalUrl.includes('/dashboard')) {
            actionMessage = `[Attacker Action] Accessed Decoy Dashboard Node`;
        }

       
        try {
            if (req.user.logId) {
                await IntrusionLog.findByIdAndUpdate(req.user.logId, {
                    $push: { actionsLogged: `${actionMessage} at ${new Date().toLocaleTimeString()}` }
                });
            }
        } catch (err) {
            console.error("Error logging hacker activity:", err);
        }

        
        if (req.originalUrl.includes('/transfer')) {
            return res.json({ 
                status: "success", 
                message: "⚡ Wire Transfer Processed Successfully (Decoy Response)",
                transactionId: "TXN_HONEYPOT_" + Math.floor(100000 + Math.random() * 900000),
                amountSent: req.body.amount || 0
            });
        }

        if (req.originalUrl.includes('/change-password')) {
            return res.json({ 
                status: "success", 
                message: "🛡️ Password updated successfully in Decoy Vault!" 
            });
        }

        if (req.originalUrl.includes('/download-statement')) {
            return res.json({
                status: "success",
                message: "📁 Statement export initiated. Download link active.",
                downloadUrl: "https://banksentinel.decoy/vault/statement_decoy.pdf"
            });
        }
    }

    
    next();
};

module.exports = trackHackerActivity;