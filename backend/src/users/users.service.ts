import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../common/enums/audit-action.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { UserResponse } from './interfaces/user-response.interface';
import { UsersRepository, PaginatedUsers } from './users.repository';
import { mapUser } from './utils/map-user';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly auditService: AuditService,
  ) {}

  // ─── Read ──────────────────────────────────────────────────────────────────

  async findAll(
    query: UsersQueryDto,
  ): Promise<Omit<PaginatedUsers, 'data'> & { data: UserResponse[] }> {
    const result = await this.usersRepo.findAll(query);
    return { ...result, data: result.data.map(mapUser) };
  }

  async findById(id: string): Promise<UserResponse> {
    const user = await this.usersRepo.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found.`);
    return mapUser(user);
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  async create(actorId: string, dto: CreateUserDto): Promise<UserResponse> {
    const existing = await this.usersRepo.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use.');

    if (dto.managerId) {
      const manager = await this.usersRepo.findById(dto.managerId);
      if (!manager) throw new NotFoundException('Manager not found.');
    }

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.usersRepo.create({
      email: dto.email,
      password: hashed,
      role: dto.role,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      ...(dto.managerId && { manager: { connect: { id: dto.managerId } } }),
    });

    await this.auditService.log({
      action: AuditAction.USER_CREATE,
      actorId,
      targetId: user.id,
      payload: { email: user.email, role: user.role },
    });

    this.logger.log(`User created: ${user.id} by actor ${actorId}`);
    return mapUser(user);
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  async update(
    actorId: string,
    targetId: string,
    dto: UpdateUserDto,
  ): Promise<UserResponse> {
    const existing = await this.usersRepo.findById(targetId);
    if (!existing) throw new NotFoundException(`User ${targetId} not found.`);

    if (dto.email && dto.email !== existing.email) {
      const conflict = await this.usersRepo.findByEmail(dto.email);
      if (conflict) throw new ConflictException('Email already in use.');
    }

    const user = await this.usersRepo.update(targetId, {
      ...(dto.email && { email: dto.email }),
      ...(dto.role && { role: dto.role }),
      ...(dto.firstName !== undefined && { firstName: dto.firstName }),
      ...(dto.lastName !== undefined && { lastName: dto.lastName }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.managerId !== undefined && { managerId: dto.managerId }),
    });

    await this.auditService.log({
      action: AuditAction.USER_UPDATE,
      actorId,
      targetId,
      payload: { changes: dto as Record<string, unknown> },
    });

    this.logger.log(`User updated: ${targetId} by actor ${actorId}`);
    return mapUser(user);
  }

  // ─── Suspend / Reactivate ──────────────────────────────────────────────────

  async suspend(actorId: string, targetId: string): Promise<UserResponse> {
    if (actorId === targetId) {
      throw new BadRequestException('You cannot suspend yourself.');
    }
    const user = await this.usersRepo.setActive(targetId, false);
    await this.auditService.log({
      action: AuditAction.USER_SUSPEND,
      actorId,
      targetId,
      payload: {},
    });
    return mapUser(user);
  }

  async reactivate(actorId: string, targetId: string): Promise<UserResponse> {
    const user = await this.usersRepo.setActive(targetId, true);
    await this.auditService.log({
      action: AuditAction.USER_REACTIVATE,
      actorId,
      targetId,
      payload: {},
    });
    return mapUser(user);
  }

  // ─── Ban / Unban ───────────────────────────────────────────────────────────

  async ban(actorId: string, targetId: string): Promise<UserResponse> {
    if (actorId === targetId) {
      throw new BadRequestException('You cannot ban yourself.');
    }
    const user = await this.usersRepo.setBanned(targetId, true);
    await this.auditService.log({
      action: AuditAction.USER_BAN,
      actorId,
      targetId,
      payload: {},
    });
    return mapUser(user);
  }

  async unban(actorId: string, targetId: string): Promise<UserResponse> {
    const user = await this.usersRepo.setBanned(targetId, false);
    await this.auditService.log({
      action: AuditAction.USER_UNBAN,
      actorId,
      targetId,
      payload: {},
    });
    return mapUser(user);
  }
}
