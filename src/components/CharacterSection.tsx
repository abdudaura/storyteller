/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Users, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { CharacterConfig } from '../types';

interface CharacterSectionProps {
  characters: CharacterConfig[];
  onChange: (characters: CharacterConfig[]) => void;
}

const CHARACTER_PRESETS = [
  {
    name: 'Siblings Duel',
    desc: 'Bantering brother & sister',
    chars: [
      { name: 'Chloe', role: 'Ambitious older sister who always wins board games and rules the couch' },
      { name: 'Leo', role: 'Rebellious but sweet teenage brother with a cheeky smirk and bad jokes' }
    ]
  },
  {
    name: 'Grandma & Toby',
    desc: 'Bakehouse secrets',
    chars: [
      { name: 'Grandma Rose', role: 'Wise family grandmother who teaches generational baking secrets' },
      { name: 'Toby', role: 'Curious 8-year-old grandson eager to count the chocolate chips' }
    ]
  },
  {
    name: 'Father & Daughter',
    desc: 'Life lessons & car talks',
    chars: [
      { name: 'Arthur', role: 'Patient, dad-joke-loving father who is teaching Maya how to weld' },
      { name: 'Maya', role: 'Creative high school senior trying to finish her final portfolio' }
    ]
  }
];

export default function CharacterSection({ characters, onChange }: CharacterSectionProps) {
  const handlePreset = (presetChars: CharacterConfig[]) => {
    onChange(presetChars.map(c => ({ ...c })));
  };

  const handleUpdate = (index: number, updates: Partial<CharacterConfig>) => {
    const next = [...characters];
    next[index] = { ...next[index], ...updates };
    onChange(next);
  };

  const addCharacter = () => {
    if (characters.length >= 4) return;
    onChange([...characters, { name: 'Family Member', role: 'Playful cousin, loving aunt, or supportive guardian' }]);
  };

  const removeCharacter = (index: number) => {
    if (characters.length <= 1) return;
    onChange(characters.filter((_, i) => i !== index));
  };

  return (
    <div id="character-config-card" className="border border-[#222226] bg-[#0d0d0f] rounded shadow-lg p-4 space-y-4">
      <div className="flex items-center justify-between pb-1 border-b border-[#222226]">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-rose-500" />
          <h3 className="font-sans font-medium text-[11px] tracking-widest uppercase text-white">Family Cast</h3>
        </div>
        <button
          onClick={addCharacter}
          disabled={characters.length >= 4}
          className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 px-2.5 py-1.5 bg-[#161619] text-rose-400 rounded hover:bg-[#222226] border border-[#2d2d33] disabled:opacity-50 cursor-pointer"
        >
          <Plus className="w-3 h-3 text-rose-500" /> Add Char
        </button>
      </div>

      {/* Preset Pickers */}
      <div className="space-y-1">
        <label className="text-[9px] uppercase tracking-wider text-[#8e8e93] font-semibold block">
          Archetypes Presets:
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CHARACTER_PRESETS.map((preset) => (
            <button
              key={preset.name}
              id={`preset-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
              type="button"
              onClick={() => handlePreset(preset.chars)}
              className="text-[10px] px-2 py-1 bg-[#161619] hover:bg-[#222226] border border-[#2d2d33] rounded text-gray-300 hover:text-white transition-colors cursor-pointer text-left"
            >
              <span className="font-medium block text-[9px] text-[#e0e0e0]">{preset.name}</span>
              <span className="text-gray-500 block text-[8px]">{preset.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Rows */}
      <div className="space-y-3.5 max-h-[200px] overflow-y-auto pr-1">
        {characters.map((char, index) => (
          <div key={index} className="p-3 bg-[#111114] rounded border border-[#222226] relative group space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">Character {index + 1}</span>
              {characters.length > 1 && (
                <button
                  onClick={() => removeCharacter(index)}
                  className="text-gray-500 hover:text-rose-500 p-1 rounded hover:bg-[#1c1c22] transition-colors"
                  title="Remove Character"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div>
                <input
                  type="text"
                  value={char.name}
                  onChange={(e) => handleUpdate(index, { name: e.target.value })}
                  placeholder="Name"
                  className="w-full bg-[#0a0a0b] border border-[#2d2d33] rounded p-1.5 text-xs text-[#e0e0e0] placeholder-gray-600 focus:outline-none focus:border-rose-900"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={char.role}
                  onChange={(e) => handleUpdate(index, { role: e.target.value })}
                  placeholder="Role, traits, or narrative purpose (e.g. sharp, teasing, or eager)"
                  className="w-full bg-[#0a0a0b] border border-[#2d2d33] rounded p-1.5 text-xs text-[#e0e0e0] placeholder-gray-600 focus:outline-none focus:border-rose-900"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
