import type { Tenant, User, Team, TeamMember, Project, Task, Comment } from '../types/index.js';

class DataStore {
  tenants: Map<string, Tenant> = new Map();
  users: Map<string, User> = new Map();
  teams: Map<string, Team> = new Map();
  teamMembers: TeamMember[] = [];
  projects: Map<string, Project> = new Map();
  tasks: Map<string, Task> = new Map();
  comments: Map<string, Comment> = new Map();

  // --- Tenant queries ---
  getTenant(id: string): Tenant | undefined {
    return this.tenants.get(id);
  }

  getTenantBySlug(slug: string): Tenant | undefined {
    for (const t of this.tenants.values()) {
      if (t.slug === slug) return t;
    }
    return undefined;
  }

  // --- User queries ---
  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): User | undefined {
    for (const u of this.users.values()) {
      if (u.email === email) return u;
    }
    return undefined;
  }

  getUsersByTenant(tenantId: string): User[] {
    return [...this.users.values()].filter((u) => u.tenantId === tenantId);
  }

  getUsersByIds(ids: string[]): (User | undefined)[] {
    return ids.map((id) => this.users.get(id));
  }

  // --- Team queries ---
  getTeam(id: string): Team | undefined {
    return this.teams.get(id);
  }

  getTeamsByTenant(tenantId: string): Team[] {
    return [...this.teams.values()].filter((t) => t.tenantId === tenantId);
  }

  getTeamsByIds(ids: string[]): (Team | undefined)[] {
    return ids.map((id) => this.teams.get(id));
  }

  getTeamMembers(teamId: string): TeamMember[] {
    return this.teamMembers.filter((tm) => tm.teamId === teamId);
  }

  getUserTeams(userId: string): Team[] {
    const teamIds = this.teamMembers
      .filter((tm) => tm.userId === userId)
      .map((tm) => tm.teamId);
    return teamIds.map((id) => this.teams.get(id)).filter(Boolean) as Team[];
  }

  // --- Project queries ---
  getProject(id: string): Project | undefined {
    return this.projects.get(id);
  }

  getProjectsByTenant(tenantId: string): Project[] {
    return [...this.projects.values()].filter((p) => p.tenantId === tenantId);
  }

  getProjectsByTeam(teamId: string): Project[] {
    return [...this.projects.values()].filter((p) => p.teamId === teamId);
  }

  getProjectsByIds(ids: string[]): (Project | undefined)[] {
    return ids.map((id) => this.projects.get(id));
  }

  // --- Task queries ---
  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  getTasksByProject(projectId: string): Task[] {
    return [...this.tasks.values()].filter((t) => t.projectId === projectId);
  }

  getTasksByAssignee(userId: string): Task[] {
    return [...this.tasks.values()].filter((t) => t.assigneeId === userId);
  }

  getTasksByTenant(tenantId: string): Task[] {
    return [...this.tasks.values()].filter((t) => t.tenantId === tenantId);
  }

  getTasksByIds(ids: string[]): (Task | undefined)[] {
    return ids.map((id) => this.tasks.get(id));
  }

  // --- Comment queries ---
  getComment(id: string): Comment | undefined {
    return this.comments.get(id);
  }

  getCommentsByTask(taskId: string): Comment[] {
    return [...this.comments.values()]
      .filter((c) => c.taskId === taskId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  getCommentsByIds(ids: string[]): (Comment | undefined)[] {
    return ids.map((id) => this.comments.get(id));
  }
}

export const store = new DataStore();
