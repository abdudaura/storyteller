import { LibraryEntry, StoryOutline, StorySegment, StoryConfig } from '../types';

const LIBRARY_KEY = 'fireside-story-library';
const MAX_ENTRIES = 30;

export function getLibraryEntries(): LibraryEntry[] {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LibraryEntry[];
  } catch {
    return [];
  }
}

export function saveToLibrary(
  outline: StoryOutline,
  segments: StorySegment[],
  config: StoryConfig
): LibraryEntry {
  const entry: LibraryEntry = {
    id: crypto.randomUUID(),
    savedAt: Date.now(),
    outline,
    segments,
    config,
  };
  const existing = getLibraryEntries().filter(e => e.outline.title !== outline.title);
  const entries = [entry, ...existing].slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(entries));
  } catch {}
  return entry;
}

export function deleteLibraryEntry(id: string): void {
  const entries = getLibraryEntries().filter(e => e.id !== id);
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(entries));
  } catch {}
}
