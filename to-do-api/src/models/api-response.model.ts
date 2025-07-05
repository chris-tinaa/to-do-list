/**
 * Standardized API response types
 * @see docs/prd.md section 8
 */

/**
 * Success response format
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Error response format
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export class APIResponse<T = any> {
  public statusCode: number;
  public message: string;
  public data: T | null;
  public errorCode?: string;

  constructor(statusCode: number, message: string, data: T | null = null, errorCode?: string) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.errorCode = errorCode;
  }
} 