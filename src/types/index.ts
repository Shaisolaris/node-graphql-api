export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed' | 'archived';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  teamId: string;
  userId: string;
  role: 'lead' | 'member';
  joinedAt: string;
}

export interface Project {
  id: string;
  tenantId: string;
  teamId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  tenantId: string;
  projectId: string;
  assigneeId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  completedAt: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  tenantId: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthPayload {
  userId: string;
  tenantId: string;
  role: User['role'];
}

export interface GQLContext {
  user: AuthPayload | null;
  loaders: ReturnType<typeof import('../loaders/index.js').createLoaders>;
}

export interface PaginationArgs {
  first?: number | null;
  after?: string | null;
  last?: number | null;
  before?: string | null;
}

export interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
  totalCount: number;
}

export interface Edge<T> {
  cursor: string;
  node: T;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}
