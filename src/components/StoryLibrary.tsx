import React, { useState, useEffect } from 'react';
import { X, BookOpen, Trash2, ExternalLink, Share2, Calendar, BookMarked, Library } from 'lucide-react';
import { LibraryEntry, StoryOutline, StorySegment, StoryConfig } from '../types';
import { getLibraryEntries, deleteLibraryEntry } from '../utils/library';
import { encodeStoryToShareUrl } from '../utils/share';
import { motion, AnimatePresence } from 'motion/react';

interface StoryLibraryProps {
  onClose: () => void;
  onReread: (outline: StoryOutline, segments: StorySegment[], config: StoryConfig) => void;
}

export default function StoryLibrary({ onClose, onReread }: StoryLibraryProps) {
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setEntries(getLibraryEntries());
  }, []);

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      deleteLibraryEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const handleShare = async (entry: LibraryEntry) => {
    const url = encodeStoryToShareUrl(entry.outline, entry.segments);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      window.open(url, '_blank');
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-4xl max-h-[85vh] flex flex-col bg-[#0d0d0f] border border-[#222226] rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222226] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-rose-950/40 border border-rose-900/30 rounded flex items-center justify-center">
              <Library className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase font-sans">Story Library</h2>
              <p className="text-[10px] text-gray-500 font-sans">{entries.length} tale{entries.length !== 1 ? 's' : ''} saved locally</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded border border-[#222226] hover:border-[#3d3d44] hover:bg-[#161619] text-gray-500 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
              <div className="w-12 h-12 bg-[#111114] border border-[#222226] rounded-lg flex items-center justify-center">
                <BookMarked className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-gray-400 font-sans text-sm font-medium">No tales saved yet</p>
                <p className="text-gray-600 font-sans text-xs mt-1">Complete a 4-chapter story and save it to your library.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {entries.map(entry => (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#0f0f12] border border-[#222226] rounded-lg p-4 flex flex-col gap-3 hover:border-[#2d2d33] transition-colors"
                  >
                    {/* Story title + meta */}
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-white font-serif leading-tight line-clamp-2">
                          {entry.outline.title}
                        </h3>
                        <div className="flex items-center gap-1 shrink-0">
                          <BookOpen className="w-3 h-3 text-rose-500" />
                          <span className="text-[10px] text-rose-400 font-bold font-sans">{entry.segments.length} ch.</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 font-serif italic leading-relaxed line-clamp-2">
                        {entry.outline.premise}
                      </p>
                    </div>

                    {/* Chapter titles */}
                    <div className="space-y-0.5">
                      {entry.outline.chapters.slice(0, 4).map((ch, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className={`w-1 h-1 rounded-full shrink-0 ${i < entry.segments.length ? 'bg-emerald-600' : 'bg-gray-700'}`} />
                          <span className="text-[9px] text-gray-500 truncate">{ch.title}</span>
                        </div>
                      ))}
                    </div>

                    {/* Meta footer */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-[#1a1a1f]">
                      <Calendar className="w-2.5 h-2.5 text-gray-600" />
                      <span className="text-[9px] text-gray-600 font-sans flex-1">{formatDate(entry.savedAt)}</span>
                      <span className="text-[9px] text-gray-600 font-sans uppercase tracking-widest">{entry.config.tone}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { onReread(entry.outline, entry.segments, entry.config); onClose(); }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-900/20 hover:bg-rose-900/30 border border-rose-900/30 hover:border-rose-800/50 rounded text-[10px] font-sans font-bold text-rose-300 hover:text-rose-200 uppercase tracking-wider transition-all cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Re-read
                      </button>
                      <button
                        onClick={() => handleShare(entry)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-[#161619] hover:bg-[#1a1a1f] border border-[#2d2d33] rounded text-[10px] font-sans text-gray-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        <Share2 className="w-3 h-3 text-rose-500" />
                        {copiedId === entry.id ? '✓' : 'Share'}
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 border rounded text-[10px] font-sans uppercase tracking-wider transition-colors cursor-pointer ${
                          confirmDeleteId === entry.id
                            ? 'bg-red-900/30 border-red-800/50 text-red-300'
                            : 'bg-[#161619] hover:bg-[#1a1a1f] border-[#2d2d33] text-gray-600 hover:text-red-400'
                        }`}
                      >
                        <Trash2 className="w-3 h-3" />
                        {confirmDeleteId === entry.id ? 'Sure?' : ''}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="px-6 py-3 border-t border-[#222226] shrink-0">
          <p className="text-[9px] text-gray-600 font-sans text-center">
            Stories are stored locally in your browser. Clearing browser data will remove them.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
