import 'dotenv/config';
import { PrismaClient, RoleType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    'postgresql://postgres:rbacs123@localhost:5432/postgres',
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// All permission atoms available in the system
const PERMISSION_ATOMS = [
  { atom: 'users:read',        description: 'List and view users' },
  { atom: 'users:create',      description: 'Create new users' },
  { atom: 'users:update',      description: 'Edit user details' },
  { atom: 'users:delete',      description: 'Delete users' },
  { atom: 'permissions:grant', description: 'Grant permissions to users (subject to Grant Ceiling)' },
  { atom: 'permissions:read',  description: 'View permission assignments' },
  { atom: 'leads:view',        description: 'View leads' },
  { atom: 'leads:create',      description: 'Create leads' },
  { atom: 'leads:edit',        description: 'Edit leads' },
  { atom: 'leads:delete',      description: 'Delete leads' },
  { atom: 'reports:view',      description: 'View reports' },
  { atom: 'reports:export',    description: 'Export reports' },
  { atom: 'audit:read',        description: 'View audit logs' },
  { atom: 'settings:manage',   description: 'Manage system settings' },
];

async function main() {
  console.log('🌱 Seeding database…');

  // 1. Upsert all permission atoms
  for (const perm of PERMISSION_ATOMS) {
    await prisma.permission.upsert({
      where: { atom: perm.atom },
      update: { description: perm.description },
      create: perm,
    });
  }
  console.log(`   ✓ ${PERMISSION_ATOMS.length} permission atoms seeded`);

  // 2. Fetch all permission records
  const allPerms = await prisma.permission.findMany();

  // 3. Upsert the superadmin user with ALL permissions
  const adminPassword = await bcrypt.hash('Admin@1234', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rbac.dev' },
    update: {},
    create: {
      email: 'admin@rbac.dev',
      password: adminPassword,
      role: RoleType.ADMIN,
      permissions: {
        connect: allPerms.map((p) => ({ id: p.id })),
      },
    },
  });
  console.log(`   ✓ Admin user seeded (email: admin@rbac.dev, password: Admin@1234)`);

  // 4. Seed a sample Manager with limited permissions
  const managerPassword = await bcrypt.hash('Manager@1234', 12);
  const managerAtoms = ['users:read', 'leads:view', 'leads:create', 'leads:edit', 'reports:view'];
  const managerPerms = allPerms.filter((p) => managerAtoms.includes(p.atom));

  await prisma.user.upsert({
    where: { email: 'manager@rbac.dev' },
    update: {},
    create: {
      email: 'manager@rbac.dev',
      password: managerPassword,
      role: RoleType.MANAGER,
      managerId: admin.id,
      permissions: {
        connect: managerPerms.map((p) => ({ id: p.id })),
      },
    },
  });
  console.log(`   ✓ Manager user seeded (email: manager@rbac.dev, password: Manager@1234)`);

  console.log('✅ Seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
