const jwt = require('jsonwebtoken');
const IntrusionLog = require('../models/IntrusionLog');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(403).json({ message: "No token provided. Access Denied." });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Unauthorized token" });
        }
        
        req.user = decoded;
        const fullPath = req.originalUrl || req.url;

        // Restricted Admin Routes access validation
        if (fullPath.includes('admin') && (req.user.isHacker || (req.user.role !== 'admin' && req.user.role !== 'bank_admin'))) {
            try {
                req.user.isHacker = true; 

                if (req.user.logId) {
                    await IntrusionLog.findByIdAndUpdate(req.user.logId, {
                        $push: { actionsLogged: `CRITICAL: Unauthorized attempt to access restricted Admin API Route [${fullPath}]!` }
                    });
                } else {
                    const newLog = new IntrusionLog({
                        email: req.user.email || 'Token_Bypasser',
                        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
                        userAgent: req.headers['user-agent'],
                        detectionType: 'RESTRICTED_ACCESS_VIOLATION',
                        actionsLogged: [`Direct URL injection attempt on Admin endpoint: ${fullPath}`]
                    });
                    const savedLog = await newLog.save();
                    req.user.logId = savedLog._id;
                }
            } catch (logErr) {
                console.error("IDDS Logging Error: ", logErr);
            }
            return next(); 
        }

        if (req.user.isHacker) {
            return next();
        }

        next(); 
    });
};

module.exports = verifyToken;