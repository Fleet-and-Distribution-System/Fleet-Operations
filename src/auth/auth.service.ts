import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma.service';
import { CloudinaryService } from '../common/cloudinary.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private cloudinary: CloudinaryService,
  ) {}

  async registerCompany(params: {
    companyName: string;
    companySlug: string;
    adminEmail: string;
    adminPhone?: string;
    adminPassword: string;
    adminFullName: string;
  }) {
    const existing = await this.prisma.company.findUnique({ where: { slug: params.companySlug } });
    if (existing) throw new ConflictException('Company slug already taken');

    const passwordHash = await bcrypt.hash(params.adminPassword, 10);

    const company = await this.prisma.company.create({
      data: {
        name: params.companyName,
        slug: params.companySlug,
        users: {
          create: {
            email: params.adminEmail,
            phone: params.adminPhone,
            passwordHash,
            fullName: params.adminFullName,
            role: 'COMPANY_ADMIN',
          },
        },
      },
      include: { users: true },
    });

    const admin = company.users[0];
    return this.issueToken(admin.id, company.id, admin.role, admin.email);
  }

  async login(identifier: string, password: string, companySlug: string) {
    const company = await this.prisma.company.findUnique({ where: { slug: companySlug } });
    if (!company) throw new UnauthorizedException('Invalid credentials');

    const isEmail = identifier.includes('@');

    const user = await this.prisma.user.findFirst({
      where: {
        companyId: company.id,
        ...(isEmail ? { email: identifier } : { phone: identifier }),
      },
    });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueToken(user.id, company.id, user.role, user.email);
  }

  async loginPin(identifier: string, pin: string, companySlug: string) {
    const company = await this.prisma.company.findUnique({ where: { slug: companySlug } });
    if (!company) throw new UnauthorizedException('Invalid credentials');

    const isEmail = identifier.includes('@');

    const user = await this.prisma.user.findFirst({
      where: {
        companyId: company.id,
        ...(isEmail ? { email: identifier } : { phone: identifier }),
      },
    });
    // No PIN set yet is treated the same as invalid credentials — never
    // reveal via a distinct error whether an account has a PIN configured.
    if (!user || !user.isActive || !user.pin) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(pin, user.pin);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueToken(user.id, company.id, user.role, user.email);
  }

  private issueToken(userId: string, companyId: string, role: string, email: string) {
    const accessToken = this.jwt.sign({ sub: userId, companyId, role, email });
    return { accessToken, role };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { success: true };
  }

  async setPin(userId: string, currentPassword: string, pin: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const pinHash = await bcrypt.hash(pin, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { pin: pinHash } });
    return { success: true };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { driverProfile: true },
    });
    if (!user) throw new UnauthorizedException('User not found');

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      hasPin: !!user.pin,
      driverProfile: user.driverProfile
        ? {
            id: user.driverProfile.id,
            photoUrl: user.driverProfile.photoUrl,
            licenseNumber: user.driverProfile.licenseNumber,
          }
        : null,
    };
  }

  async updateMe(userId: string, dto: { phone?: string }) {
    await this.prisma.user.update({ where: { id: userId }, data: { phone: dto.phone } });
    // Keep the linked Driver record's phone in sync, since both apps read
    // phone from different places (User for login, Driver for fleet ops).
    await this.prisma.driver.updateMany({ where: { userId }, data: { phone: dto.phone } });
    return { success: true };
  }

  async updateMyPhoto(userId: string, companyId: string, buffer: Buffer) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new ForbiddenException('No driver profile for this account');

    const url = await this.cloudinary.uploadImage(buffer, `fleet-ops/${companyId}/drivers/${driver.id}`);
    await this.prisma.driver.update({ where: { id: driver.id }, data: { photoUrl: url } });
    return { photoUrl: url };
  }
}
