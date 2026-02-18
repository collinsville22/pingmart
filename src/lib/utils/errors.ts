export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NameUnavailableError extends AppError {
  constructor(name: string) {
    super(`${name} is not available`, 409, "NAME_UNAVAILABLE");
    this.name = "NameUnavailableError";
  }
}

export class ChainApiError extends AppError {
  constructor(message: string, public chain?: string) {
    super(message, 502, "CHAIN_API_ERROR");
    this.name = "ChainApiError";
  }
}

export class OrderNotFoundError extends AppError {
  constructor(orderId: string) {
    super(`Order ${orderId} not found`, 404, "ORDER_NOT_FOUND");
    this.name = "OrderNotFoundError";
  }
}

export class PaymentVerificationError extends AppError {
  constructor(message: string) {
    super(message, 502, "PAYMENT_VERIFICATION_ERROR");
    this.name = "PaymentVerificationError";
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return { code: error.code, message: error.message };
  }
  return { code: "INTERNAL_ERROR", message: "Something went wrong" };
}

export function toStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  return 500;
}
