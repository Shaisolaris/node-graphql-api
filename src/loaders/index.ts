import DataLoader from 'dataloader';
import { store } from '../db/store.js';
import type { User, Team, Project, Task, Comment } from '../types/index.js';

export function createLoaders() {
  return {
    userLoader: new DataLoader<string, User | undefined>(async (ids) => {
      return store.getUsersByIds([...ids]);
    }),

    teamLoader: new DataLoader<string, Team | undefined>(async (ids) => {
      return store.getTeamsByIds([...ids]);
    }),

    projectLoader: new DataLoader<string, Project | undefined>(async (ids) => {
      return store.getProjectsByIds([...ids]);
    }),

    taskLoader: new DataLoader<string, Task | undefined>(async (ids) => {
      return store.getTasksByIds([...ids]);
    }),

    commentLoader: new DataLoader<string, Comment | undefined>(async (ids) => {
      return store.getCommentsByIds([...ids]);
    }),

    tasksByProjectLoader: new DataLoader<string, Task[]>(async (projectIds) => {
      return [...projectIds].map((projectId) => store.getTasksByProject(projectId));
    }),

    tasksByAssigneeLoader: new DataLoader<string, Task[]>(async (userIds) => {
      return [...userIds].map((userId) => store.getTasksByAssignee(userId));
    }),

    commentsByTaskLoader: new DataLoader<string, Comment[]>(async (taskIds) => {
      return [...taskIds].map((taskId) => store.getCommentsByTask(taskId));
    }),

    teamMembersLoader: new DataLoader<string, User[]>(async (teamIds) => {
      return [...teamIds].map((teamId) => {
        const members = store.getTeamMembers(teamId);
        return members
          .map((m) => store.getUser(m.userId))
          .filter(Boolean) as User[];
      });
    }),

    projectsByTeamLoader: new DataLoader<string, Project[]>(async (teamIds) => {
      return [...teamIds].map((teamId) => store.getProjectsByTeam(teamId));
    }),

    userTeamsLoader: new DataLoader<string, Team[]>(async (userIds) => {
      return [...userIds].map((userId) => store.getUserTeams(userId));
    }),
  };
}

export type Loaders = ReturnType<typeof createLoaders>;
