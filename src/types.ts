export interface CleanItem {
  path: string;       // absolute path
  rel: string;        // relative to ~/Repos
  sizeBytes: number;
  sizeLabel: string;  // human-readable
  typeLabel: string;  // "Node packages", "JS build output", etc.
  selected: boolean;
}

export type AppView = 'loading' | 'list' | 'confirm' | 'deleting' | 'summary';

export type SortOrder = 'size-desc' | 'size-asc' | 'name-asc' | 'name-desc';

export interface DeletedItem {
  rel: string;
  sizeBytes: number;
  sizeLabel: string;
}
