import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { RoleType } from '@prisma/client';

export class UsersQueryDto {
  /** Free-text search across email, firstName, lastName */
  @IsOptional()
  @IsString()
  search?: string;

  /** Filter by role */
  @IsOptional()
  @IsEnum(RoleType)
  role?: RoleType;

  /** Filter by active status */
  @IsOptional()
  @Transform(({ value }: { value: string }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  /** Filter by banned status */
  @IsOptional()
  @Transform(({ value }: { value: string }) => value === 'true')
  @IsBoolean()
  isBanned?: boolean;

  /** Page number (1-based) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /** Results per page (max 100) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
