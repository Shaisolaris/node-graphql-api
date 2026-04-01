export const typeDefs = `#graphql
  # =============================================
  # Enums
  # =============================================

  enum TenantPlan {
    FREE
    PRO
    ENTERPRISE
  }

  enum UserRole {
    OWNER
    ADMIN
    MEMBER
    VIEWER
  }

  enum TeamMemberRole {
    LEAD
    MEMBER
  }

  enum ProjectStatus {
    PLANNING
    ACTIVE
    PAUSED
    COMPLETED
    ARCHIVED
  }

  enum TaskStatus {
    TODO
    IN_PROGRESS
    REVIEW
    DONE
  }

  enum TaskPriority {
    LOW
    MEDIUM
    HIGH
    URGENT
  }

  # =============================================
  # Pagination (Relay-style connections)
  # =============================================

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type UserEdge {
    cursor: String!
    node: User!
  }

  type UserConnection {
    edges: [UserEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ProjectEdge {
    cursor: String!
    node: Project!
  }

  type ProjectConnection {
    edges: [ProjectEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type TaskEdge {
    cursor: String!
    node: Task!
  }

  type TaskConnection {
    edges: [TaskEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type CommentEdge {
    cursor: String!
    node: Comment!
  }

  type CommentConnection {
    edges: [CommentEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  # =============================================
  # Core types
  # =============================================

  type Tenant {
    id: ID!
    name: String!
    slug: String!
    plan: TenantPlan!
    users: [User!]!
    teams: [Team!]!
    createdAt: String!
    updatedAt: String!
  }

  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    fullName: String!
    role: UserRole!
    avatarUrl: String
    tenant: Tenant!
    teams: [Team!]!
    assignedTasks(first: Int, after: String): TaskConnection!
    createdAt: String!
    updatedAt: String!
  }

  type Team {
    id: ID!
    name: String!
    description: String
    members: [User!]!
    projects: [Project!]!
    tenant: Tenant!
    createdAt: String!
    updatedAt: String!
  }

  type Project {
    id: ID!
    name: String!
    description: String
    status: ProjectStatus!
    startDate: String
    endDate: String
    team: Team!
    createdBy: User!
    tasks(first: Int, after: String, status: TaskStatus): TaskConnection!
    tenant: Tenant!
    createdAt: String!
    updatedAt: String!
  }

  type Task {
    id: ID!
    title: String!
    description: String
    status: TaskStatus!
    priority: TaskPriority!
    dueDate: String
    completedAt: String
    project: Project!
    assignee: User
    createdBy: User!
    comments(first: Int, after: String): CommentConnection!
    tenant: Tenant!
    createdAt: String!
    updatedAt: String!
  }

  type Comment {
    id: ID!
    body: String!
    task: Task!
    author: User!
    createdAt: String!
    updatedAt: String!
  }

  # =============================================
  # Auth types
  # =============================================

  type AuthResponse {
    accessToken: String!
    refreshToken: String!
    user: User!
  }

  # =============================================
  # Input types
  # =============================================

  input CreateProjectInput {
    name: String!
    description: String
    teamId: ID!
    status: ProjectStatus
    startDate: String
    endDate: String
  }

  input UpdateProjectInput {
    name: String
    description: String
    status: ProjectStatus
    startDate: String
    endDate: String
  }

  input CreateTaskInput {
    projectId: ID!
    title: String!
    description: String
    assigneeId: ID
    priority: TaskPriority
    dueDate: String
  }

  input UpdateTaskInput {
    title: String
    description: String
    status: TaskStatus
    priority: TaskPriority
    assigneeId: ID
    dueDate: String
  }

  input CreateTeamInput {
    name: String!
    description: String
  }

  input AddTeamMemberInput {
    teamId: ID!
    userId: ID!
    role: TeamMemberRole
  }

  input CreateCommentInput {
    taskId: ID!
    body: String!
  }

  # =============================================
  # Queries
  # =============================================

  type Query {
    # Auth
    me: User

    # Tenant
    tenant: Tenant

    # Users
    users(first: Int, after: String): UserConnection!
    user(id: ID!): User

    # Teams
    teams: [Team!]!
    team(id: ID!): Team

    # Projects
    projects(first: Int, after: String, status: ProjectStatus): ProjectConnection!
    project(id: ID!): Project

    # Tasks
    tasks(first: Int, after: String, status: TaskStatus, priority: TaskPriority): TaskConnection!
    task(id: ID!): Task
    myTasks(first: Int, after: String, status: TaskStatus): TaskConnection!
  }

  # =============================================
  # Mutations
  # =============================================

  type Mutation {
    # Auth
    login(email: String!, password: String!): AuthResponse!
    refreshToken(refreshToken: String!): AuthResponse!

    # Projects
    createProject(input: CreateProjectInput!): Project!
    updateProject(id: ID!, input: UpdateProjectInput!): Project!
    deleteProject(id: ID!): Boolean!

    # Tasks
    createTask(input: CreateTaskInput!): Task!
    updateTask(id: ID!, input: UpdateTaskInput!): Task!
    deleteTask(id: ID!): Boolean!

    # Teams
    createTeam(input: CreateTeamInput!): Team!
    addTeamMember(input: AddTeamMemberInput!): Team!
    removeTeamMember(teamId: ID!, userId: ID!): Team!

    # Comments
    createComment(input: CreateCommentInput!): Comment!
    deleteComment(id: ID!): Boolean!
  }

  # =============================================
  # Subscriptions
  # =============================================

  type Subscription {
    taskUpdated(projectId: ID): Task!
    taskCreated(projectId: ID): Task!
    commentAdded(taskId: ID!): Comment!
  }
`;
