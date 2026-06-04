// server/middleware/rbac.js
import { useMock, dbStore, prisma } from '../services/dbService.js';

export const requireSuperAdmin = (req, res, next) => {
  if (req.user && req.user.isSuperAdmin) {
    return next();
  }
  return res.status(403).json({ error: 'Access Denied. Global Super Admin privileges required.' });
};

export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const orgId = req.headers['x-organization-id'] || req.params.orgId || req.body.organizationId;
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is missing. Please provide it in x-organization-id header.' });
      }

      // If user is a Super Admin, bypass organizational checks
      if (req.user.isSuperAdmin) {
        req.userRole = 'ORG_ADMIN'; // Treat as admin
        return next();
      }

      let member;
      if (useMock) {
        member = dbStore.members.find(
          m => m.userId === req.user.id && m.organizationId === orgId && m.status === 'ACTIVE'
        );
      } else {
        member = await prisma.member.findFirst({
          where: {
            userId: req.user.id,
            organizationId: orgId,
            status: 'ACTIVE'
          }
        });
      }

      if (!member) {
        return res.status(403).json({ error: 'Access Denied. You are not an active member of this organization.' });
      }

      if (!allowedRoles.includes(member.role)) {
        return res.status(403).json({ 
          error: `Access Denied. This resource requires one of the following roles: ${allowedRoles.join(', ')} (your role: ${member.role})` 
        });
      }

      req.member = member;
      req.userRole = member.role;
      next();
    } catch (error) {
      console.error('Error in requireRole RBAC middleware:', error);
      return res.status(500).json({ error: 'Internal server error executing RBAC checks.' });
    }
  };
};
