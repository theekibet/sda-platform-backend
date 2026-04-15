// src/components/auth/AnimatedCharacter.jsx
import { useState, useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════
   SVG Definitions for Gradients and Filters
═══════════════════════════════════════════════════════════ */
function CharacterSVGDefs() {
  return (
    <defs>
      {/* Skin gradients */}
      <radialGradient id="rg-skin" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#fdba74" />
        <stop offset="60%" stopColor="#fb923c" />
        <stop offset="100%" stopColor="#ea580c" />
      </radialGradient>
      
      <radialGradient id="rg-skin-light" cx="40%" cy="30%" r="60%">
        <stop offset="0%" stopColor="#fed7aa" />
        <stop offset="100%" stopColor="#fdba74" />
      </radialGradient>

      {/* Hair gradient */}
      <linearGradient id="lg-hair" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#451a03" />
        <stop offset="50%" stopColor="#78350f" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>

      {/* Eye gradients */}
      <radialGradient id="rg-eye" cx="35%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#1e40af" />
      </radialGradient>

      <radialGradient id="rg-pupil" cx="35%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#1e3a8a" />
        <stop offset="100%" stopColor="#0f172a" />
      </radialGradient>

      {/* Clothing gradients */}
      <linearGradient id="lg-robe" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef3c7" />
        <stop offset="50%" stopColor="#fde68a" />
        <stop offset="100%" stopColor="#fbbf24" />
      </linearGradient>

      <linearGradient id="lg-robe-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>

      <linearGradient id="lg-sash" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#dc2626" />
        <stop offset="50%" stopColor="#b91c1c" />
        <stop offset="100%" stopColor="#991b1b" />
      </linearGradient>

      {/* Staff gradient */}
      <linearGradient id="lg-staff" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#a16207" />
        <stop offset="50%" stopColor="#ca8a04" />
        <stop offset="100%" stopColor="#a16207" />
      </linearGradient>

      {/* Heart for success */}
      <radialGradient id="rg-heart" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#fda4af" />
        <stop offset="100%" stopColor="#fb7185" />
      </radialGradient>

      {/* Halo glow */}
      <radialGradient id="rg-halo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.8" />
        <stop offset="50%" stopColor="#fcd34d" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
      </radialGradient>

      {/* Filters */}
      <filter id="f-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#92400e" floodOpacity="0.3" />
      </filter>

      <filter id="f-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#fbbf24" floodOpacity="0.6" />
      </filter>

      <filter id="f-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
        <feOffset dx="0" dy="2" result="offsetblur" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.3" />
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
   Main Animated Shepherd Character Component
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
  const specLRef = useRef(null);
  const specRRef = useRef(null);
  const headRef = useRef(null);
  const staffRef = useRef(null);
  const armLRef = useRef(null);
  const armRRef = useRef(null);

  const [blinkState, setBlinkState] = useState(0);
  const [staffGlow, setStaffGlow] = useState(0);
  const [heartBeat, setHeartBeat] = useState(1);
  const [headTilt, setHeadTilt] = useState(0);

  const isHiding = mode === 'hiding';
  const isSuccess = mode === 'success';
  const isError = mode === 'error';
  const isThinking = mode === 'thinking';
  const isCelebrating = mode === 'celebrating';

  // Track cursor/touch for eye movement
  const trackEyes = (cx, cy) => {
    if (!svgRef.current || isHiding) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 160 / rect.width;
    const scaleY = 180 / rect.height;

    const calc = (baseCX, baseCY) => {
      const dx = (cx - rect.left) * scaleX - baseCX;
      const dy = (cy - rect.top) * scaleY - baseCY;
      const angle = Math.atan2(dy, dx);
      const dist = Math.min(Math.hypot(dx, dy) * 0.06, 2.5);
      return { 
        x: baseCX + dist * Math.cos(angle), 
        y: baseCY + dist * Math.sin(angle) 
      };
    };

    const applyEye = (pupilRef, irisRef, specRef, pos) => {
      pupilRef.current?.setAttribute('cx', pos.x);
      pupilRef.current?.setAttribute('cy', pos.y);
      irisRef.current?.setAttribute('cx', pos.x);
      irisRef.current?.setAttribute('cy', pos.y);
      specRef.current?.setAttribute('cx', pos.x + 1.5);
      specRef.current?.setAttribute('cy', pos.y - 1.5);
    };

    applyEye(pupilLRef, irisLRef, specLRef, calc(68, 58));
    applyEye(pupilRRef, irisRRef, specRRef, calc(92, 58));
  };

  // Mouse/touch tracking
  useEffect(() => {
    if (isHiding) return;
    const onMove = e => trackEyes(e.clientX, e.clientY);
    const onTouch = e => trackEyes(e.touches[0].clientX, e.touches[0].clientY);
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
    trackEyes(r.left + r.width / 2, r.top + r.height / 2);
  }, [focusedField, isHiding]);

  // Random eye movement when idle
  useEffect(() => {
    if (isHiding || focusedField || isSuccess || isError) return;
    const id = setInterval(() => {
      trackEyes(
        window.innerWidth * (0.3 + Math.random() * 0.4),
        window.innerHeight * (0.3 + Math.random() * 0.4)
      );
    }, 3500);
    return () => clearInterval(id);
  }, [focusedField, isHiding, isSuccess, isError]);

  // Blinking animation
  useEffect(() => {
    if (isHiding) return;
    const blink = () => {
      setBlinkState(1);
      setTimeout(() => setBlinkState(0), 150);
    };
    const schedule = () => {
      const delay = 2500 + Math.random() * 4000;
      return setTimeout(() => {
        blink();
        timer = schedule();
      }, delay);
    };
    let timer = schedule();
    return () => clearTimeout(timer);
  }, [isHiding]);

  // Staff glow animation for thinking
  useEffect(() => {
    if (!isThinking) {
      setStaffGlow(0);
      return;
    }
    const id = setInterval(() => {
      setStaffGlow(prev => (prev === 0 ? 1 : 0));
    }, 800);
    return () => clearInterval(id);
  }, [isThinking]);

  // Heart beat for success
  useEffect(() => {
    if (!isSuccess) {
      setHeartBeat(1);
      return;
    }
    const id = setInterval(() => {
      setHeartBeat(prev => (prev === 1 ? 1.15 : 1));
    }, 600);
    return () => clearInterval(id);
  }, [isSuccess]);

  // Head tilt based on mode
  useEffect(() => {
    if (isThinking) {
      setHeadTilt(-8);
    } else if (isError) {
      setHeadTilt(5);
    } else if (isCelebrating) {
      setHeadTilt(-5);
    } else {
      setHeadTilt(0);
    }
  }, [isThinking, isError, isCelebrating]);

  // Determine animation class
  const svgAnimClass = isCelebrating
    ? 'animate-bounce-slow'
    : isSuccess
    ? 'animate-pulse-slow'
    : isError
    ? 'animate-wiggle'
    : isThinking
    ? 'animate-float'
    : 'animate-float';

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
        width="160"
        height="180"
        viewBox="0 0 160 180"
        style={{
          filter: 'drop-shadow(0 6px 16px rgba(146, 64, 14, 0.25))',
        }}
      >
        <CharacterSVGDefs />

        {/* Background glow/halo */}
        <ellipse 
          cx="80" 
          cy="90" 
          rx="55" 
          ry="45" 
          fill="url(#rg-halo)" 
          opacity={isSuccess || isCelebrating ? 0.8 : 0.4}
          style={{ transition: 'opacity 0.5s' }}
        />

        {/* Staff (behind body) */}
        <g
          ref={staffRef}
          style={{
            transformOrigin: '125px 100px',
            transform: isThinking ? 'rotate(-5deg)' : isCelebrating ? 'rotate(-15deg)' : 'rotate(0deg)',
            transition: 'transform 0.5s ease-out',
          }}
        >
          <rect x="123" y="35" width="4" height="110" rx="2" fill="url(#lg-staff)" filter="url(#f-shadow)" />
          <path 
            d="M125 35 Q125 20 135 22 Q140 23 140 28 Q140 33 135 32 Q129 31 129 35" 
            fill="none" 
            stroke="url(#lg-staff)" 
            strokeWidth="4" 
            strokeLinecap="round"
          />
          <circle 
            cx="135" 
            cy="28" 
            r="8" 
            fill="#fbbf24" 
            opacity={staffGlow * 0.6}
            style={{ transition: 'opacity 0.3s' }}
            filter="url(#f-glow)"
          />
        </g>

        {/* Body/Robe */}
        <ellipse 
          cx="80" 
          cy="115" 
          rx="35" 
          ry="40" 
          fill="url(#lg-robe)" 
          filter="url(#f-soft-shadow)"
        />
        
        <path d="M60 90 Q70 110 65 140" fill="none" stroke="url(#lg-robe-shadow)" strokeWidth="2" opacity="0.5" />
        <path d="M100 90 Q90 110 95 140" fill="none" stroke="url(#lg-robe-shadow)" strokeWidth="2" opacity="0.5" />
        <path d="M80 85 Q80 110 80 145" fill="none" stroke="url(#lg-robe-shadow)" strokeWidth="1.5" opacity="0.4" />

        {/* Sash */}
        <path 
          d="M52 100 Q80 115 108 100 L105 110 Q80 125 55 110 Z" 
          fill="url(#lg-sash)" 
          filter="url(#f-shadow)"
        />

        {/* Left Arm */}
        <g
          ref={armLRef}
          style={{
            transformOrigin: '50px 95px',
            transform: isHiding ? 'rotate(140deg)' : isThinking ? 'rotate(-20deg)' : isCelebrating ? 'rotate(-160deg)' : 'rotate(0deg)',
            transition: 'transform 0.5s ease-out',
          }}
        >
          <ellipse cx="45" cy="105" rx="10" ry="25" fill="url(#lg-robe)" filter="url(#f-soft-shadow)" />
          <circle cx="42" cy="125" r="7" fill="url(#rg-skin)" />
          {isHiding && (
            <>
              <ellipse cx="38" cy="122" rx="2" ry="4" fill="url(#rg-skin)" />
              <ellipse cx="42" cy="120" rx="2" ry="4" fill="url(#rg-skin)" />
              <ellipse cx="46" cy="122" rx="2" ry="4" fill="url(#rg-skin)" />
            </>
          )}
        </g>

        {/* Right Arm */}
        <g
          ref={armRRef}
          style={{
            transformOrigin: '110px 95px',
            transform: isHiding ? 'rotate(-140deg)' : isCelebrating ? 'rotate(160deg)' : 'rotate(0deg)',
            transition: 'transform 0.5s ease-out',
          }}
        >
          <ellipse cx="115" cy="105" rx="10" ry="25" fill="url(#lg-robe)" filter="url(#f-soft-shadow)" />
          <circle cx="118" cy="125" r="7" fill="url(#rg-skin)" />
        </g>

        {/* Head Group */}
        <g
          ref={headRef}
          style={{
            transformOrigin: '80px 85px',
            transform: `rotate(${headTilt}deg)`,
            transition: 'transform 0.5s ease-out',
          }}
        >
          <rect x="73" y="78" width="14" height="12" fill="url(#rg-skin)" />
          <ellipse cx="80" cy="65" rx="22" ry="26" fill="url(#rg-skin)" filter="url(#f-soft-shadow)" />

          {/* Hair */}
          <path 
            d="M58 55 Q60 35 80 32 Q100 35 102 55 Q105 65 100 70 Q102 60 98 50 Q95 40 80 38 Q65 40 62 50 Q58 60 60 70 Q55 65 58 55Z" 
            fill="url(#lg-hair)" 
            filter="url(#f-shadow)"
          />
          <path d="M65 42 Q70 38 75 42" fill="none" stroke="#92400e" strokeWidth="1" opacity="0.5" />
          <path d="M85 42 Q90 38 95 42" fill="none" stroke="#92400e" strokeWidth="1" opacity="0.5" />

          {/* Beard */}
          <path 
            d="M62 75 Q65 95 80 100 Q95 95 98 75 Q95 85 80 88 Q65 85 62 75Z" 
            fill="url(#lg-hair)" 
            opacity="0.9"
            filter="url(#f-soft-shadow)"
          />

          <ellipse cx="58" cy="65" rx="4" ry="6" fill="url(#rg-skin)" />
          <ellipse cx="102" cy="65" rx="4" ry="6" fill="url(#rg-skin)" />

          {/* Eyes - normal state */}
          {!isHiding && (
            <g>
              <ellipse cx="68" cy="58" rx="7" ry="8" fill="white" stroke="#fed7aa" strokeWidth="0.8" />
              <ellipse ref={irisLRef} cx="68" cy="58" rx="4.5" ry="5" fill="url(#rg-eye)" />
              <ellipse ref={pupilLRef} cx="68" cy="58" rx="2.5" ry="3" fill="url(#rg-pupil)" />
              <ellipse ref={specLRef} cx="69.5" cy="56.5" rx="1.2" ry="0.8" fill="white" opacity="0.9" />
              
              <ellipse cx="92" cy="58" rx="7" ry="8" fill="white" stroke="#fed7aa" strokeWidth="0.8" />
              <ellipse ref={irisRRef} cx="92" cy="58" rx="4.5" ry="5" fill="url(#rg-eye)" />
              <ellipse ref={pupilRRef} cx="92" cy="58" rx="2.5" ry="3" fill="url(#rg-pupil)" />
              <ellipse ref={specRRef} cx="93.5" cy="56.5" rx="1.2" ry="0.8" fill="white" opacity="0.9" />

              <path 
                d={`M61 58 Q68 ${58 - blinkState * 8} 75 58`}
                fill="#fdba74"
                stroke="none"
                style={{ transition: 'all 0.1s' }}
              />
              <path 
                d={`M85 58 Q92 ${58 - blinkState * 8} 99 58`}
                fill="#fdba74"
                stroke="none"
                style={{ transition: 'all 0.1s' }}
              />
            </g>
          )}

          {/* Eyes - hiding */}
          {isHiding && (
            <g>
              <path d="M61 58 Q68 54 75 58" fill="none" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
              <path d="M85 58 Q92 54 99 58" fill="none" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
              <ellipse cx="62" cy="68" rx="6" ry="3" fill="#fda4af" opacity="0.6" />
              <ellipse cx="98" cy="68" rx="6" ry="3" fill="#fda4af" opacity="0.6" />
            </g>
          )}

          {/* Eyebrows */}
          <path 
            d={isThinking ? "M62 50 Q68 47 74 50" : isError ? "M62 52 Q68 48 74 52" : "M62 50 Q68 52 74 50"}
            fill="none" 
            stroke="#78350f" 
            strokeWidth="2" 
            strokeLinecap="round"
            style={{ transition: 'all 0.3s' }}
          />
          <path 
            d={isThinking ? "M86 50 Q92 47 98 50" : isError ? "M86 52 Q92 48 98 52" : "M86 50 Q92 52 98 50"}
            fill="none" 
            stroke="#78350f" 
            strokeWidth="2" 
            strokeLinecap="round"
            style={{ transition: 'all 0.3s' }}
          />

          {/* Nose */}
          <path d="M80 62 L78 70 L82 70 Z" fill="#ea580c" opacity="0.6" />
          <ellipse cx="80" cy="70" rx="3" ry="2" fill="#fb923c" opacity="0.8" />

          {/* Mouth */}
          <path 
            d={isSuccess || isCelebrating ? "M72 78 Q80 88 88 78" : isError ? "M75 82 Q80 78 85 82" : isThinking ? "M75 80 Q80 82 85 80" : "M72 80 Q80 85 88 80"}
            fill={isSuccess || isCelebrating ? "#fda4af" : "none"}
            stroke="#78350f" 
            strokeWidth="1.5" 
            strokeLinecap="round"
            style={{ transition: 'all 0.3s' }}
          />

          {/* Heart eyes for success */}
          {isSuccess && (
            <g>
              <path
                d="M64 55 Q66 52 68 55 Q68 59 66 62 Q64 59 64 55Z"
                fill="url(#rg-heart)"
                style={{ transformOrigin: '66px 58px', transform: `scale(${heartBeat})`, transition: 'transform 0.3s' }}
              />
              <path
                d="M88 55 Q90 52 92 55 Q92 59 90 62 Q88 59 88 55Z"
                fill="url(#rg-heart)"
                style={{ transformOrigin: '90px 58px', transform: `scale(${heartBeat})`, transition: 'transform 0.3s' }}
              />
            </g>
          )}
        </g>

        {/* Sweat drop - error state */}
        {isError && (
          <g className="animate-bounce" style={{ animationDuration: '0.8s' }}>
            <ellipse cx="110" cy="45" rx="5" ry="7" fill="#bae6fd" />
            <polygon points="105,45 115,45 110,35" fill="#bae6fd" />
            <ellipse cx="108" cy="43" rx="1.5" ry="1.2" fill="white" opacity="0.7" />
          </g>
        )}

        {/* Thinking indicator */}
        {isThinking && (
          <g className="animate-pulse">
            <text x="115" y="35" fontSize="20" fill="#fbbf24" fontWeight="bold" fontFamily="sans-serif">?</text>
          </g>
        )}

        {/* Sparkles for celebration */}
        {(isCelebrating || isSuccess) && (
          <g>
            <path d="M25 50 L26 53 L29 52 L26 55 L28 58 L25 56 L22 58 L24 55 L21 52 L24 53 Z" 
              fill="#fbbf24" 
              className="animate-spin" 
              style={{ animationDuration: '2s', transformOrigin: '25px 54px' }}
            />
            <path d="M135 45 L136 48 L139 47 L136 50 L138 53 L135 51 L132 53 L134 50 L131 47 L134 48 Z" 
              fill="#fb7185" 
              className="animate-spin" 
              style={{ animationDuration: '2.5s', animationDelay: '0.3s', transformOrigin: '135px 49px' }}
            />
            <circle cx="30" cy="80" r="3" fill="#60a5fa" className="animate-pulse" />
            <circle cx="130" cy="85" r="2.5" fill="#34d399" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
          </g>
        )}

        {/* Confetti for celebration */}
        {isCelebrating && (
          <g>
            <rect x="20" y="40" width="6" height="6" fill="#fbbf24" transform="rotate(15 23 43)" className="animate-float" />
            <rect x="140" y="55" width="5" height="5" fill="#fb7185" transform="rotate(-20 142 57)" className="animate-float" style={{ animationDelay: '0.1s' }} />
            <circle cx="25" cy="95" r="4" fill="#60a5fa" className="animate-float" style={{ animationDelay: '0.2s' }} />
            <circle cx="135" cy="100" r="3" fill="#34d399" className="animate-float" style={{ animationDelay: '0.3s' }} />
          </g>
        )}
      </svg>
    </div>
  );
}