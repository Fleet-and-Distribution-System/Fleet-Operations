# Fleet SaaS — Backend

Standalone multi-tenant fleet & transport operations API. Built with NestJS + PostgreSQL
(Prisma). This is an original build — not derived from or dependent on any third-party
codebase; any external systems reviewed during planning were used only as domain-flow
reference, no code was copied.

## What's included

- **Multi-tenant schema** (`prisma/schema.prisma`) — Company, User, Vehicle, Driver, Customer,
  Location, TransportOrder, Trip, Waybill. Every business table carries `companyId`.
- **Auth** — `POST /auth/register-company` (creates a tenant + its first admin), `POST /auth/login`
  (accepts either email or phone as `identifier`). Returns a JWT carrying `companyId` and `role`;
  every other endpoint trusts *that*, never a companyId from the request body.
- **Vehicles module** — full CRUD + status updates + driver assignment, all scoped by the
  authenticated user's `companyId`. Copy this exact shape (service → controller → module)
  for Drivers, Customers, TransportOrders, Trips, and Waybills — that's the rest of Phase 1.
- **RolesGuard** (`src/auth/roles.guard.ts`) — use `@Roles('COMPANY_ADMIN')` on endpoints that
  should be restricted (e.g. only admins can register vehicles, dispatchers can update trips, etc).
- **Multi-stop trips** and **proof-of-delivery** fields (receiver, photos, signature) already
  modeled on `Trip` and `Waybill`.
- **Locations** — reusable named places (depot, warehouse, customer site, loading point) instead
  of free-text pickup/destination strings.

## Setting up your own repo

```bash
git init
git add .
git commit -m "Initial commit: Phase 0 scaffold — multi-tenant schema, auth, vehicles module"
```
Then create a new empty repo on GitHub and push:
```bash
git remote add origin <your-new-repo-url>
git branch -M main
git push -u origin main
```

## Running it locally

```bash
docker compose up -d              # starts Postgres
cp .env.example .env              # then edit JWT_SECRET
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run start:dev
```

API will be at `http://localhost:3000`.

### Try it

```bash
# 1. Register a company + admin
curl -X POST localhost:3000/auth/register-company \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Acme Logistics","companySlug":"acme","adminEmail":"admin@acme.com","adminPassword":"changeme123","adminFullName":"Ada Admin"}'
# -> { "accessToken": "..." }

# 2. Create a vehicle (use the token from step 1)
curl -X POST localhost:3000/vehicles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"plateNumber":"LAG-123-XY","make":"Mercedes","model":"Actros","vehicleType":"Truck","capacity":30}'
```

## Next build steps (in order — see the roadmap doc for full context)

1. **Drivers module** — same pattern as Vehicles, plus link to a `User` record for driver login.
2. **Customers + TransportOrders modules.**
3. **Trips module** — creates a Trip from a TransportOrder + assigns Vehicle/Driver; status
   lifecycle PENDING → ASSIGNED → IN_TRANSIT → DELIVERED.
4. **Waybill generation** — PDF (see the `docx`/`pdf`-style generation approach) triggered on
   Trip dispatch; store the file in S3-compatible storage and save the URL on the Waybill record.
5. **Dashboard endpoint** — aggregate counts (`vehicles by status`, `trips by status`, etc.)
   scoped by companyId, feeding the Phase 2 dashboard UI.
6. **Harden tenant isolation** — replace the "pass companyId manually" pattern with a Prisma
   Client Extension that injects `companyId` automatically on every tenant-scoped query, so a
   missed `where` clause can never leak data across companies. Do this before any real customer
   data goes in.

## Explicitly not in this starter (see roadmap §6)

GPS/telematics integration, accounting/GL, AI features, native mobile apps, subscription billing
(Stripe) wiring. These come in Phase 2/3 once Vehicles → Trips → Waybills is solid and demoable.
