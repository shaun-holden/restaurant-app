// Global error handler — Express calls this automatically when any route
// calls next(error) or throws inside an async handler.
//
// Without this, Express would return an ugly HTML error page.
// With this, every error returns clean JSON: { error: "message" }

function errorHandler(err, req, res, next) {
  console.error(err.stack);

  // Prisma "record not found" errors
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }

  // Prisma unique constraint violation (e.g. duplicate email)
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(409).json({ error: `${field} already in use` });
  }

  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message });
}

module.exports = errorHandler;
