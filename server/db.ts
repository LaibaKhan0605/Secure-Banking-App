/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Configuration
let rawUri = (process.env.MONGODB_URI || '').trim();
if (rawUri.startsWith('"') && rawUri.endsWith('"')) {
  rawUri = rawUri.slice(1, -1).trim();
} else if (rawUri.startsWith("'") && rawUri.endsWith("'")) {
  rawUri = rawUri.slice(1, -1).trim();
}
const MONGODB_URI = rawUri;
let isUsingMongoDB = false;

// Real Mongoose schemas (if connected)
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
  isLocked: { type: Boolean, default: false },
  failedAttempts: { type: Number, default: 0 },
  apiKey: { type: String }
});

const TransactionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['deposit', 'withdrawal', 'transfer'], required: true },
  recipient: { type: String },
  status: { type: String, enum: ['completed', 'pending', 'flagged'], default: 'completed' },
  timestamp: { type: Date, default: Date.now },
  isSuspicious: { type: Boolean, default: false }
});

const SecurityLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  eventType: { type: String, required: true },
  severity: { type: String, enum: ['INFO', 'WARNING', 'HIGH', 'CRITICAL'], default: 'INFO' },
  message: { type: String, required: true },
  ipAddress: { type: String, required: true },
  endpoint: { type: String, required: true },
  userAgent: { type: String },
  payload: { type: String }
});

const SecurityAlertSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  title: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ['INFO', 'WARNING', 'HIGH', 'CRITICAL'], default: 'INFO' },
  status: { type: String, enum: ['OPEN', 'RESOLVED', 'INVESTIGATING'], default: 'OPEN' },
  attackType: { type: String },
  triggeredBy: { type: String }
});

export let UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export let TransactionModel = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
export let SecurityLogModel = mongoose.models.SecurityLog || mongoose.model('SecurityLog', SecurityLogSchema);
export let SecurityAlertModel = mongoose.models.SecurityAlert || mongoose.model('SecurityAlert', SecurityAlertSchema);

// In-Memory Fallback Store (Developer Sandbox)
interface MemoryDb {
  users: any[];
  transactions: any[];
  securityLogs: any[];
  securityAlerts: any[];
  apiCount: number;
}

const memoryDb: MemoryDb = {
  users: [],
  transactions: [],
  securityLogs: [],
  securityAlerts: [],
  apiCount: 1540 // starting benchmark
};

// Seed initial memory data
async function seedInitialData() {
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('AdminPass123!', salt);
  const userHash = bcrypt.hashSync('UserPass123!', salt);

  // Users
  const adminUser = {
    _id: 'u_admin_id',
    username: 'admin',
    email: 'admin@bank.secure',
    passwordHash: adminHash,
    role: 'admin',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
    isLocked: false,
    failedAttempts: 0,
    apiKey: 'sb_apiKey_admin_secure_98324'
  };

  const normalUser = {
    _id: 'u_normal_id',
    username: 'user',
    email: 'user@bank.secure',
    passwordHash: userHash,
    role: 'user',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    isLocked: false,
    failedAttempts: 0,
    apiKey: 'sb_apiKey_user_secure_12874'
  };

  const attackerUser = {
    _id: 'u_locked_id',
    username: 'culprit',
    email: 'culprit@hacker.io',
    passwordHash: bcrypt.hashSync('hackedyou!', salt),
    role: 'user',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
    isLocked: true,
    failedAttempts: 6,
    apiKey: 'sb_apiKey_untr_88231'
  };

  memoryDb.users = [adminUser, normalUser, attackerUser];

  // Transactions
  memoryDb.transactions = [
    {
      _id: 't1',
      userId: 'u_normal_id',
      username: 'user',
      amount: 1500.00,
      type: 'deposit',
      recipient: '',
      status: 'completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
      isSuspicious: false
    },
    {
      _id: 't2',
      userId: 'u_normal_id',
      username: 'user',
      amount: 45.30,
      type: 'transfer',
      recipient: 'grocery_store_outlet',
      status: 'completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
      isSuspicious: false
    },
    {
      _id: 't3',
      userId: 'u_normal_id',
      username: 'user',
      amount: 85000.00,
      type: 'transfer',
      recipient: 'offshore_account_hacker',
      status: 'flagged',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      isSuspicious: true
    },
    {
      _id: 't4',
      userId: 'u_admin_id',
      username: 'admin',
      amount: 10000.00,
      type: 'deposit',
      recipient: '',
      status: 'completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      isSuspicious: false
    }
  ];

  // Security Logs
  memoryDb.securityLogs = [
    {
      _id: 'l1',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      eventType: 'AUTH_SUCCESS',
      severity: 'INFO',
      message: 'Admin successfully authenticated from authorized workstation',
      ipAddress: '192.168.1.100',
      endpoint: '/api/auth/login',
      userAgent: 'Mozilla/5.0 SecureAgent/1.0'
    },
    {
      _id: 'l2',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18),
      eventType: 'XSS_ATTEMPT',
      severity: 'HIGH',
      message: 'WAF Blocked Reflected XSS Inject attempt in search parameters',
      ipAddress: '10.0.4.15',
      endpoint: '/api/users?search=<script>alert("hack")</script>',
      userAgent: 'Mozilla/5.0 curl/7.68.0',
      payload: '<script>alert("hack")</script>'
    },
    {
      _id: 'l3',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      eventType: 'AUTH_FAILURE',
      severity: 'WARNING',
      message: 'Failed login attempt for user admin. Incorrect passwords entered.',
      ipAddress: '198.51.100.77',
      endpoint: '/api/auth/login',
      userAgent: 'Hydra/9.5 SSH-Bruteforcer',
    },
    {
      _id: 'l4',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4.9),
      eventType: 'AUTH_FAILURE',
      severity: 'WARNING',
      message: 'Failed login attempt for user admin. Incorrect passwords entered.',
      ipAddress: '198.51.100.77',
      endpoint: '/api/auth/login',
      userAgent: 'Hydra/9.5 SSH-Bruteforcer',
    },
    {
      _id: 'l5',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4.8),
      eventType: 'AUTH_FAILURE',
      severity: 'WARNING',
      message: 'Failed login attempt for user admin. Incorrect passwords entered.',
      ipAddress: '198.51.100.77',
      endpoint: '/api/auth/login',
      userAgent: 'Hydra/9.5 SSH-Bruteforcer',
    },
    {
      _id: 'l6',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4.7),
      eventType: 'AUTH_FAILURE',
      severity: 'WARNING',
      message: 'Failed login attempt for user admin. Incorrect passwords entered.',
      ipAddress: '198.51.100.77',
      endpoint: '/api/auth/login',
      userAgent: 'Hydra/9.5 SSH-Bruteforcer',
    },
    {
      _id: 'l7',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4.6),
      eventType: 'USER_LOCKED',
      severity: 'CRITICAL',
      message: 'Intrusion Detected: admin account locked. 5 failed password attempts exceeded.',
      ipAddress: '198.51.100.77',
      endpoint: '/api/auth/login',
      userAgent: 'Hydra/9.5 SSH-Bruteforcer',
    },
    {
      _id: 'l8',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      eventType: 'SQL_INJECTION',
      severity: 'CRITICAL',
      message: 'WAF Intercept: Active SQL Injection payload block on transaction search',
      ipAddress: '45.33.22.11',
      endpoint: '/api/transactions?search=\' OR 1=1 --',
      userAgent: 'sqlmap/1.6.4',
      payload: "' OR 1=1 --"
    }
  ];

  // Security Alerts
  memoryDb.securityAlerts = [
    {
      _id: 'a1',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4.6),
      title: 'Brute force login threshold exceeded',
      description: 'IP 198.51.100.77 performed 5+ consecutive password failures prompting account lockdown on target [admin].',
      severity: 'HIGH',
      status: 'OPEN',
      attackType: 'Brute Force / Credential Stuffing',
      triggeredBy: 'Security Engine (Ruleset V1)'
    },
    {
      _id: 'a2',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      title: 'SQL Injection detected & blocked',
      description: 'WAF blocked structured SQLMap probe attempting bypass queries (`\' OR 1=1 --`) inside request routing.',
      severity: 'CRITICAL',
      status: 'OPEN',
      attackType: 'SQL Injection (OWASP A03:2021)',
      triggeredBy: 'Web Application Firewall'
    }
  ];
}

// Global Connection Initializer (fails safely)
export async function initializeDatabase(): Promise<{ success: boolean; type: string }> {
  await seedInitialData();

  const isValidScheme = MONGODB_URI.startsWith('mongodb://') || MONGODB_URI.startsWith('mongodb+srv://');

  if (MONGODB_URI && isValidScheme) {
    try {
      console.log('Attempting to connect to MongoDB server...', MONGODB_URI.substring(0, 30) + '...');
      // Enforce timeout so it doesn't hang startup
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 3000
      });
      isUsingMongoDB = true;
      console.log('✅ Successfully connected to MongoDB database!');

      // Populate MongoDB from memory seed if collections are empty
      try {
        const uCount = await UserModel.countDocuments();
        if (uCount === 0) {
          console.log('[Seeding] Migration of in-memory seeds to MongoDB...');
          await UserModel.insertMany(memoryDb.users);
          await TransactionModel.insertMany(memoryDb.transactions);
          await SecurityLogModel.insertMany(memoryDb.securityLogs);
          await SecurityAlertModel.insertMany(memoryDb.securityAlerts);
        }
      } catch (err: any) {
        console.warn('[Seeding Warning] Failed migrating data to Mongo:', err.message);
      }

      return { success: true, type: 'MongoDB' };
    } catch (e: any) {
      console.log('ℹ️ MongoDB Connection failed (server offline). Switching to robust local In-Memory Sandbox Mode.', e.message);
    }
  } else {
    console.log('ℹ️ No valid MONGODB_URI scheme defined in environment. Launching in-memory developer platform.');
  }

  isUsingMongoDB = false;
  return { success: true, type: 'In-Memory (Developer Sandbox)' };
}

// Database Operations Facade (unified Mongo / Memory API)
export const db = {
  isMongo: (): boolean => isUsingMongoDB,

  // User Operations
  users: {
    find: async (query: any = {}) => {
      if (isUsingMongoDB) return await UserModel.find(query);
      return memoryDb.users.filter(u => {
        for (const k in query) {
          if (u[k] !== query[k]) return false;
        }
        return true;
      });
    },

    findOne: async (query: any) => {
      if (isUsingMongoDB) return await UserModel.findOne(query);
      return memoryDb.users.find(u => {
        for (const k in query) {
          if (u[k] !== query[k]) return false;
        }
        return true;
      }) || null;
    },

    create: async (data: any) => {
      if (isUsingMongoDB) {
        const doc = await UserModel.create({ ...data, createdAt: new Date() });
        return doc.toObject();
      }
      const newU = {
        _id: 'u_' + Math.random().toString(36).substr(2, 9),
        ...data,
        createdAt: new Date(),
        isLocked: false,
        failedAttempts: 0,
        apiKey: 'sb_apiKey_' + Math.random().toString(36).substr(2, 10)
      };
      memoryDb.users.push(newU);
      return newU;
    },

    updateOne: async (filter: any, update: any) => {
      if (isUsingMongoDB) {
        return await UserModel.updateOne(filter, update);
      }
      const userIdx = memoryDb.users.findIndex(u => {
        for (const k in filter) {
          if (u[k] !== filter[k]) return false;
        }
        return true;
      });
      if (userIdx === -1) return { nModified: 0 };
      
      const setVal = update.$set || update;
      const incVal = update.$inc;
      
      if (setVal) {
        memoryDb.users[userIdx] = { ...memoryDb.users[userIdx], ...setVal };
      }
      if (incVal) {
        for (const k in incVal) {
          memoryDb.users[userIdx][k] = (memoryDb.users[userIdx][k] || 0) + incVal[k];
        }
      }
      return { nModified: 1 };
    },

    deleteOne: async (filter: any) => {
      if (isUsingMongoDB) return await UserModel.deleteOne(filter);
      const startLen = memoryDb.users.length;
      memoryDb.users = memoryDb.users.filter(u => {
        for (const k in filter) {
          if (u[k] === filter[k]) return false;
        }
        return true;
      });
      return { deletedCount: startLen - memoryDb.users.length };
    }
  },

  // Transactions Operations
  transactions: {
    find: async (query: any = {}) => {
      if (isUsingMongoDB) return await TransactionModel.find(query).sort({ timestamp: -1 });
      let list = [...memoryDb.transactions];
      if (query.userId) {
        list = list.filter(t => t.userId === query.userId);
      }
      return list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    },

    create: async (data: any) => {
      if (isUsingMongoDB) {
        const doc = await TransactionModel.create({ ...data, timestamp: new Date() });
        return doc.toObject();
      }
      const newT = {
        _id: 't_' + Math.random().toString(36).substr(2, 9),
        ...data,
        timestamp: new Date()
      };
      memoryDb.transactions.push(newT);
      return newT;
    }
  },

  // Security Logs
  securityLogs: {
    find: async (query: any = {}) => {
      if (isUsingMongoDB) return await SecurityLogModel.find(query).sort({ timestamp: -1 }).limit(100);
      let logs = [...memoryDb.securityLogs];
      return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 100);
    },

    create: async (data: any) => {
      if (isUsingMongoDB) {
        const doc = await SecurityLogModel.create({ ...data, timestamp: new Date() });
        return doc.toObject();
      }
      const newL = {
        _id: 'l_' + Math.random().toString(36).substr(2, 9),
        ...data,
        timestamp: new Date()
      };
      memoryDb.securityLogs.push(newL);
      return newL;
    }
  },

  // Security Alerts
  securityAlerts: {
    find: async (query: any = {}) => {
      if (isUsingMongoDB) return await SecurityAlertModel.find(query).sort({ timestamp: -1 });
      let alerts = [...memoryDb.securityAlerts];
      if (query.status) {
        alerts = alerts.filter(a => a.status === query.status);
      }
      return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    },

    create: async (data: any) => {
      if (isUsingMongoDB) {
        const doc = await SecurityAlertModel.create({ ...data, timestamp: new Date() });
        return doc.toObject();
      }
      const newA = {
        _id: 'a_' + Math.random().toString(36).substr(2, 9),
        ...data,
        timestamp: new Date()
      };
      memoryDb.securityAlerts.push(newA);
      return newA;
    },

    updateOne: async (filter: any, update: any) => {
      if (isUsingMongoDB) return await SecurityAlertModel.updateOne(filter, update);
      const idx = memoryDb.securityAlerts.findIndex(a => {
        for (const k in filter) {
          if (a[k] !== filter[k]) return false;
        }
        return true;
      });
      if (idx === -1) return { nModified: 0 };
      const setVal = update.$set || update;
      if (setVal) {
        memoryDb.securityAlerts[idx] = { ...memoryDb.securityAlerts[idx], ...setVal };
      }
      return { nModified: 1 };
    },

    clearAll: async () => {
      if (isUsingMongoDB) {
        await SecurityAlertModel.deleteMany({});
        await SecurityLogModel.deleteMany({});
        return { success: true };
      }
      memoryDb.securityAlerts = [];
      memoryDb.securityLogs = [];
      return { success: true };
    }
  },

  // Global Counter helper
  getApiCount: (): number => {
    return memoryDb.apiCount;
  },

  incrementApiCount: (amount = 1) => {
    memoryDb.apiCount += amount;
  }
};
