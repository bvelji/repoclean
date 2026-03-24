import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface Props {
  index: number;   // 1-based current item
  total: number;
  currentRel: string;
}

export function DeletingView({ index, total, currentRel }: Props) {
  const pct = total > 0 ? Math.round((index / total) * 100) : 0;
  const barWidth = 30;
  const filled = Math.round((index / total) * barWidth);
  const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box marginBottom={1}>
        <Text color="red"><Spinner type="dots" /></Text>
        <Text bold>  Deleting…</Text>
      </Box>

      <Box marginBottom={1}>
        <Text color="yellow">[{bar}]</Text>
        <Text>  {index}/{total} ({pct}%)</Text>
      </Box>

      <Box>
        <Text dimColor>Removing: </Text>
        <Text>{currentRel}</Text>
      </Box>
    </Box>
  );
}
