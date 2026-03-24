import { Box, Text, useInput } from 'ink';
import type { DeletedItem } from '../types.js';
import { formatSize } from '../format.js';

function totalSize(items: DeletedItem[]): string {
  const bytes = items.reduce((s, i) => s + i.sizeBytes, 0);
  return formatSize(bytes);
}

interface Props {
  deleted: DeletedItem[];
  onReturn: () => void;
  onQuit: () => void;
}

export function SummaryView({ deleted, onReturn, onQuit }: Props) {
  useInput((input) => {
    if (input === 'r') onReturn();
    if (input === 'q') onQuit();
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="green">✓  Cleanup Complete</Text>
      </Box>

      <Box marginBottom={1}>
        <Text>Deleted </Text>
        <Text bold color="green">{deleted.length} {deleted.length === 1 ? 'directory' : 'directories'}</Text>
        <Text>, freed </Text>
        <Text bold color="yellow">{totalSize(deleted)}</Text>
        <Text>.</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        {deleted.map(item => (
          <Box key={item.rel}>
            <Text color="green">  ✓ </Text>
            <Text>{item.rel.padEnd(52).slice(0, 52)}</Text>
            <Text dimColor>{'  '}</Text>
            <Text color="yellow">{item.sizeLabel.padStart(10)}</Text>
          </Box>
        ))}
      </Box>

      <Box>
        <Text bold color="cyan">[r] Return to list</Text>
        <Text>{'   '}</Text>
        <Text bold color="gray">[q] Quit</Text>
      </Box>
    </Box>
  );
}
