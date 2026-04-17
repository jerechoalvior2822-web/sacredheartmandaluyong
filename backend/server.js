import express from 'express';
import pg from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory (root of project)
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3001;

// Configure multer for file uploads - separate by type
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads';
    if (req.path.includes('/carousel')) {
      folder = 'uploads/carousel';
    } else if (req.path.includes('/bookings/upload')) {
      folder = 'uploads/documents';
    }
    cb(null, path.join(__dirname, `../assets/${folder}`));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit per file
});

// Middleware
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL || 'http://localhost:3000',
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Log all requests
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.path}`);
  next();
});

const mailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true' ? true : false,
  auth: {
    user: process.env.SMTP_USER || 'no-reply@sacredheart.local',
    pass: process.env.SMTP_PASS || 'password',
  },
});

console.log('[SMTP] Configuration loaded:');
console.log('[SMTP] - Host:', process.env.SMTP_HOST);
console.log('[SMTP] - Port:', process.env.SMTP_PORT);
console.log('[SMTP] - Secure:', process.env.SMTP_SECURE);
console.log('[SMTP] - User:', process.env.SMTP_USER);
console.log('[SMTP] - Pass (last 5 chars):', process.env.SMTP_PASS ? '***' + (process.env.SMTP_PASS || '').slice(-5) : 'NOT SET');

// Test SMTP connection
mailTransporter.verify((err, success) => {
  if (err) {
    console.error('[SMTP] ✗ Verification failed:', err.message);
  } else {
    console.log('[SMTP] ✓ Connection verified - Ready to send emails');
  }
});

const sendEmail = async (to, subject, text) => {
  try {
    console.log(`[SMTP] Attempting to send email to ${to}...`);
    const info = await mailTransporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@sacredheart.local',
      to,
      subject,
      text,
    });
    console.log(`[SMTP] ✓ Email sent to ${to}: ${info.messageId}`);
  } catch (err) {
    console.error(`[SMTP] ✗ Failed to send email to ${to}:`);
    console.error(`[SMTP] Error Code:`, err.code);
    console.error(`[SMTP] Error Message:`, err.message);
    console.error(`[SMTP] Error Response:`, err.response);
    console.error(`[SMTP] Full Error:`, err);
    throw err;
  }
};

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Database connection pool
const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sacred_heart',
  port: process.env.DB_PORT || 5432,
});

const db = {
  query: (sql, params, callback) => {
    pool.query(sql, params, (err, result) => {
      if (err) {
        callback(err, null);
      } else {
        // Normalize result to match MySQL callback pattern
        // PostgreSQL returns {rows: [...], rowCount: N}, we want to pass rows as second param
        callback(null, result.rows, result.rowCount);
      }
    });
  },
  connect: (callback) => {
    pool.connect((err, client, release) => {
      if (err) {
        console.error('Database connection failed:', err);
        console.error('Retrying in 5 seconds...');
        setTimeout(() => db.connect(callback), 5000);
      } else {
        console.log('Connected to PostgreSQL database');
        release();
        callback(null);
      }
    });
  }
};

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to PostgreSQL database');

    const createDonationsTable = `
      CREATE TABLE IF NOT EXISTS donations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        donation_type VARCHAR(255),
        amount DECIMAL(10,2),
        payment_method VARCHAR(255),
        message TEXT,
        proof_file_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    db.query(createDonationsTable, (tableErr) => {
      if (tableErr) {
        console.error('Failed to create donations table:', tableErr);
      }
    });

    const createServicesTable = `
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(255),
        price DECIMAL(10,2) DEFAULT 0,
        processing_time VARCHAR(255),
        requirements JSONB,
        image VARCHAR(1024),
        form_path VARCHAR(1024),
        form_name VARCHAR(255),
        form_fields JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createSouvenirsTable = `
      CREATE TABLE IF NOT EXISTS souvenirs (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) DEFAULT 0,
        stock INTEGER DEFAULT 0,
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createMassSchedulesTable = `
      CREATE TABLE IF NOT EXISTS mass_schedules (
        id SERIAL PRIMARY KEY,
        mass_day VARCHAR(255),
        mass_time VARCHAR(255),
        date DATE,
        status VARCHAR(50),
        collectors JSONB,
        lectors JSONB,
        eucharistic_ministers JSONB,
        altar_servers JSONB,
        choir_leader VARCHAR(255),
        ushers JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createMessagesTable = `
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        sender VARCHAR(20),
        text TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createOrgMembersTable = `
      CREATE TABLE IF NOT EXISTS org_members (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        position VARCHAR(255) NOT NULL,
        department VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        photo TEXT,
        level INTEGER DEFAULT 1,
        parent_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createCarouselTable = `
      CREATE TABLE IF NOT EXISTS carousel_images (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        description TEXT,
        image_path VARCHAR(255) NOT NULL,
        order_position INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    db.query(createCarouselTable, (tableErr) => {
      if (tableErr) {
        console.error('Failed to create carousel_images table:', tableErr);
      }
    });

    db.query(createServicesTable, (tableErr) => {
      if (tableErr) {
        console.error('Failed to create services table:', tableErr);
      } else {
        // Seed default parish services when the table is empty
        db.query('SELECT COUNT(*) AS count FROM services', (countErr, countResults) => {
          if (countErr) {
            console.error('Failed to count services:', countErr);
            return;
          }

          const count = Array.isArray(countResults) && countResults[0] ? countResults[0].count : 0;
          if (count === 0) {
            const seedServices = [
              [
                'Wedding Service',
                'Ceremony preparation, documents review, and blessing for couples.',
                'Weddings',
                5000.00,
                '2 weeks',
                JSON.stringify(['Marriage License', 'Baptismal Certificate', 'IDs', 'Parish Interview']),
                '',
                '',
                '',
                JSON.stringify([
                  { name: 'full_name', label: 'Full Name', type: 'text', placeholder: 'Bride or groom full name', required: true },
                  { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', required: true },
                  { name: 'phone', label: 'Phone Number', type: 'text', placeholder: '0917xxxxxxx', required: true },
                  { name: 'preferred_date', label: 'Preferred Date', type: 'date', required: true },
                  { name: 'church', label: 'Church Location', type: 'text', placeholder: 'Sacred Heart of Jesus Parish, Mandaluyong', required: true }
                ])
              ],
              [
                'Baptism Service',
                'Baptism coordination, certificate issuance, and family guidance.',
                'Baptism',
                2000.00,
                '1 week',
                JSON.stringify(['Birth Certificate', 'Parents IDs', 'Godparent IDs', 'Baptismal Prep Class']),
                '',
                '',
                '',
                JSON.stringify([
                  { name: 'child_name', label: 'Child Name', type: 'text', placeholder: 'Name of child', required: true },
                  { name: 'birth_date', label: 'Birth Date', type: 'date', required: true },
                  { name: 'parent_names', label: 'Parent Names', type: 'text', placeholder: 'Mother and father names', required: true },
                  { name: 'preferred_date', label: 'Preferred Baptism Date', type: 'date', required: true },
                  { name: 'godparents', label: 'Godparents', type: 'text', placeholder: 'Names of godparents', required: true },
                  { name: 'parish_origin', label: 'Parish of Origin', type: 'text', placeholder: 'Current home parish', required: false }
                ])
              ],
              [
                'Funeral Service',
                'Funeral mass, burial arrangements, and memorial support.',
                'Funeral',
                4000.00,
                '3 days',
                JSON.stringify(['Death Certificate', 'IDs of next of kin', 'Funeral Home Details']),
                '',
                '',
                '',
                JSON.stringify([
                  { name: 'deceased_name', label: 'Deceased Name', type: 'text', placeholder: 'Name of deceased', required: true },
                  { name: 'date_of_death', label: 'Date of Death', type: 'date', required: true },
                  { name: 'family_contact', label: 'Family Contact', type: 'text', placeholder: 'Contact person and phone', required: true },
                  { name: 'preferred_date', label: 'Preferred Date', type: 'date', required: false },
                  { name: 'burial_place', label: 'Burial Place', type: 'text', placeholder: 'Cemetery or memorial location', required: false }
                ])
              ],
              [
                'Counselling Session',
                'Pastoral counselling for individuals, couples, and families.',
                'Counselling',
                1000.00,
                '1-2 days',
                JSON.stringify(['Preferred date/time', 'Reason for counselling', 'Contact details']),
                '',
                '',
                '',
                JSON.stringify([
                  { name: 'full_name', label: 'Full Name', type: 'text', placeholder: 'Your name', required: true },
                  { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', required: true },
                  { name: 'phone', label: 'Phone Number', type: 'text', placeholder: '0917xxxxxxx', required: false },
                  { name: 'preferred_date', label: 'Preferred Date', type: 'date', required: false },
                  { name: 'issue_summary', label: 'Issue Summary', type: 'textarea', placeholder: 'Short summary of your concern', required: false }
                ])
              ],
              [
                'Blessing Service',
                'Blessing for homes, businesses, or special occasions.',
                'Blessing',
                1500.00,
                '1 week',
                JSON.stringify(['Location details', 'Preferred schedule', 'Special requests']),
                '',
                '',
                '',
                JSON.stringify([
                  { name: 'requester_name', label: 'Requester Name', type: 'text', placeholder: 'Name of requester', required: true },
                  { name: 'address', label: 'Address', type: 'text', placeholder: 'Home or business address', required: true },
                  { name: 'preferred_date', label: 'Preferred Date', type: 'date', required: false },
                  { name: 'event_type', label: 'Event Type', type: 'text', placeholder: 'Home blessing, car blessing, etc.', required: false },
                  { name: 'notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Any special requests', required: false }
                ])
              ]
            ];

            const insertQuery = 'INSERT INTO services (name, description, category, price, processing_time, requirements, image, form_path, form_name, form_fields) VALUES ?';
            db.query(insertQuery, [seedServices], (insertErr) => {
              if (insertErr) {
                console.error('Failed to seed services:', insertErr);
              } else {
                console.log('Seeded default services');
              }
            });
          }
        });
      }
    });

    db.query(createSouvenirsTable, (tableErr) => {
      if (tableErr) {
        console.error('Failed to create souvenirs table:', tableErr);
      }
    });

    db.query(createMassSchedulesTable, (tableErr) => {
      if (tableErr) {
        console.error('Failed to create mass_schedules table:', tableErr);
      }
    });

    const createAnnouncementsTable = `
      CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        type VARCHAR(50),
        date DATE,
        image VARCHAR(1024),
        likes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    db.query(createAnnouncementsTable, (tableErr) => {
      if (tableErr) {
        console.error('Failed to create announcements table:', tableErr);
      }
    });

    db.query('ALTER TABLE IF EXISTS announcements ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0', (alterErr) => {
      if (alterErr) {
        console.error('Failed to ensure likes column on announcements:', alterErr);
      }
    });

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        address VARCHAR(255),
        role VARCHAR(20) DEFAULT 'user',
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    db.query(createUsersTable, (tableErr) => {
      if (tableErr) {
        console.error('Failed to create users table:', tableErr);
      } else {
        const ensureColumn = (columnName, pgType) => {
          db.query(
            `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = $1`,
            [columnName],
            (columnErr, columnResults) => {
              if (columnErr) {
                console.error(`Failed to inspect users table column ${columnName}:`, columnErr);
              } else if (!columnResults || columnResults.rows.length === 0) {
                const alterQuery = `ALTER TABLE users ADD COLUMN ${columnName} ${pgType}`;
                db.query(alterQuery, (alterErr) => {
                  if (alterErr) {
                    console.error(`Failed to add ${columnName} to users table:`, alterErr);
                  }
                });
              }
            }
          );
        };

        ensureColumn('password_hash', 'VARCHAR(255) NOT NULL');
        ensureColumn('is_verified', 'BOOLEAN DEFAULT false');
        ensureColumn('phone', 'VARCHAR(50)');
        ensureColumn('address', 'VARCHAR(255)');
        ensureColumn('role', "VARCHAR(20) DEFAULT 'user'");
      }
    });

    const createEmailOtpsTable = `
      CREATE TABLE IF NOT EXISTS email_otps (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(16) NOT NULL,
        type VARCHAR(24) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);
      CREATE INDEX IF NOT EXISTS idx_email_otps_type ON email_otps(type);
    `;

    db.query(createEmailOtpsTable, (tableErr) => {
      if (tableErr) {
        console.error('Failed to create email_otps table:', tableErr);
      }
    });

    const createAnnouncementCommentsTable = `
      CREATE TABLE IF NOT EXISTS announcement_comments (
        id SERIAL PRIMARY KEY,
        announcement_id INTEGER NOT NULL,
        parent_comment_id INTEGER DEFAULT NULL,
        user_id VARCHAR(255) DEFAULT '0',
        user VARCHAR(255) DEFAULT 'Guest',
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_ann_comments_announcement ON announcement_comments(announcement_id);
      CREATE INDEX IF NOT EXISTS idx_ann_comments_parent ON announcement_comments(parent_comment_id);
      CREATE INDEX IF NOT EXISTS idx_ann_comments_user ON announcement_comments(user_id);
    `;

    db.query(createAnnouncementCommentsTable, (tableErr) => {
      if (tableErr) {
        console.error('Failed to create announcement_comments table:', tableErr);
      }
    });

    db.query('ALTER TABLE IF EXISTS announcement_comments ADD COLUMN IF NOT EXISTS parent_comment_id INTEGER', (alterErr) => {
      if (alterErr) {
        console.error('Failed to add parent_comment_id to announcement_comments:', alterErr);
      }
    });

    db.query('ALTER TABLE IF EXISTS announcement_comments ADD COLUMN IF NOT EXISTS user_id VARCHAR(255) DEFAULT \'0\'', (alterErr) => {
      if (alterErr) {
        console.error('Failed to add user_id to announcement_comments:', alterErr);
      }
    });

    const createAnnouncementLikesTable = `
      CREATE TABLE IF NOT EXISTS announcement_likes (
        id SERIAL PRIMARY KEY,
        announcement_id INTEGER NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (announcement_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_ann_likes_announcement ON announcement_likes(announcement_id);
      CREATE INDEX IF NOT EXISTS idx_ann_likes_user ON announcement_likes(user_id);
    `;

    db.query(createAnnouncementLikesTable, (tableErr) => {
      if (tableErr) {
        console.error('Failed to create announcement_likes table:', tableErr);
      }
    });

    const createAnnouncementCommentLikesTable = `
      CREATE TABLE IF NOT EXISTS announcement_comment_likes (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (comment_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_ann_comment_likes_comment ON announcement_comment_likes(comment_id);
      CREATE INDEX IF NOT EXISTS idx_ann_comment_likes_user ON announcement_comment_likes(user_id);
    `;

    db.query(createAnnouncementCommentLikesTable, (tableErr) => {
      if (tableErr) {
        console.error('Failed to create announcement_comment_likes table:', tableErr);
      }
    });

    db.query(createMessagesTable, (tableErr) => {
      if (tableErr) {
        console.error('Failed to create messages table:', tableErr);
      }
    });

    db.query(createOrgMembersTable, (tableErr) => {
      if (tableErr) {
        console.error('Failed to create org_members table:', tableErr);
      }
    });
  }
});
app.get('/', (req, res) => {
  res.send('Sacred Heart API');
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, phone, address } = req.body || {};
  
  console.log('[AUTH] Registration attempt:', {name, email, phone, address});

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }

  const emailLower = String(email).trim().toLowerCase();
  const passwordHash = hashPassword(String(password));

  db.query('SELECT id FROM users WHERE email = $1', [emailLower], async (selectErr, selectResults) => {
    if (selectErr) {
      console.error('Error checking existing user:', selectErr);
      return res.status(500).json({ error: selectErr.message });
    }

    if (selectResults && selectResults.rows && selectResults.rows.length > 0) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const insertQuery = 'INSERT INTO users (name, email, password_hash, phone, address, role, is_verified) VALUES ($1, $2, $3, $4, $5, $6, 0)';
    db.query(insertQuery, [name, emailLower, passwordHash, phone || '', address || '', 'user'], async (insertErr, result) => {
      if (insertErr) {
        console.error('Error creating user:', insertErr);
        return res.status(500).json({ error: insertErr.message });
      }
      
      console.log('[AUTH] User created, generating OTP...');

      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      db.query(
        'INSERT INTO email_otps (email, otp_code, type, expires_at) VALUES ($1, $2, $3, $4)',
        [emailLower, otp, 'verify', expiresAt],
        async (otpErr) => {
          if (otpErr) {
            console.error('Error creating email OTP:', otpErr);
            return res.status(500).json({ error: otpErr.message });
          }
          
          console.log(`[AUTH] OTP created: ${otp}, sending email to ${emailLower}...`);

          try {
            await sendEmail(
              emailLower,
              'Verify your Sacred Heart account',
              `Your verification code is ${otp}. This code expires in 15 minutes.`
            );
          } catch (sendErr) {
            console.error('Email send error:', sendErr);
            return res.status(500).json({ error: 'Failed to send verification email. Check SMTP configuration.' });
          }

          res.json({ message: 'Account created. Please check your email for the verification code.' });
        }
      );
    });
  });
});

app.post('/api/auth/verify-email', (req, res) => {
  const { email, otp } = req.body || {};
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const emailLower = String(email).trim().toLowerCase();
  db.query(
    'SELECT id, expires_at, used FROM email_otps WHERE email = $1 AND otp_code = $2 AND type = $3 ORDER BY id DESC LIMIT 1',
    [emailLower, String(otp).trim(), 'verify'],
    (err, results) => {
      if (err) {
        console.error('Error validating OTP:', err);
        return res.status(500).json({ error: err.message });
      }

      if (!results || results.length === 0) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      const otpRow = results[0];
      const now = new Date();
      if (otpRow.used) {
        return res.status(400).json({ error: 'OTP already used' });
      }

      if (new Date(otpRow.expires_at) < now) {
        return res.status(400).json({ error: 'OTP expired' });
      }

      db.query('UPDATE users SET is_verified = 1 WHERE email = $1', [emailLower], (updateErr) => {
        if (updateErr) {
          console.error('Error verifying user:', updateErr);
          return res.status(500).json({ error: updateErr.message });
        }

        db.query('UPDATE email_otps SET used = 1 WHERE id = ?', [otpRow.id], (usedErr) => {
          if (usedErr) {
            console.error('Error marking OTP used:', usedErr);
          }
          res.json({ message: 'Email verified successfully' });
        });
      });
    }
  );
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  console.log('[AUTH] Login attempt - Email:', email);
  
  if (!email || !password) {
    console.log('[AUTH] Missing email or password');
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const emailLower = String(email).trim().toLowerCase();
  const passwordHash = hashPassword(String(password));
  console.log('[AUTH] Querying for user:', emailLower);

  db.query(
    'SELECT id, name, email, phone, address, role, is_verified FROM users WHERE email = $1 AND password_hash = $2',
    [emailLower, passwordHash],
    (err, results) => {
      if (err) {
        console.error('[AUTH] Login query error:', err);
        return res.status(500).json({ error: 'Database error: ' + err.message });
      }

      if (!results || results.length === 0) {
        console.log('[AUTH] No user found with that email/password');
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = results[0];
      console.log('[AUTH] User found, verified status:', user.is_verified);
      
      if (!user.is_verified) {
        console.log('[AUTH] User email not verified');
        return res.status(403).json({ error: 'Email not verified' });
      }

      console.log('[AUTH] Login successful for:', user.email);
      res.json({ user: { id: user.id.toString(), name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role } });
    }
  );
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const emailLower = String(email).trim().toLowerCase();
  db.query('SELECT id FROM users WHERE email = $1', [emailLower], async (err, results) => {
    if (err) {
      console.error('Forgot password error:', err);
      return res.status(500).json({ error: err.message });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    db.query(
      'INSERT INTO email_otps (email, otp_code, type, expires_at) VALUES ($1, $2, $3, $4)',
      [emailLower, otp, 'reset', expiresAt],
      async (otpErr) => {
        if (otpErr) {
          console.error('Error creating reset OTP:', otpErr);
          return res.status(500).json({ error: otpErr.message });
        }

        try {
          await sendEmail(
            emailLower,
            'Your Sacred Heart password reset code',
            `Your password reset code is ${otp}. This code expires in 15 minutes.`
          );
        } catch (sendErr) {
          return res.status(500).json({ error: 'Failed to send password reset email. Check SMTP configuration.' });
        }

        res.json({ message: 'Reset code sent to your email' });
      }
    );
  });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, otp, newPassword } = req.body || {};
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: 'Email, OTP and new password are required' });
  }

  const emailLower = String(email).trim().toLowerCase();
  db.query(
    'SELECT id, expires_at, used FROM email_otps WHERE email = $1 AND otp_code = $2 AND type = $3 ORDER BY id DESC LIMIT 1',
    [emailLower, String(otp).trim(), 'reset'],
    (err, results) => {
      if (err) {
        console.error('Reset password error:', err);
        return res.status(500).json({ error: err.message });
      }

      if (!results || results.length === 0) {
        return res.status(400).json({ error: 'Invalid reset code' });
      }

      const otpRow = results[0];
      const now = new Date();
      if (otpRow.used) {
        return res.status(400).json({ error: 'OTP already used' });
      }

      if (new Date(otpRow.expires_at) < now) {
        return res.status(400).json({ error: 'OTP expired' });
      }

      const passwordHash = hashPassword(String(newPassword));
      db.query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, emailLower], (updateErr) => {
        if (updateErr) {
          console.error('Error updating password:', updateErr);
          return res.status(500).json({ error: updateErr.message });
        }

        db.query('UPDATE email_otps SET used = 1 WHERE id = ?', [otpRow.id], (usedErr) => {
          if (usedErr) {
            console.error('Error marking reset OTP used:', usedErr);
          }
          res.json({ message: 'Password has been reset successfully' });
        });
      });
    }
  );
});

// Example route for bookings
app.get('/api/bookings', (req, res) => {
  const { userId, serviceId, status } = req.query;
  let query = 'SELECT id, user_id, service, CAST(DATE_FORMAT(date, \'%Y-%m-%d\') AS CHAR) as date, time, status, documents, fee, payment_status, notes FROM bookings WHERE 1=1';
  const params = [];

  if (userId) {
    query += ' AND user_id = ?';
    params.push(userId);
  }
  if (serviceId) {
    query += ' AND service_id = ?';
    params.push(serviceId);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  db.query(query, params, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(results);
    }
  });
});

// Get booked dates for a service (for calendar blocking)
app.get('/api/bookings/booked-dates', (req, res) => {
  const { serviceId } = req.query;
  let query = `SELECT CAST(DATE_FORMAT(date, '%Y-%m-%d') AS CHAR) as date FROM bookings WHERE status != 'cancelled'`;
  const params = [];

  if (serviceId) {
    query += ' AND service_id = ?';
    params.push(serviceId);
  }

  db.query(query, params, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      // Return as unique date array
      const dates = [...new Set(results.map(r => r.date))];
      res.json(dates);
    }
  });
});

// POST route to create a new booking
app.post('/api/bookings', (req, res) => {
  const { user_id, service, date, time, status, documents, fee, payment_status, notes } = req.body;
  const query = 'INSERT INTO bookings (user_id, service, date, time, status, documents, fee, payment_status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';
  db.query(query, [user_id, service, date, time, status || 'pending', JSON.stringify(documents || []), fee || '$0', payment_status || 'pending', notes || ''], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ id: result.insertId, message: 'Booking created successfully' });
    }
  });
});

// Announcements routes
app.get('/api/announcements', (req, res) => {
  const userId = String(req.query.user_id || '');
  const query = `
    SELECT a.id, a.title, a.content, a.type, a.date, a.image,
           COALESCE(al.likes, 0) AS likes,
           COUNT(c.id) AS commentCount, a.created_at
    FROM announcements a
    LEFT JOIN announcement_comments c ON c.announcement_id = a.id
    LEFT JOIN (
      SELECT announcement_id, COUNT(*) AS likes FROM announcement_likes GROUP BY announcement_id
    ) al ON al.announcement_id = a.id
    GROUP BY a.id
    ORDER BY a.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching announcements:', err);
      res.status(500).json({ error: err.message });
    } else {
      const formatted = (results || []).map((post) => ({
        ...post,
        likes: post.likes ?? 0,
        commentCount: Number(post.commentCount || 0),
        userLiked: false,
      }));

      if (!userId || formatted.length === 0) {
        return res.json(formatted);
      }

      db.query('SELECT announcement_id AS announcementId FROM announcement_likes WHERE user_id = $1', [userId], (likeErr, likeResults) => {
        if (likeErr) {
          console.error('Error checking announcement likes for user:', likeErr);
          return res.status(500).json({ error: likeErr.message });
        }
        const likedSet = new Set((likeResults || []).map((row) => row.announcementId));
        res.json(
          formatted.map((post) => ({
            ...post,
            userLiked: likedSet.has(post.id),
          }))
        );
      });
    }
  });
});

app.post('/api/announcements/:id/like', (req, res) => {
  const { id } = req.params;
  const userId = String(req.body.userId || '');

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const insertQuery = 'INSERT INTO announcement_likes (announcement_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING';
  db.query(insertQuery, [id, userId], (err) => {
    if (err) {
      console.error('Error liking announcement:', err);
      return res.status(500).json({ error: err.message });
    }
    db.query('SELECT COUNT(*) AS likes FROM announcement_likes WHERE announcement_id = ?', [id], (selectErr, results) => {
      if (selectErr) {
        console.error('Error fetching announcement likes:', selectErr);
        return res.status(500).json({ error: selectErr.message });
      }
      const likes = Number(results?.[0]?.likes || 0);
      res.json({ likes, userLiked: true });
    });
  });
});

app.delete('/api/announcements/:id/like', (req, res) => {
  const { id } = req.params;
  const userId = String(req.query.user_id || '');

  if (!userId) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  db.query('DELETE FROM announcement_likes WHERE announcement_id = $1 AND user_id = $2', [id, userId], (err) => {
    if (err) {
      console.error('Error unliking announcement:', err);
      return res.status(500).json({ error: err.message });
    }
    db.query('SELECT COUNT(*) AS likes FROM announcement_likes WHERE announcement_id = ?', [id], (selectErr, results) => {
      if (selectErr) {
        console.error('Error fetching announcement likes:', selectErr);
        return res.status(500).json({ error: selectErr.message });
      }
      const likes = Number(results?.[0]?.likes || 0);
      res.json({ likes, userLiked: false });
    });
  });
});

app.post('/api/announcements/:id/comments', (req, res) => {
  const { id } = req.params;
  const { userId = '0', user = 'Guest', text, parentCommentId = null } = req.body || {};

  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: 'Comment text is required' });
  }

  const insertQuery = 'INSERT INTO announcement_comments (announcement_id, parent_comment_id, user_id, user, text) VALUES ($1, $2, $3, $4, $5)';
  db.query(insertQuery, [id, parentCommentId, String(userId), String(user).trim(), String(text).trim()], (err, result) => {
    if (err) {
      console.error('Error creating announcement comment:', err);
      return res.status(500).json({ error: err.message });
    }
    const comment = {
      id: result.insertId,
      announcementId: Number(id),
      parentCommentId: parentCommentId ? Number(parentCommentId) : null,
      user: String(user).trim(),
      userId: String(userId),
      text: String(text).trim(),
      likeCount: 0,
      likedByCurrentUser: false,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      children: [],
    };
    res.json({ comment });
  });
});

app.get('/api/announcements/:id/comments', (req, res) => {
  const { id } = req.params;
  const userId = String(req.query.user_id || '');

  const baseQuery = `
    SELECT c.id,
           c.announcement_id AS announcementId,
           c.parent_comment_id AS parentCommentId,
           c.user,
           c.user_id AS userId,
           c.text,
           CAST(DATE_FORMAT(c.created_at, "%Y-%m-%d %H:%i:%s") AS CHAR) AS created_at,
           COALESCE(cl.likeCount, 0) AS likeCount,
           COALESCE(clu.likedByUser, 0) AS likedByCurrentUser
    FROM announcement_comments c
    LEFT JOIN (
      SELECT comment_id, COUNT(*) AS likeCount FROM announcement_comment_likes GROUP BY comment_id
    ) cl ON cl.comment_id = c.id
    LEFT JOIN (
      SELECT comment_id, 1 AS likedByUser FROM announcement_comment_likes WHERE user_id = ?
    ) clu ON clu.comment_id = c.id
    WHERE c.announcement_id = ?
    ORDER BY c.created_at ASC
  `;

  db.query(baseQuery, [userId, id], (err, results) => {
    if (err) {
      console.error('Error fetching announcement comments:', err);
      return res.status(500).json({ error: err.message });
    }

    const comments = (results || []).map((comment) => ({
      ...comment,
      likedByCurrentUser: Boolean(comment.likedByCurrentUser),
      likeCount: Number(comment.likeCount || 0),
      parentCommentId: comment.parentCommentId ? Number(comment.parentCommentId) : null,
      children: [],
    }));

    const commentMap = new Map();
    comments.forEach((comment) => commentMap.set(comment.id, comment));
    const nestedComments = [];

    comments.forEach((comment) => {
      if (comment.parentCommentId && commentMap.has(comment.parentCommentId)) {
        commentMap.get(comment.parentCommentId).children.push(comment);
      } else {
        nestedComments.push(comment);
      }
    });

    res.json({ comments: nestedComments });
  });
});

app.post('/api/announcements/comments/:commentId/like', (req, res) => {
  const { commentId } = req.params;
  const userId = String(req.body.userId || '');

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const insertQuery = 'INSERT INTO announcement_comment_likes (comment_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING';
  db.query(insertQuery, [commentId, userId], (err) => {
    if (err) {
      console.error('Error liking comment:', err);
      return res.status(500).json({ error: err.message });
    }
    db.query('SELECT COUNT(*) AS likeCount FROM announcement_comment_likes WHERE comment_id = ?', [commentId], (selectErr, results) => {
      if (selectErr) {
        console.error('Error fetching comment likes:', selectErr);
        return res.status(500).json({ error: selectErr.message });
      }
      const likeCount = Number(results?.[0]?.likeCount || 0);
      res.json({ likeCount, likedByCurrentUser: true });
    });
  });
});

app.delete('/api/announcements/comments/:commentId/like', (req, res) => {
  const { commentId } = req.params;
  const userId = String(req.query.user_id || '');

  if (!userId) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  db.query('DELETE FROM announcement_comment_likes WHERE comment_id = $1 AND user_id = $2', [commentId, userId], (err) => {
    if (err) {
      console.error('Error unliking comment:', err);
      return res.status(500).json({ error: err.message });
    }
    db.query('SELECT COUNT(*) AS likeCount FROM announcement_comment_likes WHERE comment_id = ?', [commentId], (selectErr, results) => {
      if (selectErr) {
        console.error('Error fetching comment likes:', selectErr);
        return res.status(500).json({ error: selectErr.message });
      }
      const likeCount = Number(results?.[0]?.likeCount || 0);
      res.json({ likeCount, likedByCurrentUser: false });
    });
  });
});

app.delete('/api/announcements/:id/comments/:commentId', (req, res) => {
  const { id, commentId } = req.params;
  const userId = String(req.query.user_id || '');

  if (!userId) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  db.query('SELECT user_id FROM announcement_comments WHERE id = $1', [commentId], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error checking comment ownership:', checkErr);
      return res.status(500).json({ error: checkErr.message });
    }

    if (!checkResults || checkResults.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const commentUserId = String(checkResults[0].user_id || '');
    if (commentUserId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    db.query('DELETE FROM announcement_comment_likes WHERE comment_id IN (SELECT id FROM announcement_comments WHERE id = $1 OR parent_comment_id = $2)', [commentId, commentId], (deletelikesErr) => {
      if (deletelikesErr) {
        console.error('Error deleting comment likes:', deletelikesErr);
        return res.status(500).json({ error: deletelikesErr.message });
      }

      db.query('DELETE FROM announcement_comments WHERE id = $1 OR parent_comment_id = $2', [commentId, commentId], (deleteErr) => {
        if (deleteErr) {
          console.error('Error deleting comment:', deleteErr);
          return res.status(500).json({ error: deleteErr.message });
        }
        res.json({ message: 'Comment deleted successfully' });
      });
    });
  });
});

app.post('/api/announcements', upload.any(), (req, res) => {
  const body = req.body || {};
  const file = Array.isArray(req.files) ? req.files.find((file) => file.fieldname === 'image') : null;
  const title = String(body.title || '').trim();
  const content = String(body.content || '').trim();
  const type = String(body.type || 'announcement').trim();
  const date = String(body.date || '').trim();

  const imagePath = file ? `/assets/uploads/${file.filename}` : String(body.image || '').trim();

  console.log('POST /api/announcements', { title, content, type, date, imagePath, hasFile: Boolean(file), bodyKeys: Object.keys(body) });

  db.query('INSERT INTO announcements (title, content, type, date, image) VALUES ($1, $2, $3, $4, $5)', [title, content, type, date || null, imagePath], (err, result) => {
    if (err) {
      console.error('Error creating announcement:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: result.insertId, message: 'Announcement created successfully' });
  });
});

app.get('/api/donations', (req, res) => {
  db.query('SELECT id, user_id, donation_type, amount, payment_method, message, proof_file_name, to_char(created_at, \'YYYY-MM-DD HH24:MI:SS\') as created_at FROM donations ORDER BY created_at DESC', (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(results);
    }
  });
});

app.post('/api/donations', (req, res) => {
  const { user_id, donation_type, amount, payment_method, message, proof_file_name } = req.body;
  const query = 'INSERT INTO donations (user_id, donation_type, amount, payment_method, message, proof_file_name) VALUES ($1, $2, $3, $4, $5, $6)';
  db.query(query, [user_id, donation_type, amount, payment_method, message || '', proof_file_name || ''], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ id: result.insertId, message: 'Donation submitted successfully' });
    }
  });
});

app.put('/api/donations/:id', (req, res) => {
  const { id } = req.params;
  const { user_id, donation_type, amount, payment_method, message, proof_file_name } = req.body;
  const query = 'UPDATE donations SET user_id = $1, donation_type = $2, amount = $3, payment_method = $4, message = $5, proof_file_name = $6 WHERE id = $7';
  db.query(query, [user_id, donation_type, amount, payment_method, message || '', proof_file_name || '', id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: 'Donation updated successfully' });
    }
  });
});

app.delete('/api/donations/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM donations WHERE id = $1', [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: 'Donation deleted successfully' });
    }
  });
});

const parseJSONField = (value) => {
  if (value === null || value === undefined) return [];
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return [];
    }
  }
  return value;
};

app.get('/api/services', (req, res) => {
  db.query(
    'SELECT id, name, description, category, price, processing_time as processingTime, requirements, image, form_path as formPath, form_name as formName, form_fields as formFields FROM services ORDER BY name',
    (err, results) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        const formatted = results.map((service) => ({
          ...service,
          requirements: parseJSONField(service.requirements),
          formFields: parseJSONField(service.formFields),
        }));
        res.json(formatted);
      }
    }
  );
});

app.post('/api/services', upload.any(), (req, res) => {
  const { name, description, category, price, processingTime, requirements, formPath, formName, formFields } = req.body || {};
  const parsedRequirements = parseJSONField(requirements);
  const parsedFormFields = parseJSONField(formFields);
  const file = Array.isArray(req.files) ? req.files.find((file) => file.fieldname === 'image') : null;
  const imagePath = file ? `/assets/uploads/${file.filename}` : (req.body?.image || '');
  const query = 'INSERT INTO services (name, description, category, price, processing_time, requirements, image, form_path, form_name, form_fields) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)';
  db.query(
    query,
    [name, description, category, price, processingTime, JSON.stringify(parsedRequirements), imagePath, formPath || '', formName || '', JSON.stringify(parsedFormFields)],
    (err, result) => {
      if (err) {
        console.error('Service create error:', err, { body: req.body, files: req.files });
        res.status(500).json({ error: err.message });
      } else {
        res.json({ id: result.insertId, message: 'Service created successfully' });
      }
    }
  );
});

app.put('/api/services/:id', upload.any(), (req, res) => {
  const { id } = req.params;
  const { name, description, category, price, processingTime, requirements, formPath, formName, formFields } = req.body || {};
  const parsedRequirements = parseJSONField(requirements);
  const parsedFormFields = parseJSONField(formFields);
  const file = Array.isArray(req.files) ? req.files.find((file) => file.fieldname === 'image') : null;
  const imagePath = file ? `/assets/uploads/${file.filename}` : (req.body?.image || '');
  const query = 'UPDATE services SET name = $1, description = $2, category = $3, price = $4, processing_time = $5, requirements = $6, image = $7, form_path = $8, form_name = $9, form_fields = $10 WHERE id = $11';
  db.query(
    query,
    [name, description, category, price, processingTime, JSON.stringify(parsedRequirements), imagePath, formPath || '', formName || '', JSON.stringify(parsedFormFields), id],
    (err) => {
      if (err) {
        console.error('Service update error:', err, { body: req.body, files: req.files });
        res.status(500).json({ error: err.message });
      } else {
        res.json({ message: 'Service updated successfully' });
      }
    }
  );
});

app.delete('/api/services/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM services WHERE id = $1', [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: 'Service deleted successfully' });
    }
  });
});

app.get('/api/souvenirs', (req, res) => {
  db.query('SELECT id, name, description, price, stock, image FROM souvenirs ORDER BY name', (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(results);
    }
  });
});

app.post('/api/souvenirs', upload.any(), (req, res) => {
  const { name, description, price, stock } = req.body || {};
  const file = Array.isArray(req.files) ? req.files.find((file) => file.fieldname === 'image') : null;
  const imagePath = file ? `/assets/uploads/${file.filename}` : (req.body?.image || '');
  
  const query = 'INSERT INTO souvenirs (name, description, price, stock, image) VALUES ($1, $2, $3, $4, $5)';
  db.query(query, [name, description, price, stock, imagePath], (err, result) => {
    if (err) {
      console.error('Souvenir create error:', err, { body: req.body, files: req.files });
      res.status(500).json({ error: err.message });
    } else {
      res.json({ id: result.insertId, message: 'Souvenir created successfully' });
    }
  });
});

app.put('/api/souvenirs/:id', upload.any(), (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock } = req.body || {};
  const file = Array.isArray(req.files) ? req.files.find((file) => file.fieldname === 'image') : null;
  const imagePath = file ? `/assets/uploads/${file.filename}` : (req.body?.image || '');
  
  const query = 'UPDATE souvenirs SET name = $1, description = $2, price = $3, stock = $4, image = $5 WHERE id = $6';
  db.query(query, [name, description, price, stock, imagePath, id], (err) => {
    if (err) {
      console.error('Souvenir update error:', err, { body: req.body, files: req.files });
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: 'Souvenir updated successfully' });
    }
  });
});

app.delete('/api/souvenirs/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM souvenirs WHERE id = $1', [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: 'Souvenir deleted successfully' });
    }
  });
});

app.get('/api/mass-schedules', (req, res) => {
  db.query(
    'SELECT id, mass_day AS massDay, mass_time AS massTime, CAST(date AS DATE)::TEXT as date, status, collectors, lectors, eucharistic_ministers AS eucharisticMinisters, altar_servers AS altarServers, choir_leader AS choirLeader, ushers FROM mass_schedules ORDER BY date, mass_time',
    (err, results) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        const formatted = results.map((schedule) => ({
          ...schedule,
          collectors: parseJSONField(schedule.collectors),
          lectors: parseJSONField(schedule.lectors),
          eucharisticMinisters: parseJSONField(schedule.eucharisticMinisters),
          altarServers: parseJSONField(schedule.altarServers),
          ushers: parseJSONField(schedule.ushers),
        }));
        res.json(formatted);
      }
    }
  );
});

app.post('/api/mass-schedules', (req, res) => {
  const { massDay, massTime, date, status, collectors, lectors, eucharisticMinisters, altarServers, choirLeader, ushers } = req.body;
  const query = 'INSERT INTO mass_schedules (mass_day, mass_time, date, status, collectors, lectors, eucharistic_ministers, altar_servers, choir_leader, ushers) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)';
  db.query(
    query,
    [massDay, massTime, date, status, JSON.stringify(collectors || []), JSON.stringify(lectors || []), JSON.stringify(eucharisticMinisters || []), JSON.stringify(altarServers || []), choirLeader || '', JSON.stringify(ushers || [])],
    (err, result) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ id: result.insertId, message: 'Mass schedule created successfully' });
      }
    }
  );
});

app.put('/api/mass-schedules/:id', (req, res) => {
  const { id } = req.params;
  const { massDay, massTime, date, status, collectors, lectors, eucharisticMinisters, altarServers, choirLeader, ushers } = req.body;
  const query = 'UPDATE mass_schedules SET mass_day = ?, mass_time = ?, date = ?, status = ?, collectors = ?, lectors = ?, eucharistic_ministers = ?, altar_servers = ?, choir_leader = ?, ushers = ? WHERE id = ?';
  db.query(
    query,
    [massDay, massTime, date, status, JSON.stringify(collectors || []), JSON.stringify(lectors || []), JSON.stringify(eucharisticMinisters || []), JSON.stringify(altarServers || []), choirLeader || '', JSON.stringify(ushers || []), id],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ message: 'Mass schedule updated successfully' });
      }
    }
  );
});

app.delete('/api/mass-schedules/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM mass_schedules WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: 'Mass schedule deleted successfully' });
    }
  });
});

app.get('/api/messages', (req, res) => {
  const userId = req.query.user_id;
  
  if (!userId) {
    // Admin view: fetch all messages with user names
    const query = `
      SELECT 
        m.id, 
        m.user_id AS userId, 
        u.name AS userName,
        u.email AS userEmail,
        m.text, 
        m.sender, 
        DATE_FORMAT(m.timestamp, "%Y-%m-%dT%H:%i:%s") as timestamp 
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.id
      ORDER BY m.timestamp DESC
    `;
    db.query(query, (err, results) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(results);
      }
    });
  } else {
    // User view: fetch messages for specific user
    const query = 'SELECT id, user_id AS userId, text, sender, DATE_FORMAT(timestamp, "%Y-%m-%dT%H:%i:%s") as timestamp FROM messages WHERE user_id = ? ORDER BY timestamp ASC';
    db.query(query, [userId], (err, results) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(results);
      }
    });
  }
});

app.post('/api/messages', (req, res) => {
  const { user_id, sender, text } = req.body;
  const query = 'INSERT INTO messages (user_id, sender, text) VALUES (?, ?, ?)';
  db.query(query, [user_id, sender, text], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ id: result.insertId, message: 'Message saved successfully' });
    }
  });
});

app.put('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const query = 'UPDATE bookings SET status = ? WHERE id = ?';
  db.query(query, [status, id], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: 'Booking status updated successfully' });
    }
  });
});

// Upload documents for booking
app.post('/api/bookings/upload-documents', upload.any(), (req, res) => {
  const { bookingId } = req.body;
  const files = req.files || [];

  if (!bookingId || files.length === 0) {
    return res.status(400).json({ error: 'Booking ID and files are required' });
  }

  try {
    // Get current documents
    db.query('SELECT documents FROM bookings WHERE id = ?', [bookingId], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      
      let currentDocs = [];
      if (results.length > 0 && results[0].documents) {
        try {
          currentDocs = JSON.parse(results[0].documents);
        } catch (e) {
          currentDocs = [];
        }
      }

      // Add new files
      const newDocs = files.map(file => `/assets/uploads/documents/${file.filename}`);
      const allDocs = [...currentDocs, ...newDocs];

      // Update booking with new documents
      const updateQuery = 'UPDATE bookings SET documents = ? WHERE id = ?';
      db.query(updateQuery, [JSON.stringify(allDocs), bookingId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ 
          message: 'Documents uploaded successfully',
          documents: allDocs,
          count: allDocs.length
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/announcements/:id', upload.any(), (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  const file = Array.isArray(req.files) ? req.files.find((file) => file.fieldname === 'image') : null;
  const title = String(body.title || '').trim();
  const content = String(body.content || '').trim();
  const type = String(body.type || 'announcement').trim();
  const date = String(body.date || '').trim();
  const image = String(body.image || '').trim();

  const imagePath = file ? `/assets/uploads/${file.filename}` : image;

  console.log('PUT /api/announcements/:id', { id, title, content, type, date, imagePath, hasFile: Boolean(file), bodyKeys: Object.keys(body) });

  const updateQuery = `UPDATE announcements SET title=?, content=?, type=?, date=?, image=? WHERE id=?`;

  db.query(updateQuery, [title, content, type, date || null, imagePath, id], (err) => {
    if (err) {
      console.error('Error updating announcement:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Announcement updated successfully' });
  });
});

app.delete('/api/announcements/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM announcements WHERE id = ?', [id], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: 'Announcement deleted successfully' });
    }
  });
});

// Global error handler to return JSON for uncaught errors
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  if (res.headersSent) {
    return next(err);
  }
  const statusCode = err.status || 500;
  res.status(statusCode).json({ error: err.message || 'Internal Server Error' });
});

// JSON error handler for all routes
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Organization Members Endpoints
app.get('/api/org-members', (req, res) => {
  const query = 'SELECT id, name, position, department, email, phone, photo, level, parent_id AS parentId FROM org_members ORDER BY level ASC, name ASC';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(results);
    }
  });
});

app.post('/api/org-members', (req, res) => {
  const { name, position, department, email, phone, photo, level, parentId } = req.body;
  const query = 'INSERT INTO org_members (name, position, department, email, phone, photo, level, parent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(query, [name, position, department, email || null, phone || null, photo || null, level, parentId || null], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ id: result.insertId, message: 'Member added successfully' });
    }
  });
});

app.put('/api/org-members/:id', (req, res) => {
  const { id } = req.params;
  const { name, position, department, email, phone, photo, level, parentId } = req.body;
  const query = 'UPDATE org_members SET name = ?, position = ?, department = ?, email = ?, phone = ?, photo = ?, level = ?, parent_id = ? WHERE id = ?';
  db.query(query, [name, position, department, email || null, phone || null, photo || null, level, parentId || null, id], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: 'Member updated successfully' });
    }
  });
});

app.delete('/api/org-members/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM org_members WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: 'Member deleted successfully' });
    }
  });
});

// Users endpoint
app.get('/api/users', (req, res) => {
  const query = 'SELECT id, name, email, role, is_verified, phone, address FROM users';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(results);
    }
  });
});

// Delete user endpoint
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  
  // First, delete all bookings related to this user
  const deleteBookingsQuery = 'DELETE FROM bookings WHERE user_id = ?';
  db.query(deleteBookingsQuery, [id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete user bookings: ' + err.message });
    }
    
    // Then delete donations
    const deleteDonationsQuery = 'DELETE FROM donations WHERE user_id = ?';
    db.query(deleteDonationsQuery, [id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete user donations: ' + err.message });
      }
      
      // Finally delete the user
      const deleteUserQuery = 'DELETE FROM users WHERE id = ?';
      db.query(deleteUserQuery, [id], (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete user: ' + err.message });
        }
        
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User deleted successfully', userId: id });
      });
    });
  });
});

// ===== CAROUSEL ENDPOINTS =====

// Get all carousel images (active ones)
app.get('/api/carousel', (req, res) => {
  const query = 'SELECT id, title, description, image_path, order_position FROM carousel_images WHERE is_active = 1 ORDER BY order_position ASC';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(results);
    }
  });
});

// Get all carousel images for admin (including inactive)
app.get('/api/carousel/admin/all', (req, res) => {
  const query = 'SELECT id, title, description, image_path, order_position, is_active, created_at FROM carousel_images ORDER BY order_position ASC';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(results);
    }
  });
});

// Add new carousel image
app.post('/api/carousel', upload.single('image'), (req, res) => {
  const { title, description, orderPosition } = req.body;
  const imagePath = req.file ? `/assets/uploads/carousel/${req.file.filename}` : null;

  if (!imagePath) {
    return res.status(400).json({ error: 'Image file is required' });
  }

  const query = 'INSERT INTO carousel_images (title, description, image_path, order_position, is_active) VALUES (?, ?, ?, ?, 1)';
  db.query(query, [title || '', description || '', imagePath, orderPosition || 0], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ id: result.insertId, message: 'Carousel image added successfully' });
    }
  });
});

// Update carousel image
app.put('/api/carousel/:id', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title, description, orderPosition, isActive } = req.body;
  
  // First get existing image to keep it if no new image is uploaded
  const getQuery = 'SELECT image_path FROM carousel_images WHERE id = ?';
  db.query(getQuery, [id], (getErr, getResults) => {
    if (getErr) {
      return res.status(500).json({ error: getErr.message });
    }

    if (!getResults || getResults.length === 0) {
      return res.status(404).json({ error: 'Carousel image not found' });
    }

    const imagePath = req.file ? `/assets/uploads/carousel/${req.file.filename}` : getResults[0].image_path;
    const query = 'UPDATE carousel_images SET title = ?, description = ?, image_path = ?, order_position = ?, is_active = ? WHERE id = ?';
    
    db.query(query, [title || '', description || '', imagePath, orderPosition || 0, isActive ? 1 : 0, id], (updateErr) => {
      if (updateErr) {
        res.status(500).json({ error: updateErr.message });
      } else {
        res.json({ message: 'Carousel image updated successfully' });
      }
    });
  });
});

// Delete carousel image
app.delete('/api/carousel/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM carousel_images WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Carousel image not found' });
    } else {
      res.json({ message: 'Carousel image deleted successfully' });
    }
  });
});

// Serve document files
app.get('/api/documents/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, `../assets/uploads/documents/${filename}`);
    
    // Security: prevent directory traversal
    if (!filepath.startsWith(path.join(__dirname, `../assets/uploads/documents`))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.download(filepath, (err) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.status(404).json({ error: 'Document not found' });
        } else {
          console.error('Download error:', err);
          res.status(500).json({ error: 'Download failed' });
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});