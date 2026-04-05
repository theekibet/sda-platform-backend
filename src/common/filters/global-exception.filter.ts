// src/common/filters/global-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaService } from '../../prisma.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly prisma: PrismaService) {}

  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'An unexpected error occurred';

    const stack =
      exception instanceof Error ? exception.stack : undefined;

    this.logger.error(
      `[${request.method}] ${request.url} → ${statusCode}: ${message}`,
      stack,
    );

    // Persist to SystemLog without crashing the response if DB is down
    try {
      const metadata = JSON.stringify({
        statusCode,
        method: request.method,
        url: request.url,
        body: request.body,
      });

      await this.prisma.systemLog.create({
        data: {
          level: statusCode >= 500 ? 'error' : 'warn',
          source: 'GlobalExceptionFilter',
          message,
          stack: stack ?? null,
          metadata,
          userId: (request as any).user?.userId ?? null, // ✅ Changed from user?.id
        },
      });
    } catch (logError) {
      this.logger.error('Failed to write exception to SystemLog', logError);
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}