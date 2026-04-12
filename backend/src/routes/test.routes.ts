import { Router, Response, Request } from 'express';

const router = Router();

const asyncHandler = (fn: (req: Request, res: Response) => Promise<any>) => {
  return (req: Request, res: Response) => {
    return fn(req, res).catch((err) => {
      console.error('Async error:', err);
      console.error('Stack:', err?.stack);
      res.status(500).json({ success: false, error: err?.message || 'Internal server error' });
    });
  };
};

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'API running' });
});

export default router;