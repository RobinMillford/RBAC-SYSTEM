import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersQueryDto } from './dto/users-query.dto';
import { UserWithPerms } from './utils/map-user';

const INCLUDE_PERMS = { permissions: true } as const;

export interface PaginatedUsers {
  data: UserWithPerms[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: UsersQueryDto): Promise<PaginatedUsers> {
    const { search, role, isActive, isBanned, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(role !== undefined && { role }),
      ...(isActive !== undefined && { isActive }),
      ...(isBanned !== undefined && { isBanned }),
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: INCLUDE_PERMS,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    this.logger.debug(`findAll: ${data.length} of ${total} users (page ${page})`);
    return { data, total, page, limit };
  }

  async findById(id: string): Promise<UserWithPerms | null> {
    return this.prisma.user.findUnique({ where: { id }, include: INCLUDE_PERMS });
  }

  async findByEmail(email: string): Promise<UserWithPerms | null> {
    return this.prisma.user.findUnique({ where: { email }, include: INCLUDE_PERMS });
  }

  async create(data: Prisma.UserCreateInput): Promise<UserWithPerms> {
    return this.prisma.user.create({ data, include: INCLUDE_PERMS });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<UserWithPerms> {
    return this.prisma.user.update({ where: { id }, data, include: INCLUDE_PERMS });
  }

  async setActive(id: string, isActive: boolean): Promise<UserWithPerms> {
    return this._safeUpdate(id, { isActive });
  }

  async setBanned(id: string, isBanned: boolean): Promise<UserWithPerms> {
    return this._safeUpdate(id, { isBanned });
  }

  /**
   * Wraps a Prisma update and converts P2025 (record not found) to NotFoundException.
   * More efficient than a separate findUnique + update (eliminates the extra round-trip).
   */
  private async _safeUpdate(
    id: string,
    data: Prisma.UserUpdateInput,
  ): Promise<UserWithPerms> {
    try {
      return await this.prisma.user.update({ where: { id }, data, include: INCLUDE_PERMS });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        throw new NotFoundException(`User ${id} not found.`);
      }
      throw err;
    }
  }
}
