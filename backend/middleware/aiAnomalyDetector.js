const userRequestLogs = {}; // IP / User-ன் Request எண்ணிக்கையைக் கணக்கிட

const aiAnomalyDetector = (req, res, next) => {
    const userIp = req.ip || req.connection.remoteAddress;
    const currentHour = new Date().getHours();
    const currentTime = Date.now();

    let anomalyScore = 0;
    let anomalyReasons = [];

    // 1. ⏱️ Time Anomaly Check (நடு இரவு 1 AM - 4 AM லாகின்)
    if (currentHour >= 1 && currentHour <= 4) {
        anomalyScore += 30;
        anomalyReasons.push("Unusual Access Time (Late Night Login 1AM-4AM)");
    }

    // 2. ⚡ Rate Anomaly Check (10 வினாடியில் 5-க்கும் மேற்பட்ட Request-கள் வந்தா)
    if (!userRequestLogs[userIp]) {
        userRequestLogs[userIp] = [];
    }
    
    // 10 வினாடிகளுக்கு முந்தைய கிளிக்ஸை நீக்குவது
    userRequestLogs[userIp] = userRequestLogs[userIp].filter(time => currentTime - time < 10000);
    userRequestLogs[userIp].push(currentTime);

    if (userRequestLogs[userIp].length > 5) {
        anomalyScore += 50;
        anomalyReasons.push(`High Request Rate Detected (${userRequestLogs[userIp].length} req / 10 sec)`);
    }

    // 3. 🤖 Suspicious User-Agent Check (Python / Burp Suite Scripts)
    const userAgent = req.headers['user-agent'] || '';
    if (userAgent.includes('python') || userAgent.includes('Postman') || userAgent.includes('curl')) {
        anomalyScore += 25;
        anomalyReasons.push("Automated Tool / Script Detected in User-Agent");
    }

    // 🎯 Threshold Decision: Anomaly Score >= 50 ஆக இருந்தால் 'isHacker' ஆக மாற்றுதல்
    if (anomalyScore >= 50) {
        req.isAnomalyDetected = true;
        req.anomalyReasons = anomalyReasons;
        req.anomalyScore = anomalyScore;

        // User Object-ல் isHacker-ஐ True ஆக்குவது
        if (!req.user) req.user = {};
        req.user.isHacker = true;
        req.user.detectionType = "AI_BEHAVIORAL_ANOMALY";
    }

    next();
};

module.exports = aiAnomalyDetector;