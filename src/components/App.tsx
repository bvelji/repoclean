import { useState, useEffect, useCallback } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { scan } from '../scanner.js';
import type { ScanPhase } from '../scanner.js';
import { ListView } from './ListView.js';
import { ConfirmView } from './ConfirmView.js';
import { DeletingView } from './DeletingView.js';
import { SummaryView } from './SummaryView.js';
import type { AppView, CleanItem, DeletedItem } from '../types.js';

const execFileAsync = promisify(execFile);

interface DeletionProgress {
  index: number;
  total: number;
  currentRel: string;
}

interface Props {
  reposDir?: string;
}

export function App({ reposDir }: Props) {
  const [view, setView] = useState<AppView>('loading');
  const [items, setItems] = useState<CleanItem[]>([]);
  const [scanPhase, setScanPhase] = useState<ScanPhase>({ phase: 'walking' });
  const [toDelete, setToDelete] = useState<CleanItem[]>([]);
  const [deletionProgress, setDeletionProgress] = useState<DeletionProgress>({ index: 0, total: 0, currentRel: '' });
  const [deleted, setDeleted] = useState<DeletedItem[]>([]);

  useEffect(() => {
    scan(
      (item) => {
        setItems(prev => [...prev, item]);
      },
      () => {
        setView(v => v === 'loading' ? 'list' : v);
      },
      reposDir,
      (phase) => {
        setScanPhase(phase);
        // Transition to list as soon as sizing starts so the user sees progress
        if (phase.phase === 'sizing') {
          setView(v => v === 'loading' ? 'list' : v);
        }
      },
    );
  }, []);

  // Async deletion — runs when view transitions to 'deleting'
  useEffect(() => {
    if (view !== 'deleting' || toDelete.length === 0) return;

    let cancelled = false;

    async function runDeletion() {
      const results: DeletedItem[] = [];

      for (let i = 0; i < toDelete.length; i++) {
        if (cancelled) break;
        const item = toDelete[i]!;
        setDeletionProgress({ index: i + 1, total: toDelete.length, currentRel: item.rel });

        try {
          await execFileAsync('rm', ['-rf', item.path]);
        } catch {
          // Dir already gone or permission error — continue anyway
        }

        results.push({ rel: item.rel, sizeBytes: item.sizeBytes, sizeLabel: item.sizeLabel });
      }

      if (!cancelled) {
        const deletedPaths = new Set(toDelete.map(i => i.path));
        setItems(prev => prev.filter(i => !deletedPaths.has(i.path)));
        setDeleted(results);
        setView('summary');
      }
    }

    runDeletion();
    return () => { cancelled = true; };
  }, [view, toDelete]);

  const handleToggle = useCallback((path: string) => {
    setItems(prev => prev.map(i => i.path === path ? { ...i, selected: !i.selected } : i));
  }, []);

  const handleSelectAll = useCallback((paths: string[]) => {
    const pathSet = new Set(paths);
    setItems(prev => prev.map(i => pathSet.has(i.path) ? { ...i, selected: true } : i));
  }, []);

  const handleDeselectAll = useCallback(() => {
    setItems(prev => prev.map(i => ({ ...i, selected: false })));
  }, []);

  const handleDelete = useCallback(() => {
    setView('confirm');
  }, []);

  const handleConfirm = useCallback(() => {
    const selected = items.filter(i => i.selected);
    setToDelete(selected);
    setDeletionProgress({ index: 0, total: selected.length, currentRel: selected[0]?.rel ?? '' });
    setView('deleting');
  }, [items]);

  const handleCancel = useCallback(() => {
    setView('list');
  }, []);

  const handleQuit = useCallback(() => {
    process.exit(0);
  }, []);

  if (view === 'loading') {
    const walkingDir = scanPhase.phase === 'walking' ? scanPhase.currentDir : undefined;
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Box>
          <Text color="cyan"><Spinner type="dots" /></Text>
          <Text>  Walking {reposDir ?? '~/Repos'}…</Text>
        </Box>
        {walkingDir && (
          <Box paddingLeft={4}>
            <Text dimColor>{walkingDir}</Text>
          </Box>
        )}
      </Box>
    );
  }

  if (view === 'deleting') {
    return <DeletingView {...deletionProgress} />;
  }

  if (view === 'confirm') {
    const selected = items.filter(i => i.selected);
    return (
      <ConfirmView
        selected={selected}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        onQuit={handleQuit}
      />
    );
  }

  if (view === 'summary') {
    return <SummaryView deleted={deleted} onReturn={handleCancel} onQuit={handleQuit} />;
  }

  return (
    <ListView
      items={items}
      scanPhase={scanPhase}
      onToggle={handleToggle}
      onSelectAll={handleSelectAll}
      onDeselectAll={handleDeselectAll}
      onDelete={handleDelete}
      onQuit={handleQuit}
    />
  );
}
