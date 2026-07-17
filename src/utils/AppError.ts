// Distinguishing "operational" errors (bad input, not found, unauthorized —
// expected, safe to show a clean message for) from programmer errors
// (undefined is not a function) is the backbone of the global error handler.
// Only AppError instances get their message shown to the client; anything
// else is logged in full and a generic 500 is returned instead.
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational = true;
  public readonly errors?: unknown;

  constructor(message: string, statusCode = 500, errors?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: unknown) {
    return new AppError(message, 400, errors);
  }
  static unauthorized(message = "Unauthorized") {
    return new AppError(message, 401);
  }
  static forbidden(message = "Forbidden") {
    return new AppError(message, 403);
  }
  static notFound(message = "Resource not found") {
    return new AppError(message, 404);
  }
  static conflict(message: string) {
    return new AppError(message, 409);
  }
  static tooMany(message = "Too many requests") {
    return new AppError(message, 429);
  }
}
