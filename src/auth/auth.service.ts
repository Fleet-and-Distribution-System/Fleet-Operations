import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // Registers a brand-new tenant (Company) plus its first admin user.
  // This is the "onboarding" entry point referenced in the roadmap (Phase 0).
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

    // Basic heuristic: contains "@" -> treat as email, otherwise treat as phone.
    // Keep validation format-agnostic here (no country-specific regex) since phone
    // formats vary by market; normalize/validate more strictly at signup time instead.
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

  private issueToken(userId: string, companyId: string, role: string, email: string) {
    const accessToken = this.jwt.sign({ sub: userId, companyId, role, email });
    return { accessToken };
  }
}
