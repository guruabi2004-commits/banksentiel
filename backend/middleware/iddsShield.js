const IntrusionLog = require('../models/IntrusionLog');
const rateLimit = require('express-rate-limit');


const bruteForceShield = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 20, 
    handler: async (req, res) => {
        
        const newLog = new IntrusionLog({
            email: req.body.email || 'Unknown_DDoS_Attacker',
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.headers['user-agent'],
            detectionType: 'DDOS_BRUTE_FORCE',
            actionsLogged: ['Rate limit exceeded', 'Triggered automated brute force pattern']
        });
        await newLog.save();
        
        
        res.status(200).json({ 
            token: "fake_ddos_token_xyz123", 
            user: { username: "Hacker_Decoy", role: "Hacker_Decoy", isHacker: true },
            message: "System stability maintained" 
        });
    }
});


const intrusionDetector = async (req, res, next) => {
    const { email, password, username } = req.body;
    const ip = req.ip || '127.0.0.1';
    
    
    const injectionPattern = /(\$regex|'(\s)*or(\s)*'|--|#|\/\*|\*\/)/i;
    const inputString = JSON.stringify(req.body);

    if (injectionPattern.test(inputString)) {
        const newLog = new IntrusionLog({
            email: email || 'Unknown_Injector',
            ipAddress: ip,
            userAgent: req.headers['user-agent'],
            detectionType: 'MALICIOUS_INPUT_INJECTION',
            actionsLogged: ['SQL/NoSQL Injection detected in payload', 'Redirected to Sandbox Decoy']
        });
        await newLog.save();

        // ஹேக்கருக்கு சக்சஸ் ஆனது போல ஒரு போலி டேட்டாவை தூக்கிப் போடு!
        return res.json({
            token: "fake_injection_token",
            user: { username: "Hacker_Decoy", role: "Hacker_Decoy", isHacker: true },
            message: "Query executed successfully (Decoy Active)"
        });
    }

    
    const hackerLocales = ['zh-CN', 'ru-RU', 'kp-KP']; 
    const userLanguage = req.headers['accept-language'] || '';
    
    const isSuspiciousLocation = hackerLocales.some(locale => userLanguage.includes(locale));
    if (isSuspiciousLocation) {
        req.isSuspiciousLocation = true; 
    }

    next();
};

module.exports = { bruteForceShield, intrusionDetector };