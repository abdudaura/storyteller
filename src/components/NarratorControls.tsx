/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sliders, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { TONE_OPTIONS, VERBOSITY_OPTIONS, VOICE_STYLE_OPTIONS, VOICE_MATURITY_OPTIONS, VOICE_ROLE_OPTIONS } from '../data';
import { NarratorConfig } from '../types';

interface NarratorControlsProps {
  config: NarratorConfig;
  onChange: (updates: Partial<NarratorConfig>) => void;
}

export default function NarratorControls({ config, onChange }: NarratorControlsProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div id="narrator-editor-card" className="border border-[#222226] bg-[#0d0d0f] rounded overflow-hidden shadow-lg transition-all">
      <button
        id="narrator-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[#161619] text-gray-200 hover:bg-[#1f1f24] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Sliders className="w-4 h-4 text-rose-500" />
          <span className="font-sans font-medium text-[11px] tracking-widest uppercase text-white">Narrator Persona</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-rose-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-rose-500" />
        )}
      </button>

      {isOpen && (
        <div id="narrator-fields" className="p-4 space-y-4 leading-relaxed text-gray-300 font-sans">
          {/* Tone block */}
          <div id="tone-group" className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-[#8e8e93] font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" /> Story Tone
            </label>
            <select
              id="tone-picker"
              value={config.tone}
              onChange={(e) => onChange({ tone: e.target.value })}
              className="w-full bg-[#161619] border border-[#2d2d33] rounded p-2.5 text-gray-200 text-xs focus:outline-none focus:border-rose-900 transition-all cursor-pointer"
            >
              {TONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#0f0f11]">
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-500 italic">
              {TONE_OPTIONS.find((t) => t.value === config.tone)?.desc}
            </p>
          </div>

          {/* Verbosity / Length block */}
          <div id="verbosity-group" className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-[#8e8e93] font-bold">
              Format & Length
            </label>
            <select
              id="verbosity-picker"
              value={config.verbosity}
              onChange={(e) => onChange({ verbosity: e.target.value })}
              className="w-full bg-[#161619] border border-[#2d2d33] rounded p-2.5 text-gray-200 text-xs focus:outline-none focus:border-rose-900 transition-all cursor-pointer"
            >
              {VERBOSITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#0f0f11]">
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-500 italic">
              {VERBOSITY_OPTIONS.find((v) => v.value === config.verbosity)?.desc}
            </p>
          </div>

          <div id="advanced-grid" className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-[#222226]">
            {/* Prose Style */}
            <div id="style-group" className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-[#8e8e93] font-bold block">
                Voice Style
              </label>
              <select
                id="style-picker"
                value={config.voiceStyle}
                onChange={(e) => onChange({ voiceStyle: e.target.value })}
                className="w-full bg-[#161619] border border-[#2d2d33] rounded p-2 text-gray-200 text-[10px] focus:outline-none focus:border-rose-950 cursor-pointer"
              >
                {VOICE_STYLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Voice Maturity */}
            <div id="maturity-group" className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-[#8e8e93] font-bold block">
                Voice Persona
              </label>
              <select
                id="maturity-picker"
                value={config.voiceMaturity}
                onChange={(e) => onChange({ voiceMaturity: e.target.value })}
                className="w-full bg-[#161619] border border-[#2d2d33] rounded p-2 text-gray-200 text-[10px] focus:outline-none focus:border-rose-950 cursor-pointer"
              >
                {VOICE_MATURITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Narrative Role */}
            <div id="role-group" className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-[#8e8e93] font-bold block">
                Narrator Role
              </label>
              <select
                id="role-picker"
                value={config.voiceRole}
                onChange={(e) => onChange({ voiceRole: e.target.value })}
                className="w-full bg-[#161619] border border-[#2d2d33] rounded p-2 text-gray-200 text-[10px] focus:outline-none focus:border-rose-950 cursor-pointer"
              >
                {VOICE_ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
