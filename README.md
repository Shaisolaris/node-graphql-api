# node-graphql-api

Production-ready GraphQL API built with Apollo Server 4, TypeScript, and a multi-tenant SaaS data model. Features DataLoader for N+1 query prevention, JWT authentication with refresh token rotation, real-time WebSocket subscriptions, and Relay-style cursor pagination.

## Stack

- **Runtime:** Node.js 20+, TypeScript 5
- **GraphQL:** Apollo Server 4, schema-first SDL
- **Subscriptions:** graphql-ws over WebSocket (ws)
- **Auth:** JWT access + refresh tokens (jsonwebtoken, bcryptjs)
- **N+1 Prevention:** DataLoader with 11 batch loaders
- **Logging:** Winston structured logging with levels and transports
- **HTTP:** Express 5, CORS, JSON body parsing

## Architecture

```
src/
├── index.ts              # Server entry — Apollo + Express + WS setup
├── schema/
│   └── typeDefs.ts       # Full SDL schema (types, inputs, enums, connections)
├── resolvers/
│   ├── index.ts          # Deep-merged resolver map
│   ├── auth.ts           # login, refreshToken, me
│   ├── user.ts           # User queries + field resolvers
│   ├── team.ts           # Team CRUD + member management
│   ├── project.ts        # Project CRUD with cascading deletes
│   ├── task.ts           # Task CRUD with subscription publishing
│   ├── comment.ts        # Comment CRUD with auth checks
│   ├── tenant.ts         # Tenant resolver
│   ├── subscription.ts   # Filtered subscriptions (taskUpdated, taskCreated, commentAdded)
│   └── pubsub.ts         # PubSub instance + event constants
├── context/
│   └── index.ts          # HTTP + WebSocket context factories
├── auth/
│   ├── jwt.ts            # Token generation, verification, password hashing
│   └── guards.ts         # requireAuth, requireRole, requireTenant helpers
├── loaders/
│   └── index.ts          # DataLoader factory (users, teams, projects, tasks, comments + relations)
├── db/
│   ├── store.ts          # In-memory data store with typed query methods
│   └── seed.ts           # Sample data (2 tenants, 5 users, 2 teams, 3 projects, 8 tasks, 3 comments)
├── errors/
│   └── index.ts          # AuthenticationError, ForbiddenError, NotFoundError, ValidationError, TenantMismatchError
├── logger/
│   └── index.ts          # Winston logger with structured metadata
├── types/
│   └── index.ts          # All TypeScript interfaces and type aliases
└── utils/
    └── pagination.ts     # Relay cursor encoding/decoding + paginate() helper
```

## Data Model

Multi-tenant SaaS with strict tenant isolation:

- **Tenant** — Organization with plan tier (free/pro/enterprise)
- **User** — Belongs to a tenant, has role (owner/admin/member/viewer)
- **Team** — Group of users within a tenant, with lead/member roles
- **Project** — Belongs to a team, has status lifecycle (planning → active → paused → completed → archived)
- **Task** — Belongs to a project, assignable to a user, with priority and status tracking
- **Comment** — Belongs to a task, authored by a user

Every query is scoped to the authenticated user's tenant. Cross-tenant access is blocked at the resolver level.

## Setup

```bash
# Clone
git clone https://github.com/Shaisolaris/node-graphql-api.git
cd node-graphql-api

# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your JWT secrets

# Development
npm run dev

# Production build
npm run build
npm start
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | HTTP server port |
| `HOST` | `0.0.0.0` | Bind address |
| `NODE_ENV` | `development` | Environment (production disables introspection) |
| `JWT_SECRET` | dev fallback | Access token signing secret |
| `JWT_EXPIRES_IN` | `24h` | Access token lifetime |
| `REFRESH_SECRET` | dev fallback | Refresh token signing secret |
| `REFRESH_EXPIRES_IN` | `7d` | Refresh token lifetime |
| `LOG_LEVEL` | `info` | Winston log level |

## API Endpoints

| Endpoint | Protocol | Description |
|---|---|---|
| `POST /graphql` | HTTP | GraphQL queries and mutations |
| `ws://host:port/graphql` | WebSocket | GraphQL subscriptions |
| `GET /health` | HTTP | Health check (status, uptime, timestamp) |

## Authentication

Login to receive an access token and refresh token:

```graphql
mutation {
  login(email: "alice@acme.com", password: "password123") {
    accessToken
    refreshToken
    user { id firstName lastName role }
  }
}
```

Include the access token in subsequent requests:

```
Authorization: Bearer <accessToken>
```

Refresh an expired access token:

```graphql
mutation {
  refreshToken(refreshToken: "<refreshToken>") {
    accessToken
    refreshToken
    user { id }
  }
}
```

## Example Queries

**Paginated projects with tasks:**

```graphql
query {
  projects(first: 10) {
    edges {
      cursor
      node {
        id
        name
        status
        team { name }
        tasks(first: 5) {
          edges {
            node { title status priority assignee { fullName } }
          }
          totalCount
        }
      }
    }
    pageInfo { hasNextPage endCursor }
    totalCount
  }
}
```

**Create a task:**

```graphql
mutation {
  createTask(input: {
    projectId: "p1"
    title: "Implement rate limiting"
    priority: HIGH
    assigneeId: "u2"
  }) {
    id
    title
    status
    priority
    assignee { fullName }
  }
}
```

**Subscribe to task updates:**

```graphql
subscription {
  taskUpdated(projectId: "p1") {
    id
    title
    status
    priority
    assignee { fullName }
  }
}
```

## Key Design Decisions

**Schema-first SDL over code-first.** The schema is the contract. SDL keeps it readable and diffable. Resolvers implement the schema, not the other way around. This matches how most production teams work — schema review happens independently of resolver implementation.

**DataLoader for every relationship.** 11 batch loaders cover all entity lookups and relation traversals. A query like `projects → tasks → assignee → teams` that would produce dozens of individual lookups in a naive implementation batches down to a handful of calls per entity type. Loaders are created per-request to prevent cross-request data leaking.

**Relay-style cursor pagination.** Base64-encoded cursors with forward (first/after) and backward (last/before) support. Consistent interface across all list fields. Page size capped at 100 to prevent abuse.

**Tenant isolation at the resolver layer.** Every query checks `tenantId` against the authenticated user's tenant. There is no way to access another tenant's data through the API. This is enforced in resolvers rather than middleware because different operations have different authorization requirements.

**Custom error classes with HTTP status codes.** Each error type maps to a GraphQL error extension code and an appropriate HTTP status. AuthenticationError → 401, ForbiddenError → 403, NotFoundError → 404, ValidationError → 400. Production mode hides internal error details.

**In-memory store with real query patterns.** The store uses Maps with typed accessor methods that mirror what you would write against a real database. Swapping to Prisma, Drizzle, or raw SQL is a matter of replacing the store methods — the resolver and loader interfaces stay identical.

**Subscriptions with per-field filtering.** Task and comment subscriptions accept optional filter arguments (projectId, taskId). The custom `withFilter` implementation only delivers events matching the subscriber's filter, avoiding unnecessary client-side processing.

## Seed Data

The server starts with pre-loaded data for testing:

- **Tenants:** Acme Corp (pro), Globex Industries (enterprise)
- **Users:** Alice (owner), Bob (admin), Charlie (member), Diana (member) at Acme; Hank (owner) at Globex
- **Teams:** Engineering, Design at Acme
- **Projects:** API v2 Rewrite (active), Mobile App Backend (planning), Design System (active)
- **Tasks:** 8 tasks across projects with various statuses and priorities
- **Comments:** 3 comments on tasks

All seed users use password `password123`.

## License

MIT
