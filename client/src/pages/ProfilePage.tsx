import React, { useState } from 'react';
import { User as UserIcon, Mail, Lock, Shield, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../api/users';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { Badge } from '../components/common/Badge';

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuth();

  // Profile update form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password update form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    if (!name.trim() || !email.trim()) {
      setProfileMsg({ type: 'error', text: 'Name and email are required.' });
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const res = await usersApi.updateMe({ name: name.trim(), email: email.trim() });
      setUser(res.user);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { status?: number; data?: { message?: string } } }).response;
        if (response?.status === 409) {
          setProfileMsg({ type: 'error', text: 'This email is already taken by another account.' });
        } else if (response?.data?.message) {
          setProfileMsg({ type: 'error', text: response.data.message });
        } else {
          setProfileMsg({ type: 'error', text: 'Failed to update profile.' });
        }
      } else {
        setProfileMsg({ type: 'error', text: 'Network error. Please try again.' });
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!currentPassword || !newPassword) {
      setPasswordMsg({ type: 'error', text: 'All password fields are required.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await usersApi.updatePassword({ currentPassword, newPassword });
      setPasswordMsg({ type: 'success', text: res.message || 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { status?: number; data?: { message?: string } } }).response;
        if (response?.status === 400) {
          setPasswordMsg({ type: 'error', text: 'Current password is incorrect.' });
        } else if (response?.data?.message) {
          setPasswordMsg({ type: 'error', text: response.data.message });
        } else {
          setPasswordMsg({ type: 'error', text: 'Failed to update password.' });
        }
      } else {
        setPasswordMsg({ type: 'error', text: 'Network error. Please try again.' });
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Account Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your personal information and security credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-sky-50 text-sky-600 rounded-full">
              <UserIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">{user?.name}</h3>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-500">
            <div className="flex items-center justify-between">
              <span>Role:</span>
              <Badge variant={user?.role === 'ADMIN' ? 'warning' : 'info'}>
                {user?.role}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Account Status:</span>
              <Badge variant={user?.isActive ? 'success' : 'danger'}>
                {user?.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Update Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Details Form */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-sky-600" /> Personal Details
            </h3>

            {profileMsg && <Alert type={profileMsg.type} message={profileMsg.text} />}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<UserIcon className="w-4 h-4" />}
              />

              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Button
                type="submit"
                variant="primary"
                isLoading={isUpdatingProfile}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Profile
              </Button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-sky-600" /> Change Security Password
            </h3>

            {passwordMsg && <Alert type={passwordMsg.type} message={passwordMsg.text} />}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <Button
                type="submit"
                variant="secondary"
                isLoading={isUpdatingPassword}
                leftIcon={<Shield className="w-4 h-4" />}
              >
                Update Password
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
