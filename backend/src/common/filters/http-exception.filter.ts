import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? (exception.getResponse() as unknown)
        : 'Internal server error';

    const messageValue =
      exception instanceof HttpException
        ? (exception.getResponse() as any)
        : message;

    // Log the exception details
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Unhandled Exception: ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
      );
    } else {
      this.logger.warn(
        `HTTP ${status} Warning: ${request.method} ${request.url} - ${
          typeof message === 'object' ? JSON.stringify(message) : message
        }`,
      );
    }

    const isProduction = process.env.NODE_ENV === 'production';

    // Format clean response
    const formattedResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        typeof message === 'object' && message !== null
          ? (message as any).message || (message as any).error || JSON.stringify(message)
          : message,
      errorStack: exception instanceof Error ? exception.stack : String(exception),
    };

    response.status(status).json(formattedResponse);
  }
}
