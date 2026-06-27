'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, Shield, X } from 'lucide-react';
import type { Admin, UserRole } from '@/types';

export default function AdminsPage() {
  const supabase = createClient();
  const { isSuperAdmin, user } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New admin form
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('admin');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchAdmins = async () => {
    const { data } = await supabase.from('admins').select('*').order('created_at');
    setAdmins((data || []) as Admin[]);
    setLoading(false);
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || !newName) { toast.error('Fill all fields'); return; }
    setCreating(true);

    // Create auth user via Supabase Admin API (server-side)
    // This requires a server-side API route since signUp from client creates session
    const res = await fetch('/api/admins/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, password: newPassword, name: newName, role: newRole }),
    });

    const result = await res.json();
    if (!res.ok) {
      toast.error(result.error || 'Failed to create user');
    } else {
      toast.success(`Admin "${newName}" created!`);
      setShowForm(false);
      setNewEmail(''); setNewName(''); setNewPassword('');
      fetchAdmins();
    }
    setCreating(false);
  };

  const handleDelete = async (admin: Admin) => {
    if (admin.id === user?.id) { toast.error("You can't delete yourself"); return; }
    if (!confirm(`Remove admin "${admin.name}"?`)) return;
    setDeletingId(admin.id);

    const res = await fetch('/api/admins/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: admin.id }),
    });

    if (res.ok) {
      toast.success('Admin removed');
      fetchAdmins();
    } else {
      const r = await res.json();
      toast.error(r.error || 'Failed to delete');
    }
    setDeletingId(null);
  };

  const handleRoleChange = async (admin: Admin, role: UserRole) => {
    const { error } = await supabase.from('admins').update({ role }).eq('id', admin.id);
    if (error) toast.error(error.message);
    else { toast.success(`Role updated to ${role}`); fetchAdmins(); }
  };

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-20">
        <Shield className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <p className="text-slate-500 font-medium">Access Denied</p>
        <p className="text-slate-400 text-sm">Only Super Admins can manage users</p>
      </div>
    );
  }

  const roleBadge: Record<UserRole, string> = {
    super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    viewer: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Admin Users</h1>
          <p className="text-slate-500 text-sm mt-0.5">{admins.length} users registered</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Admin
        </button>
      </div>

      {/* Admins Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden sm:table-cell">Email</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Role</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="border-b border-slate-50">
                  {[...Array(4)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 rounded skeleton-shimmer" /></td>)}
                </tr>
              ))
            ) : admins.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-slate-400">No admins found</td></tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.id} className="border-b border-slate-50 dark:border-slate-800/50 table-row-hover">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                        {admin.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{admin.name}</p>
                        {admin.id === user?.id && <p className="text-xs text-slate-400">You</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{admin.email}</td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={admin.role}
                      onChange={(e) => handleRoleChange(admin, e.target.value as UserRole)}
                      disabled={admin.id === user?.id}
                      className={`px-2 py-1 rounded-full text-xs font-medium border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 ${roleBadge[admin.role]} disabled:opacity-60`}
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="admin">Admin</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => handleDelete(admin)}
                        disabled={admin.id === user?.id || deletingId === admin.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-40"
                      >
                        {deletingId === admin.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Role descriptions */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Role Permissions</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-3">
            <p className="font-semibold text-purple-700 dark:text-purple-400 mb-1">Super Admin</p>
            <p className="text-slate-500">Full access including settings and admin management</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg p-3">
            <p className="font-semibold text-blue-700 dark:text-blue-400 mb-1">Admin</p>
            <p className="text-slate-500">Manage employees, attendance, advances and reports</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg p-3">
            <p className="font-semibold text-slate-600 dark:text-slate-400 mb-1">Viewer</p>
            <p className="text-slate-500">Read-only access to all reports and data</p>
          </div>
        </div>
      </div>

      {/* Create Admin Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Create Admin User</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="Admin Name" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required type="email" placeholder="admin@factory.com" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required type="password" minLength={8} placeholder="Min. 8 characters" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={creating} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition disabled:opacity-60">
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create User
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-lg hover:bg-slate-50 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
