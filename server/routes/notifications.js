// server/routes/notifications.js
import express from 'express';
import { useMock, dbStore, prisma } from '../services/dbService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// 1. GET ALL NOTIFICATIONS FOR USER
router.get('/', async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];

    let notifications = [];
    if (useMock) {
      notifications = dbStore.notifications.filter(
        n => n.userId === req.user.id && (!orgId || n.organizationId === orgId || n.organizationId === null)
      );
    } else {
      const where = { userId: req.user.id };
      if (orgId) {
        where.OR = [
          { organizationId: orgId },
          { organizationId: null }
        ];
      }
      notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });
    }

    return res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

// 2. MARK NOTIFICATION AS READ
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    if (useMock) {
      const notif = dbStore.notifications.find(n => n.id === id && n.userId === req.user.id);
      if (!notif) return res.status(404).json({ error: 'Notification not found.' });

      notif.read = true;
      return res.status(200).json(notif);
    } else {
      const check = await prisma.notification.findFirst({
        where: { id, userId: req.user.id }
      });
      if (!check) return res.status(404).json({ error: 'Notification not found.' });

      const notif = await prisma.notification.update({
        where: { id },
        data: { read: true }
      });
      return res.status(200).json(notif);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification state.' });
  }
});

// 3. MARK ALL AS READ
router.put('/read-all/batch', async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];

    if (useMock) {
      dbStore.notifications.forEach(n => {
        if (n.userId === req.user.id && (!orgId || n.organizationId === orgId)) {
          n.read = true;
        }
      });
      return res.status(200).json({ success: true });
    } else {
      const where = { userId: req.user.id };
      if (orgId) {
        where.organizationId = orgId;
      }

      await prisma.notification.updateMany({
        where,
        data: { read: true }
      });
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notifications.' });
  }
});

export default router;
