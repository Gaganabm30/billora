// client/src/pages/Team.jsx
import React, { useEffect, useState } from 'react';
import { apiRequest, useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { Users, UserPlus, Shield, Trash2, CheckCircle, Clock } from 'lucide-react';

export default function Team() {
  const { role, activeOrg } = useAuthStore();
  const { addToast } = useToastStore();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('TEAM_MEMBER');

  // Edit Role State
  const [editingMember, setEditingMember] = useState(null);
  const [editRoleValue, setEditRoleValue] = useState('');

  const loadTeam = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/team');
      setMembers(res);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, [activeOrg]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (role !== 'ORG_ADMIN') return addToast('Only Organization Admins can invite team members.', 'warning');
    if (!inviteEmail || !inviteName) return addToast('Please enter both name and email.', 'warning');

    try {
      await apiRequest('/api/team/invite', {
        method: 'POST',
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName,
          role: inviteRole
        })
      });
      addToast('Invitation sent successfully!', 'success');
      setInviteEmail('');
      setInviteName('');
      setInviteRole('TEAM_MEMBER');
      loadTeam();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleEditRoleSubmit = async (e) => {
    e.preventDefault();
    if (!editingMember) return;
    try {
      await apiRequest(`/api/team/${editingMember.id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: editRoleValue })
      });
      addToast('Member role updated successfully!', 'success');
      setEditingMember(null);
      loadTeam();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleRemoveMember = async (id) => {
    if (role !== 'ORG_ADMIN') return addToast('Only Organization Admins can remove members.', 'warning');
    if (window.confirm('Are you sure you want to remove this team member?')) {
      try {
        await apiRequest(`/api/team/${id}`, { method: 'DELETE' });
        addToast('Member removed successfully.', 'success');
        loadTeam();
      } catch (err) {
        addToast(err.message, 'error');
      }
    }
  };

  const matrixPermissions = [
    { label: 'Invite / Remove Users', admin: true, finance: false, member: false },
    { label: 'Edit Member Roles', admin: true, finance: false, member: false },
    { label: 'Switch / Upgrade Subscription', admin: true, finance: false, member: false },
    { label: 'Manage Saved Cards', admin: true, finance: false, member: false },
    { label: 'Initiate Refunds', admin: true, finance: true, member: false },
    { label: 'Download Receipts', admin: true, finance: true, member: true },
    { label: 'View Invoices & Payments', admin: true, finance: true, member: true },
    { label: 'Raise Support Tickets', admin: true, finance: true, member: true },
    { label: 'Track Limits & Usage meters', admin: true, finance: true, member: true }
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-48 bg-brand-slate-200 dark:bg-brand-slate-800 rounded-2xl" />
        <div className="h-64 bg-brand-slate-200 dark:bg-brand-slate-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      
      {/* Lower Row: Invite Box + Team List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Invite Box */}
        {role === 'ORG_ADMIN' ? (
          <div className="glass-panel p-6 border border-brand-slate-200/50 dark:border-brand-slate-900 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-brand-teal-500" />
              <h2 className="text-sm font-bold font-outfit">Invite Team Member</h2>
            </div>
            
            <form onSubmit={handleInvite} className="flex flex-col gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Organization Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-150"
                >
                  <option value="TEAM_MEMBER">Team Member</option>
                  <option value="FINANCE_MANAGER">Finance Manager</option>
                  <option value="ORG_ADMIN">Organization Admin</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-brand-teal-500 to-brand-cyan-500 text-white font-bold text-xs rounded-xl shadow-glow-teal hover:opacity-95 mt-2"
              >
                Send Invite Link
              </button>
            </form>
          </div>
        ) : (
          <div className="glass-panel p-6 border border-brand-slate-200/50 dark:border-brand-slate-900 bg-brand-slate-100/50 dark:bg-brand-navy-950/20 text-center text-xs text-brand-slate-500 leading-relaxed">
            <Shield className="w-8 h-8 text-brand-slate-400 mx-auto mb-3" />
            <p>You have a read-only role. Only Organization Admins can invite team members and modify RBAC memberships.</p>
          </div>
        )}

        {/* Team Members List */}
        <div className="lg:col-span-2 glass-card border border-brand-slate-200/50 dark:border-brand-slate-900 overflow-hidden shadow-md">
          <div className="p-4 border-b border-brand-slate-200/40 dark:border-brand-slate-800/10 flex items-center justify-between">
            <h2 className="text-sm font-bold font-outfit">Active Members</h2>
            <span className="px-2 py-0.5 bg-brand-slate-200 dark:bg-brand-slate-800 rounded-full font-bold text-[10px] text-brand-slate-600 dark:text-brand-slate-300">
              {members.length} Total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-slate-200/40 dark:border-brand-slate-800/10 bg-brand-slate-100/30 dark:bg-brand-navy-950/10">
                  <th className="p-4 font-bold text-brand-slate-400 uppercase">User Name</th>
                  <th className="p-4 font-bold text-brand-slate-400 uppercase">Active Role</th>
                  <th className="p-4 font-bold text-brand-slate-400 uppercase">Status</th>
                  <th className="p-4 font-bold text-brand-slate-400 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-brand-slate-200/40 dark:border-brand-slate-800/10 hover:bg-brand-slate-200/10 dark:hover:bg-brand-slate-900/10 transition-colors last:border-none">
                    <td className="p-4 flex items-center gap-3">
                      <img 
                        src={member.user?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'} 
                        alt={member.user?.name}
                        className="w-8 h-8 rounded-full object-cover border border-brand-teal-500/20"
                      />
                      <div>
                        <p className="font-bold text-brand-slate-800 dark:text-brand-slate-100">{member.user?.name}</p>
                        <p className="text-[10px] text-brand-slate-400 mt-0.5">{member.user?.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 bg-brand-slate-200 dark:bg-brand-slate-800 text-[10px] font-semibold text-brand-slate-700 dark:text-brand-slate-350 rounded-lg">
                        {member.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full inline-flex items-center gap-0.5 ${
                        member.status === 'ACTIVE'
                          ? 'bg-brand-emerald-500/10 text-brand-emerald-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {member.status === 'ACTIVE' ? <CheckCircle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                        <span>{member.status}</span>
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {role === 'ORG_ADMIN' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditingMember(member); setEditRoleValue(member.role); }}
                            className="text-[10px] text-brand-teal-500 font-semibold hover:underline"
                          >
                            Edit Role
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Visual Permission Matrix */}
      <div className="glass-card border border-brand-slate-200/50 dark:border-brand-slate-900 overflow-hidden shadow-md">
        <div className="p-4 border-b border-brand-slate-200/40 dark:border-brand-slate-800/10">
          <h2 className="text-sm font-bold font-outfit">Workspace Permission Matrix</h2>
          <p className="text-[10px] text-brand-slate-400">Granular verification of operations permitted per tenant role.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-brand-slate-200/40 dark:border-brand-slate-800/10 bg-brand-slate-100/30 dark:bg-brand-navy-950/10">
                <th className="p-4 font-bold text-brand-slate-500">Operation / Control Scope</th>
                <th className="p-4 font-bold text-brand-slate-500 text-center">Organization Admin</th>
                <th className="p-4 font-bold text-brand-slate-500 text-center">Finance Manager</th>
                <th className="p-4 font-bold text-brand-slate-500 text-center">Team Member</th>
              </tr>
            </thead>
            <tbody>
              {matrixPermissions.map((row, idx) => (
                <tr key={idx} className="border-b border-brand-slate-200/40 dark:border-brand-slate-800/10 last:border-none">
                  <td className="p-4 font-medium text-brand-slate-750 dark:text-brand-slate-350">{row.label}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.admin ? 'bg-brand-emerald-500/10 text-brand-emerald-500' : 'bg-brand-slate-200 dark:bg-brand-slate-800 text-brand-slate-400'}`}>
                      {row.admin ? 'YES' : 'NO'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.finance ? 'bg-brand-emerald-500/10 text-brand-emerald-500' : 'bg-brand-slate-200 dark:bg-brand-slate-800 text-brand-slate-400'}`}>
                      {row.finance ? 'YES' : 'NO'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.member ? 'bg-brand-emerald-500/10 text-brand-emerald-500' : 'bg-brand-slate-200 dark:bg-brand-slate-800 text-brand-slate-400'}`}>
                      {row.member ? 'YES' : 'NO'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role Dialog Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-slate-950/70 backdrop-blur-xs dialog-overlay">
          <div className="glass-panel max-w-sm w-full rounded-2xl border border-brand-slate-200 dark:border-brand-slate-800 shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-outfit">Modify Team Role</h3>
              <button onClick={() => setEditingMember(null)} className="p-1 hover:bg-brand-slate-200 dark:hover:bg-brand-slate-850 rounded-lg text-brand-slate-400">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleEditRoleSubmit} className="flex flex-col gap-4">
              <div className="text-xs">
                <p className="text-[10px] text-brand-slate-500">MEMBER USER</p>
                <p className="font-bold text-brand-slate-800 dark:text-brand-slate-200">{editingMember.user?.name}</p>
                <p className="font-mono text-[10px] text-brand-slate-400 mt-0.5">{editingMember.user?.email}</p>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1.5">Select New Role</label>
                <select
                  value={editRoleValue}
                  onChange={(e) => setEditRoleValue(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-150"
                >
                  <option value="TEAM_MEMBER">Team Member</option>
                  <option value="FINANCE_MANAGER">Finance Manager</option>
                  <option value="ORG_ADMIN">Organization Admin</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-brand-teal-500 to-brand-cyan-500 text-white font-bold text-xs rounded-xl shadow-glow-teal hover:opacity-95 mt-2"
              >
                Save Role Assignment
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
