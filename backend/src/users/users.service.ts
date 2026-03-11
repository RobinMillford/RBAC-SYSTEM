import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
import { UserResponse } from './interfaces/user-response.interface';

// ─── Helper type (inlined Prisma result shape) ────────────────────────────────
type UserWithPerms = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  managerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  permissions: { atom: string }[];
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private mapUser(user: UserWithPerms): UserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      isBanned: user.isBanned,
      managerId: user.managerId,
      permissions: user.permissions.map((p) => p.atom),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private includePerms = { permissions: true } as const;

  // ─── Read ──────────────────────────────────────────────────────────────────

  async findAll(): Promise<UserResponse[]> {
    const users = await this.prisma.user.findMany({
      include: this.includePerms,
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => this.mapUser(u));
  }

  async findById(id: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: this.includePerms,
    });
    if (!user) throw new NotFoundException(`User ${id} not found.`);
    return this.mapUser(user);
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  async create(actorId: string, dto: CreateUserDto): Promise<UserResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use.');

    if (dto.managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: dto.managerId },
      });
      if (!manager) throw new NotFoundException('Manager not found.');
    }

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        role: dto.role,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        managerId: dto.managerId,
      },
      include: this.includePerms,
    });

    await this.auditService.log({
      action: 'USER_CREATE',
      actorId,
      targetId: user.id,
      payload: { email: user.email, role: user.role } as Prisma.InputJsonValue,
    });

    return this.mapUser(user);
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  async update(
    actorId: string,
    targetId: string,
    dto: UpdateUserDto,
  ): Promise<UserResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { id: targetId },
    });
    if (!existing) throw new NotFoundException(`User ${targetId} not found.`);

    if (dto.email && dto.email !== existing.email) {
      const conflict = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (conflict) throw new ConflictException('Email already in use.');
    }

    const user = await this.prisma.user.update({
      where: { id: targetId },
      data: {
        ...(dto.email && { email: dto.email }),
        ...(dto.role && { role: dto.role }),
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.managerId !== undefined && { managerId: dto.managerId }),
      },
      include: this.includePerms,
    });

    await this.auditService.log({
      action: 'USER_UPDATE',
      actorId,
      targetId,
      payload: { changes: dto } as unknown as Prisma.InputJsonValue,
    });

    return this.mapUser(user);
  }

  // ─── Suspend / Reactivate ──────────────────────────────────────────────────

  async suspend(actorId: string, targetId: string): Promise<UserResponse> {
    if (actorId === targetId) {
      throw new BadRequestException('You cannot suspend yourself.');
    }
    const user = await this._setActive(targetId, false);
    await this.auditService.log({
      action: 'USER_SUSPEND',
      actorId,
      targetId,
      payload: {} as Prisma.InputJsonValue,
    });
    return user;
  }

  async reactivate(actorId: string, targetId: string): Promise<UserResponse> {
    const user = await this._setActive(targetId, true);
    await this.auditService.log({
      action: 'USER_REACTIVATE',
      actorId,
      targetId,
      payload: {} as Prisma.InputJsonValue,
    });
    return user;
  }

  // ─── Ban / Unban ───────────────────────────────────────────────────────────

  async ban(actorId: string, targetId: string): Promise<UserResponse> {
    if (actorId === targetId) {
      throw new BadRequestException('You cannot ban yourself.');
    }
    const user = await this._setBanned(targetId, true);
    await this.auditService.log({
      action: 'USER_BAN',
      actorId,
      targetId,
      payload: {} as Prisma.InputJsonValue,
    });
    return user;
  }

  async unban(actorId: string, targetId: string): Promise<UserResponse> {
    const user = await this._setBanned(targetId, false);
    await this.auditService.log({
      action: 'USER_UNBAN',
      actorId,
      targetId,
      payload: {} as Prisma.InputJsonValue,
    });
    return user;
  }

  // ─── Grant Ceiling — Update Permissions ───────────────────────────────────

  async updatePermissions(
    actorId: string,
    targetUserId: string,
    dto: UpdatePermissionsDto,
  ): Promise<UserResponse> {
    if (actorId === targetUserId) {
      throw new BadRequestException('You cannot modify your own permissions.');
    }

    const actor = await this.prisma.user.findUnique({
      where: { id: actorId },
      include: { permissions: true },
    });
    if (!actor) throw new NotFoundException('Actor not found.');

    const actorAtoms = new Set(actor.permissions.map((p) => p.atom));

    const forbidden = dto.atoms.filter((atom) => !actorAtoms.has(atom));
    if (forbidden.length > 0) {
      throw new ForbiddenException(
        `Grant ceiling violation: you do not possess [${forbidden.join(', ')}].`,
      );
    }

    const permissionRecords = await this.prisma.permission.findMany({
      where: { atom: { in: dto.atoms } },
    });

    const unknown = dto.atoms.filter(
      (a) => !permissionRecords.map((p) => p.atom).includes(a),
    );
    if (unknown.length > 0) {
      throw new BadRequestException(
        `Unknown permission atoms: [${unknown.join(', ')}].`,
      );
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { permissions: true },
    });
    if (!target) throw new NotFoundException(`User ${targetUserId} not found.`);
    const previousAtoms = target.permissions.map((p) => p.atom);

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        permissions: {
          set: permissionRecords.map((p) => ({ id: p.id })),
        },
      },
      include: this.includePerms,
    });

    await this.auditService.log({
      action: 'PERMISSION_GRANT',
      actorId,
      targetId: targetUserId,
      payload: {
        before: previousAtoms,
        after: dto.atoms,
        added: dto.atoms.filter((a) => !previousAtoms.includes(a)),
        removed: previousAtoms.filter((a) => !dto.atoms.includes(a)),
      } as Prisma.InputJsonValue,
    });

    return this.mapUser(updated);
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async _setActive(id: string, isActive: boolean): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found.`);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive },
      include: this.includePerms,
    });
    return this.mapUser(updated);
  }

  private async _setBanned(id: string, isBanned: boolean): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found.`);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isBanned },
      include: this.includePerms,
    });
    return this.mapUser(updated);
  }
}
