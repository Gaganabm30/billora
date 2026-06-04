// server/routes/usage.js
import express from 'express';
import { useMock, dbStore, prisma } from '../services/dbService.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(authMiddleware);

// 1. GET USAGE DATA
router.get('/', requireRole(['ORG_ADMIN', 'FINANCE_MANAGER', 'TEAM_MEMBER']), async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];

    let sub, plan, membersCount = 0;
    if (useMock) {
      sub = dbStore.subscriptions.find(s => s.organizationId === orgId);
      plan = sub ? dbStore.plans.find(p => p.id === sub.planId) : dbStore.plans[0];
      membersCount = dbStore.members.filter(m => m.organizationId === orgId && m.status === 'ACTIVE').length;
    } else {
      sub = await prisma.subscription.findFirst({
        where: { organizationId: orgId },
        include: { plan: true },
        orderBy: { createdAt: 'desc' }
      });
      plan = sub ? sub.plan : await prisma.plan.findFirst({ where: { slug: 'free' } });
      membersCount = await prisma.member.count({
        where: { organizationId: orgId, status: 'ACTIVE' }
      });
    }

    if (plan.features && typeof plan.features === 'string') {
      plan = { ...plan, features: JSON.parse(plan.features) };
    }

    // Dynamic mock usage counters keyed by organization id
    // Set seed based on orgId characters to remain relatively stable per org but unique
    const hash = orgId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // API limits & usage
    const apiLimit = plan.apiLimit;
    const apiUsed = Math.round((hash * 47) % (apiLimit * 0.9)); // Up to 90% of limit
    const apiPercentage = Math.round((apiUsed / apiLimit) * 100);

    // Storage limits & usage
    const storageLimit = plan.storageLimit; // MB
    let storageUsed = Math.round((hash * 13) % (storageLimit * 0.95)); // MB
    // Let's force Acme to have high storage to show warning alerts
    if (orgId === 'org-acme') {
      storageUsed = 8500; // 8.5 GB out of 10 GB (85% - triggers warning!)
    }
    const storagePercentage = Math.round((storageUsed / storageLimit) * 100);

    // Seats limits & usage
    const seatLimit = plan.seatLimit;
    const seatPercentage = seatLimit > 0 ? Math.round((membersCount / seatLimit) * 100) : 0;

    res.status(200).json({
      plan: {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        seatLimit,
        storageLimit,
        apiLimit
      },
      metrics: {
        api: {
          used: apiUsed,
          limit: apiLimit,
          percentage: apiPercentage,
          status: apiPercentage > 85 ? 'DANGER' : apiPercentage > 70 ? 'WARNING' : 'NORMAL'
        },
        storage: {
          used: storageUsed, // MB
          limit: storageLimit, // MB
          percentage: storagePercentage,
          status: storagePercentage > 85 ? 'DANGER' : storagePercentage > 70 ? 'WARNING' : 'NORMAL'
        },
        seats: {
          used: membersCount,
          limit: seatLimit,
          percentage: seatPercentage,
          status: seatPercentage >= seatLimit ? 'DANGER' : seatPercentage > 80 ? 'WARNING' : 'NORMAL'
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve usage metrics.' });
  }
});

export default router;
