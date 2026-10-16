const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('🛡️ BankSentinel Backend Security Shield is Active and Guarding!');
});

// Routes Settings
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/banking', require('./routes/bankingRoutes')); // 👈 புது பேங்கிங் ரூட் இங்கே இணைக்கப்பட்டுள்ளது!

// MongoDB Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('🛡️  MongoDB connected successfully to BankSentinel DB.'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Server Start
app.listen(PORT, () => {
    console.log(`🚀 Security Engine running on port ${PORT}`);
});