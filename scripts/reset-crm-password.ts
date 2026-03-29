import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

type CliOptions = {
  email: string;
  password: string;
  createIfMissing: boolean;
  activateUser: boolean;
  help: boolean;
  role: UserRole;
};

function printUsage() {
  console.log('Usage: npm run crm:reset-password -- [options]');
  console.log('');
  console.log('Options:');
  console.log('  --email <value>       User email (default: admin@crm.local)');
  console.log('  --password <value>    New password (default: CRM_DEMO_PASSWORD env var)');
  console.log('  --create              Create user as ADMIN if missing');
  console.log('  --role <value>        Role to force (ADMIN, ASSISTANT, PORTAL_USER)');
  console.log('  --keep-status         Do not force isActive=true on update');
  console.log('  --help                Show this help');
}

function parseArgs(argv: string[]): CliOptions {
  const args = new Map<string, string | boolean>();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--create') {
      args.set('create', true);
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      args.set('help', true);
      continue;
    }

    if (arg === '--keep-status') {
      args.set('keep-status', true);
      continue;
    }

    if (arg.startsWith('--email=')) {
      args.set('email', arg.slice('--email='.length));
      continue;
    }

    if (arg === '--email') {
      args.set('email', argv[index + 1] ?? '');
      index += 1;
      continue;
    }

    if (arg.startsWith('--role=')) {
      args.set('role', arg.slice('--role='.length));
      continue;
    }

    if (arg === '--role') {
      args.set('role', argv[index + 1] ?? '');
      index += 1;
      continue;
    }

    if (arg.startsWith('--password=')) {
      args.set('password', arg.slice('--password='.length));
      continue;
    }

    if (arg === '--password') {
      args.set('password', argv[index + 1] ?? '');
      index += 1;
      continue;
    }
  }

  const email = String(args.get('email') ?? 'admin@crm.local').trim().toLowerCase();
  const password = String(args.get('password') ?? process.env.CRM_DEMO_PASSWORD ?? '').trim();
  const roleRaw = String(args.get('role') ?? 'ADMIN').trim().toUpperCase();

  if (!Object.values(UserRole).includes(roleRaw as UserRole)) {
    throw new Error('Invalid role. Use ADMIN, ASSISTANT or PORTAL_USER.');
  }

  const role = roleRaw as UserRole;

  const help = Boolean(args.get('help'));

  if (help) {
    return {
      email,
      password,
      createIfMissing: Boolean(args.get('create')),
      activateUser: !Boolean(args.get('keep-status')),
      help: true,
      role,
    };
  }

  if (!email) {
    throw new Error('Missing email. Use --email admin@crm.local');
  }

  if (!password) {
    throw new Error(
      'Missing password. Use --password "your_password" or set CRM_DEMO_PASSWORD in environment.',
    );
  }

  return {
    email,
    password,
    createIfMissing: Boolean(args.get('create')),
    activateUser: !Boolean(args.get('keep-status')),
    help: false,
    role,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  const passwordHash = await bcrypt.hash(options.password, 10);

  const existingUser = await prisma.user.findUnique({
    where: { email: options.email },
  });

  if (!existingUser && !options.createIfMissing) {
    throw new Error(
      `User ${options.email} does not exist. Run with --create to create an ADMIN account.`,
    );
  }

  if (!existingUser) {
    const created = await prisma.user.create({
      data: {
        email: options.email,
        fullName: 'Admin CRM',
        role: options.role,
        passwordHash,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    console.log('CRM user created successfully:');
    console.log(created);
    return;
  }

  const updated = await prisma.user.update({
    where: { id: existingUser.id },
    data: {
      role: options.role,
      passwordHash,
      ...(options.activateUser ? { isActive: true } : {}),
    },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  console.log('CRM password reset successfully:');
  console.log(updated);
}

main()
  .catch((error) => {
    console.error('Failed to reset CRM password:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
