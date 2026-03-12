import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { PermissionsService } from './permissions.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [UsersRepository, UsersService, PermissionsService],
  controllers: [UsersController],
  exports: [UsersService, PermissionsService],
})
export class UsersModule {}
