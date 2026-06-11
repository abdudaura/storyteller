/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StoryCategory {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  intensity: 'Soft' | 'Medium' | 'Deep' | 'Wild';
  suggestedScenarios: string[];
}

export interface NarratorConfig {
  tone: string;
  verbosity: string;
  voiceStyle: string;
  voiceMaturity: string;
  voiceRole: string;
}

export interface ChapterOutline {
  chapter: number;
  title: string;
  focus: string;
}

export interface StoryOutline {
  title: string;
  premise: string;
  chapters: ChapterOutline[];
}

export interface CharacterConfig {
  name: string;
  role: string;
  tags?: string[];
}

export interface StoryConfig {
  category: string;
  stageSetting: string;
  customPrompt?: string;
  tone: string;
  protagonists: CharacterConfig[];
}

export interface StorySegment {
  id: string;
  text: string;
  choiceMade?: string;
  reactions?: string[];
  options?: string[];
  timestamp: number;
}

export interface StoryState {
  config: StoryConfig | null;
  segments: StorySegment[];
  isGenerating: boolean;
  error: string | null;
  selectedSegmentId: string | null;
}

export interface LibraryEntry {
  id: string;
  savedAt: number;
  outline: StoryOutline;
  segments: StorySegment[];
  config: StoryConfig;
}
