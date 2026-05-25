/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MurmurationCanvas } from './components/MurmurationCanvas';
import { SidebarControls } from './components/SidebarControls';
import { ATMOSPHERIC_PRESETS } from './utils/presets';
import { PresetConfig, NamedBird } from './types';
import { Trophy, RotateCcw, Award } from 'lucide-react';

const INITIAL_NAMED_BIRDS: NamedBird[] = [
  { id: '1', name: 'Mr Holmes', color: '#ffd32a' }        // Amber Gold
];

export default function App() {
  // Config state (defaults to Foggy/Misty Baker Street preset)
  const [config, setConfig] = useState<PresetConfig>(ATMOSPHERIC_PRESETS[0]);

  // Tracked named birds and Battle Royale status
  const [namedBirds, setNamedBirds] = useState<NamedBird[]>(INITIAL_NAMED_BIRDS);
  const [battleRoyaleActive, setBattleRoyaleActive] = useState<boolean>(false);
  const [remainingNamedCount, setRemainingNamedCount] = useState<number>(INITIAL_NAMED_BIRDS.length);
  const [winnerName, setWinnerName] = useState<string | null>(null);

  const handleResetArena = () => {
    setWinnerName(null);
    setBattleRoyaleActive(false);
    
    // Restore original population boid count to config
    setConfig(prev => ({
      ...prev,
      boidCount: 220 // Healthy default flock size
    }));
    
    // Re-verify initial survivors count
    setRemainingNamedCount(namedBirds.length);
  };

  return (
    <div 
      id="app-root" 
      className="relative w-screen h-screen overflow-hidden flex flex-col font-sans select-none"
      style={{
        background: `linear-gradient(135deg, ${config.bgColorStart}, ${config.bgColorEnd})`
      }}
    >
      {/* Absolute canvas container filling complete screen */}
      <div id="canvas-wrapper" className="absolute inset-0 w-full h-full z-0">
        <MurmurationCanvas 
          config={config} 
          mouseMode="attract" // Force attract cursor behavior for smooth hover control
          showAura={false} // Clean visual without aura range markings
          namedBirds={namedBirds}
          battleRoyaleActive={battleRoyaleActive}
          onBattleRoyaleWinner={(winner) => {
            setWinnerName(winner);
          }}
          onRemainingNamedBirdsCount={(count) => {
            setRemainingNamedCount(count);
          }}
        />
      </div>

      {/* Dynamic Ambient Vignette Overlay */}
      <div id="ambient-vignette" className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(10,10,10,0.45)_95%)]" />

      {/* Floating Sidebar Control Ledger */}
      <SidebarControls
        currentConfig={config}
        onConfigChange={setConfig}
        namedBirds={namedBirds}
        onNamedBirdsChange={(list) => {
          setNamedBirds(list);
          if (!battleRoyaleActive) {
            setRemainingNamedCount(list.length);
          }
        }}
        battleRoyaleActive={battleRoyaleActive}
        onBattleRoyaleToggle={(active) => {
          setBattleRoyaleActive(active);
          if (active) {
            setWinnerName(null);
            setRemainingNamedCount(namedBirds.length);
          }
        }}
        remainingNamedCount={remainingNamedCount}
      />

      {/* Winner Congratulations Screen Overlay Popup */}
      {winnerName && (
        <div 
          id="victory-screen-overlay"
          className="absolute inset-0 z-30 flex items-center justify-center bg-zinc-950/85 backdrop-blur-md animate-fade-in"
        >
          <div className="w-[440px] bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-300 shadow-2xl relative select-none max-w-[95%]">
            {/* Top Modern Badge */}
            <div className="absolute top-[-16px] left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-400 to-cyan-500 text-zinc-950 px-4 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase font-extrabold shadow-lg flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 stroke-[2.5]" /> VICTORY ACHIEVED
            </div>

            <div className="w-20 h-20 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 mt-2 relative">
              <Trophy className="w-10 h-10 text-[#ffd32a]" />
              <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-ping opacity-25" />
            </div>

            <h1 className="text-2xl font-sans tracking-tight text-white font-extrabold">
              WE HAVE A CHAMPION!
            </h1>
            
            <p className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase mt-1 mb-5">
              Battle Horizon Completed
            </p>

            <div className="my-6 py-4 px-6 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
              <span className="text-[10px] font-mono block text-zinc-500 mb-1">SURVIVING STARLING</span>
              <span className="text-3xl font-sans font-black text-cyan-400 tracking-tight block">
                {winnerName}
              </span>
            </div>

            <p className="text-xs text-zinc-400 font-sans leading-relaxed mb-6">
              Against wild chaotic swarming and intense high-speed clashes, they survived every attack and emerged as the supreme aerial victor.
            </p>

            <button
              onClick={handleResetArena}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold font-sans py-3 rounded-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" /> RESTOCK THE SKIES
            </button>
          </div>
        </div>
      )}

      {/* Simple brand signature overlay following No Margin Clutter constraints */}
      <footer id="study-copyright-stamp" className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-[9px] font-mono uppercase tracking-[0.15em] text-zinc-500/40 whitespace-nowrap text-center">
        DJDH98 © 2026 | Redruth, Cornwall, UK
      </footer>
    </div>
  );
}
