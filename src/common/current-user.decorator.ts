import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  userId: string;
  companyId: string;
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'DISPATCHER' | 'DRIVER';
  email: string;
}

// Pulls the authenticated user (attached by JwtStrategy) off the request.
// Use this in every controller instead of trusting a companyId from the request body/query —
// the tenant boundary must always come from the verified JWT, never from client input.
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
