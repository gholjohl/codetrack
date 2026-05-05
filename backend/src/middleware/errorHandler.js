// Централизованный обработчик ошибок — единый формат ответа
export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Ошибка валидации данных',
        details: err.errors,
      },
    });
  }

  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Внутренняя ошибка сервера';

  res.status(status).json({ error: { code, message } });
}
