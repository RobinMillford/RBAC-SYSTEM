import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '../common/enums/audit-action.enum';

export interface AuditLogPayload {
  action: AuditAction | string;
  actorId: string;
  targetId?: string;
  payload: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditLogPayload): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action: entry.action,
        actorId: entry.actorId,
        targetId: entry.targetId,
        payload: entry.payload as Prisma.InputJsonValue,
      },
    });
    this.logger.debug(
      `Audit [${entry.action}] by ${entry.actorId}${entry.targetId ? ` → ${entry.targetId}` : ''}`,
    );
  }

  async findAll(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { id: true, email: true, role: true } } },
      }),
      this.prisma.auditLog.count(),
    ]);
    return { data, total, page, limit };
  }
}
