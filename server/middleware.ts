/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { logSecurityEvent } from './logger.js';
import rateLimit from 'express-rate-limit';

const JWT_SECRET = process.env.JWT_SECRET || 'SecureBankingSuperSecretJWTKey_2026';

// Extend Express Request types to hold user details
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email: string;
        role: 'admin' | 'user';
      };
      apiKeyUsed?: string;
    }
  }
}

// Global SSE connection registry for live push updates
let sseClients: any[] = [];
export function registerSseClient(res: any) {
  sseClients.push(res);
}
export function removeSseClient(res: any) {
  sseClients = sseClients.filter(c => c !== res);
}
export function pushSseNotification(messageType: 'LOG' | 'ALERT' | 'STATS', data: any) {
  const payload = JSON.stringify({ type: messageType, data });
  sseClients.forEach(client => {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch (e) {
      // clean stale client
    }
  });
}

// 1. Web Application Firewall (WAF) Middleware
export async function wafProtection(req: Request, res: Response, next: NextFunction) {
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
  const endpoint = req.originalUrl || req.url;
  const userAgent = req.headers['user-agent'] || 'unknown';

  // Extract all request payloads to scan
  const queryStr = JSON.stringify(req.query || {});
  const bodyStr = JSON.stringify(req.body || {});
  const paramsStr = JSON.stringify(req.params || {});
  const allPayloads = `${queryStr} | ${bodyStr} | ${paramsStr}`;

  // Injection Signs
  const signatures = [
    {
      regex: /(['"`;]\s*(or|and)\s+['"]?\d['"]?\s*=\s*['"]?\d)|UNION\s+SELECT|xp_cmdshell|OR\s+1\s*=\s*1|SELECT\s+.*\s+FROM/gi,
      type: 'SQL_INJECTION',
      message: 'SQL Injection pattern detected (OWASP Top 10 A03:Injection)'
    },
    {
      regex: /<script.*?>.*?<\/script>|javascript:|onerror\s*=|onload\s*=|alert\s*\(/gi,
      type: 'XSS_ATTEMPT',
      message: 'Cross-Site Scripting (XSS) payload blocked (OWASP Top 10 A03)'
    },
    {
      regex: /\.\.\/|\.\.\\|etc\/passwd|cmd\.exe|bin\/sh/gi,
      type: 'PATH_TRAVERSAL',
      message: 'Directory / Path Traversal or system file read attempt blocked'
    },
    {
      regex: /;\s*rm\s+-|\|\s*bash|&\s*curl/gi,
      type: 'COMMAND_INJECTION',
      message: 'Remote Command Execution / Command Injection signature blocked'
    }
  ];

  for (const sig of signatures) {
    if (sig.regex.test(allPayloads)) {
      // Block! Log the event and alert.
      await logSecurityEvent(
        sig.type,
        'CRITICAL',
        `WAF INTERCEPT: ${sig.message} from IP ${ipAddress}`,
        ipAddress,
        endpoint,
        userAgent,
        { query: req.query, body: req.body }
      );

      // Create a persistent Alarm in our database to reflect on screen
      const alert = await db.securityAlerts.create({
        title: `CRITICAL: Blocked ${sig.type} Attack`,
        description: `WAF intercepted a structural payload signature matching [${sig.type}] targeting resource [${endpoint}]. Connection severed.`,
        severity: 'CRITICAL',
        status: 'OPEN',
        attackType: sig.type,
        triggeredBy: 'Web Application Firewall V1.0'
      });

      // Update API count and push notification immediately
      db.incrementApiCount(1);
      pushSseNotification('ALERT', alert);
      
      // Get updated logs to stream list refresh
      const freshLogs = await db.securityLogs.find({});
      pushSseNotification('LOG', freshLogs[0]);

      return res.status(403).json({
        error: 'Forbidden: Request Blocked',
        message: 'Your system signature triggered our Web Application Firewall (WAF) filtering systems.',
        incidentId: alert._id || 'inc_waf_' + Math.random().toString(36).substr(2, 9),
        details: sig.message,
        timestamp: new Date()
      });
    }
  }

  next();
}

// 2. JWT Authentication Middleware
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  // Check custom headers, standard bearer auth, or cookies
  let token = req.headers['authorization'] as string || req.headers['x-auth-token'] as string;
  
  if (token && token.startsWith('Bearer ')) {
    token = token.slice(7);
  }

  if (!token && req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Authentication token missing' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Check if user account is locked
    const fetchedUser = await db.users.findOne({ _id: decoded.id });
    if (!fetchedUser) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    if (fetchedUser.isLocked) {
      return res.status(403).json({ 
        error: 'Account Locked', 
        message: 'This user account is locked. Please contact your system administrator to clear security alerts.' 
      });
    }

    req.user = {
      id: fetchedUser._id || fetchedUser.id,
      username: fetchedUser.username,
      email: fetchedUser.email,
      role: fetchedUser.role
    };

    next();
  } catch (err) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const endpoint = req.originalUrl || req.url;
    await logSecurityEvent(
      'AUTH_FAILURE',
      'WARNING',
      `Failed Token Authentication from IP ${ipAddress}`,
      ipAddress,
      endpoint
    );
    return res.status(401).json({ error: 'Unauthorized: Session key invalid or expired' });
  }
}

// 3. API Key Authentication (For secure API access)
export async function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'Unauthorized: API Key missing (Header: X-API-KEY)' });
  }

  try {
    const foundUser = await db.users.findOne({ apiKey });
    if (!foundUser) {
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const endpoint = req.originalUrl || req.url;
      
      await logSecurityEvent(
        'AUTH_FAILURE',
        'HIGH',
        `Unauthorized Attempt using invalid API Key from IP ${ipAddress}`,
        ipAddress,
        endpoint,
        req.headers['user-agent'],
        { attemptedKey: apiKey }
      );
      
      return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }

    if (foundUser.isLocked) {
      return res.status(403).json({ error: 'Account Locked', message: 'API key owner account is suspended.' });
    }

    req.user = {
      id: foundUser._id || foundUser.id,
      username: foundUser.username,
      email: foundUser.email,
      role: foundUser.role
    };
    req.apiKeyUsed = apiKey;

    next();
  } catch (e: any) {
    return res.status(500).json({ error: 'Server validation error' });
  }
}

// 4. Role-Based Access Control Middleware (Admin Only)
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const endpoint = req.originalUrl || req.url;
    
    logSecurityEvent(
      'AUTH_FAILURE',
      'HIGH',
      `Zero Trust Block: User ${req.user?.username || 'Guest'} attempted Admin resource ${endpoint} without clearance`,
      ipAddress,
      endpoint
    );
    
    return res.status(403).json({ 
      error: 'Access Denied', 
      message: 'Zero Trust Authorization: High Privilege Admin clearance required.' 
    });
  }
  next();
}

// 5. Custom CSRF Implementation (Double-Submit Validation)
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Allow GET / HEAD requests without check
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const csrfCookie = req.cookies && req.cookies['XSRF-TOKEN'];
  const csrfHeader = req.headers['x-xsrf-token'] || req.headers['x-csrf-token'];

  // Zero-trust verification
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const endpoint = req.originalUrl || req.url;

    logSecurityEvent(
      'CSRF_BLOCKED',
      'HIGH',
      `CSRF Validation Mismatch: Token cookie does not match head. Terminating transaction request.`,
      ipAddress,
      endpoint
    );

    return res.status(403).json({
      error: 'CSRF Validation Failed: Double-Submit check failure',
      message: 'State verification token missing or mismatch. Reloading your session may fix this.',
      timestamp: new Date()
    });
  }

  next();
}

// 6. express-rate-limit Configuration
export const globalApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  handler: async (req, res) => {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const endpoint = req.originalUrl || req.url;

    await logSecurityEvent(
      'RATE_LIMIT',
      'WARNING',
      `Rate limit exceeded: IP ${ipAddress} queried [${endpoint}] excessively.`,
      ipAddress,
      endpoint
    );

    const alert = await db.securityAlerts.create({
      title: 'WARNING: API Rate Limit Triggered',
      description: `IP ${ipAddress} made over 100 requests within a 15-minute window to safety route [${endpoint}].`,
      severity: 'WARNING',
      status: 'OPEN',
      attackType: 'Denial of Service (DoS) Probe',
      triggeredBy: 'Security Engine (Rate Limiter V1)'
    });

    pushSseNotification('ALERT', alert);
    
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. System safety rules permit a maximum of 100 requests per 15-minute window.',
      cooldownMinutes: 15
    });
  }
});
