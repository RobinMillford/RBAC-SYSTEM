import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
import { AuditAction } from '../common/enums/audit-action.enum';
import { UserResponse } from './interfaces/user-response.interface';
import { mapUser } from './utils/map-user';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async updatePermissions(
    actorId: string,
    targetUserId: string,
    dto: UpdatePermissionsDto,
  ): Promise<UserResponse> {
    if (actorId === targetUserId) {
      throw new BadRequestException('You cannot modify your own permissions.');
    }

    // Fetch actor and target in parallel for efficiency
    const [actor, target] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: actorId },
        include: { permissions: true },
      }),
      this.prisma.user.findUnique({
        where: { id: targetUserId },
        include: { permissions: true },
      }),
    ]);

    if (!actor) throw new NotFoundException('Actor not found.');
    if (!target) throw new NotFoundException(`User ${targetUserId} not found.`);

    // Grant ceiling: actors may only grant permissions they themselves possess
    const actorAtomSet = new Set(actor.permissions.map((p) => p.atom));
    const forbidden = dto.atoms.filter((atom) => !actorAtomSet.has(atom));
    if (forbidden.length > 0) {
      throw new ForbiddenException(
        `Grant ceiling violation: you do not possess [${forbidden.join(', ')}].`,
      );
    }

    // Validate all requested atoms exist in the permissions table
    const permissionRecords = await this.prisma.permission.findMany({
      where: { atom: { in: dto.atoms } },
    });
    const foundAtomSet = new Set(permissionRecords.map((p) => p.atom));
    const unknownAtoms = dto.atoms.filter((a) => !foundAtomSet.has(a));
    if (unknownAtoms.length > 0) {
      throw new BadRequestException(
        `Unknown permission atoms: [${unknownAtoms.join(', ')}].`,
      );
    }

    const previousAtoms = target.permissions.map((p) => p.atom);

    // Atomic: update permissions + write audit log in a single transaction
    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: targetUserId },
        data: {
          permissions: { set: permissionRecords.map((p) => ({ id: p.id })) },
        },
        include: { permissions: true },
      });

      await tx.auditLog.create({
        data: {
          action: AuditAction.PERMISSION_GRANT,
          actorId,
          targetId: targetUserId,
          payload: {
            before: previousAtoms,
            after: dto.atoms,
            added: dto.atoms.filter((a) => !previousAtoms.includes(a)),
            removed: previousAtoms.filter((a) => !dto.atoms.includes(a)),
          } as Prisma.InputJsonValue,
        },
      });

      return user;
    });

    this.logger.log(
      `Permissions updated for user ${targetUserId} by actor ${actorId}`,
    );
    return mapUser(updated);
  }
}
