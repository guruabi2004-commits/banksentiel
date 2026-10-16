const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const IntrusionLog = require('../models/IntrusionLog'); 


const failedAttemptsTracker = {};
const mfaFailedAttemptsTracker = {};

// 1. REGISTER LOGIC
exports.register = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // 🚨 NoSQL Injection / Object Check in Register
        if (typeof username === 'object' || typeof email === 'object' || typeof password === 'object') {
            return res.status(400).json({ message: 'Invalid input format.' });
        }

        let user = await User.findOne({ $or: [{ email: email }, { username: username }] });
        if (user) return res.status(400).json({ message: 'User or Email already exists!' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            username,
            email,
            password: hashedPassword,
            role: role || 'customer'
        });

        await user.save();
        res.status(201).json({ message: '🛡️ Account created successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. LOGIN LOGIC
exports.login = async (req, res) => {
    try {
        const { email, password, token } = req.body; // email ஃபீல்டில் Username அல்லது Email வரலாம்
        const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

        // 🎯 IDDS RULE 0: NoSQL / SQL Injection Threat Detection
        const isObjectPayload = typeof email === 'object' || typeof password === 'object';
        const rawString = JSON.stringify(req.body);
        const hasInjectionPattern = /(\$ne|\$gt|\$gte|\$lt|\$lte|\$where|\$regex|UNION|SELECT|DROP)/i.test(rawString);

        if (isObjectPayload || hasInjectionPattern) {
            const newLog = new IntrusionLog({
                email: (typeof email === 'string' ? email : 'NoSQL_Attacker'),
                ipAddress: ip,
                userAgent: req.headers['user-agent'],
                detectionType: 'NOSQL_INJECTION_ATTEMPT',
                actionsLogged: [
                    'Malicious NoSQL injection query payload detected in authentication request',
                    'Attack mitigated & Session isolated in Honeypot Decoy Vault'
                ]
            });
            await newLog.save();

            const fakeToken = jwt.sign(
                { email: 'NoSQL_Attacker', isHacker: true, logId: newLog._id }, 
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            return res.json({
                token: fakeToken,
                user: { username: "Decoy_User", role: "Hacker_Decoy", isHacker: true },
                message: "🛡️ Secure Access Granted"
            });
        }

        // Username அல்லது Email இரண்டில் ஒன்றைக் கொண்டு பயனர் தேடல்
        const user = await User.findOne({
            $or: [{ email: email }, { username: email }]
        });

        // 🎯 IDDS RULE 1: Brute Force (5+ Failed Login Attempts)
        if (!user || !(await bcrypt.compare(password, user.password))) {
            const trackKey = typeof email === 'string' ? email : 'Unknown';
            failedAttemptsTracker[trackKey] = (failedAttemptsTracker[trackKey] || 0) + 1;

            if (failedAttemptsTracker[trackKey] >= 5) {
                const newLog = new IntrusionLog({
                    email: user ? user.email : trackKey,
                    ipAddress: ip,
                    userAgent: req.headers['user-agent'],
                    detectionType: 'REPEATED_FAILED_ATTEMPTS',
                    actionsLogged: ['Brute force threshold reached (5+ password failures)', 'Redirected to Fake Honeypot Vault']
                });
                await newLog.save();

                const fakeToken = jwt.sign(
                    { email: trackKey, isHacker: true, logId: newLog._id }, 
                    process.env.JWT_SECRET,
                    { expiresIn: '1h' }
                );
                return res.json({
                    token: fakeToken,
                    user: { username: "Decoy_User", role: "Hacker_Decoy", isHacker: true },
                    message: "🛡️ Secure Access Granted" 
                });
            }
            return res.status(400).json({ 
                message: `Invalid Credentials. Remaining attempts: ${5 - failedAttemptsTracker[trackKey]}` 
            });
        }

        // Block செய்யப்பட்ட ஹேக்கராக இருந்தால்
        if (user.role === 'blocked_hacker') {
            return res.status(403).json({ message: "Your account/IP has been isolated and blocked by BankSentinel security." });
        }

        // 🎯 IDDS RULE 2: Impossible Travel Location
        if (req.isSuspiciousLocation) {
            const newLog = new IntrusionLog({
                email: user.email,
                ipAddress: ip,
                userAgent: req.headers['user-agent'],
                detectionType: 'IMPOSSIBLE_TRAVEL_LOCATION',
                actionsLogged: ['Anomalous geolocation pattern detected', 'Redirected to Honeypot']
            });
            await newLog.save();

            const fakeToken = jwt.sign(
                { id: user._id, role: 'hacker', isHacker: true, logId: newLog._id }, 
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
            return res.json({
                token: fakeToken,
                user: { username: user.username, role: 'Hacker_Decoy', isHacker: true },
                message: "🛡️ Secure Access Granted"
            });
        }

        // 🎯 ADMIN LOGIC: Admin-க்கு 2FA தவிர்க்கப்பட்டு நேரடி அனுமதி
        if (user.role === 'admin' || user.role === 'bank_admin') {
            failedAttemptsTracker[user.email] = 0;
            const jwtToken = jwt.sign(
                { id: user._id, role: 'admin', isHacker: false },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            return res.json({
                token: jwtToken,
                user: { id: user._id, username: user.username, email: user.email, role: 'admin', isHacker: false },
                message: "🛡️ Admin Access Granted"
            });
        }

        // 🎯 CUSTOMER MFA CHECK
        if (user.isMfaEnabled) {
            // OTP இன்னும் அனுப்பப்படவில்லை என்றால் MFA Screen-க்கு திருப்புதல்
            if (!token) {
                return res.status(202).json({ 
                    mfaRequired: true, 
                    email: user.email,
                    message: "🛡️ MFA is enabled. Please enter your 6-digit OTP token." 
                });
            }

            // Secret key இல்லையென்றால் Safe Error Handling
            if (!user.twoFactorSecret) {
                return res.status(400).json({ message: "MFA Secret key is missing! Please re-setup 2FA." });
            }

            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: token,
                window: 2 // Timing clock drift தவிர்க்க Window 2 ஆக உயர்த்தப்பட்டுள்ளது
            });

            if (!verified) {
                mfaFailedAttemptsTracker[user.email] = (mfaFailedAttemptsTracker[user.email] || 0) + 1;

                // 🚨 5 முறைக்கு மேல் தப்பான OTP போட்டால் மட்டுமே Honeypot-க்கு அனுப்ப வேண்டும்!
                if (mfaFailedAttemptsTracker[user.email] >= 5) {
                    const newLog = new IntrusionLog({
                        email: user.email,
                        ipAddress: ip,
                        userAgent: req.headers['user-agent'],
                        detectionType: 'MFA_BYPASS_ATTEMPT',
                        actionsLogged: ['Exceeded 5 invalid 2FA OTP attempts', 'Sent to Honeypot Decoy Vault']
                    });
                    await newLog.save();

                    const fakeToken = jwt.sign(
                        { id: user._id, role: 'hacker', isHacker: true, logId: newLog._id }, 
                        process.env.JWT_SECRET,
                        { expiresIn: '1h' }
                    );
                    return res.json({
                        token: fakeToken,
                        user: { username: user.username, role: 'Hacker_Decoy', isHacker: true },
                        message: "🛡️ Secure Access Granted"
                    });
                }

                return res.status(400).json({ 
                    message: `Invalid OTP Code! Remaining attempts: ${5 - mfaFailedAttemptsTracker[user.email]}` 
                });
            }
        }

        // 🎯 Successful Customer Login (Password + OTP இரண்டும் சரி)
        failedAttemptsTracker[user.email] = 0;
        mfaFailedAttemptsTracker[user.email] = 0; // Reset MFA Tracker
        
        const jwtToken = jwt.sign(
            { id: user._id, role: user.role, isHacker: false },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.json({
            token: jwtToken,
            user: { id: user._id, username: user.username, email: user.email, role: user.role, isHacker: false }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. SETUP MFA
exports.setupMFA = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ $or: [{ email: email }, { username: email }] });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const secret = speakeasy.generateSecret({ name: `BankSentinel (${user.email})` });

        user.twoFactorSecret = secret.base32;
        await user.save();

        QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) return res.status(500).json({ message: 'Error generating QR Code' });
            res.json({
                message: "Scan this QR Code in your Authenticator App",
                qrCodeUrl: data_url,
                secret: secret.base32
            });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. VERIFY MFA (Setup நேரத்திலும், தனி MFA Verification-லும் பயன்படுகிறது)
exports.verifyMFA = async (req, res) => {
    try {
        const { email, token } = req.body;
        const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
        const user = await User.findOne({ $or: [{ email: email }, { username: email }] });
        
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.twoFactorSecret) {
            return res.status(400).json({ message: 'No 2FA secret setup found for this user.' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 2
        });

        if (verified) {
            user.isMfaEnabled = true;
            await user.save();

            mfaFailedAttemptsTracker[user.email] = 0; // Success ஆனவுடன் reset

            const jwtToken = jwt.sign(
                { id: user._id, role: user.role, isHacker: false },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            return res.json({ 
                status: "success", 
                token: jwtToken,
                user: { id: user._id, username: user.username, email: user.email, role: user.role, isHacker: false },
                message: "🛡️ 2FA Verified and Enabled Successfully!" 
            });
        } else {
            mfaFailedAttemptsTracker[user.email] = (mfaFailedAttemptsTracker[user.email] || 0) + 1;

            if (mfaFailedAttemptsTracker[user.email] >= 5) {
                const newLog = new IntrusionLog({
                    email: user.email,
                    ipAddress: ip,
                    userAgent: req.headers['user-agent'],
                    detectionType: 'MFA_BYPASS_ATTEMPT',
                    actionsLogged: ['Invalid 2FA OTP submitted 5 times during MFA Verification', 'Redirected to Honeypot Decoy Vault']
                });
                await newLog.save();

                const fakeToken = jwt.sign(
                    { id: user._id, role: 'hacker', isHacker: true, logId: newLog._id }, 
                    process.env.JWT_SECRET,
                    { expiresIn: '1h' }
                );

                return res.json({
                    status: "success", // Hacker-க்கு சந்தேகம் வரக்கூடாது என்பதற்காக success Response
                    token: fakeToken,
                    user: { username: user.username || "Decoy_User", role: 'Hacker_Decoy', isHacker: true },
                    message: "🛡️ 2FA Verified Successfully!"
                });
            }

            return res.status(400).json({ 
                message: `Invalid OTP Code. Remaining attempts: ${5 - mfaFailedAttemptsTracker[user.email]}` 
            });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};