const { useState, useEffect, useRef } = React;

const BinauralChakraApp = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [leftFreq, setLeftFreq] = useState(440);
  const [rightFreq, setRightFreq] = useState(444);
  const [selectedChakra, setSelectedChakra] = useState(null);
  const [selectedOffset, setSelectedOffset] = useState('focus');
  const [customOffset, setCustomOffset] = useState(4);
  
  const audioContextRef = useRef(null);
  const leftOscillatorRef = useRef(null);
  const rightOscillatorRef = useRef(null);
  const leftGainRef = useRef(null);
  const rightGainRef = useRef(null);
  const leftAnalyserRef = useRef(null);
  const rightAnalyserRef = useRef(null);
  const animationRef = useRef(null);

  const chakras = [
    { name: 'Root', freq: 396, color: '#FF0000', sanskrit: 'Muladhara' },
    { name: 'Sacral', freq: 417, color: '#FF8C00', sanskrit: 'Svadhisthana' },
    { name: 'Solar Plexus', freq: 528, color: '#FFD700', sanskrit: 'Manipura' },
    { name: 'Heart', freq: 639, color: '#00FF00', sanskrit: 'Anahata' },
    { name: 'Throat', freq: 741, color: '#0080FF', sanskrit: 'Vishuddha' },
    { name: 'Third Eye', freq: 852, color: '#4B0082', sanskrit: 'Ajna' },
    { name: 'Crown', freq: 963, color: '#8A2BE2', sanskrit: 'Sahasrara' }
  ];

  const offsetPresets = {
    'focus': { name: 'Focus (Alpha)', value: 10 },
    'relax': { name: 'Relaxation (Theta)', value: 6 },
    'meditate': { name: 'Meditation (Delta)', value: 2 },
    'alert': { name: 'Alert (Beta)', value: 20 },
    'custom': { name: 'Custom', value: customOffset }
  };

  const currentChakra = selectedChakra ? chakras.find(c => c.name === selectedChakra) : null;
  const currentOffset = offsetPresets[selectedOffset].value;

  useEffect(() => {
    if (selectedChakra && selectedOffset) {
      const baseFreq = chakras.find(c => c.name === selectedChakra).freq;
      const offset = selectedOffset === 'custom' ? customOffset : offsetPresets[selectedOffset].value;
      setLeftFreq(baseFreq);
      setRightFreq(baseFreq + offset);
    }
  }, [selectedChakra, selectedOffset, customOffset]);

  const initAudio = async () => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create stereo panner and gain nodes
      leftGainRef.current = audioContextRef.current.createGain();
      rightGainRef.current = audioContextRef.current.createGain();
      
      const leftPanner = audioContextRef.current.createStereoPanner();
      const rightPanner = audioContextRef.current.createStereoPanner();
      leftPanner.pan.value = -1; // Full left
      rightPanner.pan.value = 1;  // Full right
      
      // Create analysers for visualization
      leftAnalyserRef.current = audioContextRef.current.createAnalyser();
      rightAnalyserRef.current = audioContextRef.current.createAnalyser();
      leftAnalyserRef.current.fftSize = 256;
      rightAnalyserRef.current.fftSize = 256;
      
      // Connect audio graph
      leftGainRef.current.connect(leftPanner);
      rightGainRef.current.connect(rightPanner);
      leftPanner.connect(leftAnalyserRef.current);
      rightPanner.connect(rightAnalyserRef.current);
      leftAnalyserRef.current.connect(audioContextRef.current.destination);
      rightAnalyserRef.current.connect(audioContextRef.current.destination);
      
      // Set initial gain
      leftGainRef.current.gain.value = 0.3;
      rightGainRef.current.gain.value = 0.3;
      
    } catch (error) {
      console.error('Audio initialization failed:', error);
    }
  };

  const startAudio = async () => {
    if (!audioContextRef.current) {
      await initAudio();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    // Create oscillators
    leftOscillatorRef.current = audioContextRef.current.createOscillator();
    rightOscillatorRef.current = audioContextRef.current.createOscillator();
    
    leftOscillatorRef.current.type = 'sine';
    rightOscillatorRef.current.type = 'sine';
    leftOscillatorRef.current.frequency.value = leftFreq;
    rightOscillatorRef.current.frequency.value = rightFreq;
    
    leftOscillatorRef.current.connect(leftGainRef.current);
    rightOscillatorRef.current.connect(rightGainRef.current);
    
    leftOscillatorRef.current.start();
    rightOscillatorRef.current.start();
    
    startVisualization();
  };

  const stopAudio = () => {
    if (leftOscillatorRef.current) {
      leftOscillatorRef.current.stop();
      leftOscillatorRef.current = null;
    }
    if (rightOscillatorRef.current) {
      rightOscillatorRef.current.stop();
      rightOscillatorRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handlePlayStop = async () => {
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    } else {
      await startAudio();
      setIsPlaying(true);
    }
  };

  const updateFrequency = (channel, freq) => {
    if (channel === 'left') {
      setLeftFreq(freq);
      if (leftOscillatorRef.current) {
        leftOscillatorRef.current.frequency.value = freq;
      }
    } else {
      setRightFreq(freq);
      if (rightOscillatorRef.current) {
        rightOscillatorRef.current.frequency.value = freq;
      }
    }
  };

  const selectChakra = (chakra) => {
    setSelectedChakra(chakra.name);
  };

  const VisualizerBar = ({ height, color }) => (
    <div 
      className="w-1 bg-gradient-to-t transition-all duration-75 ease-out"
      style={{ 
        height: `${height}%`,
        backgroundImage: `linear-gradient(to top, ${color}40, ${color})`
      }}
    />
  );

  const Visualizer = ({ analyserRef, color, label }) => {
    const [bars, setBars] = useState(new Array(16).fill(0));
    
    useEffect(() => {
      let animationId;
      
      const updateBars = () => {
        if (analyserRef.current && isPlaying) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Sample 16 frequency bins for visualization
          const newBars = [];
          const binSize = Math.floor(dataArray.length / 16);
          for (let i = 0; i < 16; i++) {
            const start = i * binSize;
            const end = start + binSize;
            const average = dataArray.slice(start, end).reduce((a, b) => a + b, 0) / binSize;
            newBars.push((average / 255) * 100);
          }
          setBars(newBars);
        } else {
          setBars(new Array(16).fill(0));
        }
        animationId = requestAnimationFrame(updateBars);
      };
      
      updateBars();
      return () => cancelAnimationFrame(animationId);
    }, [analyserRef, isPlaying]);

    return (
      <div className="bg-black/30 rounded-lg p-3 sm:p-4 backdrop-blur-sm mt-4">
        <div className="text-center text-white/80 text-xs sm:text-sm mb-2 font-mono">{label}</div>
        <div className="flex items-end justify-center gap-1 h-12 sm:h-16">
          {bars.map((height, i) => (
            <VisualizerBar key={i} height={Math.max(height, 2)} color={color} />
          ))}
        </div>
      </div>
    );
  };

  const startVisualization = () => {
    // Visualization is now handled by individual Visualizer components
  };

  return (
    <div 
      className="min-h-screen transition-all duration-1000 ease-in-out relative overflow-hidden"
      style={{
        background: currentChakra 
          ? `radial-gradient(ellipse at center, ${currentChakra.color}15 0%, ${currentChakra.color}08 30%, ${currentChakra.color}04 60%, #0a0a0a 100%)`
          : 'linear-gradient(135deg, #0F0F23 0%, #1A1A2E 50%, #16213E 100%)'
      }}
    >
      {/* Multiple layered glow effects */}
      {currentChakra && (
        <>
          <div 
            className="absolute inset-0 pointer-events-none transition-all duration-1000"
            style={{
              background: `radial-gradient(circle at 50% 30%, ${currentChakra.color}12 0%, ${currentChakra.color}06 40%, transparent 70%)`,
              filter: 'blur(80px)'
            }}
          />
          <div 
            className="absolute inset-0 pointer-events-none transition-all duration-1000"
            style={{
              background: `radial-gradient(circle at 50% 70%, ${currentChakra.color}08 0%, transparent 50%)`,
              filter: 'blur(120px)'
            }}
          />
        </>
      )}

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-6xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Chakra Binaural Generator</h1>
          <p className="text-white/60 text-sm sm:text-base px-4">Align your energy centers with sacred frequencies</p>
        </div>

        {/* Chakra Selection */}
        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 text-center">Choose Your Chakra</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 max-w-4xl mx-auto">
            {chakras.map((chakra) => (
              <button
                key={chakra.name}
                onClick={() => selectChakra(chakra)}
                className={`p-2 sm:p-4 rounded-lg transition-all duration-300 border-2 hover:scale-105 active:scale-95 ${
                  selectedChakra === chakra.name 
                    ? 'border-white shadow-lg transform scale-105' 
                    : 'border-white/20 hover:border-white/40'
                }`}
                style={{
                  backgroundColor: `${chakra.color}20`,
                  boxShadow: selectedChakra === chakra.name ? `0 0 20px ${chakra.color}40` : 'none'
                }}
              >
                <div 
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mx-auto mb-1 sm:mb-2"
                  style={{ backgroundColor: chakra.color }}
                />
                <div className="text-white text-xs font-medium">{chakra.name}</div>
                <div className="text-white/60 text-xs">{chakra.freq}Hz</div>
              </button>
            ))}
          </div>
        </div>

        {/* Offset Selection */}
        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 text-center">Binaural Beat Offset</h2>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4">
            {Object.entries(offsetPresets).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => setSelectedOffset(key)}
                className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-all duration-200 text-xs sm:text-sm active:scale-95 ${
                  selectedOffset === key 
                    ? 'bg-white/20 text-white border border-white/40' 
                    : 'bg-black/30 text-white/70 border border-white/20 hover:bg-white/10'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
          
          {selectedOffset === 'custom' && (
            <div className="flex justify-center">
              <div className="bg-black/30 rounded-lg p-4 backdrop-blur-sm w-full max-w-xs">
                <label className="block text-white/80 text-sm mb-2 text-center">Custom Offset (Hz)</label>
                <input
                  type="number"
                  value={customOffset}
                  onChange={(e) => setCustomOffset(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-black/50 border border-white/30 rounded text-white text-center"
                  min="0.1"
                  max="50"
                  step="0.1"
                />
              </div>
            </div>
          )}
        </div>

        {/* Frequency Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Left Channel */}
          <div className="bg-black/30 rounded-lg p-4 sm:p-6 backdrop-blur-sm">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4 text-center">Left Channel</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-xs sm:text-sm mb-2">Frequency: {leftFreq} Hz</label>
                <input
                  type="range"
                  min="20"
                  max="2000"
                  value={leftFreq}
                  onChange={(e) => updateFrequency('left', Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
              <div>
                <label className="block text-white/80 text-xs sm:text-sm mb-2">Manual Input</label>
                <input
                  type="number"
                  value={leftFreq}
                  onChange={(e) => updateFrequency('left', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-black/50 border border-white/30 rounded text-white text-sm"
                  min="20"
                  max="2000"
                />
              </div>
            </div>
            <Visualizer 
              analyserRef={leftAnalyserRef} 
              color={currentChakra?.color || '#00FFFF'} 
              label="LEFT" 
            />
          </div>

          {/* Right Channel */}
          <div className="bg-black/30 rounded-lg p-4 sm:p-6 backdrop-blur-sm">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4 text-center">Right Channel</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-xs sm:text-sm mb-2">Frequency: {rightFreq} Hz</label>
                <input
                  type="range"
                  min="20"
                  max="2000"
                  value={rightFreq}
                  onChange={(e) => updateFrequency('right', Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
              <div>
                <label className="block text-white/80 text-xs sm:text-sm mb-2">Manual Input</label>
                <input
                  type="number"
                  value={rightFreq}
                  onChange={(e) => updateFrequency('right', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-black/50 border border-white/30 rounded text-white text-sm"
                  min="20"
                  max="2000"
                />
              </div>
            </div>
            <Visualizer 
              analyserRef={rightAnalyserRef} 
              color={currentChakra?.color || '#FF00FF'} 
              label="RIGHT" 
            />
          </div>
        </div>

        {/* Control Panel */}
        <div className="text-center">
          <div className="bg-black/30 rounded-lg p-4 sm:p-6 backdrop-blur-sm inline-block w-full max-w-sm">
            <div className="mb-4">
              <div className="text-white/80 text-xs sm:text-sm">Binaural Beat Frequency</div>
              <div className="text-xl sm:text-2xl font-bold text-white">
                {Math.abs(rightFreq - leftFreq).toFixed(1)} Hz
              </div>
            </div>
            
            <button
              onClick={handlePlayStop}
              className={`w-full px-6 py-3 sm:px-8 sm:py-4 rounded-lg font-semibold text-white transition-all duration-200 transform hover:scale-105 active:scale-95 text-sm sm:text-base ${
                isPlaying 
                  ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30' 
                  : 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/30'
              }`}
            >
              {isPlaying ? '⏹ STOP' : '▶ START'}
            </button>
          </div>
        </div>

        {/* Current Selection Display */}
        {currentChakra && (
          <div className="mt-6 text-center">
            <div className="bg-black/30 rounded-lg p-4 backdrop-blur-sm inline-block w-full max-w-sm">
              <div className="text-white/80 text-xs sm:text-sm">Currently Tuned To</div>
              <div 
                className="text-lg sm:text-xl font-bold mb-1"
                style={{ color: currentChakra.color }}
              >
                {currentChakra.name} Chakra
              </div>
              <div className="text-white/60 text-xs sm:text-sm">{currentChakra.sanskrit}</div>
              <div className="text-white/60 text-xs sm:text-sm">
                Base: {currentChakra.freq}Hz | Offset: {currentOffset}Hz
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};