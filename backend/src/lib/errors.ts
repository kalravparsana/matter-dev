export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export function toErrorResponse(err: unknown): { statusCode: number; body: object } {
  if (isAppError(err)) {
    return {
      statusCode: err.statusCode,
      body: { error: err.message, code: err.code ?? 'APP_ERROR' },
    };
  }
  console.error('Unhandled error', err);
  return {
    statusCode: 500,
    body: { error: 'Something went wrong. Please try again.', code: 'INTERNAL_ERROR' },
  };
}
