import { Box, Text, useInput } from 'ink';
import type { CleanItem } from '../types.js';
import { formatSize } from '../format.js';

function totalSize(items: CleanItem[]): string {
  const bytes = items.reduce((s, i) => s + i.sizeBytes, 0);
  return formatSize(bytes);
}

interface Props {
  selected: CleanItem[];
  onConfirm: () => void;
  onCancel: () => void;
  onQuit: () => void;
}

export function ConfirmView({ selected, onConfirm, onCancel, onQuit }: Props) {
  useInput((input, key) => {
    if (input === 'y') onConfirm();
    if (input === 'n' || key.escape) onCancel();
    if (input === 'q') onQuit();
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="red">⚠  Confirm Deletion</Text>
      </Box>

      <Box marginBottom={1}>
        <Text>The following directories will be </Text>
        <Text bold color="red">permanently deleted</Text>
        <Text>:</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        {selected.map(item => (
          <Box key={item.path}>
            <Text color="red">  ✕ </Text>
            <Text>{item.rel.padEnd(52).slice(0, 52)}</Text>
            <Text dimColor>{'  '}</Text>
            <Text color="yellow">{item.sizeLabel.padStart(10)}</Text>
          </Box>
        ))}
      </Box>

      <Box borderStyle="single" borderColor="yellow" paddingX={1} marginBottom={1}>
        <Text>Total freed: </Text>
        <Text bold color="yellow">{totalSize(selected)}</Text>
        <Text dimColor>  ({selected.length} {selected.length === 1 ? 'directory' : 'directories'})</Text>
      </Box>

      <Box>
        <Text bold color="green">[y] Confirm</Text>
        <Text>{'   '}</Text>
        <Text bold color="gray">[n] / [Esc] Cancel   [q] Quit</Text>
      </Box>
    </Box>
  );
}
