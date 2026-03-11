import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Observable, tap } from 'rxjs';
import { AuditService } from '../audit.service';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

/**
 * Attach this interceptor to any controller method that modifies permissions.
 * It automatically logs actorId, targetId, and the response payload.
 *
 * Usage:
 *   @UseInterceptors(AuditInterceptor)
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: JwtPayload; params?: { id?: string }; body?: Record<string, unknown> }>();

    const actor = request.user;
    const targetId = request.params?.id;
    const requestPayload = request.body ?? {};

    return next.handle().pipe(
      tap(async (responseData: unknown) => {
        if (!actor) return;

        await this.auditService.log({
          action: 'PERMISSION_CHANGE',
          actorId: actor.sub,
          targetId,
          payload: {
            request: requestPayload,
            response: responseData,
          } as Prisma.InputJsonValue,
        });
      }),
    );
  }
}
