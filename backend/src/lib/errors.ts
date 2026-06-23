export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code = 'APP_ERROR',
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(err: unknown): { statusCode: number; body: object } {
  if (err instanceof AppError) {
    return {
      statusCode: err.statusCode,
      body: { error: { code: err.code, message: err.message } },
    };
  }
  console.error('Unhandled error', err);
  return {
    statusCode: 500,
    body: { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' } },
  };
}
