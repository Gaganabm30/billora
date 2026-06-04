// client/src/store/authStore.js
import { create } from 'zustand';

// Simple API request helper
export const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('billora_token');
  const activeOrg = JSON.parse(localStorage.getItem('billora_org') || 'null');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(activeOrg && { 'x-organization-id': activeOrg.id }),
    ...options.headers
  };

  const API_BASE = import.meta.env.VITE_API_URL || '';
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'An error occurred making the request.');
  }
  return data;
};

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('billora_user') || 'null'),
  token: localStorage.getItem('billora_token') || null,
  activeOrg: JSON.parse(localStorage.getItem('billora_org') || 'null'),
  role: localStorage.getItem('billora_role') || null, // SUPER_ADMIN, ORG_ADMIN, FINANCE_MANAGER, TEAM_MEMBER
  notifications: [],
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      localStorage.setItem('billora_token', data.token);
      localStorage.setItem('billora_user', JSON.stringify(data.user));
      localStorage.setItem('billora_org', JSON.stringify(data.organization));
      localStorage.setItem('billora_role', data.role);

      set({
        token: data.token,
        user: data.user,
        activeOrg: data.organization,
        role: data.role,
        loading: false
      });
      
      // Fetch initial notifications
      get().fetchNotifications();
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });

      localStorage.setItem('billora_token', data.token);
      localStorage.setItem('billora_user', JSON.stringify(data.user));
      localStorage.setItem('billora_org', JSON.stringify(data.organization));
      localStorage.setItem('billora_role', data.role);

      set({
        token: data.token,
        user: data.user,
        activeOrg: data.organization,
        role: data.role,
        loading: false
      });
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  completeOnboarding: async (onboardingData) => {
    set({ loading: true, error: null });
    try {
      const data = await apiRequest('/api/auth/onboard', {
        method: 'POST',
        body: JSON.stringify(onboardingData)
      });

      localStorage.setItem('billora_org', JSON.stringify(data.organization));
      localStorage.setItem('billora_role', data.role);

      set({
        activeOrg: data.organization,
        role: data.role,
        loading: false
      });
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updateOrganization: async (orgSettings) => {
    set({ loading: true, error: null });
    try {
      const data = await apiRequest('/api/auth/organization', {
        method: 'PUT',
        body: JSON.stringify(orgSettings)
      });

      localStorage.setItem('billora_org', JSON.stringify(data));
      
      set({
        activeOrg: data,
        loading: false
      });
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('billora_token');
    localStorage.removeItem('billora_user');
    localStorage.removeItem('billora_org');
    localStorage.removeItem('billora_role');
    set({
      token: null,
      user: null,
      activeOrg: null,
      role: null,
      notifications: []
    });
  },

  switchOrg: async (orgId) => {
    try {
      const data = await apiRequest('/api/auth/switch-org', {
        method: 'POST',
        body: JSON.stringify({ organizationId: orgId })
      });

      localStorage.setItem('billora_org', JSON.stringify(data.organization));
      localStorage.setItem('billora_role', data.role);

      set({
        activeOrg: data.organization,
        role: data.role
      });
      
      get().fetchNotifications();
      return data;
    } catch (err) {
      console.error('Failed to switch organization', err);
      throw err;
    }
  },

  fetchNotifications: async () => {
    if (!get().token) return;
    try {
      const notifications = await apiRequest('/api/notifications');
      set({ notifications });
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  },

  markNotificationRead: async (id) => {
    try {
      await apiRequest(`/api/notifications/${id}/read`, { method: 'PUT' });
      set({
        notifications: get().notifications.map(n => n.id === id ? { ...n, read: true } : n)
      });
    } catch (err) {
      console.error(err);
    }
  },

  markAllNotificationsRead: async () => {
    try {
      await apiRequest('/api/notifications/read-all/batch', { method: 'PUT' });
      set({
        notifications: get().notifications.map(n => ({ ...n, read: true }))
      });
    } catch (err) {
      console.error(err);
    }
  },

  hasPermission: (requiredPermission) => {
    const role = get().role;
    if (!role) return false;
    
    const permissions = {
      SUPER_ADMIN: ['manage_all_orgs', 'view_global_analytics', 'suspend_orgs', 'manage_plans', 'view_all_payments'],
      ORG_ADMIN: ['invite_users', 'assign_roles', 'manage_subscriptions', 'view_analytics', 'manage_billing'],
      FINANCE_MANAGER: ['view_invoices', 'export_reports', 'manage_refunds', 'view_payment_history'],
      TEAM_MEMBER: ['view_usage', 'view_current_plan', 'raise_support_tickets']
    };

    if (role === 'SUPER_ADMIN') return true; // Super admin bypass

    // Check if the role permissions list contains the requiredPermission
    return permissions[role]?.includes(requiredPermission) || false;
  }
}));
