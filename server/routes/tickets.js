// server/routes/tickets.js
import express from 'express';
import { useMock, dbStore, prisma } from '../services/dbService.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(authMiddleware);

// 1. GET ALL TICKETS FOR AN ORGANIZATION
router.get('/', requireRole(['ORG_ADMIN', 'FINANCE_MANAGER', 'TEAM_MEMBER']), async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];

    let tickets = [];
    if (useMock) {
      tickets = dbStore.tickets.filter(t => t.organizationId === orgId);
    } else {
      tickets = await prisma.ticket.findMany({
        where: { organizationId: orgId },
        include: {
          user: { select: { name: true, email: true } }
        },
        orderBy: { updatedAt: 'desc' }
      });
    }

    // Parse chatHistory JSON string if needed
    const parsedTickets = tickets.map(t => ({
      ...t,
      chatHistory: typeof t.chatHistory === 'string' ? JSON.parse(t.chatHistory) : t.chatHistory
    }));

    return res.status(200).json(parsedTickets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve support tickets.' });
  }
});

// 2. RAISE A SUPPORT TICKET
router.post('/', requireRole(['ORG_ADMIN', 'FINANCE_MANAGER', 'TEAM_MEMBER']), async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];
    const { title, description, priority } = req.body; // priority: LOW | MEDIUM | HIGH

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }

    const defaultHistory = [
      {
        sender: 'user',
        text: description,
        time: new Date().toISOString()
      },
      {
        sender: 'support',
        text: `Hi ${req.user.name}, thank you for contacting Billora Support. We have received your ticket regarding "${title}" and opened it with ${priority || 'MEDIUM'} priority. An agent will review this shortly.`,
        time: new Date(Date.now() + 2000).toISOString()
      }
    ];

    if (useMock) {
      const newTicket = {
        id: `tick-${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
        organizationId: orgId,
        title,
        description,
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        chatHistory: JSON.stringify(defaultHistory),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      dbStore.tickets.push(newTicket);

      // Audit Log
      dbStore.activityLogs.push({
        id: `log-${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
        organizationId: orgId,
        action: 'TICKET_CREATED',
        details: `Raised support ticket: "${title}" (Priority: ${priority || 'MEDIUM'})`,
        createdAt: new Date()
      });

      return res.status(201).json({
        ...newTicket,
        chatHistory: defaultHistory
      });
    } else {
      const ticket = await prisma.ticket.create({
        data: {
          userId: req.user.id,
          organizationId: orgId,
          title,
          description,
          priority: priority || 'MEDIUM',
          status: 'OPEN',
          chatHistory: JSON.stringify(defaultHistory)
        }
      });

      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          organizationId: orgId,
          action: 'TICKET_CREATED',
          details: `Raised support ticket: "${title}" (Priority: ${priority || 'MEDIUM'})`
        }
      });

      return res.status(201).json({
        ...ticket,
        chatHistory: defaultHistory
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create support ticket.' });
  }
});

// 3. GET SINGLE TICKET
router.get('/:id', requireRole(['ORG_ADMIN', 'FINANCE_MANAGER', 'TEAM_MEMBER']), async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];
    const { id } = req.params;

    let ticket;
    if (useMock) {
      ticket = dbStore.tickets.find(t => t.id === id && t.organizationId === orgId);
    } else {
      ticket = await prisma.ticket.findFirst({
        where: { id, organizationId: orgId }
      });
    }

    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found.' });
    }

    return res.status(200).json({
      ...ticket,
      chatHistory: typeof ticket.chatHistory === 'string' ? JSON.parse(ticket.chatHistory) : ticket.chatHistory
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve ticket.' });
  }
});

// 4. SEND MESSAGE IN TICKET CHAT (WITH AUTO-RESPONSE SIMULATION)
router.post('/:id/message', requireRole(['ORG_ADMIN', 'FINANCE_MANAGER', 'TEAM_MEMBER']), async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];
    const { id } = req.params;
    const { text } = req.body;

    if (!text) return res.status(400).json({ error: 'Message text is required.' });

    let ticket;
    if (useMock) {
      ticket = dbStore.tickets.find(t => t.id === id && t.organizationId === orgId);
    } else {
      ticket = await prisma.ticket.findFirst({ where: { id, organizationId: orgId } });
    }

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    const history = typeof ticket.chatHistory === 'string' ? JSON.parse(ticket.chatHistory) : ticket.chatHistory;
    
    // 1. Add user message
    const userMsg = {
      sender: 'user',
      text,
      time: new Date().toISOString()
    };
    history.push(userMsg);

    // 2. Add automated support reply
    const supportMsg = {
      sender: 'support',
      text: `Thanks for the update. We've logged this message and our engineering team has been notified. We will get back to you shortly.`,
      time: new Date(Date.now() + 1000).toISOString()
    };
    history.push(supportMsg);

    // Update status to IN_PROGRESS
    const updatedStatus = 'IN_PROGRESS';

    if (useMock) {
      ticket.chatHistory = JSON.stringify(history);
      ticket.status = updatedStatus;
      ticket.updatedAt = new Date();
      return res.status(200).json({
        ...ticket,
        chatHistory: history
      });
    } else {
      const updated = await prisma.ticket.update({
        where: { id },
        data: {
          chatHistory: JSON.stringify(history),
          status: updatedStatus
        }
      });
      return res.status(200).json({
        ...updated,
        chatHistory: history
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// 5. SOLVE TICKET
router.post('/:id/resolve', requireRole(['ORG_ADMIN', 'FINANCE_MANAGER', 'TEAM_MEMBER']), async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];
    const { id } = req.params;

    if (useMock) {
      const ticket = dbStore.tickets.find(t => t.id === id && t.organizationId === orgId);
      if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });

      ticket.status = 'RESOLVED';
      ticket.updatedAt = new Date();

      dbStore.activityLogs.push({
        id: `log-${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
        organizationId: orgId,
        action: 'TICKET_RESOLVED',
        details: `Closed ticket: "${ticket.title}"`,
        createdAt: new Date()
      });

      return res.status(200).json({
        ...ticket,
        chatHistory: typeof ticket.chatHistory === 'string' ? JSON.parse(ticket.chatHistory) : ticket.chatHistory
      });
    } else {
      const ticket = await prisma.ticket.findFirst({ where: { id, organizationId: orgId } });
      if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });

      const updated = await prisma.ticket.update({
        where: { id },
        data: { status: 'RESOLVED' }
      });

      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          organizationId: orgId,
          action: 'TICKET_RESOLVED',
          details: `Closed ticket: "${ticket.title}"`
        }
      });

      return res.status(200).json({
        ...updated,
        chatHistory: typeof updated.chatHistory === 'string' ? JSON.parse(updated.chatHistory) : updated.chatHistory
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve ticket.' });
  }
});

export default router;
