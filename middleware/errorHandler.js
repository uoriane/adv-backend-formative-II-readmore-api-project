function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.name === 'ValidationError') {
    return res.status(422).json({
      message: 'Validation failed',
      errors: Object.values(error.errors).map((item) => item.message),
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id format' });
  }

  if (error.status) {
    return res.status(error.status).json({ message: error.message });
  }

  console.error(error);
  return res.status(500).json({ message: 'Internal server error' });
}

module.exports = { notFound, errorHandler };
