import React, { useRef, useState, useCallback, useMemo } from 'react';
import gsap from 'gsap';
import logoImg from '../assets/logo.png';
import flywheelRing from '../assets/Flywheel-Ring.png';
import stopperImg from '../assets/Stopper.png';

// Configuration constants
const WHEEL_CONFIG = {
  CENTER: 365,
  RADIUS: 310,
  LABEL_RADIUS: 200,
  GAP_SIZE: 0.5,
  MIN_ROTATION: 1800,
  MAX_ROTATION: 3600,
  SPIN_DURATION: 5,
  INDICATOR_OFFSET: 40, 
} as const;

// Wheel segments configuration
const wheelSegments = [
  { id: 1, label: '100 $GPU', color: '#2C2C2C' },
  { id: 2, label: '50 $GPU', color: '#3A3A3A' },
  { id: 3, label: '300 GXP', color: '#2C2C2C' },
  { id: 4, label: '1 Lootbox', color: '#3A3A3A' },
  { id: 5, label: '1$ dApp Credits', color: '#2C2C2C' },
  { id: 6, label: 'Mini Quest Booster', color: '#3A3A3A' },
  { id: 7, label: 'Retry Spin', color: '#2C2C2C' },
  { id: 8, label: '5 $GPU', color: '#3A3A3A' },
  { id: 9, label: 'Better luck next time', color: '#2C2C2C' },
] as const;

const LuckyWheel: React.FC = () => {
  const wheelRef = useRef<SVGGElement>(null);
  const indicatorRef = useRef<SVGGElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const segmentAngle = 360 / wheelSegments.length;

  // Memoize segment data calculations to avoid recalculating on every render
  const segmentData = useMemo(() => {
    return wheelSegments.map((segment, index) => {
      // Generate SVG path for each segment (40° for 9 segments)
      const startAngle = index * segmentAngle - 90 + WHEEL_CONFIG.GAP_SIZE / 2;
      const endAngle = (index + 1) * segmentAngle - 90 - WHEEL_CONFIG.GAP_SIZE / 2;
      
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      const x1 = WHEEL_CONFIG.CENTER + WHEEL_CONFIG.RADIUS * Math.cos(startRad);
      const y1 = WHEEL_CONFIG.CENTER + WHEEL_CONFIG.RADIUS * Math.sin(startRad);
      const x2 = WHEEL_CONFIG.CENTER + WHEEL_CONFIG.RADIUS * Math.cos(endRad);
      const y2 = WHEEL_CONFIG.CENTER + WHEEL_CONFIG.RADIUS * Math.sin(endRad);
      
      const pathData = `M${WHEEL_CONFIG.CENTER},${WHEEL_CONFIG.CENTER} L${x1},${y1} A${WHEEL_CONFIG.RADIUS},${WHEEL_CONFIG.RADIUS} 0 0,1 ${x2},${y2} Z`;
      
      // Calculate text position and rotation
      const angle = index * segmentAngle + segmentAngle / 2;
      const angleRad = (angle - 90) * (Math.PI / 180);
      const textX = WHEEL_CONFIG.CENTER + WHEEL_CONFIG.LABEL_RADIUS * Math.cos(angleRad);
      const textY = WHEEL_CONFIG.CENTER + WHEEL_CONFIG.LABEL_RADIUS * Math.sin(angleRad);
      
      // Split long text into multiple lines
      const words = segment.label.split(' ');
      const lines = words.length > 2
        ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')]
        : [segment.label];
      
      return {
        segment,
        pathData,
        textX,
        textY,
        angle: angle + 90,
        lines,
      };
    });
  }, [segmentAngle]);

  const startSpin = useCallback(() => {
    if (isSpinning || !wheelRef.current || !indicatorRef.current) return;

    setIsSpinning(true);

    const rotationCurrent = gsap.getProperty(wheelRef.current, 'rotation') as number;
    const rotationNext = rotationCurrent + gsap.utils.random(WHEEL_CONFIG.MIN_ROTATION, WHEEL_CONFIG.MAX_ROTATION);
    
    // Calculate which segment will be selected
    const finalRotation = rotationNext % 360;
    const adjustedAngle = (WHEEL_CONFIG.INDICATOR_OFFSET - finalRotation + segmentAngle / 2 + 360) % 360;
    const selectedIndex = Math.floor(adjustedAngle / segmentAngle) % wheelSegments.length;
    const selectedSegment = wheelSegments[selectedIndex];

    // Indicator animation
    const indicatorTimeline = gsap.timeline();
    let rotationLast = rotationCurrent;

    indicatorTimeline
      .to(indicatorRef.current, {
        duration: 0.13,
        rotation: -10,
        transformOrigin: '65% 36%',
      })
      .to(indicatorRef.current, {
        duration: 0.13,
        rotation: 3,
        ease: 'power4',
      });

    // Wheel spin animation
    gsap.to(wheelRef.current, {
      duration: WHEEL_CONFIG.SPIN_DURATION,
      rotation: rotationNext,
      transformOrigin: '50% 50%',
      ease: 'power4.out',
      onUpdate: () => {
        if (!wheelRef.current) return;
        
        const currentRotation = Math.round(gsap.getProperty(wheelRef.current, 'rotation') as number);
        const tolerance = currentRotation - rotationLast;

        // Trigger indicator animation on each segment pass
        if (Math.round(currentRotation) % segmentAngle <= Math.abs(tolerance)) {
          if (indicatorTimeline.progress() > 0.2 || indicatorTimeline.progress() === 0) {
            indicatorTimeline.play(0);
          }
        }
        rotationLast = currentRotation;
      },
      onComplete: () => {
        setIsSpinning(false);
        console.log('Selected:', selectedSegment);
        // Show alert popup
        alert(`🎉 You won: ${selectedSegment.label}! 🎉`);
      },
    });
  }, [isSpinning, segmentAngle]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-white">
      {/* Wheel Container */}
      <div className="relative w-full max-w-[90vw] md:max-w-[1100px] lg:max-w-[1400px] xl:max-w-[1700px] aspect-square">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="-50 -50 830 830"
          className="w-full h-full"
        >
          {/* Static Flywheel Ring Border */}
          <image
            href={flywheelRing}
            x="-35"
            y="-35"
            width="800"
            height="800"
            transform="rotate(51 365 365)"
            style={{ pointerEvents: 'none' }}
          />

          {/* Main Wheel Group */}
          <g ref={wheelRef} className="wheel">

            {/* Wheel Segments */}
            <g className="sectors">
              {segmentData.map(({ segment, pathData, textX, textY, angle, lines }) => (
                <g key={segment.id}>
                  <path
                    id={`segment_${segment.id}`}
                    d={pathData}
                    fill={segment.color}
                    stroke="#FF8C00"
                    strokeWidth="5"
                  />
                  <text
                    x={textX}
                    y={textY}
                    fill="#FF8C00"
                    fontSize="16"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${angle} ${textX} ${textY})`}
                    style={{ 
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontFamily: 'Arial, sans-serif',
                    }}
                  >
                    {lines.map((line, i) => (
                      <tspan
                        key={i}
                        x={textX}
                        dy={i === 0 ? 0 : 18}
                        style={{
                          textShadow: '0 0 10px rgba(255, 140, 0, 0.8)'
                        }}
                      >
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              ))}
            </g>

            {/* Center Circle */}
            <g>
              <g opacity="0.3">
                <circle cx="368.5" cy="368.5" r="54.5" fill="#000" />
              </g>
              <g className="wheel_middle">
                <circle cx="365" cy="365" r="54.5" fill="#1a1a1a" stroke="#FF8C00" strokeWidth="3" />
              </g>
              <circle cx="365" cy="365" r="25" fill="none" stroke="#FF8C00" strokeWidth="3" />
              <circle cx="365" cy="365" r="15" fill="none" stroke="#FF8C00" strokeWidth="2" />
            </g>
          </g>

          {/* Logo in center - Fixed (doesn't rotate) */}
          <image
            href={logoImg}
            x="315"
            y="315"
            width="100"
            height="100"
            style={{
              filter: 'drop-shadow(0 0 5px rgba(255, 140, 0, 0.8))'
            }}
          />

          {/* Shadow Effect */}
          <g opacity="0.15">
            <path
              d="M46.9,372.5c0-181.7,147.4-329,329.1-329A327.3,327.3,0,0,1,556.3,97.2,327.3,327.3,0,0,0,365,35.9C183.3,35.9,35.9,183.3,35.9,365c0,115.2,59.2,216.5,148.8,275.3C101.3,580.6,46.9,482.9,46.9,372.5Z"
              fill="#000"
            />
          </g>

          {/* Indicator/Stopper - Static Image */}
          <g ref={indicatorRef} className="current">
            <image
              href={stopperImg}
              x="500"
              y="40"
              width="200"
              height="200"
              transform="rotate(40 600 200)"
            />
          </g>
        </svg>
      </div>

      {/* Spin Button */}
      <button
        onClick={startSpin}
        disabled={isSpinning}
        className="mt-8 px-12 py-4 text-xl font-bold rounded-full shadow-lg transition-all duration-300"
        style={{
          background: isSpinning ? '#555' : '#FF8C00',
          color: isSpinning ? '#999' : '#1a1a1a',
          boxShadow: isSpinning ? 'none' : '0 0 20px rgba(255, 140, 0, 0.6)',
          cursor: isSpinning ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={(e) => {
          if (!isSpinning) {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 140, 0, 0.9)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSpinning) {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 140, 0, 0.6)';
          }
        }}
      >
        {isSpinning ? 'SPINNING...' : 'SPIN THE WHEEL!'}
      </button>

    </div>
  );
};

export default LuckyWheel;