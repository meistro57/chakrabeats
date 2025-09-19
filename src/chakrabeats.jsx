import React, { useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

/**
 * Minimal, production-safe version of your Binaural Chakra app.
 * - No CDN React, no Babel-in-browser.
 * - Tailwind classes come from the compiled CSS.
 * - Audio wiring kept simple; swap in your full generator when ready.
 */

function BinauralChakraApp() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [carrier, setCarrier] = useState(200);  // Hz
  const [beat, setBeat]       = useState(7.83); // Hz (Schumann-ish)
  const ctxRef = useRef(null);
  const nodesRef = useRef({});

  // Simple binaural generator
  const start = async () => {
    if (isPlaying) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = ctxRef.current ?? new AudioCtx();
    
    // Resume audio context if suspended (required by browsers)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const left = ctx.createOscillator();
    const right = ctx.createOscillator();
    const splitter = ctx.createChannelMerger(2);
    const gain = ctx.createGain();

    // Left = carrier - beat/2, Right = carrier + beat/2
    left.frequency.value = Math.max(20, carrier - beat / 2);
    right.frequency.value = Math.max(20, carrier + beat / 2);

    left.connect(splitter, 0, 0);
    right.connect(splitter, 0, 1);
    splitter.connect(gain).connect(ctx.destination);

    gain.gain.value = 0.1; // gentle default
    left.start();
    right.start();

    ctxRef.current = ctx;
    nodesRef.current = { left, right, gain };
    setIsPlaying(true);
  };

  const stop = () => {
    if (!isPlaying) return;
    const { left, right, gain } = nodesRef.current || {};
    try { left?.stop(); right?.stop(); } catch {}
    nodesRef.current = {};
    setIsPlaying(false);
  };

  const applyParams = () => {
    const { left, right } = nodesRef.current || {};
    if (left && right) {
      left.frequency.value  = Math.max(20, carrier - beat / 2);
      right.frequency.value = Math.max(20, carrier + beat / 2);
    }
  };

  // Chakra presets (you can refine these)
  const chakras = useMemo(() => ([
    { id: "root",    name: "Root",    color: "red-500",    carrier: 228, beat: 7.83 },
    { id: "sacral",  name: "Sacral",  color: "orange-500", carrier: 303, beat: 6.0  },
    { id: "solar",   name: "Solar",   color: "yellow-500", carrier: 364, beat: 10.0 },
    { id: "heart",   name: "Heart",   color: "green-500",  carrier: 341, beat: 8.0  },
    { id: "throat",  name: "Throat",  color: "sky-500",    carrier: 384, beat: 5.0  },
    { id: "third",   name: "Third Eye",color:"indigo-500", carrier: 445, beat: 8.5  },
    { id: "crown",   name: "Crown",   color: "violet-500", carrier: 480, beat: 12.0 },
  ]), []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-slate-800/60 border border-slate-700 rounded-2xl shadow-xl p-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">ChakraBeats</h1>
        <p className="mt-1 text-slate-300 text-sm">
          Align your chakras with sacred frequencies. Generate binaural beats tuned to the seven chakras.
        </p>

        {/* Chakra presets */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {chakras.map(c => (
            <button
              key={c.id}
              onClick={() => { setCarrier(c.carrier); setBeat(c.beat); applyParams(); }}
              className={`px-3 py-2 rounded-lg border border-slate-700/70 bg-slate-700/30 hover:bg-slate-700/50 text-sm`}
              title={`${c.name}: carrier ${c.carrier}Hz, beat ${c.beat}Hz`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-slate-300">Carrier: {carrier.toFixed(1)} Hz</label>
            <input
              type="range" min="100" max="600" step="1" value={carrier}
              onChange={e => { setCarrier(+e.target.value); applyParams(); }}
              className="w-full accent-indigo-500"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300">Beat: {beat.toFixed(2)} Hz</label>
            <input
              type="range" min="1" max="20" step="0.01" value={beat}
              onChange={e => { setBeat(+e.target.value); applyParams(); }}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-3">
          {!isPlaying ? (
            <button onClick={start} className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white">
              Play
            </button>
          ) : (
            <button onClick={stop} className="px-4 py-2 rounded-xl border border-slate-600 hover:bg-slate-700/50">
              Stop
            </button>
          )}
          <button
            onClick={() => { setCarrier(200); setBeat(7.83); applyParams(); }}
            className="px-4 py-2 rounded-xl border border-slate-600 hover:bg-slate-700/50"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<BinauralChakraApp />);
