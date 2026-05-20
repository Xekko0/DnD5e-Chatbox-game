'use client';

import { useGameStore } from '@/store/useGameStore';
import { Shield, Coins } from 'lucide-react';

export default function CharacterSheet() {
  const { character } = useGameStore();

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Character Sheet</h1>
          <div className="flex gap-8 text-sm">
            <div>Level {character?.level || 3} • {character?.class || 'Fighter'}</div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="font-mono">AC {character?.armorClass || 19}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Equipped Items */}
          <div className="col-span-7">
            <h2 className="text-lg font-semibold mb-4">Equipped Items</h2>
            <div className="grid grid-cols-3 gap-4">
              {/* Head, Neck, Back, Armor, etc. */}
              {['Head', 'Neck', 'Back', 'Armor', 'Gloves', 'Belt', 'Ring', 'Legs'].map((slot) => (
                <div key={slot} className="bg-zinc-900 border border-zinc-700 rounded-3xl p-4 flex flex-col items-center justify-center h-28 hover:border-amber-400 transition-colors">
                  <div className="text-xs text-zinc-400 mb-2">{slot}</div>
                  {slot === 'Armor' && (
                    <div className="w-12 h-12 bg-amber-900 rounded-2xl flex items-center justify-center">
                      <Shield className="w-8 h-8 text-amber-300" />
                    </div>
                  )}
                  {slot === 'Legs' && (
                    <div className="w-12 h-12 bg-zinc-700 rounded-2xl flex items-center justify-center text-xs">Boots</div>
                  )}
                  <div className="text-[10px] text-zinc-500 mt-2">{slot === 'Armor' ? character?.equipment?.body || 'Plate Armor' : ''}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats & Info */}
          <div className="col-span-5 space-y-6">
            {/* Currency */}
            <div className="bg-zinc-900 rounded-3xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Coins className="w-5 h-5" /> Currency</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-mono text-yellow-400">42</div>
                  <div className="text-xs text-zinc-400">Gold</div>
                </div>
                <div>
                  <div className="text-3xl font-mono text-zinc-300">7</div>
                  <div className="text-xs text-zinc-400">Silver</div>
                </div>
                <div>
                  <div className="text-3xl font-mono text-orange-300">5</div>
                  <div className="text-xs text-zinc-400">Copper</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-zinc-900 rounded-3xl p-6">
              <h3 className="font-semibold mb-4">Stats</h3>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { label: 'Strength', value: character?.abilityScores?.STR || 18 },
                  { label: 'Dexterity', value: character?.abilityScores?.DEX || 14 },
                  { label: 'Constitution', value: character?.abilityScores?.CON || 15 },
                  { label: 'Intelligence', value: character?.abilityScores?.INT || 10 },
                  { label: 'Wisdom', value: character?.abilityScores?.WIS || 12 },
                  { label: 'Charisma', value: character?.abilityScores?.CHA || 11 },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-xs text-zinc-400">{stat.label}</div>
                    <div className="text-4xl font-mono font-bold text-amber-300">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Armor Class & HP */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-zinc-900 rounded-3xl p-6">
                <div className="flex justify-between">
                  <div>
                    <div className="text-sm text-zinc-400">Armor Class</div>
                    <div className="text-5xl font-mono font-bold text-emerald-400">{character?.armorClass || 19}</div>
                  </div>
                  <Shield className="w-12 h-12 text-emerald-400" />
                </div>
              </div>
              <div className="bg-zinc-900 rounded-3xl p-6">
                <div className="flex justify-between">
                  <div>
                    <div className="text-sm text-zinc-400">Max HP</div>
                    <div className="text-5xl font-mono font-bold text-red-400">{character?.maxHitPoints || 35}</div>
                  </div>
                  <div className="text-4xl">❤️</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
