// server/middleware/auth.js
import jwt from 'jsonwebtoken';
import { useMock, dbStore, prisma } from '../services/dbService.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No authorization token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'billora-super-secret-dev-jwt-key-2026');

    let user;
    if (useMock) {
      user = dbStore.users.find(u => u.id === decoded.id);
    } else {
      user = await prisma.user.findUnique({ where: { id: decoded.id } });
    }

    if (!user) {
      return res.status(401).json({ error: 'Access denied. User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Access denied. Invalid or expired token.' });
  }
};
