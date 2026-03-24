import { useState, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import Spinner from 'ink-spinner';
import type { CleanItem, SortOrder } from '../types.js';
import type { ScanPhase } from '../scanner.js';
import { formatSize } from '../format.js';

const SORT_LABELS: Record<SortOrder, string> = {
  'size-desc': 'size ↓',
  'size-asc': 'size ↑',
  'name-asc': 'name A→Z',
  'name-desc': 'name Z→A',
};

const SORT_CYCLE: SortOrder[] = ['size-desc', 'size-asc', 'name-asc', 'name-desc'];

function sortItems(items: CleanItem[], order: SortOrder): CleanItem[] {
  return [...items].sort((a, b) => {
    switch (order) {
      case 'size-desc': return b.sizeBytes - a.sizeBytes;
      case 'size-asc': return a.sizeBytes - b.sizeBytes;
      case 'name-asc': return a.rel.localeCompare(b.rel);
      case 'name-desc': return b.rel.localeCompare(a.rel);
    }
  });
}

function formatSelectedSize(items: CleanItem[]): string {
  const bytes = items.filter(i => i.selected).reduce((s, i) => s + i.sizeBytes, 0);
  return formatSize(bytes);
}

interface Props {
  items: CleanItem[];
  scanPhase: ScanPhase;
  onToggle: (path: string) => void;
  onSelectAll: (paths: string[]) => void;
  onDeselectAll: () => void;
  onDelete: () => void;
  onQuit: () => void;
}

export function ListView({ items, scanPhase, onToggle, onSelectAll, onDeselectAll, onDelete, onQuit }: Props) {
  const { stdout } = useStdout();
  const termHeight = stdout?.rows ?? 24;

  const [cursor, setCursor] = useState(0);
  const [sortOrder, setSortOrder] = useState<SortOrder>('size-desc');
  const [filter, setFilter] = useState('');
  const [filtering, setFiltering] = useState(false);

  const filtered = sortItems(
    filter ? items.filter(i => i.rel.toLowerCase().includes(filter.toLowerCase()) || i.typeLabel.toLowerCase().includes(filter.toLowerCase())) : items,
    sortOrder
  );

  const selectedCount = items.filter(i => i.selected).length;
  const selectedSize = formatSelectedSize(items);

  // Keep cursor in bounds
  useEffect(() => {
    if (cursor >= filtered.length && filtered.length > 0) {
      setCursor(filtered.length - 1);
    }
  }, [filtered.length, cursor]);

  // Visible window: reserve 6 rows for header + footer
  const listHeight = Math.max(termHeight - 6, 5);
  const scrollOffset = Math.max(0, cursor - Math.floor(listHeight / 2));
  const visible = filtered.slice(scrollOffset, scrollOffset + listHeight);

  useInput((input, key) => {
    if (filtering) {
      if (key.escape) {
        setFilter('');
        setFiltering(false);
        return;
      }
      if (key.return) {
        setFiltering(false);
        return;
      }
      if (key.backspace || key.delete) {
        setFilter(f => f.slice(0, -1));
        return;
      }
      if (input && !key.ctrl && !key.meta) {
        setFilter(f => f + input);
      }
      return;
    }

    if (key.upArrow) {
      setCursor(c => Math.max(0, c - 1));
    } else if (key.downArrow) {
      setCursor(c => Math.min(filtered.length - 1, c + 1));
    } else if (input === ' ') {
      const item = filtered[cursor];
      if (item) onToggle(item.path);
    } else if (input === 'a') {
      const allSelected = filtered.every(i => i.selected);
      if (allSelected) {
        onDeselectAll();
      } else {
        onSelectAll(filtered.map(i => i.path));
      }
    } else if (input === '/') {
      setFiltering(true);
    } else if (key.escape) {
      setFilter('');
    } else if (input === 's') {
      setSortOrder(o => {
        const idx = SORT_CYCLE.indexOf(o);
        return SORT_CYCLE[(idx + 1) % SORT_CYCLE.length]!;
      });
    } else if (input === 'd') {
      if (selectedCount > 0) onDelete();
    } else if (input === 'q') {
      onQuit();
    }
  });

  return (
    <Box flexDirection="column" width="100%">
      {/* Header */}
      <Box borderStyle="round" borderColor="cyan" paddingX={1}>
        <Text bold color="cyan">repoclean</Text>
        <Text>{'  '}</Text>
        <Text dimColor>{items.length} found</Text>
        <Text>{'  '}</Text>
        <Text color={selectedCount > 0 ? 'green' : 'gray'}>
          {selectedCount} selected ({selectedSize})
        </Text>
        <Text>{'  '}</Text>
        <Text dimColor>sort: {SORT_LABELS[sortOrder]}</Text>
        {scanPhase.phase === 'sizing' && (
          <>
            <Text color="yellow">{'  '}<Spinner type="dots" /></Text>
            <Text color="yellow">
              {' '}sizing {scanPhase.done}/{scanPhase.total}
            </Text>
          </>
        )}
      </Box>

      {/* Filter bar */}
      {(filtering || filter) && (
        <Box paddingX={1}>
          <Text color="yellow">{'/'}</Text>
          <Text>{filter}</Text>
          {filtering && <Text color="gray">_</Text>}
          {!filtering && filter && <Text dimColor>  [Esc] clear</Text>}
        </Box>
      )}

      {/* List */}
      <Box flexDirection="column">
        {filtered.length === 0 && scanPhase.phase === 'complete' && (
          <Box paddingX={2} paddingY={1}>
            <Text dimColor>{filter ? 'No matches.' : 'Nothing to clean up.'}</Text>
          </Box>
        )}
        {visible.map((item, visIdx) => {
          const absIdx = scrollOffset + visIdx;
          const isCursor = absIdx === cursor;
          return (
            <Box key={item.path}>
              <Text color={isCursor ? 'cyan' : undefined}>{isCursor ? '▸ ' : '  '}</Text>
              <Text color={item.selected ? 'green' : 'gray'}>{item.selected ? '✓ ' : '· '}</Text>
              <Text color={isCursor ? 'white' : undefined} bold={isCursor}>
                {item.rel.padEnd(52).slice(0, 52)}
              </Text>
              <Text dimColor>{'  '}</Text>
              <Text color="yellow">{item.sizeLabel.padStart(10)}</Text>
              <Text dimColor>{'  '}</Text>
              <Text color="blue">[{item.typeLabel}]</Text>
            </Box>
          );
        })}
      </Box>

      {/* Footer */}
      <Box borderStyle="single" borderColor="gray" paddingX={1} marginTop={0}>
        <Text dimColor>[↑↓] nav  [Space] select  [a] all/none  [/] filter  [s] sort  </Text>
        <Text color={selectedCount > 0 ? 'red' : 'gray'}>[d] delete</Text>
        <Text dimColor>  [q] quit</Text>
      </Box>
    </Box>
  );
}
