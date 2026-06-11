/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Heart,
  Sparkles,
  Flame,
  Eye,
  Moon,
  BookOpen,
  Feather,
  RefreshCw,
  Compass,
  Users,
  Volume2,
  VolumeX,
  ChevronRight,
  PenTool,
  Copy,
  Download,
  FileText,
  BadgeAlert,
  Share2,
  ExternalLink,
  Mic,
  BookMarked,
  Library
} from 'lucide-react';
import { STORY_CATEGORIES, TONE_OPTIONS } from './data';
import { StorySegment, CharacterConfig, StoryOutline, StoryConfig } from './types';
import CharacterSection from './components/CharacterSection';
import StoryReader from './components/StoryReader';
import StoryLibrary from './components/StoryLibrary';
import AudioNarrator from './components/AudioNarrator';
import { ambientSound } from './utils/audio';
import { encodeStoryToShareUrl, decodeStoryFromUrl } from './utils/share';
import { saveToLibrary } from './utils/library';
import { motion, AnimatePresence } from 'motion/react';

// Map icon names to Lucide icon components
const iconMap: Record<string, any> = {
  Heart,
  Sparkles,
  Flame,
  Eye,
  Moon
};

// Initial default family protagonists
const defaultProtagonists: CharacterConfig[] = [
  { name: 'Chloe', role: 'Ambitious older sister who always wins board games and rules the couch' },
  { name: 'Leo', role: 'Rebellious but sweet teenage brother with a cheeky smirk and bad jokes' }
];

const STORAGE_KEY = 'fireside-storyteller-session';

interface SavedSession {
  categoryId: string;
  stageSetting: string;
  customPrompt: string;
  characters: CharacterConfig[];
  selectedTone: string;
  storyOutline: StoryOutline | null;
  segments: StorySegment[];
  savedAt: number;
}

function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedSession;
  } catch {
    return null;
  }
}

function saveSession(data: SavedSession) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage quota exceeded or private browsing — fail silently
  }
}

function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState(STORY_CATEGORIES[0]);
  const [stageSetting, setStageSetting] = useState(STORY_CATEGORIES[0].suggestedScenarios[0]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [characters, setCharacters] = useState<CharacterConfig[]>(defaultProtagonists);
  const [selectedTone, setSelectedTone] = useState('cozy');

  // Multi-agent workflow state
  const [storyOutline, setStoryOutline] = useState<StoryOutline | null>(null);
  const [activeWriter, setActiveWriter] = useState<'none' | 'arthur' | 'rose' | 'silas'>('none');
  const [segments, setSegments] = useState<StorySegment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resume banner state
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);
  const [showResumeBanner, setShowResumeBanner] = useState(false);

  // Shared story view
  const [isSharedView, setIsSharedView] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Story Library
  const [showLibrary, setShowLibrary] = useState(false);
  const [savedToLibrary, setSavedToLibrary] = useState(false);

  // Audio Narrator
  const [showNarrator, setShowNarrator] = useState(false);
  const [narrateFromIndex, setNarrateFromIndex] = useState(0);

  // Statistics
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [sessionStartTime] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  // Ambient sound state
  const [ambientActive, setAmbientActive] = useState(false);

  // Copy & Action States
  const [copied, setCopied] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customAction, setCustomAction] = useState('');

  // On mount: first check for shared story in URL hash, then localStorage
  useEffect(() => {
    const shared = decodeStoryFromUrl();
    if (shared) {
      setIsSharedView(true);
      setStoryOutline({
        title: shared.title,
        premise: shared.premise,
        chapters: shared.chapters.map(ch => ({ ...ch, focus: '' })),
      });
      setSegments(shared.segments.map(seg => ({
        id: crypto.randomUUID(),
        text: seg.text,
        choiceMade: seg.choiceMade,
        options: [],
        timestamp: Date.now(),
      })));
      return;
    }
    const session = loadSession();
    if (session && (session.storyOutline || session.segments.length > 0)) {
      setSavedSession(session);
      setShowResumeBanner(true);
    }
  }, []);

  // Auto-save whenever meaningful story state changes
  useEffect(() => {
    if (storyOutline || segments.length > 0) {
      saveSession({
        categoryId: selectedCategory.id,
        stageSetting,
        customPrompt,
        characters,
        selectedTone,
        storyOutline,
        segments,
        savedAt: Date.now(),
      });
    }
  }, [storyOutline, segments, selectedCategory.id, stageSetting, customPrompt, characters, selectedTone]);

  const handleResumeSession = () => {
    if (!savedSession) return;
    const cat = STORY_CATEGORIES.find(c => c.id === savedSession.categoryId) || STORY_CATEGORIES[0];
    setSelectedCategory(cat);
    setStageSetting(savedSession.stageSetting);
    setCustomPrompt(savedSession.customPrompt);
    setCharacters(savedSession.characters);
    setSelectedTone(savedSession.selectedTone);
    setStoryOutline(savedSession.storyOutline);
    setSegments(savedSession.segments);
    setShowResumeBanner(false);
    setSavedSession(null);
  };

  const handleDismissResume = () => {
    setShowResumeBanner(false);
    setSavedSession(null);
    clearSession();
  };

  // Automatically update suggested scenario when category changes
  useEffect(() => {
    if (selectedCategory && selectedCategory.suggestedScenarios.length > 0) {
      setStageSetting(selectedCategory.suggestedScenarios[0]);
    }
  }, [selectedCategory]);

  // Recalculate stats when segments change
  useEffect(() => {
    const textUnion = segments.map((s) => s.text).join(' ');
    const count = textUnion.trim() === '' ? 0 : textUnion.split(/\s+/).length;
    setWordCount(count);
    setReadingTime(Math.ceil(count / 150));
  }, [segments]);

  // Synchronize ambient sound with active reading & toggle
  useEffect(() => {
    if (ambientActive && segments.length > 0) {
      ambientSound.start();
    } else {
      ambientSound.stop();
    }
    return () => {
      ambientSound.stop();
    };
  }, [ambientActive, segments.length]);

  const handleSelectScenario = (scenario: string) => {
    setStageSetting(scenario);
  };

  // Step 1: Trigger Arthur (the Outliner) to draft a story roadmap
  const handleGenerateOutline = async () => {
    setIsGenerating(true);
    setActiveWriter('arthur');
    setError(null);
    setStoryOutline(null);
    setSegments([]);

    const config = {
      category: selectedCategory.name,
      stageSetting,
      customPrompt: customPrompt.trim() ? customPrompt : undefined,
      tone: TONE_OPTIONS.find(t => t.value === selectedTone)?.label || 'Cozy & Heartwarming',
      protagonists: characters
    };

    try {
      const response = await fetch('/api/generate-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        // Response format fallback
      }

      if (!response.ok) {
        const desc = data?.error || 'Arthur encountered a creative blockage. Please check your config and try again.';
        throw new Error(desc);
      }

      if (data && data.error) {
        throw new Error(data.error);
      }

      if (!data.title || !data.chapters) {
        throw new Error("Arthur returned an incomplete outline structure. Please try generating again.");
      }

      setStoryOutline(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Arthur could not finish drafting the outline. Try clicking again.');
    } finally {
      setIsGenerating(false);
      setActiveWriter('none');
    }
  };

  // Step 2: Trigger Rose to write Chapter 1 (Introduction)
  const handleWriteIntroduction = async () => {
    if (!storyOutline || isGenerating) return;

    setIsGenerating(true);
    setActiveWriter('rose');
    setError(null);

    const config = {
      category: selectedCategory.name,
      stageSetting,
      tone: TONE_OPTIONS.find(t => t.value === selectedTone)?.label || 'Cozy & Heartwarming',
      protagonists: characters
    };

    try {
      const response = await fetch('/api/generate-story-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          outline: storyOutline,
          history: [],
          choice: null,
          chapterNumber: 1
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (e) { }

      if (!response.ok) {
        throw new Error(data?.error || 'Rose the Introducer took a reflective pause. Please try writing again.');
      }

      const chapterSegment: StorySegment = {
        id: crypto.randomUUID(),
        text: data.story || '',
        options: data.options || [],
        timestamp: Date.now()
      };

      setSegments([chapterSegment]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Rose is lost in memory. Try drafting Chapter 1 again.');
    } finally {
      setIsGenerating(false);
      setActiveWriter('none');
    }
  };

  // Step 3 (Chapters 2-4): Trigger Silas to write successive parts based on choices
  const handleWriteChapter = async (selectedChoice: string) => {
    if (!storyOutline || isGenerating) return;

    const nextChapterNumber = segments.length + 1;
    if (nextChapterNumber > 4) return; // Cap at 4 chapters exactly

    setIsGenerating(true);
    setActiveWriter('silas');
    setError(null);

    // Build the updated history synchronously before setting state,
    // so the API receives the correct choiceMade on the last segment.
    const updatedSegments = segments.map((seg, i) =>
      i === segments.length - 1 ? { ...seg, choiceMade: selectedChoice } : seg
    );
    setSegments(updatedSegments);

    const config = {
      category: selectedCategory.name,
      stageSetting,
      tone: TONE_OPTIONS.find(t => t.value === selectedTone)?.label || 'Cozy & Heartwarming',
      protagonists: characters
    };

    try {
      const response = await fetch('/api/generate-story-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          outline: storyOutline,
          history: updatedSegments,
          choice: selectedChoice,
          chapterNumber: nextChapterNumber,
          reactions: updatedSegments.flatMap(s => s.reactions || []),
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (e) { }

      if (!response.ok) {
        throw new Error(data?.error || `Silas met with a distraction during Chapter ${nextChapterNumber}. Please try again.`);
      }

      const nextSegment: StorySegment = {
        id: crypto.randomUUID(),
        text: data.story || '',
        options: data.options || [],
        timestamp: Date.now()
      };

      setSegments((prev) => [...prev, nextSegment]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Silas could not complete the chapter transcription.');
    } finally {
      setIsGenerating(false);
      setActiveWriter('none');
    }
  };

  const handleResetStory = () => {
    setSegments([]);
    setStoryOutline(null);
    setError(null);
    setActiveWriter('none');
    setIsSharedView(false);
    setSavedToLibrary(false);
    setShowNarrator(false);
    window.location.hash = '';
    clearSession();
  };

  const handleSaveToLibrary = () => {
    if (!storyOutline || segments.length === 0) return;
    const config: StoryConfig = {
      category: selectedCategory.name,
      stageSetting,
      customPrompt,
      tone: selectedTone,
      protagonists: characters,
    };
    saveToLibrary(storyOutline, segments, config);
    setSavedToLibrary(true);
  };

  const handleNarrate = (fromIndex: number) => {
    setNarrateFromIndex(fromIndex);
    setShowNarrator(true);
  };

  const handleStopNarrator = () => {
    setShowNarrator(false);
  };

  const handleReread = (
    outline: StoryOutline,
    segs: StorySegment[],
    config: StoryConfig
  ) => {
    setStoryOutline(outline);
    setSegments(segs);
    setSelectedTone(config.tone);
    setCharacters(config.protagonists);
    setIsSharedView(false);
    setSavedToLibrary(true);
    window.location.hash = '';
  };

  const handleShare = async () => {
    if (!storyOutline || segments.length === 0) return;
    const url = encodeStoryToShareUrl(storyOutline, segments);
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleReact = (segmentId: string, reaction: string) => {
    setSegments(prev => prev.map(seg => {
      if (seg.id !== segmentId) return seg;
      const existing = seg.reactions || [];
      return {
        ...seg,
        reactions: existing.includes(reaction)
          ? existing.filter(r => r !== reaction)
          : [...existing, reaction],
      };
    }));
  };

  const handleCopy = async () => {
    if (!storyOutline) return;
    const fullStoryText = `Story Blueprint: "${storyOutline.title}"\nPremise: ${storyOutline.premise}\n\n` +
      segments
        .map((seg, idx) => `[Chapter ${idx + 1} - ${storyOutline.chapters[idx]?.title || 'Story'}]\n${seg.text}\n${seg.choiceMade ? `Choice: "${seg.choiceMade}"\n` : ''}`)
        .join('\n\n');
    try {
      await navigator.clipboard.writeText(fullStoryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      setError('Could not copy to clipboard. Please try selecting and copying the text manually.');
    }
  };

  const handleDownload = () => {
    if (!storyOutline) return;
    const fullStoryText = `Story Blueprint: "${storyOutline.title}"\nPremise: ${storyOutline.premise}\n\n` +
      segments
        .map((seg, idx) => `[Chapter ${idx + 1} - ${storyOutline.chapters[idx]?.title || 'Story'}]\n${seg.text}\n${seg.choiceMade ? `Choice: "${seg.choiceMade}"\n` : ''}`)
        .join('\n\n');
    const blob = new Blob([fullStoryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${storyOutline.title.toLowerCase().replace(/\s+/g, '-')}-chaptered.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAction.trim() || isGenerating) return;
    handleWriteChapter(customAction.trim());
    setCustomAction('');
    setShowCustomInput(false);
  };

  // Status for display
  const currentChapterIndex = segments.length; // 0 before Rose drafts, 1 when ch1 written, up to 4
  const activeChapterFromOutline = storyOutline?.chapters[segments.length < 4 ? segments.length : 3];
  const latestSegment = segments[segments.length - 1];

  return (
    <div
      id="geometric-balance-viewport"
      className="flex flex-col min-h-screen lg:h-screen w-full bg-[#0a0a0b] text-[#e0e0e0] font-sans overflow-hidden"
    >
      {/* Top Navigation Bar */}
      <header
        id="geometric-nav-header"
        className="h-14 flex items-center justify-between px-6 md:px-8 border-b border-[#222226] bg-[#0d0d0f] shadow-lg shrink-0 z-20"
      >
        <div className="flex items-center gap-4">
          <div className="w-5 h-5 bg-gradient-to-tr from-rose-600 to-rose-900 rounded-sm transform rotate-45 flex items-center justify-center">
            <span className="text-[8px] uppercase font-bold text-white tracking-widest -rotate-45">F</span>
          </div>
          <h1 className="text-[13px] md:text-base font-light tracking-[0.25em] uppercase text-white">
            Fireside <span className="text-rose-500 font-medium font-sans">Storyteller</span>
          </h1>
        </div>
        <div className="hidden md:flex gap-8 text-[11px] uppercase tracking-widest text-[#8e8e93]">
          <span className="text-rose-400 border-b border-rose-400 pb-1 font-semibold">Tale Weaver</span>
          <button
            className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 bg-transparent border-0 p-0 font-[inherit] text-[inherit] tracking-[inherit] uppercase"
            onClick={() => setShowLibrary(true)}
          >
            <Library className="w-3 h-3" />
            The Library
          </button>
          <span className="hover:text-white transition-colors cursor-pointer" onClick={() => setCharacters(defaultProtagonists)}>Collaborators</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 text-[8px] border border-rose-950/40 bg-rose-950/25 text-rose-300 font-semibold tracking-wider rounded-sm uppercase">
            Family Reading room
          </span>
        </div>
      </header>

      {/* Resume Session Banner */}
      <AnimatePresence>
        {showResumeBanner && savedSession && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="shrink-0 flex items-center justify-between gap-4 px-6 py-2.5 bg-rose-950/30 border-b border-rose-900/40 z-30"
          >
            <div className="flex items-center gap-3 min-w-0">
              <BookOpen className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <p className="text-[11px] text-rose-200 font-sans truncate">
                <span className="font-bold text-white">Unsaved tale found</span>
                {savedSession.storyOutline && (
                  <span className="text-rose-300"> — "{savedSession.storyOutline.title}"</span>
                )}
                <span className="text-rose-400/70 ml-1.5">
                  ({savedSession.segments.length} chapter{savedSession.segments.length !== 1 ? 's' : ''} written · {new Date(savedSession.savedAt).toLocaleDateString()})
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleResumeSession}
                className="px-3 py-1 bg-rose-700 hover:bg-rose-600 text-white text-[10px] font-bold uppercase tracking-widest rounded transition-colors cursor-pointer"
              >
                Resume
              </button>
              <button
                onClick={handleDismissResume}
                className="px-3 py-1 bg-[#1a1a1f] hover:bg-[#222226] border border-[#2d2d33] text-gray-400 hover:text-white text-[10px] font-bold uppercase tracking-widest rounded transition-colors cursor-pointer"
              >
                Discard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shared Story Banner */}
      <AnimatePresence>
        {isSharedView && storyOutline && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="shrink-0 flex items-center justify-between gap-4 px-6 py-2.5 bg-[#111114] border-b border-[#2d2d33] z-30"
          >
            <div className="flex items-center gap-3 min-w-0">
              <BookOpen className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <p className="text-[11px] text-gray-300 font-sans truncate">
                <span className="font-bold text-white">Shared Tale</span>
                <span className="text-gray-500"> — "{storyOutline.title}" · {segments.length} chapter{segments.length !== 1 ? 's' : ''} · Read only</span>
              </p>
            </div>
            <button
              onClick={handleResetStory}
              className="flex items-center gap-1.5 px-3 py-1 bg-rose-700 hover:bg-rose-600 text-white text-[10px] font-bold uppercase tracking-widest rounded transition-colors cursor-pointer shrink-0"
            >
              <ExternalLink className="w-3 h-3" />
              Create Your Own
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Layout */}
      <main
        id="geometric-main-workspace"
        className="flex-1 flex flex-col lg:grid lg:grid-cols-12 overflow-hidden"
      >
        {/* Left Side Control Panel — hidden in shared read-only view */}
        <aside
          id="left-controls-column"
          className={`col-span-3 border-b lg:border-b-0 lg:border-r border-[#222226] bg-[#0d0d0f] p-4 md:p-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar shrink-0 ${isSharedView ? 'hidden lg:hidden' : ''}`}
        >
          {/* Header */}
          <div className="flex items-center gap-1.5 pb-2 border-b border-[#222226]">
            <Compass className="w-4 h-4 text-rose-500" />
            <label className="text-[10px] uppercase tracking-widest text-rose-500 font-bold">
              Story Tone & characters
            </label>
          </div>

          {/* 1. Tone Selector (Sleek replacement of entire Narrator controls group) */}
          <div id="tone-selector-block" className="space-y-2 border border-[#222226] bg-[#0d0d0f] rounded p-3 shadow-md">
            <span className="text-[9px] uppercase tracking-wider text-[#8e8e93] font-bold block">
              Story Hearth Tone
            </span>
            <div className="grid grid-cols-1 gap-1">
              {TONE_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setSelectedTone(t.value)}
                  className={`w-full text-left p-2 rounded text-xs transition-colors flex flex-col gap-0.5 ${
                    selectedTone === t.value
                      ? 'bg-rose-950/20 border border-rose-900/40 text-white'
                      : 'bg-[#111114] border border-[#222226] text-gray-400 hover:text-white hover:bg-[#1a1a1f] cursor-pointer'
                  }`}
                >
                  <span className="font-semibold text-[11px] block">{t.label}</span>
                  <span className="text-[8px] text-gray-500 font-sans italic block line-clamp-1">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Family Members Editor Section */}
          <CharacterSection characters={characters} onChange={(chars) => setCharacters(chars)} />

          {/* Dynamic Workflow Trigger Button at Bottom */}
          <div className="mt-auto pt-3 border-t border-[#222226]/60">
            {error && (
              <div className="p-3 bg-red-950/20 border border-red-900/50 rounded-lg text-xs text-red-400 mb-3 font-sans flex items-start gap-2">
                <BadgeAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {!storyOutline ? (
              <button
                id="draft-blueprint-trigger"
                onClick={handleGenerateOutline}
                disabled={isGenerating}
                className="w-full py-3 bg-gradient-to-r from-rose-700 to-rose-950 hover:from-rose-600 hover:to-rose-900 active:scale-[0.98] text-white text-[10px] uppercase tracking-[0.25em] font-bold transition-all shadow-[0_0_20px_rgba(225,29,72,0.15)] disabled:opacity-50 cursor-pointer rounded-sm"
              >
                {activeWriter === 'arthur' ? 'Arthur is planning...' : 'Arthur: Draft Tale Outline'}
              </button>
            ) : segments.length === 0 ? (
              <button
                id="introducer-draft-trigger"
                onClick={handleWriteIntroduction}
                disabled={isGenerating}
                className="w-full py-3 bg-gradient-to-r from-[#ca8a04] to-[#f59e0b] hover:from-[#eab308] hover:to-[#f59e0b] active:scale-[0.98] text-black text-[10px] uppercase tracking-[0.25em] font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer rounded-sm"
              >
                {activeWriter === 'rose' ? 'Rose is weaving...' : 'Rose: Compose Chapter 1'}
              </button>
            ) : segments.length < 4 ? (
              <div className="p-2.5 bg-[#111114] border border-[#222226] rounded text-center">
                <p className="text-[10px] text-rose-400 font-semibold mb-1 uppercase tracking-wider">Silas is Active</p>
                <p className="text-[9px] text-gray-500">Pick an option below or command him with Bespoke Memory.</p>
              </div>
            ) : (
              <div className="p-2.5 bg-rose-950/10 border border-rose-900/30 rounded text-center">
                <p className="text-[10px] text-rose-300 font-bold mb-1 uppercase tracking-wider">Chronicle Finished!</p>
                <button
                  onClick={handleResetStory}
                  className="text-[9px] uppercase tracking-widest text-[#e2e8f0] underline font-bold hover:text-rose-400"
                >
                  Write Next Tale
                </button>
              </div>
            )}

            <p className="text-[9px] text-gray-500 mt-2 text-center italic">
              {!storyOutline 
                ? 'Arthur starts by drafting the chapters outline.' 
                : segments.length === 0 
                ? 'Arthur is idle. Rose is ready to write the introduction.' 
                : 'Silas is ready for the continuation.'}
            </p>
          </div>
        </aside>

        {/* Center Canvas: The Manuscript Layout */}
        <div id="center-manuscript-column" className={`${isSharedView ? 'col-span-9' : 'col-span-6'} bg-[#0a0a0b] p-3 md:p-5 flex flex-col overflow-hidden h-full gap-3`}>
          
          {/* Real-time Workers' Guild Visual Status Header */}
          <div id="writers-board" className="bg-[#0f0f11] border border-[#222226] p-3 rounded-md flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold font-sans">
              Writers' Desk:
            </span>
            <div className="flex gap-4 items-center">
              {/* Arthur */}
              <div className="flex items-center gap-1.5 opacity-90">
                <div className={`w-2 h-2 rounded-full ${
                  activeWriter === 'arthur' ? 'bg-rose-500 animate-pulse' : storyOutline ? 'bg-emerald-600' : 'bg-gray-700'
                }`} />
                <span className={`text-[10px] font-medium font-sans ${activeWriter === 'arthur' ? 'text-rose-400' : 'text-gray-400'}`}>
                  Arthur <span className="opacity-40 text-[8px] tracking-wide block sm:inline">(Planner)</span>
                </span>
              </div>

              {/* Rose */}
              <div className="flex items-center gap-1.5 opacity-90">
                <div className={`w-2 h-2 rounded-full ${
                  activeWriter === 'rose' ? 'bg-rose-500 animate-pulse' : segments.length > 0 ? 'bg-emerald-600' : 'bg-gray-700'
                }`} />
                <span className={`text-[10px] font-medium font-sans ${activeWriter === 'rose' ? 'text-rose-400' : 'text-gray-400'}`}>
                  Rose <span className="opacity-40 text-[8px] tracking-wide block sm:inline">(Introduction)</span>
                </span>
              </div>

              {/* Silas */}
              <div className="flex items-center gap-1.5 opacity-90">
                <div className={`w-2 h-2 rounded-full ${
                  activeWriter === 'silas' ? 'bg-rose-500 animate-pulse' : segments.length >= 4 ? 'bg-emerald-600' : 'bg-gray-700'
                }`} />
                <span className={`text-[10px] font-medium font-sans ${activeWriter === 'silas' ? 'text-rose-400' : 'text-gray-400'}`}>
                  Silas <span className="opacity-40 text-[8px] tracking-wide block sm:inline">(Draftsman)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Main Rounded Manuscript container gets 100% of remaining vertical height */}
          <div className="flex-1 border border-[#222226] bg-[#0c0c0e]/80 rounded-lg relative overflow-hidden flex flex-col group/manuscript">
            {/* Ambient indicator strip at top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-950 via-[#222226] to-rose-950"></div>

            <div className="absolute top-2 left-6 px-3 py-0.5 bg-[#0a0a0b] border border-[#222226] text-[8px] text-[#8e8e93] tracking-widest uppercase rounded z-10 font-sans">
              {segments.length > 0 ? `Showing: Chapters ${segments.length}` : 'Setting stage...'}
            </div>

            <div className="flex-1 overflow-hidden p-0.5 pt-7 flex flex-col">
              <StoryReader
                segments={segments}
                isGenerating={isGenerating}
                onSelectOption={handleWriteChapter}
                onCustomContinue={handleWriteChapter}
                onReset={handleResetStory}
                onReact={handleReact}
                onNarrate={handleNarrate}
                isSharedView={isSharedView}
                hideBottomOptions={true}
              />
            </div>
          </div>

          {/* DOCKED BOTTOM OPTIONS PANEL */}
          <AnimatePresence>
            {segments.length > 0 && (
              <motion.div
                id="docked-narrative-actions"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="p-3 bg-[#0d0d0f] border border-[#222226] rounded-md space-y-3 shrink-0 z-10"
              >
                {/* 1. Choices Selection */}
                {latestSegment && latestSegment.options && latestSegment.options.length > 0 && !isGenerating ? (
                  <div className="space-y-2">
                    <p className="text-[9px] font-sans font-bold uppercase tracking-widest text-[#a1a1aa] text-center flex items-center justify-center gap-1.5">
                      <span>✦ Choice for Chapter {segments.length + 1} ✦</span>
                      {activeChapterFromOutline && (
                        <span className="text-[#e2e8f0] font-sans font-normal lowercase">("{activeChapterFromOutline.title}")</span>
                      )}
                    </p>
                    <div id="interactive-options-list" className="grid grid-cols-1 gap-1.5 max-w-xl mx-auto">
                      {latestSegment.options.map((option, idx) => (
                        <button
                          key={idx}
                          id={`narrative-option-${idx}`}
                          onClick={() => handleWriteChapter(option)}
                          className="group w-full flex items-center justify-between p-2.5 bg-[#161619] hover:bg-[#1a1a1f] border border-[#2d2d33] hover:border-rose-900 rounded text-xs text-gray-200 hover:text-white font-sans text-left transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm cursor-pointer"
                        >
                          <span className="flex-1 pr-3 leading-relaxed tracking-wide">{option}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-rose-500 group-hover:text-rose-400 shrink-0 transition-transform group-hover:translate-x-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : segments.length >= 4 && !isGenerating ? (
                  <div className="py-2 text-center text-rose-200 font-serif italic text-xs leading-relaxed max-w-md mx-auto">
                    "And so, around the warming fireside glow, the chronicle comes to a beautiful harmony. Family treasures built together never fade."
                  </div>
                ) : null}

                {/* 2. Compact Control Buttons (Copy, Download, Custom Direction, Reset) */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#222226]/40">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCopy}
                      disabled={isGenerating}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-[#161619] hover:bg-[#222226] border border-[#2d2d33] rounded text-[10px] font-sans text-gray-400 hover:text-white disabled:opacity-40 transition-colors uppercase tracking-wider cursor-pointer"
                      title="Copy all chapters to clipboard"
                    >
                      <Copy className="w-3 h-3 text-rose-500" />
                      <span>{copied ? 'Copied' : 'Copy Tale'}</span>
                    </button>

                    <button
                      onClick={handleDownload}
                      disabled={isGenerating}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-[#161619] hover:bg-[#222226] border border-[#2d2d33] rounded text-[10px] font-sans text-gray-400 hover:text-white disabled:opacity-40 transition-colors uppercase tracking-wider cursor-pointer"
                      title="Download rich text file of this chronicle"
                    >
                      <Download className="w-3 h-3 text-rose-500" />
                      <span>Download</span>
                    </button>

                    <button
                      onClick={handleShare}
                      disabled={isGenerating || segments.length === 0}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-[#161619] hover:bg-[#222226] border border-[#2d2d33] rounded text-[10px] font-sans text-gray-400 hover:text-white disabled:opacity-40 transition-colors uppercase tracking-wider cursor-pointer"
                      title="Copy shareable link to this story"
                    >
                      <Share2 className="w-3 h-3 text-rose-500" />
                      <span>{shareCopied ? '✓ Copied!' : 'Share'}</span>
                    </button>

                    {segments.length > 0 && !isGenerating && (
                      <button
                        onClick={() => handleNarrate(0)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-[#161619] hover:bg-rose-950/20 border border-[#2d2d33] hover:border-rose-800/50 rounded text-[10px] font-sans text-gray-400 hover:text-rose-300 transition-colors uppercase tracking-wider cursor-pointer"
                        title="Listen to your story narrated aloud"
                      >
                        <Mic className="w-3 h-3 text-rose-500" />
                        <span>Listen</span>
                      </button>
                    )}

                    {segments.length === 4 && !isGenerating && (
                      <button
                        onClick={handleSaveToLibrary}
                        disabled={savedToLibrary}
                        className={`flex items-center gap-1 px-2.5 py-1.5 border rounded text-[10px] font-sans uppercase tracking-wider transition-colors cursor-pointer disabled:cursor-default ${
                          savedToLibrary
                            ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400'
                            : 'bg-[#161619] hover:bg-[#222226] border-[#2d2d33] text-gray-400 hover:text-white'
                        }`}
                        title="Save completed story to your library"
                      >
                        <BookMarked className="w-3 h-3 text-rose-500" />
                        <span>{savedToLibrary ? '✓ Saved' : 'Save'}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!showCustomInput && !isGenerating && segments.length < 4 && (
                      <button
                        onClick={() => setShowCustomInput(true)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-950/20 hover:bg-rose-900/20 border border-rose-900/40 rounded text-[10px] font-sans font-medium text-rose-300 tracking-wider uppercase transition-colors cursor-pointer"
                        title="Inject custom family memory or plot guideline"
                      >
                        <PenTool className="w-3 h-3 text-rose-500" />
                        <span>Bespoke Memory</span>
                      </button>
                    )}

                    <button
                      onClick={handleResetStory}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-[#161619] hover:bg-[#222226] border border-[#2d2d33] rounded text-[10px] font-sans text-gray-400 hover:text-rose-400 transition-colors uppercase tracking-wider cursor-pointer"
                      title="Reset and clear current story draft"
                    >
                      <RefreshCw className="w-3 h-3 text-gray-600" />
                      <span>Clear Draft</span>
                    </button>
                  </div>
                </div>

                {/* 3. Custom Input Form Row */}
                {showCustomInput && (
                  <form
                    onSubmit={handleCustomSubmit}
                    className="overflow-hidden space-y-1.5 max-w-xl mx-auto bg-[#161619] p-2 rounded border border-[#2d2d33]"
                  >
                    <label className="text-[9px] tracking-wider uppercase font-bold text-rose-500 block">
                      Bespoke Silas Directive:
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={customAction}
                        onChange={(e) => setCustomAction(e.target.value)}
                        placeholder="e.g. Sibling spills the flour, or Toby hides Grandma's glasses..."
                        className="flex-1 bg-[#0a0a0b] border border-[#222226] rounded px-2.5 py-1 text-xs text-[#e0e0e0] placeholder-gray-600 focus:outline-none focus:border-rose-900 font-sans"
                        maxLength={200}
                        disabled={isGenerating}
                      />
                      <button
                        type="submit"
                        disabled={isGenerating || !customAction.trim()}
                        className="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white rounded text-[10px] font-bold transition-all shrink-0 cursor-pointer uppercase tracking-widest"
                      >
                        Direct Silas
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomInput(false);
                          setCustomAction('');
                        }}
                        className="px-1.5 text-gray-500 hover:text-white text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side Panel: Theme Categories & Arthur's Blueprint Pane */}
        <aside
          id="right-categories-column"
          className="col-span-3 border-t lg:border-t-0 lg:border-l border-[#222226] bg-[#0d0d0f] p-4 md:p-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar shrink-0"
        >
          {/* Main Visual Board: Arthur's Blueprint display */}
          <AnimatePresence>
            {storyOutline ? (
              <motion.div
                key="blueprint-pane"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 bg-[#111114] border border-rose-900/30 p-3 rounded shadow-md"
              >
                <div className="flex items-center gap-1.5 border-b border-rose-950 pb-1.5">
                  <FileText className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-[10px] uppercase tracking-wider text-[#e2e8f0] font-sans font-bold block">
                    Arthur's Tale Blueprint
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-rose-300 font-serif line-clamp-1">"{storyOutline.title}"</h4>
                  <p className="text-[9px] text-[#a1a1aa] leading-relaxed font-sans italic">"{storyOutline.premise}"</p>
                </div>

                {/* Chapter Progression Grid */}
                <div className="space-y-2 pt-2 border-t border-[#222226]/40">
                  <span className="text-[8px] uppercase tracking-widest text-[#71717a] font-bold block">Narrative Map:</span>
                  <div className="space-y-2">
                    {storyOutline.chapters.map((ch, index) => {
                      const isCurrent = segments.length === index;
                      const isPast = segments.length > index;
                      const isFuture = segments.length < index;

                      return (
                        <div
                          key={ch.chapter}
                          className={`p-2 rounded border border-[#2d2d33] transition-all flex items-start gap-1.5 ${
                            isCurrent
                              ? 'bg-rose-950/15 border-rose-900/50 shadow-sm'
                              : isPast
                              ? 'bg-[#161619] border-emerald-950/60 opacity-60'
                              : 'bg-[#161619] border-[#222226] opacity-40'
                          }`}
                        >
                          <span className={`text-[9px] font-bold px-1 py-0.25 rounded uppercase tracking-wider font-sans leading-none mt-0.5 ${
                            isCurrent
                              ? 'bg-rose-500 text-white'
                              : isPast
                              ? 'bg-emerald-900/50 text-emerald-300'
                              : 'bg-gray-800 text-gray-500'
                          }`}>
                            Ch {ch.chapter}
                          </span>
                          <div className="flex-1 text-left min-w-0">
                            <span className="text-[10px] block font-semibold text-gray-200 line-clamp-1">{ch.title}</span>
                            <span className="text-[8px] block text-gray-500 italic font-sans leading-relaxed line-clamp-2">{ch.focus}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-[#111114] border border-dashed border-[#222226] p-4 text-center rounded text-gray-500 space-y-1">
                <FileText className="w-6 h-6 text-gray-700 mx-auto" />
                <span className="text-[10px] font-bold text-[#8e8e93] block uppercase tracking-wider">Blueprint Offline</span>
                <p className="text-[9px] leading-relaxed">Let Arthur plan your tale to see the beautiful blueprint map here.</p>
              </div>
            )}
          </AnimatePresence>

          {/* Theme List */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#222226]">
              <Flame className="w-4 h-4 text-rose-500" />
              <label className="text-[10px] uppercase tracking-widest text-[#8e8e93] font-bold">
                Story Categories
              </label>
            </div>

            <div id="genre-grid-selection" className="grid grid-cols-1 gap-1.5">
              {STORY_CATEGORIES.map((cat) => {
                const IconComponent = iconMap[cat.icon] || Heart;
                const isSelected = selectedCategory.id === cat.id;

                return (
                  <button
                    key={cat.id}
                    id={`genre-card-${cat.id}`}
                    type="button"
                    onClick={() => {
                      if (!isGenerating) {
                        setSelectedCategory(cat);
                        handleResetStory();
                      }
                    }}
                    disabled={isGenerating}
                    className={`w-full p-2.5 text-left rounded transition-all flex justify-between items-start border cursor-pointer ${
                      isSelected
                        ? 'bg-rose-950/10 border-rose-900/60 text-white shadow-inner shadow-rose-950/50'
                        : 'bg-[#161619] border-[#222226] text-[#b4b4b8] hover:border-rose-950/50 hover:bg-[#1a1a1e] hover:text-white disabled:opacity-40'
                    }`}
                  >
                    <div className="pr-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <IconComponent className={`w-3 h-3 ${isSelected ? 'text-rose-500' : 'text-gray-500'}`} />
                        <span className="text-[10px] font-semibold tracking-wide uppercase">{cat.name}</span>
                      </div>
                      <p className="text-[9px] text-[#8e8e93] line-clamp-2 leading-normal font-sans">{cat.description}</p>
                    </div>
                    {isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse mt-1 shrink-0"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Setting Details */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-1.5 pb-1 border-b border-[#222226]/50">
              <Feather className="w-3.5 h-3.5 text-rose-500" />
              <label className="text-[10px] uppercase tracking-widest text-[#8e8e93] font-bold">
                Atmosphere & Setting
              </label>
            </div>

            <div id="scenario-custom-editor" className="space-y-1">
              <textarea
                value={stageSetting}
                onChange={(e) => setStageSetting(e.target.value)}
                placeholder="Cozy fireplace, rainy Sunday island, backyard campout..."
                className="w-full h-16 bg-[#161619] border border-[#2d2d33] p-2 text-xs text-[#e0e0e0] placeholder-gray-600 rounded outline-none focus:border-rose-900 transition-all font-sans leading-relaxed resize-none"
                disabled={isGenerating}
              />
            </div>

            {/* Suggested Scenarios */}
            <div className="space-y-1">
              <span className="text-[9px] text-gray-500 block">Suggested Presets:</span>
              <div id="scenarios-bullets-container" className="space-y-1">
                {selectedCategory.suggestedScenarios.map((scText, ind) => (
                  <button
                    key={ind}
                    onClick={() => handleSelectScenario(scText)}
                    disabled={isGenerating}
                    className={`w-full p-2 text-[9px] leading-relaxed text-left border rounded transition-all cursor-pointer ${
                      stageSetting === scText
                        ? 'border-rose-900 bg-rose-950/20 text-rose-200'
                        : 'border-[#2d2d33] bg-[#161619]/40 text-gray-400 hover:text-rose-300 hover:bg-[#161619] disabled:opacity-40'
                    }`}
                  >
                    "{scText.substring(0, 75)}..."
                  </button>
                ))}
              </div>
            </div>

            {/* Custom directions */}
            <div id="custom-directions-group" className="space-y-1">
              <span className="text-[9px] text-gray-400 block">Thematic constraints (Optional):</span>
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Sibling dispute, Grandma hides chocolate..."
                className="w-full bg-[#161619] border border-[#2d2d33] p-2 text-xs text-rose-100 placeholder-gray-600 rounded outline-none focus:border-rose-900 font-sans"
                disabled={isGenerating}
              />
            </div>
          </div>
        </aside>
      </main>

      {/* Bottom Status Bar */}
      <footer
        id="geometric-status-footer"
        className="h-11 bg-[#0d0d0f] border-t border-[#222226] flex items-center justify-between px-6 shrink-0 z-20 text-[9px] tracking-wider uppercase text-gray-500"
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>Fireside Multi-Agent Team</span>
          </div>
          <span className="hidden lg:inline">Started: {sessionStartTime}</span>
          <span className="hidden lg:inline">Warmth level: Hearth-v3.5</span>
        </div>

        {/* Ambient sound toggle in footer */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setAmbientActive(!ambientActive)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all border ${
              ambientActive
                ? 'bg-rose-950/35 border-rose-900/60 text-rose-300 shadow-inner shadow-rose-950/20'
                : 'bg-[#161619]/40 border-[#222226] text-gray-500 hover:text-[#e0e0e0] hover:border-[#2d2d33]'
            } cursor-pointer`}
            title={segments.length === 0 ? "Begin storytelling to listen to the fireplace ambiance" : "Toggle cozy Reading Room soundscape!"}
          >
            {ambientActive && segments.length > 0 ? (
              <>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                </span>
                <Volume2 className="w-3 h-3 text-rose-400" />
                <span className="text-[9px] font-bold">Ambiance: On (Fireside)</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3 h-3" />
                <span className="text-[9px] font-bold">Ambiance: Off</span>
              </>
            )}
          </button>

          <span className="w-px h-3 bg-[#222226] hidden sm:inline"></span>

          <div className="flex items-center gap-4">
            <span>Words Crafted: {wordCount.toLocaleString()}</span>
            <span className="hidden sm:inline w-px h-3 bg-[#222226]"></span>
            <span className="hidden sm:inline">Avg Reading: {readingTime}m</span>
          </div>
        </div>
      </footer>

      {/* Story Library Modal */}
      <AnimatePresence>
        {showLibrary && (
          <StoryLibrary
            onClose={() => setShowLibrary(false)}
            onReread={handleReread}
          />
        )}
      </AnimatePresence>

      {/* Audio Narrator Floating Bar */}
      <AnimatePresence>
        {showNarrator && storyOutline && segments.length > 0 && (
          <AudioNarrator
            key={narrateFromIndex}
            segments={segments}
            outline={storyOutline}
            tone={selectedTone}
            startFromIndex={narrateFromIndex}
            onClose={handleStopNarrator}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
