import { Request, Response, NextFunction } from 'express';

export const basicAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Bull-Board Admin"');
    return res.status(401).send('Autenticação necessária');
  }

  // Decodifica as credenciais enviadas no formato Base64 (user:pass)
  const auth = Buffer.from(authHeader.split(' ')[1] || '', 'base64').toString().split(':');
  const user = auth[0];
  const pass = auth[1];

  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASS || 'admin123';

  if (user === adminUser && pass === adminPass) {
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Bull-Board Admin"');
  return res.status(401).send('Credenciais inválidas');
};