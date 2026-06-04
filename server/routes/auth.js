// server/routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { useMock, dbStore, prisma } from '../services/dbService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Generate a random slug
const slugify = (text) => text.toString().toLowerCase().trim()
  .replace(/\s+/g, '-')
  .replace(/[^\w\-]+/g, '')
  .replace(/\-\-+/g, '-');

// 1. REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, orgName } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (useMock) {
      const emailExists = dbStore.users.some(u => u.email === email);
      if (emailExists) {
        return res.status(400).json({ error: 'A user with this email address already exists.' });
      }

      const newUser = {
        id: `u-${Math.random().toString(36).substr(2, 9)}`,
        name,
        email,
        passwordHash,
        isSuperAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      dbStore.users.push(newUser);

      const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET || 'billora-super-secret-dev-jwt-key-2026', { expiresIn: '24h' });

      if (orgName) {
        const slug = `${slugify(orgName)}-${Math.floor(1000 + Math.random() * 9000)}`;
        const newOrg = {
          id: `org-${Math.random().toString(36).substr(2, 9)}`,
          name: orgName,
          slug,
          status: 'ACTIVE',
          industry: 'Other',
          companySize: '1-10',
          country: 'United States',
          currency: 'USD',
          timezone: 'UTC',
          themeColor: '#14b8a6',
          accentColor: '#06b6d4',
          invoiceHeader: 'Thank you for your business!',
          invoiceNotes: 'Payment is due within 30 days.',
          isOnboardingCompleted: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const newMember = {
          id: `m-${Math.random().toString(36).substr(2, 9)}`,
          userId: newUser.id,
          organizationId: newOrg.id,
          role: 'ORG_ADMIN',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const defaultSub = {
          id: `sub-${Math.random().toString(36).substr(2, 9)}`,
          organizationId: newOrg.id,
          planId: 'plan-free',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        dbStore.organizations.push(newOrg);
        dbStore.members.push(newMember);
        dbStore.subscriptions.push(defaultSub);

        dbStore.activityLogs.push({
          id: `log-${Math.random().toString(36).substr(2, 9)}`,
          userId: newUser.id,
          organizationId: newOrg.id,
          action: 'ORGANIZATION_CREATED',
          details: `Organization ${orgName} and User account created.`,
          createdAt: new Date()
        });

        return res.status(201).json({
          token,
          user: { id: newUser.id, name: newUser.name, email: newUser.email, isSuperAdmin: newUser.isSuperAdmin },
          organization: newOrg,
          role: 'ORG_ADMIN'
        });
      }

      return res.status(201).json({
        token,
        user: { id: newUser.id, name: newUser.name, email: newUser.email, isSuperAdmin: newUser.isSuperAdmin },
        organization: null,
        role: null
      });
    } else {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ error: 'A user with this email address already exists.' });
      }

      if (orgName) {
        const freePlan = await prisma.plan.findUnique({ where: { slug: 'free' } });
        if (!freePlan) {
          return res.status(500).json({ error: 'Database is not seeded. Default Free plan is missing.' });
        }

        const slug = `${slugify(orgName)}-${Math.floor(1000 + Math.random() * 9000)}`;

        const result = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: { name, email, passwordHash, isSuperAdmin: false }
          });

          const org = await tx.organization.create({
            data: {
              name: orgName,
              slug,
              status: 'ACTIVE',
              industry: 'Other',
              companySize: '1-10',
              country: 'United States',
              currency: 'USD',
              timezone: 'UTC',
              isOnboardingCompleted: true
            }
          });

          const member = await tx.member.create({
            data: { userId: user.id, organizationId: org.id, role: 'ORG_ADMIN', status: 'ACTIVE' }
          });

          await tx.subscription.create({
            data: {
              organizationId: org.id,
              planId: freePlan.id,
              status: 'ACTIVE',
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          });

          await tx.activityLog.create({
            data: {
              userId: user.id,
              organizationId: org.id,
              action: 'ORGANIZATION_CREATED',
              details: `Organization ${orgName} and User account created.`
            }
          });

          return { user, org, member };
        });

        const token = jwt.sign({ id: result.user.id }, process.env.JWT_SECRET || 'billora-super-secret-dev-jwt-key-2026', { expiresIn: '24h' });
        return res.status(201).json({
          token,
          user: { id: result.user.id, name: result.user.name, email: result.user.email, isSuperAdmin: result.user.isSuperAdmin },
          organization: result.org,
          role: 'ORG_ADMIN'
        });
      } else {
        const user = await prisma.user.create({
          data: { name, email, passwordHash, isSuperAdmin: false }
        });
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'billora-super-secret-dev-jwt-key-2026', { expiresIn: '24h' });
        return res.status(201).json({
          token,
          user: { id: user.id, name: user.name, email: user.email, isSuperAdmin: user.isSuperAdmin },
          organization: null,
          role: null
        });
      }
    }
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// 2. LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    let user;
    if (useMock) {
      user = dbStore.users.find(u => u.email === email);
    } else {
      user = await prisma.user.findUnique({ where: { email } });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    let defaultOrg = null;
    let defaultRole = null;

    if (user.isSuperAdmin) {
      // Super admin does not require organization membership
      defaultOrg = null;
      defaultRole = 'SUPER_ADMIN';
    } else {
      // Find first membership
      let firstMembership;
      if (useMock) {
        firstMembership = dbStore.members.find(m => m.userId === user.id && m.status === 'ACTIVE');
      } else {
        firstMembership = await prisma.member.findFirst({
          where: { userId: user.id, status: 'ACTIVE' },
          include: { organization: true }
        });
      }

      if (firstMembership) {
        if (useMock) {
          defaultOrg = dbStore.organizations.find(o => o.id === firstMembership.organizationId);
        } else {
          defaultOrg = firstMembership.organization;
        }
        defaultRole = firstMembership.role;
      }
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'billora-super-secret-dev-jwt-key-2026', { expiresIn: '24h' });
    return res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, isSuperAdmin: user.isSuperAdmin },
      organization: defaultOrg,
      role: defaultRole
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// 3. GET CURRENT USER CONTEXT & RECENT DATA
router.get('/me', authMiddleware, async (req, res) => {
  try {
    let memberships = [];
    if (useMock) {
      memberships = dbStore.members
        .filter(m => m.userId === req.user.id)
        .map(m => {
          const org = dbStore.organizations.find(o => o.id === m.organizationId);
          return { ...m, organization: org };
        });
    } else {
      memberships = await prisma.member.findMany({
        where: { userId: req.user.id },
        include: { organization: true }
      });
    }

    return res.status(200).json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatarUrl: req.user.avatarUrl,
        isSuperAdmin: req.user.isSuperAdmin
      },
      memberships
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve current user info.' });
  }
});

// 4. GET ALL ORGANIZATIONS FOR LOGGED IN USER
router.get('/organizations', authMiddleware, async (req, res) => {
  try {
    if (req.user.isSuperAdmin) {
      let orgs;
      if (useMock) {
        orgs = dbStore.organizations;
      } else {
        orgs = await prisma.organization.findMany();
      }
      return res.status(200).json(orgs);
    }

    let orgs = [];
    if (useMock) {
      const userMemberships = dbStore.members.filter(m => m.userId === req.user.id);
      orgs = userMemberships.map(m => dbStore.organizations.find(o => o.id === m.organizationId)).filter(Boolean);
    } else {
      const memberships = await prisma.member.findMany({
        where: { userId: req.user.id },
        include: { organization: true }
      });
      orgs = memberships.map(m => m.organization);
    }

    return res.status(200).json(orgs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve organizations.' });
  }
});

// 5. SWITCH ORGANIZATION
router.post('/switch-org', authMiddleware, async (req, res) => {
  try {
    const { organizationId } = req.body;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required.' });
    }

    if (req.user.isSuperAdmin) {
      let org;
      if (useMock) {
        org = dbStore.organizations.find(o => o.id === organizationId);
      } else {
        org = await prisma.organization.findUnique({ where: { id: organizationId } });
      }

      if (!org) return res.status(404).json({ error: 'Organization not found.' });

      return res.status(200).json({
        organization: org,
        role: 'ORG_ADMIN' // Super admin is treated as admin for switched orgs
      });
    }

    let membership;
    if (useMock) {
      membership = dbStore.members.find(
        m => m.userId === req.user.id && m.organizationId === organizationId && m.status === 'ACTIVE'
      );
    } else {
      membership = await prisma.member.findFirst({
        where: { userId: req.user.id, organizationId, status: 'ACTIVE' },
        include: { organization: true }
      });
    }

    if (!membership) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this organization.' });
    }

    const org = useMock ? dbStore.organizations.find(o => o.id === organizationId) : membership.organization;

    return res.status(200).json({
      organization: org,
      role: membership.role
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to switch organizations.' });
  }
});

// 6. COMPLETE ONBOARDING FLOW
router.post('/onboard', authMiddleware, async (req, res) => {
  try {
    const { orgName, logoUrl, industry, companySize, country, currency, planSlug, invites, paymentMethod } = req.body;
    if (!orgName || !planSlug) {
      return res.status(400).json({ error: 'Organization name and subscription plan selection are required.' });
    }

    const slug = `${slugify(orgName)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const orgId = `org-${Math.random().toString(36).substr(2, 9)}`;
    const memberId = `m-${Math.random().toString(36).substr(2, 9)}`;
    const subId = `sub-${Math.random().toString(36).substr(2, 9)}`;

    if (useMock) {
      // 1. Create Organization in mock dbStore
      const newOrg = {
        id: orgId,
        name: orgName,
        logoUrl: logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
        status: 'ACTIVE',
        industry: industry || 'Technology',
        companySize: companySize || '1-10',
        country: country || 'United States',
        currency: currency || 'USD',
        timezone: 'UTC',
        themeColor: '#14b8a6',
        accentColor: '#06b6d4',
        invoiceHeader: `Thank you for choosing ${orgName}!`,
        invoiceNotes: 'Please pay within 15 days of invoice date.',
        isOnboardingCompleted: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      dbStore.organizations.push(newOrg);

      // 2. Add current user as ORG_ADMIN
      const newMember = {
        id: memberId,
        userId: req.user.id,
        organizationId: orgId,
        role: 'ORG_ADMIN',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      dbStore.members.push(newMember);

      // 3. Find plan
      const selectedPlan = dbStore.plans.find(p => p.slug === planSlug) || dbStore.plans[0];

      // 4. Create Subscription
      const defaultSub = {
        id: subId,
        organizationId: orgId,
        planId: selectedPlan.id,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      dbStore.subscriptions.push(defaultSub);

      // 5. Generate first invoice and payment if paid plan
      if (selectedPlan.priceMonthly > 0) {
        const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const amount = selectedPlan.priceMonthly;
        const tax = Math.round((amount * 0.18) * 100) / 100;
        const total = Math.round((amount + tax) * 100) / 100;

        const newInvoice = {
          id: `inv-${Math.random().toString(36).substr(2, 9)}`,
          organizationId: orgId,
          subscriptionId: subId,
          invoiceNumber,
          amount,
          tax,
          total,
          status: 'PAID',
          pdfUrl: `/invoices/${invoiceNumber}.pdf`,
          dueDate: new Date(),
          paidAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        dbStore.invoices.push(newInvoice);

        const newPayment = {
          id: `pay-${Math.random().toString(36).substr(2, 9)}`,
          organizationId: orgId,
          invoiceId: newInvoice.id,
          amount: total,
          paymentMethod: `${paymentMethod?.type || 'CARD'} (•••• ${paymentMethod?.details?.slice(-4) || '4242'})`,
          status: 'SUCCESS',
          transactionId: `tx_onboard_${Math.random().toString(36).substr(2, 9)}`,
          refundReason: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        dbStore.payments.push(newPayment);
      }

      // 6. Invite team members
      if (invites && Array.isArray(invites)) {
        invites.forEach(inv => {
          let invitedUser = dbStore.users.find(u => u.email === inv.email);
          if (!invitedUser) {
            invitedUser = {
              id: `u-${Math.random().toString(36).substr(2, 9)}`,
              email: inv.email,
              name: inv.name || inv.email.split('@')[0],
              passwordHash: '',
              avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              isSuperAdmin: false,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            dbStore.users.push(invitedUser);
          }
          dbStore.members.push({
            id: `m-${Math.random().toString(36).substr(2, 9)}`,
            userId: invitedUser.id,
            organizationId: orgId,
            role: inv.role || 'TEAM_MEMBER',
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        });
      }

      // 7. Activity Log
      dbStore.activityLogs.push({
        id: `log-${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
        organizationId: orgId,
        action: 'ORGANIZATION_CREATED',
        details: `Organization ${orgName} created and onboarded with plan ${selectedPlan.name}.`,
        createdAt: new Date()
      });

      return res.status(201).json({
        organization: newOrg,
        role: 'ORG_ADMIN'
      });
    } else {
      // Prisma
      const selectedPlan = await prisma.plan.findUnique({ where: { slug: planSlug } });
      if (!selectedPlan) {
        return res.status(404).json({ error: 'Selected plan not found in database.' });
      }

      const result = await prisma.$transaction(async (tx) => {
        const newOrg = await tx.organization.create({
          data: {
            name: orgName,
            slug,
            logoUrl: logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
            status: 'ACTIVE',
            industry: industry || 'Technology',
            companySize: companySize || '1-10',
            country: country || 'United States',
            currency: currency || 'USD',
            timezone: 'UTC',
            isOnboardingCompleted: true
          }
        });

        await tx.member.create({
          data: {
            userId: req.user.id,
            organizationId: newOrg.id,
            role: 'ORG_ADMIN',
            status: 'ACTIVE'
          }
        });

        const sub = await tx.subscription.create({
          data: {
            organizationId: newOrg.id,
            planId: selectedPlan.id,
            status: 'ACTIVE',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        });

        if (selectedPlan.priceMonthly > 0) {
          const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
          const amount = selectedPlan.priceMonthly;
          const tax = Math.round((amount * 0.18) * 100) / 100;
          const total = Math.round((amount + tax) * 100) / 100;

          const invoice = await tx.invoice.create({
            data: {
              organizationId: newOrg.id,
              subscriptionId: sub.id,
              invoiceNumber,
              amount,
              tax,
              total,
              status: 'PAID',
              dueDate: new Date(),
              paidAt: new Date()
            }
          });

          await tx.payment.create({
            data: {
              organizationId: newOrg.id,
              invoiceId: invoice.id,
              amount: total,
              paymentMethod: `${paymentMethod?.type || 'CARD'} (•••• ${paymentMethod?.details?.slice(-4) || '4242'})`,
              status: 'SUCCESS',
              transactionId: `tx_onboard_${Math.random().toString(36).substr(2, 9)}`
            }
          });
        }

        if (invites && Array.isArray(invites)) {
          for (const inv of invites) {
            let invitedUser = await tx.user.findUnique({ where: { email: inv.email } });
            if (!invitedUser) {
              invitedUser = await tx.user.create({
                data: {
                  email: inv.email,
                  name: inv.name || inv.email.split('@')[0],
                  passwordHash: '',
                  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                }
              });
            }

            await tx.member.create({
              data: {
                userId: invitedUser.id,
                organizationId: newOrg.id,
                role: inv.role || 'TEAM_MEMBER',
                status: 'ACTIVE'
              }
            });
          }
        }

        await tx.activityLog.create({
          data: {
            userId: req.user.id,
            organizationId: newOrg.id,
            action: 'ORGANIZATION_CREATED',
            details: `Organization ${orgName} created and onboarded with plan ${selectedPlan.name}.`
          }
        });

        return newOrg;
      });

      return res.status(201).json({
        organization: result,
        role: 'ORG_ADMIN'
      });
    }
  } catch (error) {
    console.error('Onboarding Error:', error);
    res.status(500).json({ error: 'Failed to complete organization onboarding.' });
  }
});

// 7. UPDATE ORGANIZATION DETAILS & BRANDING
router.put('/organization', authMiddleware, async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'];
    if (!orgId) {
      return res.status(400).json({ error: 'Organization context is missing.' });
    }

    const { name, logoUrl, industry, companySize, country, currency, timezone, themeColor, accentColor, invoiceHeader, invoiceNotes } = req.body;

    if (useMock) {
      const org = dbStore.organizations.find(o => o.id === orgId);
      if (!org) return res.status(404).json({ error: 'Organization not found.' });

      // Check user permission
      const member = dbStore.members.find(m => m.userId === req.user.id && m.organizationId === orgId && m.status === 'ACTIVE');
      if (!member || member.role !== 'ORG_ADMIN') {
        return res.status(403).json({ error: 'Only Organization Admins can modify settings.' });
      }

      if (name) org.name = name;
      if (logoUrl !== undefined) org.logoUrl = logoUrl;
      if (industry !== undefined) org.industry = industry;
      if (companySize !== undefined) org.companySize = companySize;
      if (country !== undefined) org.country = country;
      if (currency !== undefined) org.currency = currency;
      if (timezone !== undefined) org.timezone = timezone;
      if (themeColor !== undefined) org.themeColor = themeColor;
      if (accentColor !== undefined) org.accentColor = accentColor;
      if (invoiceHeader !== undefined) org.invoiceHeader = invoiceHeader;
      if (invoiceNotes !== undefined) org.invoiceNotes = invoiceNotes;
      org.updatedAt = new Date();

      // Log activity
      dbStore.activityLogs.push({
        id: `log-${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
        organizationId: orgId,
        action: 'ORGANIZATION_UPDATED',
        details: `Updated workspace name, branding and metadata settings.`,
        createdAt: new Date()
      });

      return res.status(200).json(org);
    } else {
      // Check user permission in DB
      const member = await prisma.member.findFirst({
        where: { userId: req.user.id, organizationId: orgId, status: 'ACTIVE' }
      });
      if (!member || member.role !== 'ORG_ADMIN') {
        return res.status(403).json({ error: 'Only Organization Admins can modify settings.' });
      }

      const org = await prisma.organization.update({
        where: { id: orgId },
        data: {
          name,
          logoUrl,
          industry,
          companySize,
          country,
          currency,
          timezone,
          themeColor,
          accentColor,
          invoiceHeader,
          invoiceNotes
        }
      });

      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          organizationId: orgId,
          action: 'ORGANIZATION_UPDATED',
          details: `Updated workspace name, branding and metadata settings.`
        }
      });

      return res.status(200).json(org);
    }
  } catch (error) {
    console.error('Update Organization Error:', error);
    res.status(500).json({ error: 'Failed to update organization details.' });
  }
});

export default router;
