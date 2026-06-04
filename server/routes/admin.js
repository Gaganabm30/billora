// server/routes/admin.js
import express from 'express';
import { useMock, dbStore, prisma } from '../services/dbService.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/rbac.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireSuperAdmin);

// 1. GET GLOBAL ANALYTICS
router.get('/analytics', async (req, res) => {
  try {
    let orgsCount, subsCount, activeSubsCount, totalRevenue = 0, monthlyRevenue = 0;
    let paymentGrowth = [];
    let subGrowth = [];

    if (useMock) {
      orgsCount = dbStore.organizations.length;
      subsCount = dbStore.subscriptions.length;
      activeSubsCount = dbStore.subscriptions.filter(s => s.status === 'ACTIVE').length;
      
      const successPayments = dbStore.payments.filter(p => p.status === 'SUCCESS');
      totalRevenue = successPayments.reduce((acc, curr) => acc + curr.amount, 0);
      
      // Calculate MRR from active subscriptions
      dbStore.subscriptions.forEach(sub => {
        if (sub.status === 'ACTIVE') {
          const plan = dbStore.plans.find(p => p.id === sub.planId);
          if (plan) {
            monthlyRevenue += plan.priceMonthly;
          }
        }
      });

      // Growth trends mock data
      paymentGrowth = [
        { month: 'Jan', revenue: totalRevenue * 0.4 },
        { month: 'Feb', revenue: totalRevenue * 0.6 },
        { month: 'Mar', revenue: totalRevenue * 0.75 },
        { month: 'Apr', revenue: totalRevenue * 0.85 },
        { month: 'May', revenue: totalRevenue }
      ];

      subGrowth = [
        { month: 'Jan', active: 1, trialing: 1 },
        { month: 'Feb', active: 2, trialing: 1 },
        { month: 'Mar', active: 2, trialing: 2 },
        { month: 'Apr', active: activeSubsCount, trialing: subsCount - activeSubsCount }
      ];
    } else {
      orgsCount = await prisma.organization.count();
      subsCount = await prisma.subscription.count();
      activeSubsCount = await prisma.subscription.count({ where: { status: 'ACTIVE' } });
      
      const payments = await prisma.payment.findMany({ where: { status: 'SUCCESS' } });
      totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);

      const activeSubscriptions = await prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        include: { plan: true }
      });
      activeSubscriptions.forEach(sub => {
        monthlyRevenue += sub.plan.priceMonthly;
      });

      paymentGrowth = [
        { month: 'Jan', revenue: totalRevenue * 0.4 },
        { month: 'Feb', revenue: totalRevenue * 0.6 },
        { month: 'Mar', revenue: totalRevenue * 0.8 },
        { month: 'Apr', revenue: totalRevenue }
      ];

      subGrowth = [
        { month: 'Jan', active: 1, trialing: 0 },
        { month: 'Feb', active: activeSubsCount, trialing: subsCount - activeSubsCount }
      ];
    }

    res.status(200).json({
      metrics: {
        organizationsCount: orgsCount,
        subscriptionsCount: subsCount,
        activeSubscriptionsCount: activeSubsCount,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        monthlyRecurringRevenue: Math.round(monthlyRevenue * 100) / 100,
        annualRecurringRevenue: Math.round(monthlyRevenue * 12 * 100) / 100
      },
      paymentGrowth,
      subGrowth
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve global metrics.' });
  }
});

// 2. LIST ALL ORGANIZATIONS
router.get('/organizations', async (req, res) => {
  try {
    let orgs = [];
    if (useMock) {
      orgs = dbStore.organizations.map(org => {
        const sub = dbStore.subscriptions.find(s => s.organizationId === org.id);
        const plan = sub ? dbStore.plans.find(p => p.id === sub.planId) : null;
        return {
          ...org,
          subscription: sub ? { id: sub.id, status: sub.status, planName: plan?.name } : null
        };
      });
    } else {
      orgs = await prisma.organization.findMany({
        include: {
          subscriptions: {
            include: { plan: true },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });
      orgs = orgs.map(org => ({
        ...org,
        subscription: org.subscriptions[0] ? { id: org.subscriptions[0].id, status: org.subscriptions[0].status, planName: org.subscriptions[0].plan.name } : null
      }));
    }
    res.status(200).json(orgs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list organizations.' });
  }
});

// 3. SUSPEND / ACTIVATE ORGANIZATION
router.post('/organizations/:id/status', async (req, res) => {
  try {
    const { status } = req.body; // ACTIVE or SUSPENDED
    const { id } = req.params;

    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be ACTIVE or SUSPENDED.' });
    }

    if (useMock) {
      const org = dbStore.organizations.find(o => o.id === id);
      if (!org) return res.status(404).json({ error: 'Organization not found.' });
      org.status = status;
      org.updatedAt = new Date();
      return res.status(200).json(org);
    } else {
      const org = await prisma.organization.update({
        where: { id },
        data: { status }
      });
      return res.status(200).json(org);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update organization status.' });
  }
});

// 4. LIST ALL PAYMENTS GLOBALLY
router.get('/payments', async (req, res) => {
  try {
    let payments = [];
    if (useMock) {
      payments = dbStore.payments.map(p => {
        const org = dbStore.organizations.find(o => o.id === p.organizationId);
        return { ...p, organizationName: org?.name };
      });
    } else {
      payments = await prisma.payment.findMany({
        include: { organization: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      });
      payments = payments.map(p => ({ ...p, organizationName: p.organization?.name }));
    }
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve payments.' });
  }
});

// 5. UPDATE PLAN
router.put('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, priceMonthly, priceYearly, features, apiLimit, storageLimit, seatLimit } = req.body;

    if (useMock) {
      const plan = dbStore.plans.find(p => p.id === id);
      if (!plan) return res.status(404).json({ error: 'Plan not found.' });

      if (name) plan.name = name;
      if (description) plan.description = description;
      if (priceMonthly !== undefined) plan.priceMonthly = priceMonthly;
      if (priceYearly !== undefined) plan.priceYearly = priceYearly;
      if (features) plan.features = JSON.stringify(features);
      if (apiLimit !== undefined) plan.apiLimit = apiLimit;
      if (storageLimit !== undefined) plan.storageLimit = storageLimit;
      if (seatLimit !== undefined) plan.seatLimit = seatLimit;

      plan.updatedAt = new Date();
      return res.status(200).json(plan);
    } else {
      const plan = await prisma.plan.update({
        where: { id },
        data: {
          name,
          description,
          priceMonthly,
          priceYearly,
          features: features ? features : undefined,
          apiLimit,
          storageLimit,
          seatLimit
        }
      });
      return res.status(200).json(plan);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update pricing plan.' });
  }
});

export default router;
