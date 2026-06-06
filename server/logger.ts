/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

// Let's design a readable cyber-security themed terminal log format
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let metaString = '';
  if (Object.keys(metadata).length > 0) {
    metaString = ` | META: ${JSON.stringify(metadata)}`;
  }
  return `[${timestamp}] [${level}]: ${message}${metaString}`;
});

export const logger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    })
  ]
});

// Helper for security events
export async function logSecurityEvent(
  eventType: string,
  severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL',
  message: string,
  ipAddress: string,
  endpoint: string,
  userAgent?: string,
  payload?: any
) {
  // Format the visual terminal console message
  const details = payload ? ` | Payload: ${JSON.stringify(payload)}` : '';
  const severityPrefix = {
    INFO: '⚡ [INFO]',
    WARNING: '⚠️ [WARNING]',
    HIGH: '🚨 [HIGH ALERT]',
    CRITICAL: '🔥 [CRITICAL BREACH]'
  };

  logger.warn(`${severityPrefix[severity]} ${message} (IP: ${ipAddress}, Route: ${endpoint})${details}`);

  // Save dynamically into the DB
  try {
    const { db } = await import('./db.js');
    await db.securityLogs.create({
      eventType,
      severity,
      message,
      ipAddress,
      endpoint,
      userAgent: userAgent || 'N/A',
      payload: payload ? (typeof payload === 'string' ? payload : JSON.stringify(payload)) : ''
    });
  } catch (err: any) {
    logger.error('Failed writing security event to DB: ' + err.message);
  }
}
