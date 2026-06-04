// server/routes/audit.js
import express from 'express';
import { useMock, dbStore, prisma } from '../services/dbService.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(authMiddleware);

// 1. GET ALL AUDIT LOGS FOR AN ORGANIZATION
router.get('/', requireRole(['ORG_ADMIN', 'FINANCE_MANAGER']), async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];

    let logs = [];
    if (useMock) {
      logs = dbStore.activityLogs
        .filter(l => l.organizationId === orgId)
        .map(l => {
          const user = dbStore.users.find(u => u.id === l.userId);
          return {
            ...l,
            userName: user?.name || 'System',
            userEmail: user?.email || 'system@billora.com'
          };
        });
    } else {
      logs = await prisma.activityLog.findMany({
        where: { organizationId: orgId },
        include: {
          user: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      logs = logs.map(l => ({
        ...l,
        userName: l.user?.name || 'System',
        userEmail: l.user?.email || 'system@billora.com'
      }));
    }

    return res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve activity audit logs.' });
  }
});

export default router;
