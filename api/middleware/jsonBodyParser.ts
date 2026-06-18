import express, { Request, Response, NextFunction } from 'express';

const JSON_CONTENT_TYPES = [
  'application/json',
  'application/json; charset=utf-8',
  'application/json;charset=utf-8',
  'application/json; charset=UTF-8',
  'application/json;charset=UTF-8'
];

function isJsonContentType(contentType: string | undefined): boolean {
  if (!contentType) return false;
  const normalized = contentType.toLowerCase().trim();
  return JSON_CONTENT_TYPES.some((ct) => normalized.startsWith(ct));
}

function tryParseJsonString(str: string): any | null {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export const enhancedJsonParser = [
  (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'];
    const contentLength = req.headers['content-length'];
    const method = req.method;

    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      if (!contentType) {
        if (contentLength && parseInt(contentLength) > 0) {
          req.headers['content-type'] = 'application/json';
        }
      } else if (!isJsonContentType(contentType) && !contentType.includes('multipart/form-data') && !contentType.includes('application/x-www-form-urlencoded')) {
        req.headers['content-type'] = 'application/json';
      }
    }
    next();
  },

  express.json({
    limit: '10mb',
    strict: true,
    type: (req: any) => {
      const contentType = req.headers['content-type'];
      if (!contentType) return false;
      return isJsonContentType(contentType) || /.*\+json$/.test(contentType);
    }
  }),

  (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err && err.type === 'entity.parse.failed') {
      const rawBody = (req as any).rawBody || '(not available)';
      console.warn(`[JSON Parse Error] ${req.method} ${req.path}`);
      console.warn(`  Content-Type: ${req.headers['content-type']}`);
      console.warn(`  Raw body preview: ${String(rawBody).slice(0, 200)}`);
      console.warn(`  Error: ${err.message}`);

      return res.status(400).json({
        error: 'Invalid JSON payload',
        details: err.message
      });
    }

    if (err && err.type === 'entity.too.large') {
      return res.status(413).json({
        error: 'Payload too large',
        details: 'Maximum payload size is 10MB'
      });
    }

    next(err);
  },

  (req: Request, res: Response, next: NextFunction) => {
    const method = req.method;

    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      if (!req.body) {
        req.body = {};
      } else if (typeof req.body === 'string') {
        const parsed = tryParseJsonString(req.body);
        if (parsed !== null) {
          req.body = parsed;
        }
      }
    }
    next();
  }
];
