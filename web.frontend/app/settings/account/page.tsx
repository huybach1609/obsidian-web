"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input, toast } from "@heroui/react";
import { XIcon } from "lucide-react";

import {
  AccountInfo,
  getAccount,
  LoginError,
  updateAccount,
} from "@/services/authservice";
import { useEditorSettings } from "@/contexts/AppContext";

export default function AccountSettingsPage() {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { setPageTitle } = useEditorSettings();

  useEffect(() => {
    setPageTitle({
      title: "Account",
      description: "Manage your username and password",
      icon: null,
    });

    let isMounted = true;

    const loadAccount = async () => {
      try {
        const data = await getAccount();

        if (isMounted) {
          setAccount(data);
          setUsername(data.username);
        }
      } catch (err) {
        console.error("Failed to load account info:", err);
        if (isMounted) {
          if (err instanceof LoginError) {
            setError(err.message);
          } else {
            setError("Failed to load account information.");
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
      setError("Current password is required.");

      return;
    }

    if (newPassword && newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");

      return;
    }

    setIsSaving(true);
    try {
      await updateAccount(
        currentPassword,
        username !== account?.username ? username : undefined,
        newPassword || undefined,
      );
      setSuccess("Account updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      if (account) {
        setAccount({ ...account, username });
      }
    } catch (err) {
      toast("Failed to update account. Please try again.", {
        actionProps: {
          children: "Dismiss",
          onPress: () => toast.clear(),
          variant: "tertiary",
        },
        // description: "Failed to update account. Please try again.",
        indicator: <XIcon />,
        variant: "default",
      });
      if (err instanceof LoginError) {
        setError(err.message);
      } else {
        setError("Failed to update account. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold">Account details</h2>
        </Card.Header>
        <Card.Content className="space-y-4">
          <Input
            disabled={isSaving}
            // label="Username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            disabled={isSaving}
            placeholder="Enter your current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            disabled={isSaving}
            placeholder="Enter a new password (optional)"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <Input
            disabled={isSaving}
            placeholder="Re-enter new password"
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />

          {error && (
            <div className="p-3 bg-danger/10 dark:bg-danger/20 border border-danger/20 dark:border-danger/40 rounded-md text-danger text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-success/10 dark:bg-success/20 border border-success/20 dark:border-success/40 rounded-md text-success text-sm">
              {success}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              className="font-semibold"
              isDisabled={isSaving || !username || !currentPassword}
              // isLoading={isSaving}
              onPress={handleSave}
            >
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
