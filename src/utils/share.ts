import { StoryOutline, StorySegment } from '../types';

export interface ShareableStory {
  v: number;
  title: string;
  premise: string;
  chapters: { chapter: number; title: string }[];
  segments: { text: string; choiceMade?: string }[];
}

export function encodeStoryToShareUrl(outline: StoryOutline, segments: StorySegment[]): string {
  const data: ShareableStory = {
    v: 1,
    title: outline.title,
    premise: outline.premise,
    chapters: outline.chapters.map(ch => ({ chapter: ch.chapter, title: ch.title })),
    segments: segments.map(seg => ({
      text: seg.text,
      ...(seg.choiceMade ? { choiceMade: seg.choiceMade } : {}),
    })),
  };
  const json = JSON.stringify(data);
  const encoded = btoa(encodeURIComponent(json));
  const base = window.location.origin + window.location.pathname;
  return `${base}#story=${encoded}`;
}

export function decodeStoryFromUrl(): ShareableStory | null {
  try {
    const hash = window.location.hash;
    if (!hash.startsWith('#story=')) return null;
    const encoded = hash.slice('#story='.length);
    const json = decodeURIComponent(atob(encoded));
    const data = JSON.parse(json) as ShareableStory;
    if (!data.title || !Array.isArray(data.segments)) return null;
    return data;
  } catch {
    return null;
  }
}
