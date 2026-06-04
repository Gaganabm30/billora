// server/routes/invoices.js
import express from 'express';
import { useMock, dbStore, prisma } from '../services/dbService.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(authMiddleware);

// 1. GET ALL INVOICES FOR AN ORGANIZATION WITH SEARCH & FILTER
router.get('/', requireRole(['ORG_ADMIN', 'FINANCE_MANAGER', 'TEAM_MEMBER']), async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];
    const { status, search } = req.query;

    let invoices = [];
    if (useMock) {
      invoices = dbStore.invoices.filter(i => i.organizationId === orgId);
      
      // Filter status
      if (status) {
        invoices = invoices.filter(i => i.status === status);
      }
      
      // Filter search
      if (search) {
        invoices = invoices.filter(i => i.invoiceNumber.toLowerCase().includes(search.toLowerCase()));
      }
    } else {
      const where = { organizationId: orgId };
      if (status) {
        where.status = status;
      }
      if (search) {
        where.invoiceNumber = { contains: search, mode: 'insensitive' };
      }

      invoices = await prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });
    }

    return res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve invoice records.' });
  }
});

// 2. GET SINGLE INVOICE DETAILS
router.get('/:id', requireRole(['ORG_ADMIN', 'FINANCE_MANAGER', 'TEAM_MEMBER']), async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];
    const { id } = req.params;

    let invoice;
    if (useMock) {
      invoice = dbStore.invoices.find(i => i.id === id && i.organizationId === orgId);
      if (invoice) {
        const sub = dbStore.subscriptions.find(s => s.id === invoice.subscriptionId);
        const plan = sub ? dbStore.plans.find(p => p.id === sub.planId) : null;
        invoice = {
          ...invoice,
          planName: plan?.name || 'Pro Plan'
        };
      }
    } else {
      invoice = await prisma.invoice.findFirst({
        where: { id, organizationId: orgId },
        include: {
          subscription: {
            include: { plan: true }
          }
        }
      });
      if (invoice) {
        invoice = {
          ...invoice,
          planName: invoice.subscription.plan.name
        };
      }
    }

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    return res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve invoice details.' });
  }
});

export default router;
