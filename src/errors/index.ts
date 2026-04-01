import { GraphQLError } from 'graphql';

export class AuthenticationError extends GraphQLError {
  constructor(message = 'You must be logged in') {
    super(message, {
      extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } },
    });
  }
}

export class ForbiddenError extends GraphQLError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, {
      extensions: { code: 'FORBIDDEN', http: { status: 403 } },
    });
  }
}

export class NotFoundError extends GraphQLError {
  constructor(resource: string, id?: string) {
    const msg = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(msg, {
      extensions: { code: 'NOT_FOUND', http: { status: 404 } },
    });
  }
}

export class ValidationError extends GraphQLError {
  constructor(message: string, fields?: Record<string, string>) {
    super(message, {
      extensions: { code: 'VALIDATION_ERROR', http: { status: 400 }, fields },
    });
  }
}

export class TenantMismatchError extends GraphQLError {
  constructor() {
    super('Resource does not belong to your tenant', {
      extensions: { code: 'TENANT_MISMATCH', http: { status: 403 } },
    });
  }
}
