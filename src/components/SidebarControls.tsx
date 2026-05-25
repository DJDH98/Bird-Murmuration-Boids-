import React, { useState } from 'react';
import { PresetConfig, NamedBird } from '../types';
import { ChevronRight, ChevronLeft, Sliders, Play, RotateCcw, Plus, Trash2, ShieldAlert } from 'lucide-react';

interface SidebarControlsProps {
  currentConfig: PresetConfig;
  onConfigChange: (newConfig: PresetConfig) => void;
  namedBirds: NamedBird[];
  onNamedBirdsChange: (list: NamedBird[]) => void;
  battleRoyaleActive: boolean;
  onBattleRoyaleToggle: (active: boolean) => void;
  remainingNamedCount: number;
}

const PRESET_COLORS = [
  { name: 'Royal Crimson', code: '#f53b57' },
  { name: 'Amber Gold', code: '#ffd32a' },
  { name: 'Emerald Jade', code: '#05c46b' },
  { name: 'Sapphire Blue', code: '#0fbcf9' },
  { name: 'Violet Orchid', code: '#8854d0' },
  { name: 'Prussian Teal', code: '#3c6382' }
];

export const SidebarControls: React.FC<SidebarControlsProps> = ({
  currentConfig,
  onConfigChange,
  namedBirds,
  onNamedBirdsChange,
  battleRoyaleActive,
  onBattleRoyaleToggle,
  remainingNamedCount
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true); // Default to collapsed
  const [newBirdName, setNewBirdName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#ffd32a'); // Amber Gold default

  const handleAddBird = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBirdName.trim()) return;

    const newBird: NamedBird = {
      id: Math.random().toString(36).substring(2, 9),
      name: newBirdName.trim().substring(0, 16),
      color: selectedColor
    };

    onNamedBirdsChange([...namedBirds, newBird]);
    setNewBirdName('');
  };

  const handleRemoveBird = (id: string) => {
    onNamedBirdsChange(namedBirds.filter(b => b.id !== id));
  };

  const handleUpdateBoidCount = (count: number) => {
    const sanitized = Math.max(5, Math.min(600, count));
    onConfigChange({
      ...currentConfig,
      boidCount: sanitized
    });
  };

  return (
    <div 
      id="inspector-menu"
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
      className={`fixed top-4 right-4 z-20 h-[calc(100vh-2rem)] flex transition-all duration-300 ${
        isCollapsed ? 'translate-x-[360px]' : 'translate-x-0'
      }`}
    >
      {/* Drawer Toggle Handle */}
      <button
        id="menu-toggle-btn"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="self-center -ml-10 w-10 h-24 bg-zinc-900 border border-r-0 border-zinc-800 rounded-l-xl text-zinc-300 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800 hover:text-white shadow-xl outline-none transition-colors duration-200"
        title={isCollapsed ? "Reveal Menu" : "Hide Menu"}
      >
        {isCollapsed ? <ChevronLeft className="w-5 h-5 animate-pulse text-cyan-400" /> : <ChevronRight className="w-5 h-5 text-zinc-400" />}
        <span className="text-[9px] uppercase tracking-widest origin-center rotate-90 mt-5 font-mono whitespace-nowrap font-extrabold">
          {isCollapsed ? 'MENU' : 'CLOSE'}
        </span>
      </button>

      {/* Main Panel Content */}
      <div 
        id="menu-scroll-container"
        className="w-[360px] bg-zinc-950/90 border border-zinc-800 rounded-r-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-300 font-sans h-full backdrop-blur-xl"
      >
        {/* Modern Sleek Accent Bar */}
        <div id="modern-gradient-bar" className="relative h-[3px] bg-gradient-to-r from-cyan-500 to-indigo-500 w-full" />

        {/* Sleek Header */}
        <div className="p-5 border-b border-zinc-800/60 bg-zinc-900/30">
          <h2 className="text-base font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" /> Mr Holmes' Bird Boids Murmuration
          </h2>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase tracking-wider">Atmospheric Vector Swarms</p>
        </div>

        {/* Scrollable Body Controls */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Section: Flock Population Count */}
          <div className="space-y-3">
            <h3 className="text-[10px] uppercase tracking-widest font-mono text-zinc-500 border-b border-zinc-800/80 pb-1 font-bold">
              TOTAL FLOCK SIZE
            </h3>
            <div className="space-y-3 bg-zinc-900/40 p-3.5 rounded-xl border border-zinc-800/80">
              <div className="flex justify-between font-mono text-[11px] text-zinc-400 items-center">
                <span>STARLING QUANTITY</span>
                <span className="text-zinc-100 font-bold text-xs bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
                  {currentConfig.boidCount} Birds
                </span>
              </div>
              <input
                id="count-slider"
                type="range"
                min="10"
                max="600"
                step="10"
                value={currentConfig.boidCount}
                onChange={(e) => handleUpdateBoidCount(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between items-center pt-1">
                <button
                  type="button"
                  onClick={() => handleUpdateBoidCount(currentConfig.boidCount - 25)}
                  className="px-2.5 py-1 text-[10px] font-mono border border-zinc-800 bg-zinc-900 rounded-lg hover:bg-zinc-800 active:scale-95 transition-all text-zinc-300"
                >
                  -25 BIRDS
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateBoidCount(currentConfig.boidCount + 25)}
                  className="px-2.5 py-1 text-[10px] font-mono border border-zinc-800 bg-zinc-900 rounded-lg hover:bg-zinc-800 active:scale-95 transition-all text-zinc-300"
                >
                  +25 BIRDS
                </button>
              </div>
            </div>
          </div>

          {/* Section: Named & Color Coded Starlings */}
          <div className="space-y-3">
            <h3 className="text-[10px] uppercase tracking-widest font-mono text-zinc-500 border-b border-zinc-800/80 pb-1 flex justify-between items-center font-bold">
              <span>NAMED STARLINGS</span>
              <span className="text-[9px] bg-cyan-400/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-400/20 font-bold">
                {namedBirds.length} Tracked
              </span>
            </h3>

            {/* Form to insert custom bird */}
            <form onSubmit={handleAddBird} className="space-y-3 bg-zinc-900/40 p-3.5 rounded-xl border border-zinc-800/80">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-zinc-500">STARLING CODENAME</label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="e.g. Goldie, Aero..."
                  value={newBirdName}
                  onChange={(e) => setNewBirdName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800/85 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-650 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all font-sans"
                />
              </div>

              {/* Color selector */}
              <div className="flex flex-col gap-2.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">CODENAME COLOR CODE</label>
                
                {/* Predefined color swatches */}
                <div className="grid grid-cols-6 gap-1.5 bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setSelectedColor(c.code)}
                      style={{ backgroundColor: c.code }}
                      className={`h-6 rounded-md cursor-pointer transition-all border ${
                        selectedColor.toLowerCase() === c.code.toLowerCase()
                          ? 'border-white scale-110 shadow-md shadow-white/20' 
                          : 'border-zinc-800/80 opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                      title={c.name}
                    />
                  ))}
                </div>

                {/* Custom Color Selector via Color Wheel */}
                <div className="flex items-center gap-3 bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                  {/* Color wheel preview/trigger */}
                  <div className="relative group shrink-0">
                    <input
                      type="color"
                      id="color-wheel-picker"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div 
                      className="w-10 h-10 rounded-full border border-zinc-800 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center relative overflow-hidden"
                      style={{ 
                        background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)'
                      }}
                    >
                      {/* Innermost circle matching active color */}
                      <div 
                        className="w-5 h-5 rounded-full border border-zinc-950/40 shadow-inner"
                        style={{ backgroundColor: selectedColor }}
                      />
                    </div>
                  </div>

                  {/* HEX Code input */}
                  <div className="flex-1 flex flex-col justify-center">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase">Custom Color (HEX)</span>
                    <input
                      type="text"
                      value={selectedColor.toUpperCase()}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (val && !val.startsWith('#')) val = '#' + val;
                        if (/^#[0-9A-F]{0,6}$/i.test(val)) {
                          setSelectedColor(val);
                        }
                      }}
                      placeholder="#FFD32A"
                      maxLength={7}
                      className="bg-transparent font-mono text-xs text-zinc-200 outline-none w-24 border-b border-transparent focus:border-cyan-500/50 uppercase"
                    />
                  </div>

                  {/* Active swatch pill */}
                  <div 
                    className="px-2.5 py-1 rounded-lg border border-zinc-800 flex items-center justify-center font-mono text-[9px] select-none font-bold" 
                    style={{ backgroundColor: selectedColor + "20", color: selectedColor, borderColor: selectedColor + "40" }}
                  >
                    PREVIEW
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98] transition-all text-white font-sans py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" /> REGISTER NEW STARLING
              </button>
            </form>

            {/* List of custom named birds */}
            {namedBirds.length > 0 ? (
              <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-zinc-900">
                {namedBirds.map(nb => (
                  <div key={nb.id} className="flex items-center justify-between py-1.5 pl-2 pr-1.5 bg-zinc-950/40 rounded-lg border border-zinc-900/80">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: nb.color }} />
                      <span className="text-xs font-sans font-medium text-zinc-200">{nb.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBird(nb.id)}
                      className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                      title="Erase tracking"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] font-mono text-zinc-600 italic text-center py-2">
                No custom starlings registered.
              </p>
            )}
          </div>

          {/* Section: Battle Royale Extreme Mode */}
          <div className="space-y-3 pt-2">
            <h3 className="text-[10px] uppercase tracking-widest font-mono text-zinc-500 border-b border-zinc-800/80 pb-1 font-bold">
              BATTLE ARENA MODE
            </h3>
            
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3.5 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-bl-full pointer-events-none flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-red-500/20 mr-[-4px] mt-[-4px]" />
              </div>

              <p className="text-[10px] font-sans text-zinc-400 leading-relaxed">
                Starlings compete for domination. Colliding birds duel; named ones have a 92% victory multiplier against standard birds. Only one remains!
              </p>

              {battleRoyaleActive ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between border border-red-900/30 bg-red-950/20 rounded-lg px-3 py-1.5">
                    <span className="font-mono text-[9px] text-red-400 animate-pulse font-extrabold">● ARENA IS ACTIVE</span>
                    <span className="font-sans text-xs font-semibold text-zinc-200">
                      {remainingNamedCount} Surviving Competitors
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onBattleRoyaleToggle(false)}
                    className="w-full bg-zinc-950 border border-red-900/35 hover:border-red-500 text-red-400 font-sans py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-red-500" /> ABORT BATTLE
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={namedBirds.length < 2}
                  onClick={() => onBattleRoyaleToggle(true)}
                  className={`w-full py-2 font-sans rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition-all ${
                    namedBirds.length >= 2
                      ? 'bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white active:scale-95'
                      : 'bg-zinc-900/80 border border-zinc-850 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" /> ENGAGE BATTLE ROYALE
                </button>
              )}

              {namedBirds.length < 2 && !battleRoyaleActive && (
                <p className="text-[9px] font-mono text-red-500/70 text-center leading-tight">
                  ⚠️ Minimum 2 Named Starlings required to launch battle arena.
                </p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
