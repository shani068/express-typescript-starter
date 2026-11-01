export interface ErrorDetail {
  path: string;
  message: string;
}

// Throw from routes, middleware, or controllers; the error handler turns it into
// `{ error: { message, details? } }` with this status.
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: ErrorDetail[]
  ) {
    super(message);
    this.name = "HttpError";
  }
}
