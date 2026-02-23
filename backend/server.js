'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables for local development.
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const API_DIR = path.join(PROJECT_ROOT, 'api');

app.disable('x-powered-by');

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || true
}));

app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'restored-kings-foundation',
        timestamp: new Date().toISOString()
    });
});

function resolveApiHandlerPath(name) {
    const candidate = path.resolve(API_DIR, `${name}.js`);
    if (!candidate.startsWith(API_DIR + path.sep)) {
        return null;
    }
    if (!fs.existsSync(candidate)) {
        return null;
    }
    return candidate;
}

async function executeApiHandler(req, res, handlerName) {
    const handlerPath = resolveApiHandlerPath(handlerName);
    if (!handlerPath) {
        return res.status(404).json({
            error: 'Not found',
            message: `API route /api/${handlerName} does not exist`
        });
    }

    try {
        // Clear module cache in dev so changes are picked up immediately.
        delete require.cache[require.resolve(handlerPath)];
        const handler = require(handlerPath);

        if (typeof handler !== 'function') {
            return res.status(500).json({
                error: 'Invalid API handler export',
                message: `Expected function export from ${handlerName}.js`
            });
        }

        await Promise.resolve(handler(req, res));

        if (!res.headersSent) {
            res.status(204).end();
        }
    } catch (error) {
        console.error(`[API_ERROR] /api/${handlerName}`, error);
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    }
}

// Stripe webhook needs the raw body for signature verification.
app.all('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    await executeApiHandler(req, res, 'webhook');
});

// JSON/urlencoded parsers for the rest of API routes.
app.use('/api', express.json({ limit: '1mb' }));
app.use('/api', express.urlencoded({ extended: true }));

app.all('/api/:handler', async (req, res) => {
    await executeApiHandler(req, res, req.params.handler);
});

app.use(express.static(PUBLIC_DIR, {
    extensions: ['html']
}));

app.get('/', (_req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

function startServer(port, retriesLeft = 10) {
    const server = app.listen(port, () => {
        console.log(`[SERVER] Running on http://localhost:${port}`);
    });

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE' && retriesLeft > 0) {
            const fallbackPort = port + 1;
            console.warn(`[SERVER] Port ${port} is in use. Retrying on ${fallbackPort}...`);
            startServer(fallbackPort, retriesLeft - 1);
            return;
        }

        console.error('[SERVER_ERROR]', error);
        process.exit(1);
    });
}

startServer(PORT);
