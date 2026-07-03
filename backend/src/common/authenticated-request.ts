import type { Request as ExpressRequest } from 'express';

export type AuthenticatedRequest = ExpressRequest & {
  user: {
    id: string;
    email: string;
  };
};
