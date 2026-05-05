// Middleware для валидации тела запроса через Zod-схему
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ошибка валидации данных',
          details: result.error.errors,
        },
      });
    }
    req.body = result.data;
    next();
  };
}
