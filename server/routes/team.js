// server/routes/team.js
import express from 'express';
import { useMock, dbStore, prisma } from '../services/dbService.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(authMiddleware);

// Helper helper to map roles to specific permissions
const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['manage_all_orgs', 'view_global_analytics', 'suspend_orgs', 'manage_plans', 'view_all_payments'],
  ORG_ADMIN: ['invite_users', 'assign_roles', 'manage_subscriptions', 'view_analytics', 'manage_billing'],
  FINANCE_MANAGER: ['view_invoices', 'export_reports', 'manage_refunds', 'view_payment_history'],
  TEAM_MEMBER: ['view_usage', 'view_current_plan', 'raise_support_tickets']
};

// 1. GET TEAM MEMBERS
router.get('/', requireRole(['ORG_ADMIN', 'FINANCE_MANAGER', 'TEAM_MEMBER']), async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];

    let members = [];
    if (useMock) {
      members = dbStore.members
        .filter(m => m.organizationId === orgId)
        .map(m => {
          const user = dbStore.users.find(u => u.id === m.userId);
          return {
            id: m.id,
            userId: m.userId,
            role: m.role,
            status: m.status,
            createdAt: m.createdAt,
            user: user ? { name: user.name, email: user.email, avatarUrl: user.avatarUrl } : null
          };
        });
    } else {
      members = await prisma.member.findMany({
        where: { organizationId: orgId },
        include: {
          user: {
            select: { name: true, email: true, avatarUrl: true }
          }
        }
      });
    }

    return res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve team members.' });
  }
});

// 2. INVITE MEMBER
router.post('/invite', requireRole(['ORG_ADMIN']), async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];
    const { email, role, name } = req.body;

    if (!email || !role || !name) {
      return res.status(400).json({ error: 'Email, role, and name are required.' });
    }

    if (!['ORG_ADMIN', 'FINANCE_MANAGER', 'TEAM_MEMBER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role selection.' });
    }

    if (useMock) {
      // Find if user already exists
      let user = dbStore.users.find(u => u.email === email);
      if (!user) {
        // Create user placeholder
        user = {
          id: `u-${Math.random().toString(36).substr(2, 9)}`,
          email,
          name,
          passwordHash: '', // unauthenticated invitee
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
          isSuperAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        dbStore.users.push(user);
      }

      // Check if already a member
      const exists = dbStore.members.some(m => m.userId === user.id && m.organizationId === orgId);
      if (exists) {
        return res.status(400).json({ error: 'User is already a member of this organization.' });
      }

      const newMember = {
        id: `m-${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        organizationId: orgId,
        role,
        status: 'ACTIVE', // Auto approve in demo
        createdAt: new Date(),
        updatedAt: new Date()
      };
      dbStore.members.push(newMember);

      // Log activity
      dbStore.activityLogs.push({
        id: `log-${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
        organizationId: orgId,
        action: 'MEMBER_INVITED',
        details: `Invited user ${email} as ${role}.`,
        createdAt: new Date()
      });

      return res.status(201).json({
        id: newMember.id,
        userId: user.id,
        role: newMember.role,
        status: newMember.status,
        createdAt: newMember.createdAt,
        user: { name: user.name, email: user.email, avatarUrl: user.avatarUrl }
      });
    } else {
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name,
            passwordHash: '', // pending setup
            avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
          }
        });
      }

      const exists = await prisma.member.findFirst({
        where: { userId: user.id, organizationId: orgId }
      });
      if (exists) {
        return res.status(400).json({ error: 'User is already a member of this organization.' });
      }

      const member = await prisma.member.create({
        data: {
          userId: user.id,
          organizationId: orgId,
          role,
          status: 'ACTIVE'
        },
        include: {
          user: {
            select: { name: true, email: true, avatarUrl: true }
          }
        }
      });

      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          organizationId: orgId,
          action: 'MEMBER_INVITED',
          details: `Invited user ${email} as ${role}.`
        }
      });

      return res.status(201).json(member);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to invite team member.' });
  }
});

// 3. EDIT MEMBER ROLE
router.put('/:id/role', requireRole(['ORG_ADMIN']), async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];
    const memberId = req.params.id;
    const { role } = req.body;

    if (!role || !['ORG_ADMIN', 'FINANCE_MANAGER', 'TEAM_MEMBER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role selection.' });
    }

    if (useMock) {
      const member = dbStore.members.find(m => m.id === memberId && m.organizationId === orgId);
      if (!member) return res.status(404).json({ error: 'Team member not found.' });

      // Prevent changing own role
      if (member.userId === req.user.id) {
        return res.status(400).json({ error: 'You cannot change your own role.' });
      }

      const oldRole = member.role;
      member.role = role;
      member.updatedAt = new Date();

      const user = dbStore.users.find(u => u.id === member.userId);

      // Log activity
      dbStore.activityLogs.push({
        id: `log-${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
        organizationId: orgId,
        action: 'MEMBER_ROLE_UPDATED',
        details: `Updated role for ${user?.email || member.id} from ${oldRole} to ${role}.`,
        createdAt: new Date()
      });

      return res.status(200).json({
        id: member.id,
        userId: member.userId,
        role: member.role,
        status: member.status,
        user: user ? { name: user.name, email: user.email, avatarUrl: user.avatarUrl } : null
      });
    } else {
      const memberCheck = await prisma.member.findFirst({
        where: { id: memberId, organizationId: orgId }
      });
      if (!memberCheck) return res.status(404).json({ error: 'Member not found.' });
      if (memberCheck.userId === req.user.id) {
        return res.status(400).json({ error: 'You cannot edit your own role.' });
      }

      const updated = await prisma.member.update({
        where: { id: memberId },
        data: { role },
        include: {
          user: { select: { name: true, email: true, avatarUrl: true } }
        }
      });

      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          organizationId: orgId,
          action: 'MEMBER_ROLE_UPDATED',
          details: `Updated role for member ${updated.user.email} to ${role}.`
        }
      });

      return res.status(200).json(updated);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update member role.' });
  }
});

// 4. REMOVE MEMBER
router.delete('/:id', requireRole(['ORG_ADMIN']), async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];
    const memberId = req.params.id;

    if (useMock) {
      const index = dbStore.members.findIndex(m => m.id === memberId && m.organizationId === orgId);
      if (index === -1) return res.status(404).json({ error: 'Member not found.' });

      const member = dbStore.members[index];
      if (member.userId === req.user.id) {
        return res.status(400).json({ error: 'You cannot remove yourself from the organization.' });
      }

      const user = dbStore.users.find(u => u.id === member.userId);
      dbStore.members.splice(index, 1);

      // Log activity
      dbStore.activityLogs.push({
        id: `log-${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
        organizationId: orgId,
        action: 'MEMBER_REMOVED',
        details: `Removed user ${user?.email || member.id} from organization.`,
        createdAt: new Date()
      });

      return res.status(200).json({ success: true, message: 'Member removed successfully.' });
    } else {
      const member = await prisma.member.findFirst({
        where: { id: memberId, organizationId: orgId },
        include: { user: { select: { email: true } } }
      });
      if (!member) return res.status(404).json({ error: 'Member not found.' });
      if (member.userId === req.user.id) {
        return res.status(400).json({ error: 'You cannot remove yourself.' });
      }

      await prisma.member.delete({ where: { id: memberId } });

      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          organizationId: orgId,
          action: 'MEMBER_REMOVED',
          details: `Removed user ${member.user.email} from organization.`
        }
      });

      return res.status(200).json({ success: true, message: 'Member removed.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove member.' });
  }
});

// 5. GET PERMISSIONS MATRIX
router.get('/permissions-matrix', async (req, res) => {
  res.status(200).json(ROLE_PERMISSIONS);
});

export default router;
