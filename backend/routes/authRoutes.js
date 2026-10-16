const router = require('express').Router();
const authController = require('../controllers/authController');


const { bruteForceShield, intrusionDetector } = require('../middleware/iddsShield');

// 1. REGISTER ROUTE
router.post('/register', authController.register);

// 2. LOGIN ROUTE
router.post('/login', bruteForceShield, intrusionDetector, authController.login);

// 3. MFA SETUP ROUTES
router.post('/setup-mfa', authController.setupMFA);
router.post('/verify-mfa', authController.verifyMFA);

module.exports = router;