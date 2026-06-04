// server/services/dbService.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
let useMock = false;

// Predefined Plans
const PREDEFINED_PLANS = [
  {
    id: 'plan-free',
    name: 'Free Starter',
    slug: 'free',
    description: 'Perfect for small teams and developers testing the waters.',
    priceMonthly: 0,
    priceYearly: 0,
    features: JSON.stringify(['1 Team Seat', '1,000 API requests/mo', '100 MB Storage', 'Basic Dashboards', 'Community Support']),
    apiLimit: 1000,
    storageLimit: 100,
    seatLimit: 1,
  },
  {
    id: 'plan-pro',
    name: 'Pro Premium',
    slug: 'pro',
    description: 'Advanced features, analytics, and scaling for growing startups.',
    priceMonthly: 49,
    priceYearly: 490,
    features: JSON.stringify(['5 Team Seats', '50,000 API requests/mo', '10 GB Storage', 'Interactive Analytics', 'Priority Email Support', 'Custom GST/Tax Invoicing', 'UPI & Card Payment Options']),
    apiLimit: 50000,
    storageLimit: 10000,
    seatLimit: 5,
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise Shield',
    slug: 'enterprise',
    description: 'Custom limits, dedicated support, and maximum scale for larger organizations.',
    priceMonthly: 299,
    priceYearly: 2990,
    features: JSON.stringify(['Unlimited Seats', 'Unlimited API requests', '100 GB Storage', 'Real-time Webhook Streams', '24/7 Dedicated Account Manager', 'Custom SLA Agreement', 'Advanced Audit Logs', 'Full RBAC Customization']),
    apiLimit: 99999999,
    storageLimit: 100000,
    seatLimit: 999999,
  }
];

// In-Memory Database Store (Fallback)
const dbStore = {
  users: [],
  organizations: [],
  members: [],
  plans: [...PREDEFINED_PLANS],
  subscriptions: [],
  invoices: [],
  payments: [],
  notifications: [],
  tickets: [],
  activityLogs: []
};

// Seed In-Memory Store
async function seedMockStore() {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 1. Users
  const superAdmin = {
    id: 'u-super',
    email: 'superadmin@billora.com',
    passwordHash,
    name: 'Sarah Jenkins',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    isSuperAdmin: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const orgAdmin = {
    id: 'u-admin',
    email: 'admin@acme.com',
    passwordHash,
    name: 'Alex Rivera',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    isSuperAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const financeManager = {
    id: 'u-finance',
    email: 'finance@acme.com',
    passwordHash,
    name: 'Marcus Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    isSuperAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const teamMember = {
    id: 'u-member',
    email: 'member@acme.com',
    passwordHash,
    name: 'Emma Watson',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    isSuperAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  dbStore.users.push(superAdmin, orgAdmin, financeManager, teamMember);

  // 2. Organizations
  const acme = {
    id: 'org-acme',
    name: 'Acme Corp',
    slug: 'acme',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    status: 'ACTIVE',
    industry: 'Technology',
    companySize: '11-50',
    country: 'United States',
    currency: 'USD',
    timezone: 'UTC',
    themeColor: '#14b8a6',
    accentColor: '#06b6d4',
    invoiceHeader: 'Thank you for choosing Acme Corp!',
    invoiceNotes: 'Please settle invoices within 14 days.',
    isOnboardingCompleted: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  };

  const stark = {
    id: 'org-stark',
    name: 'Stark Industries',
    slug: 'stark',
    logoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150',
    status: 'ACTIVE',
    industry: 'Defense & Aerospace',
    companySize: '1000+',
    country: 'United States',
    currency: 'USD',
    timezone: 'EST',
    themeColor: '#ef4444',
    accentColor: '#eab308',
    invoiceHeader: 'Stark Industries Invoice',
    invoiceNotes: 'Payment is due immediately on receipt.',
    isOnboardingCompleted: true,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  };

  const cyberdyne = {
    id: 'org-cyberdyne',
    name: 'Cyberdyne Systems',
    slug: 'cyberdyne',
    logoUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=150',
    status: 'SUSPENDED',
    industry: 'Robotics',
    companySize: '201-1000',
    country: 'United States',
    currency: 'USD',
    timezone: 'PST',
    themeColor: '#3b82f6',
    accentColor: '#6366f1',
    invoiceHeader: 'Cyberdyne Systems Invoice',
    invoiceNotes: 'For system maintenance billing.',
    isOnboardingCompleted: true,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  };

  dbStore.organizations.push(acme, stark, cyberdyne);

  // 3. Memberships
  dbStore.members.push(
    { id: 'm-acme-admin', userId: 'u-admin', organizationId: 'org-acme', role: 'ORG_ADMIN', status: 'ACTIVE', createdAt: new Date() },
    { id: 'm-acme-finance', userId: 'u-finance', organizationId: 'org-acme', role: 'FINANCE_MANAGER', status: 'ACTIVE', createdAt: new Date() },
    { id: 'm-acme-member', userId: 'u-member', organizationId: 'org-acme', role: 'TEAM_MEMBER', status: 'ACTIVE', createdAt: new Date() },
    
    // Stark admin is also Alex Rivera (admin@acme.com) to test org switching
    { id: 'm-stark-admin', userId: 'u-admin', organizationId: 'org-stark', role: 'ORG_ADMIN', status: 'ACTIVE', createdAt: new Date() },
    { id: 'm-cyber-admin', userId: 'u-admin', organizationId: 'org-cyberdyne', role: 'ORG_ADMIN', status: 'ACTIVE', createdAt: new Date() }
  );

  // 4. Subscriptions
  const subAcme = {
    id: 'sub-acme',
    organizationId: 'org-acme',
    planId: 'plan-pro',
    status: 'ACTIVE',
    currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
    stripeSubscriptionId: 'sub_1OqTrXCl9',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  };

  const subStark = {
    id: 'sub-stark',
    organizationId: 'org-stark',
    planId: 'plan-enterprise',
    status: 'ACTIVE',
    currentPeriodStart: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
    stripeSubscriptionId: 'sub_1OqTrYCl8',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  };

  const subCyber = {
    id: 'sub-cyber',
    organizationId: 'org-cyberdyne',
    planId: 'plan-pro',
    status: 'PAST_DUE',
    currentPeriodStart: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
    currentPeriodEnd: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: true,
    stripeSubscriptionId: 'sub_1OqTrZCl7',
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  };

  dbStore.subscriptions.push(subAcme, subStark, subCyber);

  // 5. Invoices
  const invAcme1 = {
    id: 'inv-acme-1',
    organizationId: 'org-acme',
    subscriptionId: 'sub-acme',
    invoiceNumber: 'INV-2026-0001',
    amount: 49.00,
    tax: 8.82, // 18% GST
    total: 57.82,
    status: 'PAID',
    pdfUrl: '/invoices/INV-2026-0001.pdf',
    dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    paidAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  };

  const invAcme2 = {
    id: 'inv-acme-2',
    organizationId: 'org-acme',
    subscriptionId: 'sub-acme',
    invoiceNumber: 'INV-2026-0002',
    amount: 49.00,
    tax: 8.82,
    total: 57.82,
    status: 'PENDING',
    pdfUrl: '/invoices/INV-2026-0002.pdf',
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    paidAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const invStark1 = {
    id: 'inv-stark-1',
    organizationId: 'org-stark',
    subscriptionId: 'sub-stark',
    invoiceNumber: 'INV-2026-0003',
    amount: 299.00,
    tax: 53.82,
    total: 352.82,
    status: 'PAID',
    pdfUrl: '/invoices/INV-2026-0003.pdf',
    dueDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    paidAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 47 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  };

  dbStore.invoices.push(invAcme1, invAcme2, invStark1);

  // 6. Payments
  dbStore.payments.push(
    {
      id: 'pay-acme-1',
      organizationId: 'org-acme',
      invoiceId: 'inv-acme-1',
      amount: 57.82,
      paymentMethod: 'CARD (•••• 4242)',
      status: 'SUCCESS',
      transactionId: 'tx_acme_success_102',
      refundReason: null,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    },
    {
      id: 'pay-stark-1',
      organizationId: 'org-stark',
      invoiceId: 'inv-stark-1',
      amount: 352.82,
      paymentMethod: 'UPI (stark@okaxis)',
      status: 'SUCCESS',
      transactionId: 'tx_stark_success_99',
      refundReason: null,
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    }
  );

  // 7. Support Tickets
  dbStore.tickets.push(
    {
      id: 'tick-acme-1',
      userId: 'u-admin',
      organizationId: 'org-acme',
      title: 'Upgrade limit issues',
      description: 'We are trying to add a 6th seat, but our plan only allows 5. Can we custom upgrade just the seat count without moving to Enterprise?',
      priority: 'MEDIUM',
      status: 'OPEN',
      chatHistory: JSON.stringify([
        { sender: 'user', text: 'Hi, we need to add a sixth team member to our workspace. Do we have to upgrade to Enterprise?', time: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
        { sender: 'support', text: 'Hello Alex! Yes, the Pro plan has a limit of 5 seats. However, you can add extra seats on a pay-as-you-go basis ($5/seat/month) directly from the billing tab, or you can choose to upgrade to Enterprise if you need dedicated support.', time: new Date(Date.now() - 1 * 3600 * 1000).toISOString() }
      ]),
      createdAt: new Date(Date.now() - 2 * 3600 * 1000),
      updatedAt: new Date()
    }
  );

  // 8. Notifications
  dbStore.notifications.push(
    {
      id: 'notif-acme-1',
      userId: 'u-admin',
      organizationId: 'org-acme',
      title: 'Invoice Generated',
      message: 'Your invoice INV-2026-0002 for $57.82 has been generated and is due on ' + new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      type: 'INVOICE_GENERATED',
      read: false,
      createdAt: new Date()
    }
  );

  // 9. Activity Logs
  dbStore.activityLogs.push(
    { id: 'log-acme-1', userId: 'u-admin', organizationId: 'org-acme', action: 'ORGANIZATION_CREATED', details: 'Organization Acme Corp was created.', ipAddress: '192.168.1.1', createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    { id: 'log-acme-2', userId: 'u-admin', organizationId: 'org-acme', action: 'PLAN_UPGRADED', details: 'Upgraded subscription to Pro Premium tier.', ipAddress: '192.168.1.1', createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
    { id: 'log-acme-3', userId: 'u-admin', organizationId: 'org-acme', action: 'MEMBER_INVITED', details: 'Invited finance@acme.com with Finance Manager role.', ipAddress: '192.168.1.1', createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
  );
}

// Test Connection
async function initDatabase() {
  try {
    // Attempt standard prisma check
    await prisma.$connect();
    console.log('✓ Database connected successfully via Prisma ORM.');
  } catch (error) {
    console.warn('⚠️ Could not connect to database. Falling back to the In-Memory mock store.');
    useMock = true;
    await seedMockStore();
  }
}

// Run DB Initialization
initDatabase();

export { prisma, useMock, dbStore };
