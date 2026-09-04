import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { toast, askReason } from '../../lib/notify';

type Profile = {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  role: 'admin' | 'sales_manager' | 'procurement' | 'operations';
  status: 'active' | 'inactive';
  created_at: string;
  pics?: { id: string; name: string }[];
};

const ROLES: Profile['role'][] = ['admin', 'sales_manager', 'procurement', 'operations'];
const STATUSES: Profile['status'][] = ['active', 'inactive'];

export const UserManagement = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selfId, setSelfId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, meRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/auth/me'),
      ]);
      setUsers(usersRes.data.data);
      setSelfId(meRes.data.data.id);
    } catch (err: any) {
      toast(`Error loading users: ${err.response?.data?.error?.message ?? err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = async (id: string, payload: { role?: Profile['role']; status?: Profile['status'] }) => {
    setSavingId(id);
    try {
      const res = await api.patch(`/admin/users/${id}`, payload);
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...res.data.data } : u)));
    } catch (err: any) {
      toast(`Error updating user: ${err.response?.data?.error?.message ?? err.message}`, 'error');
    } finally {
      setSavingId(null);
    }
  };

  const assignPic = async (id: string, fullName: string | null) => {
    const { confirmed, reason: picName } = await askReason({
      title: 'Assign PIC identity',
      message: 'Enter the PIC name to create and assign to this user.',
      confirmLabel: 'Assign',
      defaultValue: fullName || '',
    });
    if (!confirmed || !picName) return;
    setSavingId(id);
    try {
      await api.post(`/admin/users/${id}/pic`, { name: picName });
      load(); // Reload to fetch the join properly
    } catch (err: any) {
      toast(`Error assigning PIC: ${err.response?.data?.error?.message ?? err.message}`, 'error');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <div className="loading-row"><span className="spinner" />Loading users…</div>;

  return (
    <div className="page-scroll">
      <div className="page-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div className="page-title">User Management</div>
            <div className="page-desc">Manage roles and account status for everyone in the CRM. Assign PIC identities so users can own pipeline data.</div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { load(); toast('Users refreshed', 'success'); }}
            title="Refresh user list"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Refresh
          </button>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="crm" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Email / Name</th>
                <th>PIC Identity (Data Ownership)</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '48px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--s2)', border: '1px solid var(--border-s)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t4)', marginBottom: 12 }}>
                        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', marginBottom: 4 }}>No users found</div>
                      <div style={{ fontSize: 12.5, color: 'var(--t3)' }}>There are no registered user profiles to manage.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map(u => {
                const isSelf = u.id === selfId;
                const isSaving = savingId === u.id;
                const hasPic = u.pics && u.pics.length > 0;
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--t1)' }}>{u.full_name || u.username || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--t4)' }}>{u.email}</div>
                    </td>
                    <td>
                      {hasPic ? (
                        <div className="badge badge-blue">✓ {u.pics![0].name}</div>
                      ) : (
                        <button 
                          className="btn" 
                          style={{ fontSize: 11, padding: '4px 8px' }}
                          onClick={() => assignPic(u.id, u.full_name)}
                          disabled={isSaving}
                        >
                          + Assign PIC
                        </button>
                      )}
                    </td>
                    <td>
                      <select
                        className="inp"
                        value={u.role}
                        disabled={isSelf || isSaving}
                        title={isSelf ? 'Use a different admin account to change your own role.' : undefined}
                        onChange={e => update(u.id, { role: e.target.value as Profile['role'] })}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td>
                      <select
                        className="inp"
                        value={u.status}
                        disabled={isSelf || isSaving}
                        title={isSelf ? 'Use a different admin account to change your own status.' : undefined}
                        onChange={e => update(u.id, { status: e.target.value as Profile['status'] })}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
