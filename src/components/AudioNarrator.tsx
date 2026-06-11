import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, Volume2, SkipForward, Loader2 } from 'lucide-react';
import { StorySegment, StoryOutline } from '../types';
import { motion } from 'motion/react';

interface AudioNarratorProps {
  segments: StorySegment[];
  outline: StoryOutline | null;
  tone: string;
  startFromIndex: number;
  onClose: () => void;
}

type NarratorStatus = 'loading' | 'playing' | 'done' | 'error' | 'stopped';

export default function AudioNarrator({
  segments,
  outline,
  tone,
  startFromIndex,
  onClose,
}: AudioNarratorProps) {
  const [status, setStatus] = useState<NarratorStatus>('loading');
  const [currentChapter, setCurrentChapter] = useState(startFromIndex);
  const [errorMsg, setErrorMsg] = useState('');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const stoppedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    startNarration(startFromIndex);
    return () => {
      stoppedRef.current = true;
      abortRef.current?.abort();
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  async function startNarration(fromIndex: number) {
    stoppedRef.current = false;

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      audioCtxRef.current = ctx;
      nextStartTimeRef.current = ctx.currentTime + 0.1;

      for (let i = fromIndex; i < segments.length; i++) {
        if (stoppedRef.current) break;
        setCurrentChapter(i);
        setStatus('loading');
        await narrateChapter(segments[i].text, tone, i + 1, ctx);
        if (stoppedRef.current) break;
        await waitForPlayback(ctx);
      }

      if (!stoppedRef.current) setStatus('done');
    } catch (e: any) {
      if (!stoppedRef.current) {
        setErrorMsg(e.message || 'Audio unavailable');
        setStatus('error');
      }
    }
  }

  async function narrateChapter(
    text: string,
    tone: string,
    chapterNum: number,
    ctx: AudioContext
  ) {
    const controller = new AbortController();
    abortRef.current = controller;

    const response = await fetch('/api/story-narrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, tone, chapterNum }),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${response.status}`);
    }

    setStatus('playing');

    const reader = response.body.getReader();
    let buffer = '';

    while (true) {
      if (stoppedRef.current) {
        reader.cancel();
        break;
      }
      const { done, value } = await reader.read();
      if (done) break;

      buffer += new TextDecoder().decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') return;
        try {
          const parsed = JSON.parse(payload);
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.audio) schedulePcmChunk(parsed.audio, ctx);
        } catch (e: any) {
          if (e.message && !e.message.startsWith('JSON')) throw e;
        }
      }
    }
  }

  function schedulePcmChunk(base64Pcm: string, ctx: AudioContext) {
    try {
      const binary = atob(base64Pcm);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const int16 = new Int16Array(bytes.buffer);
      if (int16.length === 0) return;

      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;

      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.copyToChannel(float32, 0);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const startAt = Math.max(nextStartTimeRef.current, ctx.currentTime + 0.02);
      source.start(startAt);
      nextStartTimeRef.current = startAt + audioBuffer.duration;
    } catch {}
  }

  async function waitForPlayback(ctx: AudioContext) {
    const remaining = nextStartTimeRef.current - ctx.currentTime;
    if (remaining > 0) {
      await new Promise<void>(resolve => setTimeout(resolve, remaining * 1000 + 300));
    }
  }

  const handleStop = () => {
    stoppedRef.current = true;
    abortRef.current?.abort();
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setStatus('stopped');
    onClose();
  };

  const handleSkip = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    const next = currentChapter + 1;
    if (next < segments.length) {
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
      startNarration(next);
    } else {
      handleStop();
    }
  };

  const chapterTitle = outline?.chapters[currentChapter]?.title || `Chapter ${currentChapter + 1}`;
  const isDone = status === 'done';
  const isError = status === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.97 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[420px] max-w-[calc(100vw-2rem)]"
    >
      <div className="bg-[#0d0d0f] border border-[#2d2d33] rounded-xl shadow-2xl shadow-black/60 overflow-hidden">
        {/* Animated top bar */}
        <div className="h-0.5 bg-gradient-to-r from-rose-900 via-rose-500 to-rose-900">
          {status === 'playing' && (
            <motion.div
              className="h-full bg-rose-400"
              animate={{ x: ['0%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </div>

        <div className="px-4 py-3 flex items-center gap-3">
          {/* Mic icon + waveform */}
          <div className="flex items-center gap-2 shrink-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center border ${
              status === 'playing' ? 'bg-rose-900/30 border-rose-700/50' : 'bg-[#161619] border-[#2d2d33]'
            }`}>
              {status === 'loading' ? (
                <Loader2 className="w-3.5 h-3.5 text-rose-400 animate-spin" />
              ) : isError ? (
                <Volume2 className="w-3.5 h-3.5 text-gray-500" />
              ) : (
                <Mic className={`w-3.5 h-3.5 ${status === 'playing' ? 'text-rose-400' : 'text-gray-500'}`} />
              )}
            </div>

            {/* Waveform bars */}
            {status === 'playing' && (
              <div className="flex items-end gap-0.5 h-4">
                {[0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6].map((h, i) => (
                  <motion.div
                    key={i}
                    className="w-[3px] bg-rose-500 rounded-full"
                    animate={{ scaleY: [h * 0.4, h, h * 0.3, h * 0.8, h * 0.5] }}
                    transition={{
                      duration: 0.8 + i * 0.1,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.07,
                    }}
                    style={{ transformOrigin: 'bottom' }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {isDone ? (
              <p className="text-[11px] text-emerald-400 font-sans font-semibold">Story complete ✦</p>
            ) : isError ? (
              <p className="text-[11px] text-red-400 font-sans">{errorMsg || 'Narration unavailable'}</p>
            ) : (
              <>
                <p className="text-[10px] text-gray-500 font-sans uppercase tracking-widest">
                  {status === 'loading' ? 'Preparing narrator...' : `Chapter ${currentChapter + 1} of ${segments.length}`}
                </p>
                <p className="text-[12px] text-white font-serif font-medium truncate leading-tight">
                  {chapterTitle}
                </p>
              </>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {status === 'playing' && currentChapter < segments.length - 1 && (
              <button
                onClick={handleSkip}
                title="Skip to next chapter"
                className="w-6 h-6 flex items-center justify-center rounded border border-[#2d2d33] hover:border-[#3d3d44] hover:bg-[#161619] text-gray-500 hover:text-white transition-all cursor-pointer"
              >
                <SkipForward className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={isDone || isError ? onClose : handleStop}
              className="w-6 h-6 flex items-center justify-center rounded border border-[#2d2d33] hover:border-rose-800/50 hover:bg-rose-950/20 text-gray-500 hover:text-rose-400 transition-all cursor-pointer"
              title={isDone ? 'Close' : 'Stop narration'}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
