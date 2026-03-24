# repoclean

An interactive terminal UI for reclaiming disk space between development sessions. Scans your repos directory for regenerable build artifacts and dependency directories, lets you select what to remove, and shows you exactly what will be deleted before anything is touched.

![repoclean TUI](assets/screenshot.gif)

## What it scans

| Directory | Condition |
|-----------|-----------|
| `node_modules/` | Any depth |
| `.next/`, `dist/`, `build/`, `.cache/` | Only when a `package.json` sibling exists |
| `packages/` | Only when a `.csproj` sibling exists (NuGet) |
| `.docker/` | Only at project-root level |

## Usage

```bash
# Scan the default directory (~/Repos)
npm start

# Scan a custom directory
npm start -- /path/to/projects
npm start -- ~/work/clients
```

When installed globally:

```bash
repoclean                        # defaults to ~/Repos
repoclean /path/to/projects      # custom directory
```

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate |
| `Space` | Select / deselect item |
| `a` | Select all / deselect all (respects active filter) |
| `/` | Filter by path or type |
| `Esc` | Clear filter |
| `s` | Cycle sort order (size ↓ → size ↑ → name A→Z → name Z→A) |
| `d` | Open deletion confirmation (only active when items are selected) |
| `y` | Confirm deletion |
| `n` / `Esc` | Cancel deletion, return to list |
| `r` | Return to list after deletion |
| `q` | Quit |

### How scanning works

Scanning is non-blocking and fully animated throughout:

1. **Walk** — async directory traversal; spinner shows the top-level directory currently being entered (e.g. `/Users/brian/Projects`). Subdirectories are never shown — only the immediate children of the root.
2. **Size** — up to 4 concurrent `du` calls run in parallel; the header shows a live `sizing X/Y` counter as results stream in and items appear in the list.

### Deletion flow

CleanupTUI never deletes anything without explicit confirmation:

1. **Select** — mark directories you want to remove
2. **Review** — full-screen confirmation lists every path and total size
3. **Delete** — press `y` to proceed; progress bar and current path shown per item
4. **Summary** — see what was freed; return to list for another pass or quit

## Requirements

- Node.js 18+
- npm

## Installation

```bash
git clone https://github.com/brianvelji/repoclean
cd repoclean
npm install
npm start
```

To run from anywhere, install globally:

```bash
npm install -g .
repoclean                   # ~/Repos
repoclean ~/work/clients    # custom directory
```

## Stack

- [Ink](https://github.com/vadimdemedes/ink) — React for CLIs
- [ink-spinner](https://github.com/vadimdemedes/ink-spinner) — terminal spinner
- [tsx](https://github.com/privatenumber/tsx) — TypeScript runner
