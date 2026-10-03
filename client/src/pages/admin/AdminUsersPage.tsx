import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, UserCheck, UserX } from 'lucide-react';
import { usersApi } from '../../api/users';
import { User } from '../../types/user';
import { Spinner } from '../../components/common/Spinner';
import { Alert } from '../../components/common/Alert';
import { Badge } from '../../components/common/Badge';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await usersApi.getAll();
      setUsers(data.users);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch users');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleUserStatus = async (user: User) => {
    const newStatus = !user.isActive;
    setUpdatingId(user.id);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await usersApi.updateStatus(user.id, newStatus);
      setSuccessMsg(
        res.message || `User ${user.name} was ${newStatus ? 'activated' : 'deactivated'}`
      );
      await fetchUsers();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update user status');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-sky-600 transition mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Admin Dashboard
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900">User Management</h1>
        <p className="text-slate-500 text-sm mt-1">Manage user account statuses and access privileges.</p>
      </div>

      {error && <Alert type="error" message={error} />}
      {successMsg && <Alert type="success" message={successMsg} />}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Spinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Registered Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map((u) => {
                  const isUpdating = updatingId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-semibold text-slate-900">
                        <div>{u.name}</div>
                        <div className="text-xs text-slate-400 font-normal">{u.email}</div>
                      </td>
                      <td className="p-4">
                        <Badge variant={u.role === 'ADMIN' ? 'warning' : 'info'}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={u.isActive ? 'success' : 'danger'}>
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </Badge>
                      </td>
                      <td className="p-4 text-xs text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          disabled={isUpdating}
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                            u.isActive
                              ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {u.isActive ? (
                            <>
                              <UserX className="w-3.5 h-3.5" /> Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5" /> Activate
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
