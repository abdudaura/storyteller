/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Copy, Download, RefreshCw, BookOpenCheck, ChevronRight, PenTool, Mic } from 'lucide-react';
import { StorySegment } from '../types';
import { CHAPTER_REACTIONS } from '../data';
import { motion, AnimatePresence } from 'motion/react';

interface StoryReaderProps {
  segments: StorySegment[];
  isGenerating: boolean;
  onSelectOption: (optionText: string) => void;
  onCustomContinue: (customText: string) => void;
  onReset: () => void;
  onReact?: (segmentId: string, reaction: string) => void;
  onNarrate?: (segmentIndex: number) => void;
  isSharedView?: boolean;
  hideBottomOptions?: boolean;
}

export default function StoryReader({
  segments,
  isGenerating,
  onSelectOption,
  onCustomContinue,
  onReset,
  onReact,
  onNarrate,
  isSharedView = false,
  hideBottomOptions = false
}: StoryReaderProps) {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'huge'>('normal');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans' | 'mono'>('serif');
  const [customAction, setCustomAction] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (segments.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [segments.length, isGenerating]);

  const handleCopy = () => {
    const fullStoryText = segments
      .map((seg, idx) => `[Chapter ${idx + 1}]\n${seg.text}\n${seg.choiceMade ? `Selected option: "${seg.choiceMade}"\n` : ''}`)
      .join('\n\n');
    navigator.clipboard.writeText(fullStoryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const fullStoryText = segments
      .map((seg, idx) => `[Chapter ${idx + 1}]\n${seg.text}\n${seg.choiceMade ? `Action chosen: "${seg.choiceMade}"\n` : ''}`)
      .join('\n\n');
    const blob = new Blob([fullStoryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eros-storyteller-chronicle.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAction.trim() || isGenerating) return;
    onCustomContinue(customAction.trim());
    setCustomAction('');
    setShowCustomInput(false);
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'normal': return 'text-base leading-relaxed';
      case 'huge': return 'text-xl md:text-2xl leading-loose tracking-wide';
      case 'large':
      default:
        return 'text-lg md:text-xl leading-loose tracking-wide';
    }
  };

  const getFontFamilyClass = () => {
    switch (fontFamily) {
      case 'sans': return 'font-sans';
      case 'mono': return 'font-mono';
      case 'serif':
      default:
        return 'font-serif';
    }
  };

  const latestSegment = segments[segments.length - 1];
  const hasInteractiveOptions = latestSegment && latestSegment.options && latestSegment.options.length > 0;

  return (
    <div id="story-reader-parlor" className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 px-3 bg-[#0d0d0f] border-b border-[#222226]">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-rose-500" />
          <h2 className="font-sans font-medium text-[10px] tracking-[0.15em] uppercase text-white">The Reading Parlor</h2>
        </div>

        {/* Display Settings Controls */}
        <div id="display-customizer" className="flex items-center gap-1.5">
          <div className="flex items-center bg-[#161619] p-0.5 rounded border border-[#2d2d33] text-[9px]">
            <button
              onClick={() => setFontFamily('serif')}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${fontFamily === 'serif' ? 'bg-rose-900/30 text-rose-200 border border-rose-900/40' : 'text-gray-400 hover:text-white'}`}
              title="Serif font"
            >Serif</button>
            <button
              onClick={() => setFontFamily('sans')}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${fontFamily === 'sans' ? 'bg-rose-900/30 text-rose-200 border border-rose-900/40' : 'text-gray-400 hover:text-white'}`}
              title="Sans font"
            >Sans</button>
            <button
              onClick={() => setFontFamily('mono')}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${fontFamily === 'mono' ? 'bg-rose-900/30 text-rose-200 border border-rose-900/40' : 'text-gray-400 hover:text-white'}`}
              title="Mono font"
            >Mono</button>
          </div>

          <div className="flex items-center bg-[#161619] p-0.5 rounded border border-[#2d2d33] text-[9px]">
            <button
              onClick={() => setFontSize('normal')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${fontSize === 'normal' ? 'bg-rose-900/30 text-rose-200 border border-rose-900/40' : 'text-gray-400 hover:text-white'}`}
              title="Normal size"
            >A</button>
            <button
              onClick={() => setFontSize('large')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${fontSize === 'large' ? 'bg-rose-900/30 text-rose-200 border border-rose-900/40' : 'text-gray-400 hover:text-white'}`}
              title="Large size"
            >A+</button>
            <button
              onClick={() => setFontSize('huge')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${fontSize === 'huge' ? 'bg-rose-900/30 text-rose-200 border border-rose-900/40' : 'text-gray-400 hover:text-white'}`}
              title="Very large size"
            >A++</button>
          </div>
        </div>
      </div>

      {/* Pages Workspace / Main Scroll */}
      <div id="story-scroll-pane" className="flex-1 overflow-y-auto p-5 md:p-7 space-y-6 custom-scrollbar bg-[#0a0a0b]">
        {segments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 py-20">
            <div className="w-12 h-12 bg-gradient-to-tr from-rose-600 to-rose-900 rounded-sm transform rotate-45 flex items-center justify-center border border-rose-400/20 shadow-lg animate-pulse">
              <BookOpenCheck className="w-5 h-5 text-white -rotate-45" />
            </div>
            <p className="font-serif italic text-gray-500 text-sm md:text-base leading-relaxed">
              "The family hearth is gathering... Choose a heartwarming theme from the card, adjust your storyteller's quills, and ignite the first family memory."
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {segments.map((segment, index) => {
              const isLatestGenerating = index === segments.length - 1 && isGenerating;
              const segmentReactions = segment.reactions || [];

              return (
                <motion.div
                  key={segment.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="space-y-3"
                >
                  {/* Chapter divider */}
                  {index > 0 && (
                    <div className="flex items-center justify-center gap-3 py-2 opacity-30 select-none">
                      <span className="h-[1px] w-12 bg-rose-900" />
                      <span className="text-[10px] text-rose-500 uppercase tracking-widest font-semibold">❦ CHAPTER {index + 1} ❦</span>
                      <span className="h-[1px] w-12 bg-rose-900" />
                    </div>
                  )}

                  {/* Main page block */}
                  <div className="bg-[#0e0e11]/80 rounded p-5 md:p-6 border border-[#222226] shadow-sm">
                    <div className={`${getFontFamilyClass()} ${getFontSizeClass()} text-[#e0e0e0] selection:bg-rose-900 selection:text-white`}>
                      {segment.text.split('\n\n').map((paragraph, pIdx) => (
                        <p key={pIdx} className={`mb-6 leading-relaxed ${pIdx === 0 ? 'first-letter:text-2xl first-letter:font-serif first-letter:text-rose-500 first-letter:mr-1' : ''}`}>
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {segment.choiceMade && (
                      <div className="mt-4 pt-3 border-t border-[#1d1d21] text-[10px] text-rose-400 uppercase tracking-wider font-sans flex items-center gap-1.5 selection:bg-rose-900">
                        <span>✦ Choice Made: </span>
                        <strong className="text-gray-100 font-medium">"{segment.choiceMade}"</strong>
                      </div>
                    )}
                  </div>

                  {/* Chapter actions row: narrate + reactions */}
                  {!isSharedView && !isLatestGenerating && (onReact || onNarrate) && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                      className="flex items-center gap-1.5 flex-wrap px-1"
                    >
                      {onNarrate && (
                        <button
                          onClick={() => onNarrate(index)}
                          title="Listen to this chapter"
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans border border-[#222226] bg-[#0f0f12] text-gray-500 hover:border-rose-800/60 hover:text-rose-300 hover:bg-rose-950/20 transition-all cursor-pointer select-none mr-1"
                        >
                          <Mic className="w-2.5 h-2.5" />
                          <span>Listen</span>
                        </button>
                      )}
                      {onReact && (
                        <>
                          <span className="text-[8px] uppercase tracking-widest text-gray-600 font-bold shrink-0">Feel?</span>
                          {CHAPTER_REACTIONS.map(r => {
                            const active = segmentReactions.includes(r.value);
                            return (
                              <button
                                key={r.value}
                                onClick={() => onReact(segment.id, r.value)}
                                title={r.label}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans border transition-all cursor-pointer select-none ${
                                  active
                                    ? 'bg-rose-950/50 border-rose-700/70 text-rose-300 shadow-sm shadow-rose-900/20'
                                    : 'bg-[#0f0f12] border-[#222226] text-gray-500 hover:border-[#3d3d44] hover:text-gray-300'
                                }`}
                              >
                                <span>{r.emoji}</span>
                                <span className={active ? 'font-semibold' : ''}>{r.label}</span>
                              </button>
                            );
                          })}
                        </>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}

            {/* AI Generator Pulsing Indicator */}
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-5 md:p-6 bg-[#0d0d0f] border border-[#222226] rounded space-y-3.5 flex flex-col justify-start"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></div>
                  <span className="text-[10px] font-sans font-medium uppercase tracking-widest text-rose-500">
                    Chronicler engine is weaving...
                  </span>
                </div>
                <div className="space-y-2.5 opacity-40">
                  <div className="h-3 bg-gray-800 rounded w-full animate-pulse" />
                  <div className="h-3 bg-gray-800 rounded w-11/12 animate-pulse" />
                  <div className="h-3 bg-gray-800 rounded w-9/12 animate-pulse" />
                </div>
              </motion.div>
            )}

            <div ref={bottomRef} className="h-2" />
          </div>
        )}
      </div>

      {/* Interactive options and Action panel footer */}
      {segments.length > 0 && !hideBottomOptions && (
        <div className="p-4 bg-[#0d0d0f] border-t border-[#222226] space-y-4 shrink-0">
          <AnimatePresence mode="wait">
            {hasInteractiveOptions && !isGenerating ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3.5"
              >
                <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#8e8e93] text-center">
                  ✦ Chart the path forward
                </p>
                <div id="interactive-options-list" className="grid grid-cols-1 gap-2.5 max-w-xl mx-auto">
                  {latestSegment.options?.map((option, idx) => (
                    <button
                      key={idx}
                      id={`narrative-option-${idx}`}
                      onClick={() => onSelectOption(option)}
                      className="group w-full flex items-center justify-between p-3.5 bg-[#161619] hover:bg-[#1a1a1f] border border-[#2d2d33] hover:border-rose-900 rounded text-xs text-gray-200 hover:text-white font-sans text-left transition-all duration-350 transform hover:-translate-y-0.5 shadow-md cursor-pointer"
                    >
                      <span className="flex-1 pr-3 leading-relaxed tracking-wide">{option}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-rose-500 group-hover:text-rose-400 shrink-0 transition-transform group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#222226]">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#161619] hover:bg-[#222226] border border-[#2d2d33] rounded text-[10px] font-sans text-gray-400 hover:text-white disabled:opacity-40 transition-colors uppercase tracking-wider cursor-pointer"
                title="Copy all chapters"
              >
                <Copy className="w-3 h-3 text-rose-500" />
                <span>{copied ? 'Copied' : 'Copy Draft'}</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#161619] hover:bg-[#222226] border border-[#2d2d33] rounded text-[10px] font-sans text-gray-400 hover:text-white disabled:opacity-40 transition-colors uppercase tracking-wider cursor-pointer"
                title="Download story as rich text file"
              >
                <Download className="w-3 h-3 text-rose-500" />
                <span>Download Chronicle</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {!showCustomInput && !isGenerating && (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/20 hover:bg-rose-900/20 border border-rose-900/40 rounded text-[10px] font-sans font-medium text-rose-300 tracking-wider uppercase transition-colors cursor-pointer"
                  title="Inject a custom action or narrative direction"
                >
                  <PenTool className="w-3 h-3 text-rose-500" />
                  <span>Bespoke Memory</span>
                </button>
              )}

              <button
                onClick={onReset}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#161619] hover:bg-[#222226] border border-[#2d2d33] rounded text-[10px] font-sans text-gray-400 hover:text-rose-400 transition-colors uppercase tracking-wider cursor-pointer"
                title="Reset book story"
              >
                <RefreshCw className="w-3 h-3 text-gray-600" />
                <span>Clear Draft</span>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showCustomInput && (
              <motion.form
                onSubmit={handleCustomSubmit}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-2 max-w-xl mx-auto bg-[#161619] p-3 rounded border border-[#2d2d33]"
              >
                <label className="text-[9px] tracking-wider uppercase font-bold text-rose-500 block">
                  Bespoke Family Direction:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customAction}
                    onChange={(e) => setCustomAction(e.target.value)}
                    placeholder="e.g. Sibling spills the flour, or Grandma starts playing a funny tune on her harmonica..."
                    className="flex-1 bg-[#0a0a0b] border border-[#222226] rounded p-2 text-xs text-[#e0e0e0] placeholder-gray-600 focus:outline-none focus:border-rose-900 font-sans"
                    maxLength={200}
                    disabled={isGenerating}
                  />
                  <button
                    type="submit"
                    disabled={isGenerating || !customAction.trim()}
                    className="px-3 py-2 bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white rounded text-xs font-bold transition-all shrink-0 cursor-pointer uppercase tracking-wider"
                  >
                    Direct
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomAction('');
                    }}
                    className="px-2 py-2 text-gray-500 hover:text-white text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
