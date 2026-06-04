// server/routes/billing.js
import express from 'express';
import { useMock, dbStore, prisma } from '../services/dbService.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(authMiddleware);

// Local memory mock store for saved cards since it doesn't need schema tables
const mockCardsStore = {};

// 1. GET PAYMENT HISTORY FOR ORGANISATION
router.get('/payments', requireRole(['ORG_ADMIN', 'FINANCE_MANAGER']), async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];

    let payments = [];
    if (useMock) {
      payments = dbStore.payments.filter(p => p.organizationId === orgId);
    } else {
      payments = await prisma.payment.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' }
      });
    }

    return res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve payment records.' });
  }
});

// 2. GET SAVED CARDS
router.get('/cards', requireRole(['ORG_ADMIN', 'FINANCE_MANAGER']), async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];
    const cards = mockCardsStore[orgId] || [
      { id: 'card-1', brand: 'Visa', last4: '4242', expMonth: 12, expYear: 2028, isDefault: true },
      { id: 'card-2', brand: 'Mastercard', last4: '8888', expMonth: 6, expYear: 2029, isDefault: false }
    ];
    mockCardsStore[orgId] = cards;
    return res.status(200).json(cards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve cards.' });
  }
});

// 3. ADD SAVED CARD
router.post('/cards', requireRole(['ORG_ADMIN']), async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];
    const { number, expMonth, expYear, cvc, name } = req.body;

    if (!number || !expMonth || !expYear || !cvc) {
      return res.status(400).json({ error: 'Card number, expiration, and CVC are required.' });
    }

    const last4 = number.slice(-4);
    const brand = number.startsWith('5') ? 'Mastercard' : number.startsWith('3') ? 'Amex' : 'Visa';

    const cards = mockCardsStore[orgId] || [];
    const newCard = {
      id: `card-${Math.random().toString(36).substr(2, 9)}`,
      brand,
      last4,
      expMonth: parseInt(expMonth),
      expYear: parseInt(expYear),
      isDefault: cards.length === 0
    };

    cards.push(newCard);
    mockCardsStore[orgId] = cards;

    // Log Activity
    const logAction = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user.id,
      organizationId: orgId,
      action: 'CARD_ADDED',
      details: `Added new saved card ${brand} •••• ${last4}`,
      createdAt: new Date()
    };
    if (useMock) {
      dbStore.activityLogs.push(logAction);
    } else {
      await prisma.activityLog.create({ data: { userId: req.user.id, organizationId: orgId, action: logAction.action, details: logAction.details } });
    }

    return res.status(201).json(newCard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save card.' });
  }
});

// 4. INITIATE REFUND (FINANCE MANAGER / ORG ADMIN)
router.post('/refund/:id', requireRole(['ORG_ADMIN', 'FINANCE_MANAGER']), async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];
    const { id } = req.params;
    const { reason } = req.body;

    let payment;
    if (useMock) {
      payment = dbStore.payments.find(p => p.id === id && p.organizationId === orgId);
      if (!payment) return res.status(404).json({ error: 'Payment record not found.' });

      if (payment.status === 'REFUNDED') {
        return res.status(400).json({ error: 'This payment has already been refunded.' });
      }

      payment.status = 'REFUNDED';
      payment.refundReason = reason || 'Customer request';
      payment.updatedAt = new Date();

      // Find invoice and update status
      if (payment.invoiceId) {
        const inv = dbStore.invoices.find(i => i.id === payment.invoiceId);
        if (inv) inv.status = 'PENDING'; // revert or set to pending/refunded
      }

      // Log activity
      dbStore.activityLogs.push({
        id: `log-${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
        organizationId: orgId,
        action: 'PAYMENT_REFUNDED',
        details: `Refunded payment of $${payment.amount}. Reason: ${payment.refundReason}`,
        createdAt: new Date()
      });

      // Notification
      dbStore.notifications.push({
        id: `notif-${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
        organizationId: orgId,
        title: 'Refund Approved',
        message: `A refund of $${payment.amount} was processed for transaction ${payment.transactionId}.`,
        type: 'GENERAL',
        read: false,
        createdAt: new Date()
      });

      return res.status(200).json(payment);
    } else {
      payment = await prisma.payment.findFirst({
        where: { id, organizationId: orgId }
      });

      if (!payment) return res.status(404).json({ error: 'Payment record not found.' });
      if (payment.status === 'REFUNDED') return res.status(400).json({ error: 'Payment already refunded.' });

      const updated = await prisma.$transaction(async (tx) => {
        const pay = await tx.payment.update({
          where: { id },
          data: { status: 'REFUNDED', refundReason: reason || 'Customer request' }
        });

        if (pay.invoiceId) {
          await tx.invoice.update({
            where: { id: pay.invoiceId },
            data: { status: 'PENDING' }
          });
        }

        await tx.activityLog.create({
          data: {
            userId: req.user.id,
            organizationId: orgId,
            action: 'PAYMENT_REFUNDED',
            details: `Refunded payment of $${pay.amount}. Reason: ${reason}`
          }
        });

        await tx.notification.create({
          data: {
            userId: req.user.id,
            organizationId: orgId,
            title: 'Refund Approved',
            message: `A refund of $${pay.amount} was processed for transaction ${pay.transactionId}.`,
            type: 'GENERAL'
          }
        });

        return pay;
      });

      return res.status(200).json(updated);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process refund request.' });
  }
});

// 5. SIMULATE FAILED PAYMENT (FOR DEMONSTRATIONS & NOTIFICATIONS CHECKING)
router.post('/simulate-failed', requireRole(['ORG_ADMIN', 'FINANCE_MANAGER']), async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];

    const txId = `tx_failed_${Math.random().toString(36).substr(2, 9)}`;
    const invoiceNumber = `INV-FAIL-${Math.floor(100 + Math.random() * 900)}`;

    let sub;
    if (useMock) {
      sub = dbStore.subscriptions.find(s => s.organizationId === orgId);
      const plan = dbStore.plans.find(p => p.id === (sub?.planId || 'plan-pro'));

      const price = plan?.priceMonthly || 49.00;
      const tax = Math.round((price * 0.18) * 100) / 100;
      const total = Math.round((price + tax) * 100) / 100;

      // 1. Create Failed Payment Record
      const failedPayment = {
        id: `pay-failed-${Math.random().toString(36).substr(2, 9)}`,
        organizationId: orgId,
        invoiceId: null,
        amount: total,
        paymentMethod: 'CARD (•••• 4242)',
        status: 'FAILED',
        transactionId: txId,
        refundReason: 'Insufficient funds (SIMULATED)',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      dbStore.payments.push(failedPayment);

      // 2. Create Overdue/Pending Invoice
      const newInvoice = {
        id: `inv-failed-${Math.random().toString(36).substr(2, 9)}`,
        organizationId: orgId,
        subscriptionId: sub?.id || 'sub-acme',
        invoiceNumber,
        amount: price,
        tax,
        total,
        status: 'OVERDUE',
        pdfUrl: `/invoices/${invoiceNumber}.pdf`,
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Due yesterday
        paidAt: null,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      };
      dbStore.invoices.push(newInvoice);
      failedPayment.invoiceId = newInvoice.id;

      // 3. Trigger notification
      dbStore.notifications.push({
        id: `notif-${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
        organizationId: orgId,
        title: 'Payment Failed',
        message: `We were unable to charge your card ending in 4242 for invoice ${invoiceNumber} ($${total}). Insufficient funds.`,
        type: 'PAYMENT_FAILED',
        read: false,
        createdAt: new Date()
      });

      // 4. Log audit trail
      dbStore.activityLogs.push({
        id: `log-${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
        organizationId: orgId,
        action: 'PAYMENT_FAILED',
        details: `Simulated transaction failure of $${total} on card. Invoice ${invoiceNumber} marked OVERDUE.`,
        createdAt: new Date()
      });

      return res.status(200).json({
        success: true,
        payment: failedPayment,
        invoice: newInvoice
      });
    } else {
      sub = await prisma.subscription.findFirst({ where: { organizationId: orgId } });
      const plan = await prisma.plan.findFirst({ where: { slug: 'pro' } });

      const price = plan.priceMonthly;
      const tax = Math.round((price * 0.18) * 100) / 100;
      const total = Math.round((price + tax) * 100) / 100;

      const result = await prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.create({
          data: {
            organizationId: orgId,
            subscriptionId: sub.id,
            invoiceNumber,
            amount: price,
            tax,
            total,
            status: 'OVERDUE',
            dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        });

        const payment = await tx.payment.create({
          data: {
            organizationId: orgId,
            invoiceId: invoice.id,
            amount: total,
            paymentMethod: 'CARD (•••• 4242)',
            status: 'FAILED',
            transactionId: txId,
            refundReason: 'Insufficient funds (SIMULATED)'
          }
        });

        await tx.notification.create({
          data: {
            userId: req.user.id,
            organizationId: orgId,
            title: 'Payment Failed',
            message: `We were unable to charge your card ending in 4242 for invoice ${invoiceNumber} ($${total}). Insufficient funds.`,
            type: 'PAYMENT_FAILED'
          }
        });

        await tx.activityLog.create({
          data: {
            userId: req.user.id,
            organizationId: orgId,
            action: 'PAYMENT_FAILED',
            details: `Simulated transaction failure of $${total} on card. Invoice ${invoiceNumber} marked OVERDUE.`
          }
        });

        return { payment, invoice };
      });

      return res.status(200).json({ success: true, ...result });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to simulate payment failure.' });
  }
});

// 6. PROCESS MOCK PAYMENT SUCCESS (UPI / CARD)
router.post('/process-payment', requireRole(['ORG_ADMIN', 'FINANCE_MANAGER']), async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];
    const { invoiceId, paymentMethod } = req.body;

    if (!invoiceId || !paymentMethod) {
      return res.status(400).json({ error: 'Invoice ID and paymentMethod are required.' });
    }

    const txId = `tx_success_${Math.random().toString(36).substr(2, 9)}`;

    if (useMock) {
      const invoice = dbStore.invoices.find(i => i.id === invoiceId && i.organizationId === orgId);
      if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

      if (invoice.status === 'PAID') {
        return res.status(400).json({ error: 'Invoice is already paid.' });
      }

      invoice.status = 'PAID';
      invoice.paidAt = new Date();
      invoice.updatedAt = new Date();

      const newPayment = {
        id: `pay-${Math.random().toString(36).substr(2, 9)}`,
        organizationId: orgId,
        invoiceId: invoice.id,
        amount: invoice.total,
        paymentMethod,
        status: 'SUCCESS',
        transactionId: txId,
        refundReason: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      dbStore.payments.push(newPayment);

      dbStore.activityLogs.push({
        id: `log-${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
        organizationId: orgId,
        action: 'PAYMENT_SUCCESS',
        details: `Invoice ${invoice.invoiceNumber} paid successfully via ${paymentMethod}.`,
        createdAt: new Date()
      });

      dbStore.notifications.push({
        id: `notif-${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
        organizationId: orgId,
        title: 'Payment Succeeded',
        message: `Payment of $${invoice.total} for invoice ${invoice.invoiceNumber} was successfully processed.`,
        type: 'INVOICE_GENERATED',
        read: false,
        createdAt: new Date()
      });

      return res.status(200).json({ success: true, payment: newPayment, invoice });
    } else {
      const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, organizationId: orgId } });
      if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });
      if (invoice.status === 'PAID') return res.status(400).json({ error: 'Invoice already paid.' });

      const result = await prisma.$transaction(async (tx) => {
        const updatedInvoice = await tx.invoice.update({
          where: { id: invoiceId },
          data: { status: 'PAID', paidAt: new Date() }
        });

        const payment = await tx.payment.create({
          data: {
            organizationId: orgId,
            invoiceId,
            amount: invoice.total,
            paymentMethod,
            status: 'SUCCESS',
            transactionId: txId
          }
        });

        await tx.activityLog.create({
          data: {
            userId: req.user.id,
            organizationId: orgId,
            action: 'PAYMENT_SUCCESS',
            details: `Invoice ${invoice.invoiceNumber} paid successfully via ${paymentMethod}.`
          }
        });

        await tx.notification.create({
          data: {
            userId: req.user.id,
            organizationId: orgId,
            title: 'Payment Succeeded',
            message: `Payment of $${invoice.total} for invoice ${invoice.invoiceNumber} was successfully processed.`,
            type: 'GENERAL'
          }
        });

        return { payment, invoice: updatedInvoice };
      });

      return res.status(200).json({ success: true, ...result });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process payment.' });
  }
});

// 7. CREATE TEST INVOICE (FOR DEMO/FTUE PURPOSES)
router.post('/create-test-invoice', requireRole(['ORG_ADMIN', 'FINANCE_MANAGER']), async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];

    // Find active subscription
    let sub;
    if (useMock) {
      sub = dbStore.subscriptions.find(s => s.organizationId === orgId);
    } else {
      sub = await prisma.subscription.findFirst({ where: { organizationId: orgId } });
    }

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const amount = 120.00;
    const tax = 21.60;
    const total = 141.60;

    let newInvoice;
    if (useMock) {
      newInvoice = {
        id: `inv-test-${Math.random().toString(36).substr(2, 9)}`,
        organizationId: orgId,
        subscriptionId: sub?.id || 'sub-default',
        invoiceNumber,
        amount,
        tax,
        total,
        status: 'PENDING',
        pdfUrl: `/invoices/${invoiceNumber}.pdf`,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        paidAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      dbStore.invoices.push(newInvoice);

      // Notification
      dbStore.notifications.push({
        id: `notif-${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
        organizationId: orgId,
        title: 'Test Invoice Created',
        message: `A test client invoice ${invoiceNumber} for $${total} has been generated.`,
        type: 'INVOICE_GENERATED',
        read: false,
        createdAt: new Date()
      });

      // Activity Log
      dbStore.activityLogs.push({
        id: `log-${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
        organizationId: orgId,
        action: 'INVOICE_GENERATED',
        details: `Generated test client invoice ${invoiceNumber} for $${total}.`,
        createdAt: new Date()
      });
    } else {
      newInvoice = await prisma.invoice.create({
        data: {
          organizationId: orgId,
          subscriptionId: sub.id,
          invoiceNumber,
          amount,
          tax,
          total,
          status: 'PENDING',
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        }
      });

      await prisma.notification.create({
        data: {
          userId: req.user.id,
          organizationId: orgId,
          title: 'Test Invoice Created',
          message: `A test client invoice ${invoiceNumber} for $${total} has been generated.`,
          type: 'INVOICE_GENERATED'
        }
      });

      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          organizationId: orgId,
          action: 'INVOICE_GENERATED',
          details: `Generated test client invoice ${invoiceNumber} for $${total}.`
        }
      });
    }

    return res.status(201).json(newInvoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create test invoice.' });
  }
});

export default router;
