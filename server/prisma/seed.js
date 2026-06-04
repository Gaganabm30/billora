// server/prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed operation...');

  // 1. Clear database
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.member.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.plan.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 2. Create Plans
  console.log('Creating plans...');
  const planFree = await prisma.plan.create({
    data: {
      name: 'Free Starter',
      slug: 'free',
      description: 'Perfect for small teams and developers testing the waters.',
      priceMonthly: 0,
      priceYearly: 0,
      features: ['1 Team Seat', '1,000 API requests/mo', '100 MB Storage', 'Basic Dashboards', 'Community Support'],
      apiLimit: 1000,
      storageLimit: 100,
      seatLimit: 1
    }
  });

  const planPro = await prisma.plan.create({
    data: {
      name: 'Pro Premium',
      slug: 'pro',
      description: 'Advanced features, analytics, and scaling for growing startups.',
      priceMonthly: 49,
      priceYearly: 490,
      features: ['5 Team Seats', '50,000 API requests/mo', '10 GB Storage', 'Interactive Analytics', 'Priority Email Support', 'Custom GST/Tax Invoicing', 'UPI & Card Payment Options'],
      apiLimit: 50000,
      storageLimit: 10000,
      seatLimit: 5
    }
  });

  const planEnterprise = await prisma.plan.create({
    data: {
      name: 'Enterprise Shield',
      slug: 'enterprise',
      description: 'Custom limits, dedicated support, and maximum scale for larger organizations.',
      priceMonthly: 299,
      priceYearly: 2990,
      features: ['Unlimited Seats', 'Unlimited API requests', '100 GB Storage', 'Real-time Webhook Streams', '24/7 Dedicated Account Manager', 'Custom SLA Agreement', 'Advanced Audit Logs', 'Full RBAC Customization'],
      apiLimit: 99999999,
      storageLimit: 100000,
      seatLimit: 999999
    }
  });

  // 3. Create Users
  console.log('Creating users...');
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@billora.com',
      passwordHash,
      name: 'Sarah Jenkins',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      isSuperAdmin: true
    }
  });

  const orgAdmin = await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      passwordHash,
      name: 'Alex Rivera',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    }
  });

  const financeManager = await prisma.user.create({
    data: {
      email: 'finance@acme.com',
      passwordHash,
      name: 'Marcus Chen',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    }
  });

  const teamMember = await prisma.user.create({
    data: {
      email: 'member@acme.com',
      passwordHash,
      name: 'Emma Watson',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
    }
  });

  // 4. Create Organizations
  console.log('Creating organizations...');
  const acme = await prisma.organization.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }
  });

  const stark = await prisma.organization.create({
    data: {
      name: 'Stark Industries',
      slug: 'stark',
      logoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150',
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    }
  });

  const cyberdyne = await prisma.organization.create({
    data: {
      name: 'Cyberdyne Systems',
      slug: 'cyberdyne',
      logoUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=150',
      status: 'SUSPENDED',
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    }
  });

  // 5. Create Memberships
  console.log('Creating memberships...');
  await prisma.member.createMany({
    data: [
      { userId: orgAdmin.id, organizationId: acme.id, role: 'ORG_ADMIN', status: 'ACTIVE' },
      { userId: financeManager.id, organizationId: acme.id, role: 'FINANCE_MANAGER', status: 'ACTIVE' },
      { userId: teamMember.id, organizationId: acme.id, role: 'TEAM_MEMBER', status: 'ACTIVE' },
      { userId: orgAdmin.id, organizationId: stark.id, role: 'ORG_ADMIN', status: 'ACTIVE' },
      { userId: orgAdmin.id, organizationId: cyberdyne.id, role: 'ORG_ADMIN', status: 'ACTIVE' }
    ]
  });

  // 6. Subscriptions
  console.log('Creating subscriptions...');
  const subAcme = await prisma.subscription.create({
    data: {
      organizationId: acme.id,
      planId: planPro.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      stripeSubscriptionId: 'sub_1OqTrXCl9'
    }
  });

  const subStark = await prisma.subscription.create({
    data: {
      organizationId: stark.id,
      planId: planEnterprise.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      stripeSubscriptionId: 'sub_1OqTrYCl8'
    }
  });

  const subCyber = await prisma.subscription.create({
    data: {
      organizationId: cyberdyne.id,
      planId: planPro.id,
      status: 'PAST_DUE',
      currentPeriodStart: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: true,
      stripeSubscriptionId: 'sub_1OqTrZCl7'
    }
  });

  // 7. Invoices
  console.log('Creating invoices...');
  const invAcme1 = await prisma.invoice.create({
    data: {
      organizationId: acme.id,
      subscriptionId: subAcme.id,
      invoiceNumber: 'INV-2026-0001',
      amount: 49.00,
      tax: 8.82,
      total: 57.82,
      status: 'PAID',
      dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      paidAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000)
    }
  });

  const invAcme2 = await prisma.invoice.create({
    data: {
      organizationId: acme.id,
      subscriptionId: subAcme.id,
      invoiceNumber: 'INV-2026-0002',
      amount: 49.00,
      tax: 8.82,
      total: 57.82,
      status: 'PENDING',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    }
  });

  const invStark1 = await prisma.invoice.create({
    data: {
      organizationId: stark.id,
      subscriptionId: subStark.id,
      invoiceNumber: 'INV-2026-0003',
      amount: 299.00,
      tax: 53.82,
      total: 352.82,
      status: 'PAID',
      dueDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      paidAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 47 * 24 * 60 * 60 * 1000)
    }
  });

  // 8. Payments
  console.log('Creating payments...');
  await prisma.payment.createMany({
    data: [
      {
        organizationId: acme.id,
        invoiceId: invAcme1.id,
        amount: 57.82,
        paymentMethod: 'CARD (•••• 4242)',
        status: 'SUCCESS',
        transactionId: 'tx_acme_success_102',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      },
      {
        organizationId: stark.id,
        invoiceId: invStark1.id,
        amount: 352.82,
        paymentMethod: 'UPI (stark@okaxis)',
        status: 'SUCCESS',
        transactionId: 'tx_stark_success_99',
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
      }
    ]
  });

  // 9. Support Tickets
  console.log('Creating tickets...');
  await prisma.ticket.create({
    data: {
      userId: orgAdmin.id,
      organizationId: acme.id,
      title: 'Upgrade limit issues',
      description: 'We are trying to add a 6th seat, but our plan only allows 5. Can we custom upgrade just the seat count without moving to Enterprise?',
      priority: 'MEDIUM',
      status: 'OPEN',
      chatHistory: JSON.stringify([
        { sender: 'user', text: 'Hi, we need to add a sixth team member to our workspace. Do we have to upgrade to Enterprise?', time: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
        { sender: 'support', text: 'Hello Alex! Yes, the Pro plan has a limit of 5 seats. However, you can add extra seats on a pay-as-you-go basis ($5/seat/month) directly from the billing tab, or you can choose to upgrade to Enterprise if you need dedicated support.', time: new Date(Date.now() - 1 * 3600 * 1000).toISOString() }
      ])
    }
  });

  // 10. Notifications
  console.log('Creating notifications...');
  await prisma.notification.create({
    data: {
      userId: orgAdmin.id,
      organizationId: acme.id,
      title: 'Invoice Generated',
      message: 'Your invoice INV-2026-0002 for $57.82 has been generated and is due on ' + new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      type: 'INVOICE_GENERATED',
      read: false
    }
  });

  // 11. Activity Logs
  console.log('Creating activity logs...');
  await prisma.activityLog.createMany({
    data: [
      { userId: orgAdmin.id, organizationId: acme.id, action: 'ORGANIZATION_CREATED', details: 'Organization Acme Corp was created.', ipAddress: '127.0.0.1', createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      { userId: orgAdmin.id, organizationId: acme.id, action: 'PLAN_UPGRADED', details: 'Upgraded subscription to Pro Premium tier.', ipAddress: '127.0.0.1', createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
      { userId: orgAdmin.id, organizationId: acme.id, action: 'MEMBER_INVITED', details: 'Invited finance@acme.com with Finance Manager role.', ipAddress: '127.0.0.1', createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
    ]
  });

  console.log('✓ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Database seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
