import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// NOTE ON MULTI-TENANCY SAFETY:
// This starter relies on every repository method explicitly passing `where: { companyId }`.
// That is fragile by hand. Before real customer data goes in, upgrade this to Prisma Client
// Extensions (or middleware) that automatically inject companyId into every query for
// tenant-scoped models, so a forgotten `where` clause can't leak data across companies.
// Track this as a Phase 0 hardening task, not an optional nice-to-have.

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
