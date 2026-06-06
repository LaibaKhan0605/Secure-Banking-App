/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load environmental parameters
dotenv.config();

import { initializeDatabase } from './server/db.js';
import { logger } from './server/logger.js';
import { routes } from './server/routes.js';
import { 
  wafProtection, 
  csrfProtection, 
  globalApiRateLimiter,
  registerSseClient,
  removeSseClient
} from './server/middleware.js';

async function bootstrap() {
  const app = express();
  const PORT = 3000;

  // 1. Initialize data store
  const dbStatus = await initializeDatabase();
  logger.info(`Database Subsystem Initialized. Mode: ${dbStatus.type}`);

  // 2. Setup Security Headers (Helmet configurations)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://fonts.googleapis.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://images.unsplash.com", "referrerpolicy"],
        connectSrc: ["'self'", "wss:", "http://localhost:*", "ws://localhost:*", "https://*.run.app", "http://*.run.app"],
        frameAncestors: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    }
  }));

  // Disable x-powered-by specifically
  app.disable('x-powered-by');

  // 3. CORS rules setup
  app.use(cors({
    origin: '*', // For sandbox flexibility. In specific hardened production, lock to the APP_URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Auth-Token', 'X-CSRF-Token', 'X-XSRF-Token', 'X-API-KEY']
  }));

  // 4. Base parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // 5. Morgan Logging Integration with Winston
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));

  // 6. Security & Inspection Layers (WAF & Rate Limiter applied to /api/*)
  app.use('/api', globalApiRateLimiter);
  app.use('/api', wafProtection);
  app.use('/api', csrfProtection); // Validate mutating csrf headers index

  // 7. Mount Core API endpoints
  app.use('/api', routes);

  // 8. Server-Sent Events (SSE) Route for live cyber stats & logs
  app.get('/api/security/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    registerSseClient(res);
    logger.info('Connected new dashboard terminal for live telemetry stream');

    // Send a keep-alive beat every 15s
    const keepAliveTimer = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch (e) {
        // failed write means client left
      }
    }, 15000);

    req.on('close', () => {
      removeSseClient(res);
      clearInterval(keepAliveTimer);
      logger.info('Closed dashboard telemetry terminal connection');
    });
  });

  // 9. Client Web App serving (Vite Dev Server vs Static Dist)
  if (process.env.NODE_ENV !== 'production') {
    logger.info('Development Environment. Mounting dynamic Vite Client Middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    logger.info('Production Mode. Mounting static assets from /dist directory...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🛡️ Secure Banking Server booted on http://localhost:${PORT}`);
  });
}

bootstrap();
