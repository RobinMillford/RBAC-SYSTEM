import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

interface RefreshPayload {
  sub: string;
  jti: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string; role: string; permissions: string[] };
  }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { permissions: true },
    });

    if (!user || user.isBanned || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials or account suspended.');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const permissions = user.permissions.map((p) => p.atom);
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role, permissions };

    const accessToken = this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const { refreshToken } = await this._issueRefreshToken(user.id);

    return { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role, permissions } };
  }

  async refresh(rawRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: RefreshPayload;
    try {
      payload = this.jwtService.verify<RefreshPayload>(rawRefreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'refresh_secret',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    // Look up the token record by jti (stored as tokenHash)
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash: payload.jti } });

    if (
      !stored ||
      stored.userId !== payload.sub ||
      stored.revokedAt !== null ||
      stored.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Refresh token has been revoked or expired.');
    }

    // Revoke old token (rotation)
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { permissions: true },
    });

    if (!user || user.isBanned || !user.isActive) {
      throw new UnauthorizedException('Account not found or suspended.');
    }

    const permissions = user.permissions.map((p) => p.atom);
    const accessPayload: JwtPayload = { sub: user.id, email: user.email, role: user.role, permissions };
    const accessToken = this.jwtService.sign(accessPayload, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const { refreshToken } = await this._issueRefreshToken(user.id);

    return { accessToken, refreshToken };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    try {
      const payload = this.jwtService.verify<RefreshPayload>(rawRefreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'refresh_secret',
      });
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash: payload.jti, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // If token is invalid/expired, nothing to revoke — silently ignore
    }
  }

  async validateUserById(id: string): Promise<JwtPayload | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { permissions: true },
    });

    if (!user || !user.isActive || user.isBanned) return null;

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions.map((p) => p.atom),
    };
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private async _issueRefreshToken(userId: string): Promise<{ refreshToken: string }> {
    const jti = randomUUID();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    await this.prisma.refreshToken.create({
      data: { tokenHash: jti, userId, expiresAt },
    });

    const refreshToken = this.jwtService.sign(
      { sub: userId, jti },
      { expiresIn: REFRESH_TOKEN_EXPIRY, secret: process.env.JWT_REFRESH_SECRET ?? 'refresh_secret' },
    );

    return { refreshToken };
  }
}


