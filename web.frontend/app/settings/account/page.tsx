'use client';

import { useEffect, useState } from 'react';
import { Button, Card, CardBody, CardHeader, Input } from '@heroui/react';
import { AccountInfo, getAccount, LoginError, updateAccount } from '@/services/authservice';

export default function AccountSettingsPage() {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAccount = async () => {
      try {
        const data = await getAccount();
        if (isMounted) {
          setAccount(data);
          setUsername(data.username);
        }
      } catch (err) {
        console.error('Failed to load account info:', err);
        if (isMounted) {
          if (err instanceof LoginError) {
            setError(err.message);
          } else {
            setError('Failed to load account information.');
          }
        }
      }
    };

    loadAccount();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    if (!currentPassword) {
      setError('Current password is required.');
      return;
    }

    if (newPassword && newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsSaving(true);
    try {
      await updateAccount(currentPassword, username !== account?.username ? username : undefined, newPassword || undefined);
      setSuccess('Account updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      if (account) {
        setAccount({ ...account, username });
      }
    } catch (err) {
      console.error('Failed to update account:', err);
      if (err instanceof LoginError) {
        setError(err.message);
      } else {
        setError('Failed to update account. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Account</h1>
          <p className="text-foreground/60 mt-2">Manage your username and password</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Account details</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="Username"
            placeholder="Enter your username"
            value={username}
            onValueChange={setUsername}
            isDisabled={isSaving}
          />
          <Input
            label="Current password"
            placeholder="Enter your current password"
            type="password"
            value={currentPassword}
            onValueChange={setCurrentPassword}
            isDisabled={isSaving}
          />
          <Input
            label="New password"
            placeholder="Enter a new password (optional)"
            type="password"
            value={newPassword}
            onValueChange={setNewPassword}
            isDisabled={isSaving}
          />
          <Input
            label="Confirm new password"
            placeholder="Re-enter new password"
            type="password"
            value={confirmNewPassword}
            onValueChange={setConfirmNewPassword}
            isDisabled={isSaving}
          />

          {error && (
            <div className="p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-md text-danger-700 dark:text-danger-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-md text-success-700 dark:text-success-400 text-sm">
              {success}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              color="primary"
              onPress={handleSave}
              isDisabled={isSaving || !username || !currentPassword}
              isLoading={isSaving}
              className="font-semibold"
            >
              Save changes
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}