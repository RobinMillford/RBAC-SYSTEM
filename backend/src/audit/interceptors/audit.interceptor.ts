import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from '../audit.service';
import { AuditAction } from '../../common/enums/audit-action.enum';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

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
          action: AuditAction.PERMISSION_CHANGE,
          actorId: actor.sub,
          targetId,
          payload: {
            request: requestPayload,
            response: responseData as Record<string, unknown>,
          },
        });
      }),
    );
  }
}
