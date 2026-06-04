// server/routes/subscriptions.js
import express from 'express';
import { useMock, dbStore, prisma } from '../services/dbService.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(authMiddleware);

// 1. GET ALL PLANS
router.get('/plans', async (req, res) => {
  try {
    let plans;
    if (useMock) {
      plans = dbStore.plans.map(p => ({
        ...p,
        features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features
      }));
    } else {
      plans = await prisma.plan.findMany();
      plans = plans.map(p => ({
        ...p,
        features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features
      }));
    }
    return res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve pricing plans.' });
  }
});

// 2. GET ACTIVE SUBSCRIPTION FOR ORGANIZATION
router.get('/active', requireRole(['ORG_ADMIN', 'FINANCE_MANAGER', 'TEAM_MEMBER']), async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];

    let subscription;
    if (useMock) {
      subscription = dbStore.subscriptions.find(s => s.organizationId === orgId);
      if (subscription) {
        const plan = dbStore.plans.find(p => p.id === subscription.planId);
        subscription = {
          ...subscription,
          plan: {
            ...plan,
            features: typeof plan?.features === 'string' ? JSON.parse(plan.features) : plan?.features
          }
        };
      }
    } else {
      subscription = await prisma.subscription.findFirst({
        where: { organizationId: orgId },
        include: { plan: true },
        orderBy: { createdAt: 'desc' }
      });
      if (subscription) {
        subscription.plan.features = typeof subscription.plan.features === 'string' ? JSON.parse(subscription.plan.features) : subscription.plan.features;
      }
    }

    if (!subscription) {
      return res.status(404).json({ error: 'No subscription found for this organization.' });
    }

    return res.status(200).json(subscription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve active subscription.' });
  }
});

// 3. UPGRADE / DOWNGRADE PLAN
router.post('/change', requireRole(['ORG_ADMIN']), async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];
    const { planId, billingCycle } = req.body; // billingCycle: 'monthly' | 'yearly'

    if (!planId) return res.status(400).json({ error: 'Plan ID is required.' });

    let targetPlan;
    if (useMock) {
      targetPlan = dbStore.plans.find(p => p.id === planId);
    } else {
      targetPlan = await prisma.plan.findUnique({ where: { id: planId } });
    }

    if (!targetPlan) {
      return res.status(404).json({ error: 'Target pricing plan not found.' });
    }

    const price = billingCycle === 'yearly' ? targetPlan.priceYearly : targetPlan.priceMonthly;

    let sub;
    if (useMock) {
      sub = dbStore.subscriptions.find(s => s.organizationId === orgId);
      if (!sub) {
        sub = {
          id: `sub-${Math.random().toString(36).substr(2, 9)}`,
          organizationId: orgId,
          planId: targetPlan.id,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        dbStore.subscriptions.push(sub);
      } else {
        sub.planId = targetPlan.id;
        sub.status = 'ACTIVE';
        sub.currentPeriodStart = new Date();
        sub.currentPeriodEnd = new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000);
        sub.updatedAt = new Date();
      }

      // Generate invoice
      const invoiceNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const amount = price;
      const tax = Math.round((amount * 0.18) * 100) / 100; // 18% tax
      const total = Math.round((amount + tax) * 100) / 100;

      const newInvoice = {
        id: `inv-${Math.random().toString(36).substr(2, 9)}`,
        organizationId: orgId,
        subscriptionId: sub.id,
        invoiceNumber,
        amount,
        tax,
        total,
        status: amount === 0 ? 'PAID' : 'PENDING',
        pdfUrl: `/invoices/${invoiceNumber}.pdf`,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        paidAt: amount === 0 ? new Date() : null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      dbStore.invoices.push(newInvoice);

      // Create activity log
      dbStore.activityLogs.push({
        id: `log-${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
        organizationId: orgId,
        action: 'PLAN_UPGRADED',
        details: `Subscribed to ${targetPlan.name} (${billingCycle} billing cycle). Invoice ${invoiceNumber} created.`,
        createdAt: new Date()
      });

      // Notification
      dbStore.notifications.push({
        id: `notif-${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
        organizationId: orgId,
        title: `Plan Changed to ${targetPlan.name}`,
        message: `Your organization plan was changed to ${targetPlan.name}. Invoice ${invoiceNumber} generated.`,
        type: 'GENERAL',
        read: false,
        createdAt: new Date()
      });

      return res.status(200).json({
        subscription: sub,
        invoice: newInvoice
      });
    } else {
      // Postgres transactional modification
      const result = await prisma.$transaction(async (tx) => {
        let subscription = await tx.subscription.findFirst({
          where: { organizationId: orgId }
        });

        if (!subscription) {
          subscription = await tx.subscription.create({
            data: {
              organizationId: orgId,
              planId: targetPlan.id,
              status: 'ACTIVE',
              currentPeriodEnd: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)
            }
          });
        } else {
          subscription = await tx.subscription.update({
            where: { id: subscription.id },
            data: {
              planId: targetPlan.id,
              status: 'ACTIVE',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)
            }
          });
        }

        const invoiceNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const amount = price;
        const tax = Math.round((amount * 0.18) * 100) / 100;
        const total = Math.round((amount + tax) * 100) / 100;

        const invoice = await tx.invoice.create({
          data: {
            organizationId: orgId,
            subscriptionId: subscription.id,
            invoiceNumber,
            amount,
            tax,
            total,
            status: amount === 0 ? 'PAID' : 'PENDING',
            pdfUrl: `/invoices/${invoiceNumber}.pdf`,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            paidAt: amount === 0 ? new Date() : null
          }
        });

        await tx.activityLog.create({
          data: {
            userId: req.user.id,
            organizationId: orgId,
            action: 'PLAN_UPGRADED',
            details: `Subscribed to ${targetPlan.name} (${billingCycle} billing cycle). Invoice ${invoiceNumber} created.`
          }
        });

        await tx.notification.create({
          data: {
            userId: req.user.id,
            organizationId: orgId,
            title: `Plan Changed to ${targetPlan.name}`,
            message: `Your organization plan was changed to ${targetPlan.name}. Invoice ${invoiceNumber} generated.`,
            type: 'GENERAL'
          }
        });

        return { subscription, invoice };
      });

      return res.status(200).json(result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to alter subscription plan.' });
  }
});

// 4. CANCEL / TOGGLE AUTO-RENEW SUBSCRIPTION
router.post('/cancel', requireRole(['ORG_ADMIN']), async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];

    let sub;
    if (useMock) {
      sub = dbStore.subscriptions.find(s => s.organizationId === orgId);
      if (!sub) return res.status(404).json({ error: 'Subscription not found.' });

      sub.cancelAtPeriodEnd = !sub.cancelAtPeriodEnd;
      sub.updatedAt = new Date();

      dbStore.activityLogs.push({
        id: `log-${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
        organizationId: orgId,
        action: sub.cancelAtPeriodEnd ? 'SUBSCRIPTION_CANCELED' : 'SUBSCRIPTION_RENEW_ENABLED',
        details: sub.cancelAtPeriodEnd ? 'Cancelled auto-renewal at period end.' : 'Enabled auto-renewal.',
        createdAt: new Date()
      });

      return res.status(200).json(sub);
    } else {
      sub = await prisma.subscription.findFirst({ where: { organizationId: orgId } });
      if (!sub) return res.status(404).json({ error: 'Subscription not found.' });

      sub = await prisma.subscription.update({
        where: { id: sub.id },
        data: { cancelAtPeriodEnd: !sub.cancelAtPeriodEnd }
      });

      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          organizationId: orgId,
          action: sub.cancelAtPeriodEnd ? 'SUBSCRIPTION_CANCELED' : 'SUBSCRIPTION_RENEW_ENABLED',
          details: sub.cancelAtPeriodEnd ? 'Cancelled auto-renewal at period end.' : 'Enabled auto-renewal.'
        }
      });

      return res.status(200).json(sub);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to process cancellation toggle.' });
  }
});

// 5. COUPON CODE VALIDATION
router.post('/coupon', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Coupon code is required.' });

    const coupons = {
      'BILLORA50': { discount: 50, description: '50% off billing' },
      'GROWTH20': { discount: 20, description: '20% off billing' },
      'FREEPRO': { discount: 100, description: '100% off trial' }
    };

    const cleanCode = code.trim().toUpperCase();
    const coupon = coupons[cleanCode];

    if (!coupon) {
      return res.status(400).json({ error: 'Invalid coupon code.' });
    }

    res.status(200).json({ code: cleanCode, ...coupon });
  } catch (error) {
    res.status(500).json({ error: 'Coupon validation failed.' });
  }
});

export default router;
