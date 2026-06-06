/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SeverityType = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  isLocked: boolean;
  failedAttempts: number;
  apiKey?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  username: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'transfer';
  recipient?: string;
  status: 'completed' | 'pending' | 'flagged';
  timestamp: string;
  isSuspicious: boolean;
}

export interface SecurityLog {
  id: string;
  timestamp: string;
  eventType: 'AUTH_SUCCESS' | 'AUTH_FAILURE' | 'USER_LOCKED' | 'SQL_INJECTION' | 'XSS_ATTEMPT' | 'RATE_LIMIT' | 'API_KEY_AUTH' | 'WAF_BLOCKED' | 'CSRF_BLOCKED' | 'TRANSFER_COMPLETED' | 'TRANSFER_FLAGGED';
  severity: SeverityType;
  message: string;
  ipAddress: string;
  endpoint: string;
  userAgent?: string;
  payload?: string;
}

export interface SecurityAlert {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  severity: SeverityType;
  status: 'OPEN' | 'RESOLVED' | 'INVESTIGATING';
  attackType?: string;
  triggeredBy?: string;
}

export interface SecurityStats {
  totalUsers: number;
  totalTransactions: number;
  failedLoginAttempts: number;
  securityAlertsCount: number;
  apiRequestCount: number;
  activeSessions: number;
  dbStatus: 'MongoDB' | 'In-Memory (Developer Sandbox)';
  wafBlockedCount: number;
}
