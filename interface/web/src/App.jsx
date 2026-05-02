import React, { useState, useEffect, useRef } from 'react';
import { Clock, FastForward, Rewind, Pause, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const romanNumerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

function App() {
  const [loading, setLoading] = useState(false);
  const [playerState, setPlayerState] = useState({ timePower: 100, score: 0, lastAction: null });
  
  // Mini-game states
  const [localScore, setLocalScore] = useState(100);
  const [entities, setEntities] = useState([]);
  const [kurumiSprite, setKurumiSprite] = useState(null);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('zafkiel_high_score') || '0'));
  const [systemMessage, setSystemMessage] = useState(null);
  const [cooldowns, setCooldowns] = useState({
    backward: 0,
    freeze: 0,
    forward: 0,
    accelerate: 0
  });
  
  const spriteTimeoutRef = useRef(null);

  // Update high score
  useEffect(() => {
    if (playerState.score > highScore) {
      setHighScore(playerState.score);
      localStorage.setItem('zafkiel_high_score', playerState.score.toString());
    }
  }, [playerState.score, highScore]);

  // Cooldown ticker
  useEffect(() => {
    const ticker = setInterval(() => {
      setCooldowns(prev => {
        const next = { ...prev };
        let changed = false;
        for (const key in next) {
          if (next[key] > 0) {
            next[key] = Math.max(0, next[key] - 100);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 100);
    return () => clearInterval(ticker);
  }, []);

  useEffect(() => {
    fetch('http://localhost:3001/api/player/player_1')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setPlayerState(data.data);
        }
      })
      .catch(err => console.error("Failed to load player state", err));
  }, []);

  // Time Limit Challenge
  useEffect(() => {
    const timer = setInterval(() => {
      setLocalScore(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Entity Spawner (Aggressive Scaling)
  useEffect(() => {
    const baseInterval = 1500;
    const interval = Math.max(400, baseInterval - (playerState.score * 50)); // Faster spawn as level increases
    
    const spawner = setInterval(() => {
      if (playerState.lastAction === 'freeze') return;
      
      const difficultyFactor = Math.min(0.8, 0.4 + (playerState.score * 0.05)); // More enemies at high level
      const isEnemy = Math.random() < difficultyFactor;
      
      setEntities(prev => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          type: isEnemy ? 'enemy' : 'essence',
          x: Math.random() * 80 + 10,
          y: -10,
          speed: isEnemy ? (15 + playerState.score) : 10 // Enemies get faster too
        }
      ]);
    }, interval);
    return () => clearInterval(spawner);
  }, [playerState.lastAction, playerState.score]);

  // Entity Movement Engine
  useEffect(() => {
    let lastTime = performance.now();
    let frameId;

    const loop = (time) => {
      const delta = (time - lastTime) / 1000; // seconds
      lastTime = time;

      setEntities(prev => {
        let scoreDiff = 0;
        let newEntities = prev.map(e => {
          let newY = e.y;
          
          if (playerState.lastAction === 'freeze') {
            // Frozen in time
          } else if (playerState.lastAction === 'backward') {
            // Move backwards
            newY -= e.speed * delta * 2;
          } else {
            // Normal falling
            newY += e.speed * delta * (playerState.lastAction === 'accelerate' ? 3 : 1);
          }

          // Enemy hits the bottom (y > 100)
          if (newY > 100) {
            if (e.type === 'enemy') {
              scoreDiff -= 15;
            }
            return { ...e, dead: true };
          }
          
          return { ...e, y: newY };
        }).filter(e => !e.dead && e.y > -20); // Remove dead or ones that went too far up

        if (scoreDiff !== 0) {
          setLocalScore(s => Math.max(0, s + scoreDiff));
        }

        return newEntities;
      });

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [playerState.lastAction]);

  useEffect(() => {
    if (playerState.lastAction === 'freeze') {
      document.body.classList.add('freeze-effect');
    } else {
      document.body.classList.remove('freeze-effect');
    }
  }, [playerState.lastAction]);

  const handleTimeAction = async (action) => {
    if (cooldowns[action] > 0) {
      setSystemMessage(`RESTRICTION: ${action.toUpperCase()} available in ${(cooldowns[action]/1000).toFixed(1)}s`);
      setTimeout(() => setSystemMessage(null), 2000);
      return;
    }

    setLoading(true);
    
    // Set Cooldowns
    const cdTimes = {
      backward: 5000,
      freeze: 10000,
      forward: 3000,
      accelerate: 5000
    };
    setCooldowns(prev => ({ ...prev, [action]: cdTimes[action] }));
    
    // Kurumi Sprite & Mini-game interactions
    if (spriteTimeoutRef.current) clearTimeout(spriteTimeoutRef.current);
    
    if (action === 'backward') {
      setKurumiSprite('/gun1.png');
      // Push enemies back significantly
      setEntities(prev => prev.map(e => ({ ...e, y: e.y - 40 })));
    } else if (action === 'forward' || action === 'accelerate') {
      setKurumiSprite(action === 'forward' ? '/gun2.png' : '/laugh.png');
      // Risk & Reward: Catch EVERYTHING on screen
      setEntities(prev => {
        let essenceCaught = 0;
        let enemiesCaught = 0;
        
        prev.forEach(e => {
          if (e.type === 'essence') essenceCaught++;
          else enemiesCaught++;
        });

        const netHP = (essenceCaught * 10) - (enemiesCaught * 8);
        setLocalScore(s => Math.max(0, s + netHP));
        
        // Visual feedback for the risk
        if (enemiesCaught > 0 && enemiesCaught > essenceCaught) {
          console.log("Strategic Error: Captured anomallies!");
        }
        
        return []; // Clear screen after collection
      });
    } else if (action === 'freeze') {
      setKurumiSprite('/laugh.png');
    }
    
    spriteTimeoutRef.current = setTimeout(() => setKurumiSprite(null), 2500);

    try {
      const response = await fetch('http://localhost:3001/api/time-shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: 'player_1',
          action: action,
          shift_amount: 10
        })
      });
      const data = await response.json();
      if (data.success) {
        const stateRes = await fetch('http://localhost:3001/api/player/player_1');
        const stateData = await stateRes.json();
        if (stateData.success) {
          setPlayerState(stateData.data);
        }
      }
    } catch (error) {
      console.error("Time displacement failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-zafkiel-darker text-zafkiel-gold flex flex-col relative overflow-hidden font-sans">
      
      {/* Background radial clock */}
      <motion.div 
        className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -mt-[400px] -ml-[400px] pointer-events-none opacity-10"
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
      >
        {romanNumerals.map((num, i) => {
          const angle = (i * 30) * (Math.PI / 180);
          const radius = 350;
          const x = Math.sin(angle) * radius;
          const y = -Math.cos(angle) * radius;
          return (
            <div 
              key={num}
              className="absolute text-zafkiel-crimson text-4xl font-gothic font-bold"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: `translate(-50%, -50%) rotate(${i * 30}deg)`
              }}
            >
              {num}
            </div>
          );
        })}
      </motion.div>

      {/* Top HUD */}
      <div className="w-full px-8 py-4 flex justify-between items-center z-30 bg-black/80 border-b border-zafkiel-crimson/20 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-4xl font-black text-zafkiel-crimsonBright tracking-tighter uppercase drop-shadow-[0_0_8px_rgba(220,20,60,0.6)]">Zafkiel</h1>
            <span className="text-[10px] text-zafkiel-gold/50 tracking-[0.5em] font-roman -mt-1 uppercase">Emperor of Time</span>
          </div>
          <div className="h-10 w-[1px] bg-white/10 mx-4"></div>
          <div className="flex flex-col">
            <span className="text-zafkiel-gold font-roman text-xl">{highScore}</span>
            <span className="text-[8px] uppercase tracking-widest text-zafkiel-gold/40">Temporal Peak</span>
          </div>
        </div>
        
        <div className="flex gap-12">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <span className={`text-4xl font-roman font-bold ${localScore < 30 ? 'text-red-500 animate-pulse' : 'text-zafkiel-crimson'}`}>
                {Math.floor(localScore)}
              </span>
              <div className={`w-3 h-3 rounded-full ${localScore < 30 ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-zafkiel-crimson shadow-[0_0_10px_crimson]'}`}></div>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-gray-500">Time Essence</span>
          </div>
          
          <div className="flex flex-col items-end border-l border-white/10 pl-12">
            <span className="text-4xl font-roman font-bold text-zafkiel-gold">
              {playerState.score}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-gray-500">Timeline Level</span>
          </div>
        </div>
      </div>

      {/* Main Game Stage (Center) */}
      <div className="flex-1 relative z-10 overflow-hidden bg-gradient-to-b from-transparent to-black/20">
        {/* Play Area Indicator */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
           <div className="w-[80vw] h-[80vh] border-[1px] border-zafkiel-gold rounded-full"></div>
        </div>

        {/* Entities */}
        <AnimatePresence>
          {entities.map(entity => (
            <motion.div 
              key={entity.id} 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute"
              style={{ 
                left: `${entity.x}%`, 
                top: `${entity.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {entity.type === 'enemy' ? (
                <div className="relative group">
                  <div className="absolute -inset-4 bg-red-600/20 rounded-full blur-xl animate-pulse"></div>
                  <img src="/enemy.png" alt="Enemy" className="w-20 h-20 relative z-10 drop-shadow-[0_0_20px_rgba(255,0,0,1)] object-contain" />
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-red-600 text-[8px] font-bold rounded border border-white/20 uppercase tracking-tighter">ANOMALY</div>
                </div>
              ) : (
                <div className="relative group">
                  <div className="absolute -inset-6 bg-zafkiel-gold/30 rounded-full blur-2xl animate-spin-slow"></div>
                  <div className="w-12 h-12 bg-black/60 border-2 border-zafkiel-gold rounded-full shadow-[0_0_30px_#FFD700] flex items-center justify-center relative z-10">
                    <Star className="w-6 h-6 text-zafkiel-gold animate-pulse fill-zafkiel-gold" />
                  </div>
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-zafkiel-gold text-black text-[8px] font-bold rounded uppercase tracking-tighter">ESSENCE</div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Side Logs (Left Floating) */}
      <div className="absolute bottom-32 left-8 w-72 z-40 hidden xl:block">
        {playerState.logs && playerState.logs.length > 0 && (
          <div className="bg-black/80 backdrop-blur-xl p-4 rounded-xl border border-zafkiel-gold/10 shadow-2xl">
            <div className="flex items-center gap-2 mb-3 border-b border-zafkiel-crimson/30 pb-2">
              <Clock className="w-4 h-4 text-zafkiel-crimson" />
              <h3 className="text-[10px] uppercase tracking-widest text-zafkiel-crimson font-bold">Temporal Audit Trail</h3>
            </div>
            <ul className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {playerState.logs.map((log) => (
                <li key={log.id} className="text-[10px] font-roman text-gray-400 flex flex-col gap-0.5 border-l-2 border-zafkiel-gold/20 pl-2">
                  <div className="flex justify-between">
                    <span className="text-zafkiel-gold font-bold">{log.action.toUpperCase()}</span>
                    <span className="text-gray-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <span className="text-[9px] opacity-40">Time deviation corrected</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Bottom HUD (Controls) */}
      <div className="w-full p-8 flex flex-col items-center z-30 bg-black/90 border-t border-zafkiel-gold/10 backdrop-blur-xl relative">
        
        {/* System Message Overlay */}
        <AnimatePresence>
          {systemMessage && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="absolute -top-12 px-6 py-2 bg-zafkiel-crimson text-white text-xs font-bold tracking-[0.3em] rounded-full shadow-[0_0_20px_rgba(220,20,60,0.8)] border border-white/20"
            >
              {systemMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-6">
          {[
            { id: 'backward', icon: Rewind, label: 'REWIND', color: 'zafkiel-crimson', cd: 5000 },
            { id: 'freeze', icon: Pause, label: 'FREEZE', color: 'zafkiel-gold', cd: 10000 },
            { id: 'forward', icon: FastForward, label: 'COLLECT', color: 'zafkiel-crimson', cd: 3000 },
            { id: 'accelerate', icon: Clock, label: 'ACCEL', color: 'zafkiel-gold', cd: 5000 }
          ].map(btn => (
            <button 
              key={btn.id}
              onClick={() => handleTimeAction(btn.id)}
              className={`flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-black to-gray-900 border transition-all duration-300 relative overflow-hidden group shadow-lg ${
                cooldowns[btn.id] > 0 
                  ? 'border-zafkiel-crimson/20 grayscale-[0.5]' 
                  : `border-${btn.color}/40 hover:border-${btn.color} hover:scale-105 active:scale-95`
              }`}
            >
              {/* Cooldown Overlay */}
              {cooldowns[btn.id] > 0 && (
                <div 
                  className="absolute bottom-0 left-0 w-full bg-zafkiel-crimson/20 transition-all duration-100 ease-linear"
                  style={{ height: `${(cooldowns[btn.id] / btn.cd) * 100}%` }}
                ></div>
              )}
              
              <btn.icon className={`w-10 h-10 mb-1 text-${btn.color} group-hover:drop-shadow-[0_0_10px_currentColor] ${btn.id === 'accelerate' && !cooldowns[btn.id] ? 'group-hover:animate-spin-slow' : ''}`} />
              <span className="text-[10px] font-bold tracking-[0.2em] text-zafkiel-gold/70 group-hover:text-zafkiel-gold relative z-10">
                {cooldowns[btn.id] > 0 ? `${(cooldowns[btn.id] / 1000).toFixed(1)}s` : btn.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Kurumi Dynamic Sprite Render */}
      <AnimatePresence>
        {kurumiSprite && (
          <motion.img 
            initial={{ opacity: 0, x: 200, rotate: 10 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={{ opacity: 0, x: 200, rotate: 10 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            src={kurumiSprite} 
            alt="Kurumi Tokisaki" 
            className="absolute bottom-24 right-0 h-[75vh] object-contain pointer-events-none drop-shadow-[0_0_50px_rgba(220,20,60,0.5)] z-50"
          />
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
             <Clock className="w-20 h-20 text-zafkiel-crimson animate-spin-slow" />
             <span className="text-zafkiel-gold font-roman tracking-[1em] animate-pulse">SHIFTING...</span>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
