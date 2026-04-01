import bcrypt from 'bcryptjs';
import { store } from './store.js';

const now = new Date().toISOString();
const passwordHash = bcrypt.hashSync('password123', 12);

export function seed(): void {
  // --- Tenants ---
  store.tenants.set('t1', {
    id: 't1',
    name: 'Acme Corp',
    slug: 'acme',
    plan: 'pro',
    createdAt: now,
    updatedAt: now,
  });
  store.tenants.set('t2', {
    id: 't2',
    name: 'Globex Industries',
    slug: 'globex',
    plan: 'enterprise',
    createdAt: now,
    updatedAt: now,
  });

  // --- Users (Acme) ---
  store.users.set('u1', {
    id: 'u1',
    tenantId: 't1',
    email: 'alice@acme.com',
    passwordHash,
    firstName: 'Alice',
    lastName: 'Johnson',
    role: 'owner',
    avatarUrl: null,
    createdAt: now,
    updatedAt: now,
  });
  store.users.set('u2', {
    id: 'u2',
    tenantId: 't1',
    email: 'bob@acme.com',
    passwordHash,
    firstName: 'Bob',
    lastName: 'Smith',
    role: 'admin',
    avatarUrl: null,
    createdAt: now,
    updatedAt: now,
  });
  store.users.set('u3', {
    id: 'u3',
    tenantId: 't1',
    email: 'charlie@acme.com',
    passwordHash,
    firstName: 'Charlie',
    lastName: 'Davis',
    role: 'member',
    avatarUrl: null,
    createdAt: now,
    updatedAt: now,
  });
  store.users.set('u4', {
    id: 'u4',
    tenantId: 't1',
    email: 'diana@acme.com',
    passwordHash,
    firstName: 'Diana',
    lastName: 'Evans',
    role: 'member',
    avatarUrl: null,
    createdAt: now,
    updatedAt: now,
  });

  // --- Users (Globex) ---
  store.users.set('u5', {
    id: 'u5',
    tenantId: 't2',
    email: 'hank@globex.com',
    passwordHash,
    firstName: 'Hank',
    lastName: 'Scorpio',
    role: 'owner',
    avatarUrl: null,
    createdAt: now,
    updatedAt: now,
  });

  // --- Teams (Acme) ---
  store.teams.set('tm1', {
    id: 'tm1',
    tenantId: 't1',
    name: 'Engineering',
    description: 'Core product development team',
    createdAt: now,
    updatedAt: now,
  });
  store.teams.set('tm2', {
    id: 'tm2',
    tenantId: 't1',
    name: 'Design',
    description: 'UI/UX and brand design',
    createdAt: now,
    updatedAt: now,
  });

  // --- Team Members ---
  store.teamMembers.push(
    { teamId: 'tm1', userId: 'u1', role: 'lead', joinedAt: now },
    { teamId: 'tm1', userId: 'u2', role: 'member', joinedAt: now },
    { teamId: 'tm1', userId: 'u3', role: 'member', joinedAt: now },
    { teamId: 'tm2', userId: 'u4', role: 'lead', joinedAt: now },
    { teamId: 'tm2', userId: 'u2', role: 'member', joinedAt: now },
  );

  // --- Projects ---
  store.projects.set('p1', {
    id: 'p1',
    tenantId: 't1',
    teamId: 'tm1',
    name: 'API v2 Rewrite',
    description: 'Complete rewrite of the public REST API to GraphQL',
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2024-06-30',
    createdById: 'u1',
    createdAt: now,
    updatedAt: now,
  });
  store.projects.set('p2', {
    id: 'p2',
    tenantId: 't1',
    teamId: 'tm1',
    name: 'Mobile App Backend',
    description: 'Backend services for the new mobile application',
    status: 'planning',
    startDate: null,
    endDate: null,
    createdById: 'u1',
    createdAt: now,
    updatedAt: now,
  });
  store.projects.set('p3', {
    id: 'p3',
    tenantId: 't1',
    teamId: 'tm2',
    name: 'Design System',
    description: 'Unified component library and design tokens',
    status: 'active',
    startDate: '2024-02-01',
    endDate: null,
    createdById: 'u4',
    createdAt: now,
    updatedAt: now,
  });

  // --- Tasks ---
  const tasks = [
    { id: 'tsk1', projectId: 'p1', assigneeId: 'u2', title: 'Set up Apollo Server', status: 'done' as const, priority: 'high' as const },
    { id: 'tsk2', projectId: 'p1', assigneeId: 'u3', title: 'Implement authentication resolvers', status: 'in_progress' as const, priority: 'high' as const },
    { id: 'tsk3', projectId: 'p1', assigneeId: 'u2', title: 'Add DataLoader for N+1 prevention', status: 'in_progress' as const, priority: 'medium' as const },
    { id: 'tsk4', projectId: 'p1', assigneeId: null, title: 'Write integration tests', status: 'todo' as const, priority: 'medium' as const },
    { id: 'tsk5', projectId: 'p1', assigneeId: 'u3', title: 'Implement subscription layer', status: 'todo' as const, priority: 'low' as const },
    { id: 'tsk6', projectId: 'p2', assigneeId: 'u2', title: 'Design API schema for mobile', status: 'todo' as const, priority: 'high' as const },
    { id: 'tsk7', projectId: 'p3', assigneeId: 'u4', title: 'Create color token system', status: 'in_progress' as const, priority: 'high' as const },
    { id: 'tsk8', projectId: 'p3', assigneeId: 'u4', title: 'Build button component variants', status: 'todo' as const, priority: 'medium' as const },
  ];

  for (const t of tasks) {
    store.tasks.set(t.id, {
      ...t,
      tenantId: 't1',
      description: null,
      dueDate: null,
      completedAt: t.status === 'done' ? now : null,
      createdById: 'u1',
      createdAt: now,
      updatedAt: now,
    });
  }

  // --- Comments ---
  store.comments.set('c1', {
    id: 'c1',
    tenantId: 't1',
    taskId: 'tsk1',
    authorId: 'u2',
    body: 'Apollo Server 4 is set up with Express. Ready for review.',
    createdAt: now,
    updatedAt: now,
  });
  store.comments.set('c2', {
    id: 'c2',
    tenantId: 't1',
    taskId: 'tsk2',
    authorId: 'u3',
    body: 'Working on JWT middleware. Should we support refresh tokens?',
    createdAt: now,
    updatedAt: now,
  });
  store.comments.set('c3', {
    id: 'c3',
    tenantId: 't1',
    taskId: 'tsk2',
    authorId: 'u1',
    body: 'Yes, implement refresh token rotation.',
    createdAt: now,
    updatedAt: now,
  });
}
