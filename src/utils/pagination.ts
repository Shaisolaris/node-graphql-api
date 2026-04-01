import type { Connection, PaginationArgs } from '../types/index.js';
import { ValidationError } from '../errors/index.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function encodeCursor(id: string): string {
  return Buffer.from(`cursor:${id}`).toString('base64');
}

export function decodeCursor(cursor: string): string {
  const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
  if (!decoded.startsWith('cursor:')) {
    throw new ValidationError('Invalid cursor format');
  }
  return decoded.slice(7);
}

export function paginate<T extends { id: string }>(
  items: T[],
  args: PaginationArgs,
): Connection<T> {
  const { first, after, last, before } = args;

  if (first != null && last != null) {
    throw new ValidationError('Cannot specify both "first" and "last"');
  }

  if (first != null && first < 0) {
    throw new ValidationError('"first" must be a non-negative integer');
  }

  if (last != null && last < 0) {
    throw new ValidationError('"last" must be a non-negative integer');
  }

  const totalCount = items.length;
  let sliced = [...items];

  // Apply "after" cursor
  if (after) {
    const afterId = decodeCursor(after);
    const afterIndex = sliced.findIndex((item) => item.id === afterId);
    if (afterIndex >= 0) {
      sliced = sliced.slice(afterIndex + 1);
    }
  }

  // Apply "before" cursor
  if (before) {
    const beforeId = decodeCursor(before);
    const beforeIndex = sliced.findIndex((item) => item.id === beforeId);
    if (beforeIndex >= 0) {
      sliced = sliced.slice(0, beforeIndex);
    }
  }

  // Apply "first" or "last" limit
  const limit = Math.min(first ?? last ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  let hasNextPage = false;
  let hasPreviousPage = false;

  if (first != null || (!first && !last)) {
    hasNextPage = sliced.length > limit;
    sliced = sliced.slice(0, limit);
    hasPreviousPage = !!after;
  } else if (last != null) {
    hasPreviousPage = sliced.length > limit;
    sliced = sliced.slice(Math.max(sliced.length - limit, 0));
    hasNextPage = !!before;
  }

  const edges = sliced.map((node) => ({
    cursor: encodeCursor(node.id),
    node,
  }));

  return {
    edges,
    pageInfo: {
      hasNextPage,
      hasPreviousPage,
      startCursor: edges.length > 0 ? edges[0]!.cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1]!.cursor : null,
    },
    totalCount,
  };
}
