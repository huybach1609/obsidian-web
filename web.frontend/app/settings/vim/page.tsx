'use client';

import { useState, useEffect } from 'react';
import { useAppSettings } from '@/contexts/AppContext';
import { VimConfig, VimKeyMapping, VimExCommand, VimMode } from '@/types/vimConfig';
import { Button, Input, Switch, Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Select, SelectItem } from '@heroui/react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function VimSettingsPage() {
  const { vimMode, setVimMode, vimConfig, setVimConfig } = useAppSettings();
  const [localConfig, setLocalConfig] = useState<VimConfig>(vimConfig);
  const [newKeyMapping, setNewKeyMapping] = useState<Partial<VimKeyMapping>>({
    keys: '',
    action: '',
    mode: 'insert',
  });
  const [newExCommand, setNewExCommand] = useState<Partial<VimExCommand>>({
    name: '',
    shortName: '',
    handler: '',
  });
  const [newUnmappedKey, setNewUnmappedKey] = useState<{ keys: string; mode: VimMode }>({
    keys: '',
    mode: 'insert',
  });

  useEffect(() => {
    setLocalConfig(vimConfig);
  }, [vimConfig]);

  const handleSave = async () => {
    try {
      await setVimConfig(localConfig);
    } catch (error) {
      console.error('Failed to save vim config:', error);
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
            mode: newKeyMapping.mode || 'insert',
          },
        ],
      });
      setNewKeyMapping({ keys: '', action: '', mode: 'insert' });
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
      setNewExCommand({ name: '', shortName: '', handler: '' });
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
      setNewUnmappedKey({ keys: '', mode: 'insert' });
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
          <h1 className="text-3xl font-bold text-foreground">Vim Configuration</h1>
          <p className="text-foreground/60 mt-2">Customize your Vim keybindings and commands</p>
        </div>
        <Button
          color="primary"
          onPress={handleSave}
          className="font-semibold"
        >
          Save Configuration
        </Button>
      </div>

      {/* Vim Mode Toggle */}
      <Card>
        <CardHeader className="flex flex-col items-start gap-2">
          <h2 className="text-xl font-semibold">Enable Vim Mode</h2>
          <p className="text-sm text-foreground/60">Toggle Vim mode on or off globally</p>
        </CardHeader>
        <CardBody>
          <Switch
            isSelected={vimMode}
            onValueChange={setVimMode}
            size="lg"
          >
            <span className="text-foreground">Vim Mode {vimMode ? 'Enabled' : 'Disabled'}</span>
          </Switch>
        </CardBody>
      </Card>

      {/* Key Mappings */}
      <Card>
        <CardHeader className="flex flex-col items-start gap-2">
          <h2 className="text-xl font-semibold">Key Mappings</h2>
          <p className="text-sm text-foreground/60">Map keys to Vim actions (e.g., "jj" to "&lt;Esc&gt;")</p>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Keys (e.g., jj)"
              value={newKeyMapping.keys || ''}
              onValueChange={(value) => setNewKeyMapping({ ...newKeyMapping, keys: value })}
              className="flex-1"
            />
            <Input
              placeholder="Action (e.g., &lt;Esc&gt;)"
              value={newKeyMapping.action || ''}
              onValueChange={(value) => setNewKeyMapping({ ...newKeyMapping, action: value })}
              className="flex-1"
            />
            <Select
              selectedKeys={newKeyMapping.mode ? [newKeyMapping.mode] : []}
              onSelectionChange={(keys) => {
                const mode = Array.from(keys)[0] as VimMode;
                setNewKeyMapping({ ...newKeyMapping, mode });
              }}
              placeholder="Mode"
              className="w-40"
            >
              <SelectItem key="insert">Insert</SelectItem>
              <SelectItem key="normal" >Normal</SelectItem>
            </Select>
            <Button
              color="primary"
              variant="flat"
              onPress={handleAddKeyMapping}
              isIconOnly
            >
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
                      <code className="px-2 py-1 bg-default-100 rounded text-sm">{mapping.keys}</code>
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-default-100 rounded text-sm">{mapping.action}</code>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat" color={mapping.mode === 'insert' ? 'primary' : 'secondary'}>
                        {mapping.mode}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Button
                        color="danger"
                        variant="light"
                        size="sm"
                        onPress={() => handleRemoveKeyMapping(index)}
                        isIconOnly
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Ex Commands */}
      <Card>
        <CardHeader className="flex flex-col items-start gap-2">
          <h2 className="text-xl font-semibold">Ex Commands</h2>
          <p className="text-sm text-foreground/60">Define custom Ex commands (e.g., :write, :w)</p>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Command name (e.g., write)"
              value={newExCommand.name || ''}
              onValueChange={(value) => setNewExCommand({ ...newExCommand, name: value })}
              className="flex-1"
            />
            <Input
              placeholder="Short name (e.g., w)"
              value={newExCommand.shortName || ''}
              onValueChange={(value) => setNewExCommand({ ...newExCommand, shortName: value })}
              className="flex-1"
            />
            <Input
              placeholder="Handler function body"
              value={newExCommand.handler || ''}
              onValueChange={(value) => setNewExCommand({ ...newExCommand, handler: value })}
              className="flex-1"
            />
            <Button
              color="primary"
              variant="flat"
              onPress={handleAddExCommand}
              isIconOnly
            >
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
                      <code className="px-2 py-1 bg-default-100 rounded text-sm">:{cmd.name}</code>
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-default-100 rounded text-sm">:{cmd.shortName}</code>
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-default-100 rounded text-xs max-w-md truncate block">
                        {cmd.handler}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Button
                        color="danger"
                        variant="light"
                        size="sm"
                        onPress={() => handleRemoveExCommand(index)}
                        isIconOnly
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Unmapped Keys */}
      <Card>
        <CardHeader className="flex flex-col items-start gap-2">
          <h2 className="text-xl font-semibold">Unmapped Keys</h2>
          <p className="text-sm text-foreground/60">Remove key mappings (e.g., unmap "jj" in insert mode)</p>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Keys to unmap (e.g., jj)"
              value={newUnmappedKey.keys}
              onValueChange={(value) => setNewUnmappedKey({ ...newUnmappedKey, keys: value })}
              className="flex-1"
            />
            <Select
              selectedKeys={[newUnmappedKey.mode]}
              onSelectionChange={(keys) => {
                const mode = Array.from(keys)[0] as VimMode;
                setNewUnmappedKey({ ...newUnmappedKey, mode });
              }}
              placeholder="Mode"
              className="w-40"
            >
              <SelectItem key="insert">Insert</SelectItem>
              <SelectItem key="normal">Normal</SelectItem>
            </Select>
            <Button
              color="primary"
              variant="flat"
              onPress={handleAddUnmappedKey}
              isIconOnly
            >
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
                      <code className="px-2 py-1 bg-default-100 rounded text-sm">{unmapped.keys}</code>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat" color={unmapped.mode === 'insert' ? 'primary' : 'secondary'}>
                        {unmapped.mode}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Button
                        color="danger"
                        variant="light"
                        size="sm"
                        onPress={() => handleRemoveUnmappedKey(index)}
                        isIconOnly
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
