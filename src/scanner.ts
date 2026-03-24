import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import type { CleanItem } from './types.js';
import { formatSize } from './format.js';

const execFileAsync = promisify(execFile);
const DEFAULT_REPOS_DIR = path.join(process.env['HOME'] ?? '/tmp', 'Repos');

export type ScanPhase =
  | { phase: 'walking'; currentDir?: string }
  | { phase: 'sizing'; done: number; total: number }
  | { phase: 'complete' };

async function duBytes(dirPath: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync('du', ['-sk', dirPath]);
    const blocks = parseInt(stdout.split('\t')[0] ?? '0', 10);
    return blocks * 1024;
  } catch {
    return 0;
  }
}

function hasSibling(dir: string, pattern: RegExp | string): boolean {
  const parent = path.dirname(dir);
  try {
    const entries = fs.readdirSync(parent);
    if (typeof pattern === 'string') return entries.includes(pattern);
    return entries.some(e => pattern.test(e));
  } catch {
    return false;
  }
}

async function runWithConcurrency(tasks: Array<() => Promise<void>>, limit: number): Promise<void> {
  const queue = [...tasks];
  async function worker() {
    while (queue.length > 0) await queue.shift()!();
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
}

/**
 * Two-phase scan:
 *   1. Fast synchronous walk — discovers cleanable paths, no du calls
 *   2. Async concurrent du — sizes each path (4 at a time), streams results via onFound
 *
 * onStatus is called at each phase transition and after each du completes.
 */
export function scan(
  onFound: (item: CleanItem) => void,
  onDone: () => void,
  reposDir = DEFAULT_REPOS_DIR,
  onStatus?: (phase: ScanPhase) => void,
): void {
  const seen = new Set<string>();
  const discovered: Array<{ fullPath: string; typeLabel: string }> = [];

  function register(fullPath: string, typeLabel: string) {
    if (!seen.has(fullPath)) {
      seen.add(fullPath);
      discovered.push({ fullPath, typeLabel });
    }
  }

  async function walk(dir: string, depth: number): Promise<void> {
    if (depth > 5) return;

    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('.') && !['.next', '.cache', '.docker'].includes(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);

      if (entry.name === 'node_modules') {
        register(fullPath, 'Node packages');
        continue; // prune
      }

      if (['dist', 'build', '.next', '.cache'].includes(entry.name)) {
        if (hasSibling(fullPath, 'package.json')) register(fullPath, 'JS build output');
        continue; // prune
      }

      if (entry.name === 'packages') {
        if (hasSibling(fullPath, /\.(cs|fs|vb)proj$/)) register(fullPath, 'NuGet packages');
        await walk(fullPath, depth + 1);
        continue;
      }

      if (entry.name === '.docker' && depth === 1) {
        register(fullPath, 'Docker cache');
        continue;
      }

      if (depth === 0) onStatus?.({ phase: 'walking', currentDir: fullPath });
      await walk(fullPath, depth + 1);
    }
  }

  setImmediate(async () => {
    // Phase 1: walk (async — yields between each readdir so Ink can render)
    onStatus?.({ phase: 'walking' });
    await walk(reposDir, 0);

    // Phase 2: size each discovered path concurrently
    const total = discovered.length;
    let done = 0;
    onStatus?.({ phase: 'sizing', done: 0, total });

    await runWithConcurrency(
      discovered.map(({ fullPath, typeLabel }) => async () => {
        const sizeBytes = await duBytes(fullPath);
        onFound({
          path: fullPath,
          rel: path.relative(reposDir, fullPath),
          sizeBytes,
          sizeLabel: formatSize(sizeBytes),
          typeLabel,
          selected: false,
        });
        done++;
        onStatus?.({ phase: 'sizing', done, total });
      }),
      4,
    );

    onStatus?.({ phase: 'complete' });
    onDone();
  });
}
