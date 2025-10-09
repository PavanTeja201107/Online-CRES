require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5500;

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: true, // in prod set to frontend URL or list of allowed origins
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200
});
app.use(limiter);

// import routes
const authRoutes = require('./routes/auth');
const electionRoutes = require('./routes/elections');
const nominationRoutes = require('./routes/nominations');
const voteRoutes = require('./routes/votes');
const policyRoutes = require('./routes/policy');
const auditRoutes = require('./routes/audit');

app.use('/api/auth', authRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/nominations', nominationRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/policy', policyRoutes);
app.use('/api/audit', auditRoutes);

app.get('/', (req, res) => res.json({ message: 'CRES backend up' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
