"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Switch,
  Card,
  ListBox,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Select,
} from "@heroui/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

import { useAppSettings } from "@/contexts/AppContext";
import {
  VimConfig,
  VimKeyMapping,
  VimExCommand,
  VimMode,
} from "@/types/vimConfig";

export default function VimSettingsPage() {
  const { vimMode, setVimMode, vimConfig, setVimConfig } = useAppSettings();
  const [localConfig, setLocalConfig] = useState<VimConfig>(vimConfig);
  const [newKeyMapping, setNewKeyMapping] = useState<Partial<VimKeyMapping>>({
    keys: "",
    action: "",
    mode: "insert",
  });
  const [newExCommand, setNewExCommand] = useState<Partial<VimExCommand>>({
    name: "",
    shortName: "",
    handler: "",
  });
  const [newUnmappedKey, setNewUnmappedKey] = useState<{
    keys: string;
    mode: VimMode;
  }>({
    keys: "",
    mode: "insert",
  });

  useEffect(() => {
    setLocalConfig(vimConfig);
  }, [vimConfig]);

  const handleSave = async () => {
    try {
      await setVimConfig(localConfig);
    } catch (error) {
      console.error("Failed to save vim config:", error);
      // You might want to show a toast notification here
    }
  };

  const handleAddKeyMapping = () => {
    if (newKeyMapping.keys && newKeyMapping.action) {
      setLocalConfig({
        ...localConfig,
        keyMappings: [
          ...localConfig.keyMappings,
          {
            keys: newKeyMapping.keys,
            action: newKeyMapping.action,
            mode: newKeyMapping.mode || "insert",
          },
        ],
      });
      setNewKeyMapping({ keys: "", action: "", mode: "insert" });
    }
  };

  const handleRemoveKeyMapping = (index: number) => {
    setLocalConfig({
      ...localConfig,
      keyMappings: localConfig.keyMappings.filter((_, i) => i !== index),
    });
  };

  const handleAddExCommand = () => {
    if (newExCommand.name && newExCommand.shortName && newExCommand.handler) {
      setLocalConfig({
        ...localConfig,
        exCommands: [
          ...localConfig.exCommands,
          {
            name: newExCommand.name,
            shortName: newExCommand.shortName,
            handler: newExCommand.handler,
          },
        ],
      });
      setNewExCommand({ name: "", shortName: "", handler: "" });
    }
  };

  const handleRemoveExCommand = (index: number) => {
    setLocalConfig({
      ...localConfig,
      exCommands: localConfig.exCommands.filter((_, i) => i !== index),
    });
  };

  const handleAddUnmappedKey = () => {
    if (newUnmappedKey.keys) {
      setLocalConfig({
        ...localConfig,
        unmappedKeys: [
          ...localConfig.unmappedKeys,
          {
            keys: newUnmappedKey.keys,
            mode: newUnmappedKey.mode,
          },
        ],
      });
      setNewUnmappedKey({ keys: "", mode: "insert" });
    }
  };

  const handleRemoveUnmappedKey = (index: number) => {
    setLocalConfig({
      ...localConfig,
      unmappedKeys: localConfig.unmappedKeys.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Vim Configuration
          </h1>
          <p className="text-foreground/60 mt-2">
            Customize your Vim keybindings and commands
          </p>
        </div>
        <Button className="font-semibold" onPress={handleSave}>
          Save Configuration
        </Button>
      </div>

      {/* Vim Mode Toggle */}
      <Card>
        <Card.Header className="flex flex-col items-start gap-2">
          <h2 className="text-xl font-semibold">Enable Vim Mode</h2>
          <p className="text-sm text-foreground/60">
            Toggle Vim mode on or off globally
          </p>
        </Card.Header>
        <Card.Content>
          <Switch isSelected={vimMode} size="lg" onChange={setVimMode}>
            <span className="text-foreground">
              Vim Mode {vimMode ? "Enabled" : "Disabled"}
            </span>
          </Switch>
        </Card.Content>
      </Card>

      {/* Key Mappings */}
      <Card>
        <Card.Header className="flex flex-col items-start gap-2">
          <h2 className="text-xl font-semibold">Key Mappings</h2>
          <p className="text-sm text-foreground/60">
            Map keys to Vim actions (e.g., jj to &lt;Esc&gt;)
          </p>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div className="flex gap-2">
            <Input
              className="flex-1"
              placeholder="Keys (e.g., jj)"
              value={newKeyMapping.keys || ""}
              onChange={(e) =>
                setNewKeyMapping({ ...newKeyMapping, keys: e.target.value })
              }
            />
            <Input
              className="flex-1"
              placeholder="Action (e.g., &lt;Esc&gt;)"
              value={newKeyMapping.action || ""}
              onChange={(e) =>
                setNewKeyMapping({ ...newKeyMapping, action: e.target.value })
              }
            />
            <Select
              aria-label="Select mode"
              className="w-40"
              placeholder="Mode"
              value={newKeyMapping.mode ?? null}
              onChange={(value) => {
                const modeKey = Array.isArray(value) ? value[0] : value;

                if (!modeKey) return;
                setNewKeyMapping({
                  ...newKeyMapping,
                  mode: String(modeKey) as VimMode,
                });
              }}
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox aria-label="Mode">
                  <ListBox.Item id="insert" textValue="Insert">
                    Insert
                  </ListBox.Item>
                  <ListBox.Item id="normal" textValue="Normal">
                    Normal
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
            <Button isIconOnly variant="outline" onPress={handleAddKeyMapping}>
              <PlusIcon className="w-5 h-5" />
            </Button>
          </div>

          {localConfig.keyMappings.length > 0 && (
            <Table aria-label="Key mappings">
              <TableHeader>
                <TableColumn>KEYS</TableColumn>
                <TableColumn>ACTION</TableColumn>
                <TableColumn>MODE</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {localConfig.keyMappings.map((mapping, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <code className="px-2 py-1 bg-default-100 rounded text-sm">
                        {mapping.keys}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-default-100 rounded text-sm">
                        {mapping.action}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={mapping.mode === "insert" ? "warning" : "accent"}
                        size="sm"
                        // variant="solid"
                      >
                        {mapping.mode}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        onPress={() => handleRemoveKeyMapping(index)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card.Content>
      </Card>

      {/* Ex Commands */}
      <Card>
        <Card.Header className="flex flex-col items-start gap-2">
          <h2 className="text-xl font-semibold">Ex Commands</h2>
          <p className="text-sm text-foreground/60">
            Define custom Ex commands (e.g., :write, :w)
          </p>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div className="flex gap-2">
            <Input
              className="flex-1"
              placeholder="Command name (e.g., write)"
              value={newExCommand.name || ""}
              onChange={(e) =>
                setNewExCommand({ ...newExCommand, name: e.target.value })
              }
            />
            <Input
              className="flex-1"
              placeholder="Short name (e.g., w)"
              value={newExCommand.shortName || ""}
              onChange={(e) =>
                setNewExCommand({
                  ...newExCommand,
                  shortName: e.target.value,
                })
              }
            />
            <Input
              className="flex-1"
              placeholder="Handler function body"
              value={newExCommand.handler || ""}
              onChange={(e) =>
                setNewExCommand({
                  ...newExCommand,
                  handler: e.target.value,
                })
              }
            />
            <Button isIconOnly variant="outline" onPress={handleAddExCommand}>
              <PlusIcon className="w-5 h-5" />
            </Button>
          </div>

          {localConfig.exCommands.length > 0 && (
            <Table aria-label="Ex commands">
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>SHORT NAME</TableColumn>
                <TableColumn>HANDLER</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {localConfig.exCommands.map((cmd, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <code className="px-2 py-1 bg-default-100 rounded text-sm">
                        :{cmd.name}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-default-100 rounded text-sm">
                        :{cmd.shortName}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-default-100 rounded text-xs max-w-md truncate block">
                        {cmd.handler}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Button
                        isIconOnly
                        // color="danger"
                        size="sm"
                        variant="danger"
                        onPress={() => handleRemoveExCommand(index)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card.Content>
      </Card>

      {/* Unmapped Keys */}
      <Card>
        <Card.Header className="flex flex-col items-start gap-2">
          <h2 className="text-xl font-semibold">Unmapped Keys</h2>
          <p className="text-sm text-foreground/60">
            Remove key mappings (e.g., unmap jj in insert mode)
          </p>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div className="flex gap-2">
            <Input
              className="flex-1"
              placeholder="Keys to unmap (e.g., jj)"
              value={newUnmappedKey.keys}
              onChange={(e) =>
                setNewUnmappedKey({
                  ...newUnmappedKey,
                  keys: e.target.value,
                })
              }
            />
            <Select
              aria-label="Select mode"
              className="w-40"
              placeholder="Mode"
              value={newUnmappedKey.mode ?? null}
              onChange={(value) => {
                const modeKey = Array.isArray(value) ? value[0] : value;

                if (!modeKey) return;
                setNewUnmappedKey({
                  ...newUnmappedKey,
                  mode: String(modeKey) as VimMode,
                });
              }}
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox aria-label="Mode">
                  <ListBox.Item id="insert" textValue="Insert">
                    Insert
                  </ListBox.Item>
                  <ListBox.Item id="normal" textValue="Normal">
                    Normal
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
            <Button isIconOnly variant="outline" onPress={handleAddUnmappedKey}>
              <PlusIcon className="w-5 h-5" />
            </Button>
          </div>

          {localConfig.unmappedKeys.length > 0 && (
            <Table aria-label="Unmapped keys">
              <TableHeader>
                <TableColumn>KEYS</TableColumn>
                <TableColumn>MODE</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {localConfig.unmappedKeys.map((unmapped, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <code className="px-2 py-1 bg-default-100 rounded text-sm">
                        {unmapped.keys}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={
                          unmapped.mode === "insert" ? "warning" : "accent"
                        }
                        size="sm"
                        // variant="flat"
                      >
                        {unmapped.mode}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Button
                        isIconOnly
                        // color="danger"
                        size="sm"
                        variant="ghost"
                        onPress={() => handleRemoveUnmappedKey(index)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
