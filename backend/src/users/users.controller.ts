import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { PermissionsService } from './permissions.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequiresPermission } from '../common/decorators/requires-permission.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get()
  @RequiresPermission('users:read')
  findAll(@Query() query: UsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @RequiresPermission('users:read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @RequiresPermission('users:create')
  create(@Body() dto: CreateUserDto, @Request() req: { user: JwtPayload }) {
    return this.usersService.create(req.user.sub, dto);
  }

  @Patch(':id')
  @RequiresPermission('users:update')
  update(
    @Param('id', ParseUUIDPipe) targetId: string,
    @Body() dto: UpdateUserDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.usersService.update(req.user.sub, targetId, dto);
  }

  @Patch(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @RequiresPermission('users:update')
  suspend(
    @Param('id', ParseUUIDPipe) targetId: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.usersService.suspend(req.user.sub, targetId);
  }

  @Patch(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  @RequiresPermission('users:update')
  reactivate(
    @Param('id', ParseUUIDPipe) targetId: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.usersService.reactivate(req.user.sub, targetId);
  }

  @Patch(':id/ban')
  @HttpCode(HttpStatus.OK)
  @RequiresPermission('users:delete')
  ban(
    @Param('id', ParseUUIDPipe) targetId: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.usersService.ban(req.user.sub, targetId);
  }

  @Patch(':id/unban')
  @HttpCode(HttpStatus.OK)
  @RequiresPermission('users:delete')
  unban(
    @Param('id', ParseUUIDPipe) targetId: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.usersService.unban(req.user.sub, targetId);
  }

  @Patch(':id/permissions')
  @RequiresPermission('permissions:grant')
  updatePermissions(
    @Param('id', ParseUUIDPipe) targetId: string,
    @Body() dto: UpdatePermissionsDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.permissionsService.updatePermissions(req.user.sub, targetId, dto);
  }
}
