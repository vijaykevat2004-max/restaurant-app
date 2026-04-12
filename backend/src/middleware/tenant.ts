import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';

export const tenantIsolation = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  next();
};

export const requireBranch = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  if (!req.user.branchId && req.user.role === 'STAFF') {
    res.status(403).json({ 
      success: false, 
      error: 'No branch assigned. Please contact your manager.' 
    });
    return;
  }

  next();
};
