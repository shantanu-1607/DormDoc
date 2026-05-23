// Vercel serverless entry point.
//
// Vercel routes any request matched by the rewrite in vercel.json
// (`/api/(.*)` → `/api/index`) to this file. We re-export the configured
// Express app from src/server/server.js; Vercel invokes it as a Node request
// handler. The original URL (e.g. /api/student/dashboard) is preserved on
// req.url so Express's own router does the path matching as normal.
//
// server.js intentionally only calls app.listen() when it's the main module,
// so this require is side-effect-free.

const { app } = require('../src/server/server');

module.exports = app;
