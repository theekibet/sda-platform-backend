// src/components/auth/AnimatedCharacter.jsx
import { useState, useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════
   SVG Definitions for Gradients and Filters
═══════════════════════════════════════════════════════════ */
function CharacterSVGDefs() {
  return (
    <defs>
      {/* Background glow */}
      <radialGradient id="rg-bgGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#e0e7ff" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#e0e7ff" stopOpacity="0" />
      </radialGradient>

      {/* Body gradients */}
      <radialGradient id="rg-body" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="60%" stopColor="#f0f4ff" />
        <stop offset="100%" stopColor="#dde5f9" />
      </radialGradient>

      <radialGradient id="rg-head" cx="38%" cy="30%" r="60%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="70%" stopColor="#eef2ff" />
        <stop offset="100%" stopColor="#d6dffa" />
      </radialGradient>

      {/* Wing gradient */}
      <radialGradient id="rg-wing" cx="30%" cy="25%" r="70%">
        <stop offset="0%" stopColor="#f8faff" />
        <stop offset="50%" stopColor="#e8eeff" />
        <stop offset="100%" stopColor="#c7d2fe" />
      </radialGradient>

      {/* Eye gradients */}
      <radialGradient id="rg-iris" cx="30%" cy="30%" r="60%">
        <stop offset="0%" stopColor="#818cf8" />
        <stop offset="100%" stopColor="#4338ca" />
      </radialGradient>

      <radialGradient id="rg-pupil" cx="35%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#4f46e5" />
        <stop offset="55%" stopColor="#1e1b4b" />
        <stop offset="100%" stopColor="#0f0e1a" />
      </radialGradient>

      {/* Beak gradient */}
      <radialGradient id="rg-beak" cx="30%" cy="20%" r="70%">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="100%" stopColor="#d97706" />
      </radialGradient>

      {/* Heart gradient for love mode */}
      <radialGradient id="rg-heart" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#fda4af" />
        <stop offset="100%" stopColor="#fb7185" />
      </radialGradient>

      {/* Filters */}
      <filter id="f-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#a5b4fc" floodOpacity="0.35" />
      </filter>

      <filter id="f-eyeGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#818cf8" floodOpacity="0.5" />
      </filter>

      <filter id="f-3d-effect" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
        <feOffset dx="0" dy="4" result="offsetblur" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.5" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Animated Character Component
   Props:
   - mode: 'watching' | 'hiding' | 'success' | 'error' | 'thinking' | 'celebrating'
   - focusedField: ID of currently focused input
   - message: Optional speech bubble text
═══════════════════════════════════════════════════════════ */
export default function AnimatedCharacter({ 
  mode = 'watching', 
  focusedField = null,
  message = null 
}) {
  const svgRef = useRef(null);
  const pupilLRef = useRef(null);
  const pupilRRef = useRef(null);
  const irisLRef = useRef(null);
  const irisRRef = useRef(null);
  const specL1Ref = useRef(null);
  const specR1Ref = useRef(null);
  const specL2Ref = useRef(null);
  const specR2Ref = useRef(null);
  const lidLRef = useRef(null);
  const lidRRef = useRef(null);

  const [wingPosition, setWingPosition] = useState(0);
  const [heartBeat, setHeartBeat] = useState(1);

  const isHiding = mode === 'hiding';
  const isSuccess = mode === 'success';
  const isError = mode === 'error';
  const isThinking = mode === 'thinking';
  const isCelebrating = mode === 'celebrating';

  // Track cursor/touch for eye movement
  const trackPupil = (cx, cy) => {
    if (!svgRef.current || isHiding) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 140 / rect.width;
    const scaleY = 130 / rect.height;

    const calc = (baseCX, baseCY) => {
      const dx = (cx - rect.left) * scaleX - baseCX;
      const dy = (cy - rect.top) * scaleY - baseCY;
      const angle = Math.atan2(dy, dx);
      const dist = Math.min(Math.hypot(dx, dy) * 0.08, 2.2);
      return { 
        x: baseCX + dist * Math.cos(angle), 
        y: baseCY + dist * Math.sin(angle) 
      };
    };

    const applyEye = (pupilRef, irisRef, s1Ref, s2Ref, pos) => {
      pupilRef.current?.setAttribute('cx', pos.x);
      pupilRef.current?.setAttribute('cy', pos.y);
      irisRef.current?.setAttribute('cx', pos.x);
      irisRef.current?.setAttribute('cy', pos.y);
      s1Ref.current?.setAttribute('cx', pos.x + 1.2);
      s1Ref.current?.setAttribute('cy', pos.y - 1.2);
      s2Ref.current?.setAttribute('cx', pos.x - 1.0);
      s2Ref.current?.setAttribute('cy', pos.y + 1.4);
    };

    applyEye(pupilLRef, irisLRef, specL1Ref, specL2Ref, calc(63, 40));
    applyEye(pupilRRef, irisRRef, specR1Ref, specR2Ref, calc(77, 40));
  };

  // Mouse/touch tracking
  useEffect(() => {
    if (isHiding) return;
    const onMove = e => trackPupil(e.clientX, e.clientY);
    const onTouch = e => trackPupil(e.touches[0].clientX, e.touches[0].clientY);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onTouch, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onTouch);
    };
  }, [isHiding]);

  // Focus field tracking
  useEffect(() => {
    if (!focusedField || isHiding) return;
    const el = document.getElementById(focusedField);
    if (!el) return;
    const r = el.getBoundingClientRect();
    trackPupil(r.left + r.width / 2, r.top + r.height / 2);
  }, [focusedField, isHiding]);

  // Random eye movement when idle
  useEffect(() => {
    if (isHiding || focusedField || isSuccess || isError) return;
    const id = setInterval(() => {
      trackPupil(
        window.innerWidth * (0.25 + Math.random() * 0.5),
        window.innerHeight * (0.25 + Math.random() * 0.5)
      );
    }, 3200);
    return () => clearInterval(id);
  }, [focusedField, isHiding, isSuccess, isError]);

  // Blinking animation
  useEffect(() => {
    if (isHiding) return;
    const blink = () => {
      if (!lidLRef.current) return;
      lidLRef.current.style.transform = 'scaleY(1)';
      lidRRef.current.style.transform = 'scaleY(1)';
      setTimeout(() => {
        if (!lidLRef.current) return;
        lidLRef.current.style.transform = 'scaleY(0)';
        lidRRef.current.style.transform = 'scaleY(0)';
      }, 130);
    };
    const schedule = () => {
      const delay = 2200 + Math.random() * 3500;
      return setTimeout(() => {
        blink();
        timer = schedule();
      }, delay);
    };
    let timer = schedule();
    return () => clearTimeout(timer);
  }, [isHiding]);

  // Wing flapping animation
  useEffect(() => {
    if (!isCelebrating && !isSuccess) return;
    const id = setInterval(() => {
      setWingPosition(prev => (prev === 0 ? 1 : 0));
    }, 300);
    return () => clearInterval(id);
  }, [isCelebrating, isSuccess]);

  // Heart beat animation for success
  useEffect(() => {
    if (!isSuccess) return;
    const id = setInterval(() => {
      setHeartBeat(prev => (prev === 1 ? 1.2 : 1));
    }, 600);
    return () => clearInterval(id);
  }, [isSuccess]);

  // Determine overall animation class
  const svgAnimClass = isCelebrating
    ? 'animate-bounce-slow'
    : isSuccess
    ? 'animate-pulse-slow'
    : isError
    ? 'animate-wiggle'
    : isThinking
    ? 'animate-float'
    : 'animate-float';

  // Wing rotation based on state
  const wingRotation = isCelebrating || isSuccess 
    ? wingPosition * 15 
    : 0;

  return (
    <div className="flex flex-col items-center gap-3 mb-6">
      {/* Speech bubble */}
      {message && (
        <div className="relative bg-white border-2 border-primary-300 rounded-2xl px-4 py-2 shadow-lg max-w-xs animate-float">
          <p className="text-sm text-gray-700 font-medium text-center">{message}</p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b-2 border-r-2 border-primary-300 rotate-45" />
        </div>
      )}

      {/* Character SVG */}
      <svg
        ref={svgRef}
        className={`${svgAnimClass} transition-all duration-300`}
        width="140"
        height="130"
        viewBox="0 0 140 130"
        style={{
          filter: 'drop-shadow(0 4px 12px rgba(102, 126, 234, 0.3))',
          transform: isThinking ? 'rotate(-5deg)' : 'rotate(0deg)',
        }}
      >
        <CharacterSVGDefs />

        {/* Ambient glow */}
        <ellipse cx="70" cy="75" rx="46" ry="30" fill="url(#rg-bgGlow)" />

        {/* Halo */}
        <ellipse
          cx="70"
          cy="18"
          rx="18"
          ry="5.5"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="2"
          strokeDasharray="7 4"
          strokeLinecap="round"
          opacity={isSuccess ? 1 : 0.7}
          style={{ transition: 'opacity 0.3s' }}
        />
        <ellipse
          cx="70"
          cy="18"
          rx="14"
          ry="3.5"
          fill="none"
          stroke="#fde68a"
          strokeWidth="0.8"
          strokeDasharray="3 6"
          opacity="0.5"
        />

        {/* Confetti particles for celebration */}
        {isCelebrating && (
          <g className="animate-spin-slow">
            <circle cx="30" cy="30" r="3" fill="#fbbf24" opacity="0.8" />
            <circle cx="110" cy="35" r="2.5" fill="#fb7185" opacity="0.8" />
            <circle cx="25" cy="70" r="2" fill="#818cf8" opacity="0.8" />
            <circle cx="115" cy="65" r="3" fill="#34d399" opacity="0.8" />
          </g>
        )}

        {/* Left wing */}
        <g
          style={{
            transformOrigin: '58px 58px',
            transform: `rotate(${-wingRotation}deg)`,
            transition: 'transform 0.3s ease-in-out',
          }}
        >
          <path
            d="M58 58 Q34 44 22 32 Q28 50 36 62 Q44 72 52 70Z"
            fill="url(#rg-wing)"
            stroke="#c7d2fe"
            strokeWidth="0.8"
            filter="url(#f-3d-effect)"
          />
          <path d="M52 68 Q38 55 26 38" fill="none" stroke="#a5b4fc" strokeWidth="0.7" opacity="0.8" />
          <path d="M50 65 Q37 52 28 42" fill="none" stroke="#a5b4fc" strokeWidth="0.5" opacity="0.6" />
          <path d="M48 62 Q38 50 30 45" fill="none" stroke="#a5b4fc" strokeWidth="0.5" opacity="0.5" />
        </g>

        {/* Right wing */}
        <g
          style={{
            transformOrigin: '82px 58px',
            transform: `rotate(${wingRotation}deg)`,
            transition: 'transform 0.3s ease-in-out',
          }}
        >
          <path
            d="M82 58 Q106 44 118 32 Q112 50 104 62 Q96 72 88 70Z"
            fill="url(#rg-wing)"
            stroke="#c7d2fe"
            strokeWidth="0.8"
            filter="url(#f-3d-effect)"
          />
          <path d="M88 68 Q102 55 114 38" fill="none" stroke="#a5b4fc" strokeWidth="0.7" opacity="0.8" />
          <path d="M90 65 Q103 52 112 42" fill="none" stroke="#a5b4fc" strokeWidth="0.5" opacity="0.6" />
          <path d="M92 62 Q102 50 110 45" fill="none" stroke="#a5b4fc" strokeWidth="0.5" opacity="0.5" />
        </g>

        {/* Body */}
        <ellipse
          cx="70"
          cy="68"
          rx="18"
          ry="22"
          fill="url(#rg-body)"
          stroke="#dde5f9"
          strokeWidth="1"
          filter="url(#f-shadow)"
        />

        {/* Body details */}
        <path d="M58 68 Q70 72 82 68" fill="none" stroke="#e8eeff" strokeWidth="1" opacity="0.7" />
        <path d="M60 74 Q70 77 80 74" fill="none" stroke="#e8eeff" strokeWidth="0.8" opacity="0.6" />

        {/* Head */}
        <ellipse
          cx="70"
          cy="40"
          rx="16"
          ry="18"
          fill="url(#rg-head)"
          stroke="#d6dffa"
          strokeWidth="1"
          filter="url(#f-shadow)"
        />

        {/* Eyes - normal state */}
        {!isHiding && (
          <g>
            {/* Left eye */}
            <ellipse cx="63" cy="40" rx="6" ry="7" fill="white" stroke="#c7d2fe" strokeWidth="0.8" />
            <ellipse
              ref={irisLRef}
              cx="63"
              cy="40"
              rx="4"
              ry="5"
              fill="url(#rg-iris)"
              filter="url(#f-eyeGlow)"
            />
            <ellipse ref={pupilLRef} cx="63" cy="40" rx="2.2" ry="2.8" fill="url(#rg-pupil)" />
            <ellipse ref={specL1Ref} cx="64.2" cy="38.8" rx="0.8" ry="0.6" fill="white" opacity="0.85" />
            <ellipse ref={specL2Ref} cx="62" cy="41.5" rx="0.5" ry="0.4" fill="white" opacity="0.60" />
            <path
              ref={lidLRef}
              d="M57 38 Q63 33 69 38"
              fill="#f0f4ff"
              stroke="#dde5f9"
              strokeWidth="0.5"
              style={{ transformOrigin: '63px 38px', transform: 'scaleY(0)' }}
            />

            {/* Right eye */}
            <ellipse cx="77" cy="40" rx="6" ry="7" fill="white" stroke="#c7d2fe" strokeWidth="0.8" />
            <ellipse
              ref={irisRRef}
              cx="77"
              cy="40"
              rx="4"
              ry="5"
              fill="url(#rg-iris)"
              filter="url(#f-eyeGlow)"
            />
            <ellipse ref={pupilRRef} cx="77" cy="40" rx="2.2" ry="2.8" fill="url(#rg-pupil)" />
            <ellipse ref={specR1Ref} cx="78.2" cy="38.8" rx="0.8" ry="0.6" fill="white" opacity="0.85" />
            <ellipse ref={specR2Ref} cx="76" cy="41.5" rx="0.5" ry="0.4" fill="white" opacity="0.60" />
            <path
              ref={lidRRef}
              d="M71 38 Q77 33 83 38"
              fill="#f0f4ff"
              stroke="#dde5f9"
              strokeWidth="0.5"
              style={{ transformOrigin: '77px 38px', transform: 'scaleY(0)' }}
            />
          </g>
        )}

        {/* Eyes - hiding (closed with wings) */}
        {isHiding && (
          <g>
            <path d="M57 40 Q63 36 69 40" fill="none" stroke="#4338ca" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M71 40 Q77 36 83 40" fill="none" stroke="#4338ca" strokeWidth="1.5" strokeLinecap="round" />
            {/* Wing emojis */}
            <text x="55" y="43" fontSize="12" style={{ userSelect: 'none' }}>🪶</text>
            <text x="75" y="43" fontSize="12" style={{ userSelect: 'none' }}>🪶</text>
          </g>
        )}

        {/* Beak */}
        <path
          d="M66 47 Q70 44 74 47 Q72 52 70 54 Q68 52 66 47Z"
          fill="url(#rg-beak)"
          stroke="#d97706"
          strokeWidth="0.6"
        />
        <path
          d="M67 50 Q70 53 73 50 Q71 55 70 56 Q69 55 67 50Z"
          fill="#fcd34d"
          stroke="#d97706"
          strokeWidth="0.5"
        />

        {/* Blush cheeks */}
        <ellipse
          cx="57"
          cy="46"
          rx="7"
          ry="4"
          fill="#fda4af"
          opacity={isSuccess || isHiding ? 0.85 : 0}
          style={{ transition: 'opacity 0.4s' }}
        />
        <ellipse
          cx="83"
          cy="46"
          rx="7"
          ry="4"
          fill="#fda4af"
          opacity={isSuccess || isHiding ? 0.85 : 0}
          style={{ transition: 'opacity 0.4s' }}
        />

        {/* Heart eyes for success */}
        {isSuccess && (
          <g>
            <path
              d="M61 37 Q63 35 65 37 Q65 40 63 42 Q61 40 61 37Z"
              fill="url(#rg-heart)"
              style={{
                transformOrigin: '63px 39px',
                transform: `scale(${heartBeat})`,
                transition: 'transform 0.3s',
              }}
            />
            <path
              d="M75 37 Q77 35 79 37 Q79 40 77 42 Q75 40 75 37Z"
              fill="url(#rg-heart)"
              style={{
                transformOrigin: '77px 39px',
                transform: `scale(${heartBeat})`,
                transition: 'transform 0.3s',
              }}
            />
          </g>
        )}

        {/* Sweat drop - error state */}
        {isError && (
          <g className="animate-bounce">
            <ellipse cx="94" cy="28" rx="4" ry="5.5" fill="#bae6fd" />
            <polygon points="90,28 98,28 94,20" fill="#bae6fd" />
            <ellipse cx="92.5" cy="26" rx="1.2" ry="1" fill="white" opacity="0.7" />
          </g>
        )}

        {/* Thinking indicator - three dots */}
        {isThinking && (
          <g className="animate-pulse">
            <circle cx="64" cy="85" r="2" fill="#818cf8" />
            <circle cx="70" cy="85" r="2" fill="#818cf8" />
            <circle cx="76" cy="85" r="2" fill="#818cf8" />
          </g>
        )}

        {/* Sparkles for celebration */}
        {(isCelebrating || isSuccess) && (
          <g>
            <path d="M25 45 L26 47 L28 46 L26 48 L28 49 L26 49 L25 51 L24 49 L22 49 L24 48 L22 46 L24 47 Z" 
              fill="#fbbf24" 
              className="animate-pulse" 
            />
            <path d="M115 50 L116 52 L118 51 L116 53 L118 54 L116 54 L115 56 L114 54 L112 54 L114 53 L112 51 L114 52 Z" 
              fill="#fb7185" 
              className="animate-pulse" 
              style={{ animationDelay: '0.2s' }}
            />
          </g>
        )}
      </svg>
    </div>
  );
}