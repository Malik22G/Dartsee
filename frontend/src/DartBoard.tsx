import { Throw } from './api';
import { useState } from 'react';

interface DartBoardProps {
  throws: Throw[];
  playerName: string;
  showAllPlayers?: boolean;
}

interface TooltipData {
  throwNumber: number;
  points: number;
  x: number;
  y: number;
  visible: boolean;
  playerName?: string;
}

const BOARD_SIZE = 800;
const CENTER = 400;
// Dartboard with radius 300 (matching Dartsee system exactly)
const OUTER_RING = 300;        // Outer edge (radius 300)
const DOUBLE_OUTER = 300;      // Outer edge of double ring
const DOUBLE_INNER = 280;      // Inner edge of double ring
const TRIPLE_OUTER = 188;      // Outer edge of triple ring
const TRIPLE_INNER = 173;      // Inner edge of triple ring
const BULL_OUTER = 25;         // Outer bull
const BULL_INNER = 10;         // Inner bull

const segments = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

function polarToCartesian(angle: number, radius: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

function createSegmentPath(startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) {
  const start1 = polarToCartesian(startAngle, outerRadius);
  const end1 = polarToCartesian(endAngle, outerRadius);
  const start2 = polarToCartesian(endAngle, innerRadius);
  const end2 = polarToCartesian(startAngle, innerRadius);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${start1.x} ${start1.y} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${end1.x} ${end1.y} L ${start2.x} ${start2.y} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${end2.x} ${end2.y} Z`;
}

const PLAYER_COLORS = [
  '#4F46E5', // Indigo
  '#22C55E', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#10B981', // Emerald
];

function DartBoard({ throws, playerName, showAllPlayers = false }: DartBoardProps) {
  const [currentRound, setCurrentRound] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [tooltip, setTooltip] = useState<TooltipData>({
    throwNumber: 0,
    points: 0,
    x: 0,
    y: 0,
    visible: false,
    playerName: undefined
  });

  // Get unique players and assign colors
  const uniquePlayers = showAllPlayers
    ? Array.from(new Set(throws.map(t => t.playerName).filter(Boolean)))
    : [];

  const playerColorMap = new Map(
    uniquePlayers.map((name, index) => [name, PLAYER_COLORS[index % PLAYER_COLORS.length]])
  );

  const convertCoordinates = (x: number, y: number) => {
    // Direct 1:1 mapping - no scaling needed
    // Coordinates are already in 800x800 space
    return { x, y };
  };

  const isWithinBoard = (x: number, y: number) => {
    const { x: scaledX, y: scaledY } = convertCoordinates(x, y);
    const distance = Math.sqrt(
      Math.pow(scaledX - CENTER, 2) + Math.pow(scaledY - CENTER, 2)
    );
    return distance <= OUTER_RING;
  };

  const getThrowColor = (throw_: Throw) => {
    // If showing all players, use player-specific colors
    if (showAllPlayers && throw_.playerName) {
      return playerColorMap.get(throw_.playerName) || '#64748B';
    }
    // Otherwise, miss: red, hit: green
    return throw_.modifier === 0 ? '#EF4444' : '#22C55E';
  };

  const getThrowPosition = (throw_: Throw) => {
    // If we have valid x,y coordinates, use them
    if (throw_.x && throw_.y) {
      return convertCoordinates(throw_.x, throw_.y);
    }

    // Otherwise, place based on score and modifier
    // This ensures throws appear in the correct scoring zone
    const score = throw_.score;
    const modifier = throw_.modifier;

    // Find which segment this score belongs to
    const segmentIndex = segments.indexOf(score);
    const angle = segmentIndex >= 0 ? segmentIndex * 18 : Math.random() * 360;

    // Determine radius based on modifier
    let radius;
    if (modifier === 0) {
      // Miss - outside the board
      radius = OUTER_RING + 20;
    } else if (modifier === 1) {
      // Single - between triple and double, or inner area
      radius = (TRIPLE_INNER + DOUBLE_INNER) / 2;
    } else if (modifier === 2) {
      // Double ring
      radius = (DOUBLE_INNER + DOUBLE_OUTER) / 2;
    } else if (modifier === 3) {
      // Triple ring
      radius = (TRIPLE_INNER + TRIPLE_OUTER) / 2;
    } else {
      // Bull (25 or 50)
      radius = score === 50 ? BULL_INNER : (BULL_INNER + BULL_OUTER) / 2;
    }

    // Add slight randomness to avoid overlapping dots
    const randomOffset = (Math.random() - 0.5) * 8;
    const finalRadius = radius + randomOffset;
    const randomAngle = angle + (Math.random() - 0.5) * 5;

    const pos = polarToCartesian(randomAngle, finalRadius);
    return { x: pos.x, y: pos.y };
  };

  const handleMouseEnter = (event: React.MouseEvent<SVGCircleElement>, throwNumber: number, points: number, playerName?: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const svgRect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();

    if (svgRect) {
      setTooltip({
        throwNumber,
        points,
        x: rect.left - svgRect.left + rect.width / 2,
        y: rect.top - svgRect.top,
        visible: true,
        playerName
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  return (
    <div className="dartboard-container">
      <div className="dartboard-header">
        <h4>{playerName}'s Throw Pattern</h4>
        <div className="dartboard-header-actions">
          <button
            className="fullscreen-btn"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
          >
            {isFullscreen ? '✕' : '⛶'}
          </button>
          <div className="throw-legend">
            {showAllPlayers ? (
              uniquePlayers.map(player => (
                <div key={player} className="legend-item">
                  <div
                    className="legend-dot"
                    style={{ background: playerColorMap.get(player) }}
                  ></div>
                  <span>{player}</span>
                </div>
              ))
            ) : (
              <>
                <div className="legend-item">
                  <div className="legend-dot miss"></div>
                  <span>Miss</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot hit"></div>
                  <span>Hit</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={`dartboard-wrapper ${isFullscreen ? 'fullscreen' : ''}`}>
        {isFullscreen && (
          <button
            className="fullscreen-close-btn"
            onClick={() => setIsFullscreen(false)}
          >
            ✕ Close
          </button>
        )}
        <div className="dartboard-svg-container">
          <svg viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`} className="dartboard-svg">
            {/* Outer background */}
            <circle cx={CENTER} cy={CENTER} r={OUTER_RING + 5} fill="#1a1a1a" />

            {/* Segments */}
            {segments.map((num, i) => {
              const startAngle = i * 18 - 9;
              const endAngle = startAngle + 18;
              const isBlack = i % 2 === 0;

              return (
                <g key={num}>
                  {/* Main segment */}
                  <path
                    d={createSegmentPath(startAngle, endAngle, BULL_OUTER, DOUBLE_INNER)}
                    fill={isBlack ? '#2d3748' : '#f7fafc'}
                    stroke="#1a1a1a"
                    strokeWidth="1"
                  />

                  {/* Double ring */}
                  <path
                    d={createSegmentPath(startAngle, endAngle, DOUBLE_INNER, DOUBLE_OUTER)}
                    fill={isBlack ? '#22C55E' : '#EF4444'}
                    stroke="#1a1a1a"
                    strokeWidth="1.5"
                  />

                  {/* Triple ring */}
                  <path
                    d={createSegmentPath(startAngle, endAngle, TRIPLE_INNER, TRIPLE_OUTER)}
                    fill={isBlack ? '#22C55E' : '#EF4444'}
                    stroke="#1a1a1a"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}

            {/* Bull */}
            <circle cx={CENTER} cy={CENTER} r={BULL_OUTER} fill="#22C55E" stroke="#1a1a1a" strokeWidth="1" />
            <circle cx={CENTER} cy={CENTER} r={BULL_INNER} fill="#EF4444" />

            {/* Segment numbers */}
            {segments.map((num, i) => {
              const angle = i * 18;
              const pos = polarToCartesian(angle, OUTER_RING + 18);
              return (
                <text
                  key={`num-${num}`}
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#0F172A"
                  fontSize="24"
                  fontWeight="bold"
                >
                  {num}
                </text>
              );
            })}

            {/* Throw markers */}
            {throws.map((throw_, index) => {
              const { x: scaledX, y: scaledY } = getThrowPosition(throw_);
              const withinBoard = throw_.modifier !== 0;

              return (
                <circle
                  key={throw_.id}
                  cx={scaledX}
                  cy={scaledY}
                  r={5}
                  fill={getThrowColor(throw_)}
                  stroke="white"
                  strokeWidth="2"
                  opacity={withinBoard ? 1 : 0.7}
                  className="throw-dot"
                  onMouseEnter={(e) => handleMouseEnter(e, index + 1, throw_.points, throw_.playerName)}
                  onMouseLeave={handleMouseLeave}
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))' }}
                />
              );
            })}
          </svg>

          {tooltip.visible && (
            <div
              className="throw-tooltip"
              style={{
                left: `${tooltip.x}px`,
                top: `${tooltip.y - 10}px`
              }}
            >
              <div className="tooltip-content">
                {tooltip.playerName && <span className="tooltip-label">{tooltip.playerName}</span>}
                <span className="tooltip-label">Throw #{tooltip.throwNumber}</span>
                <span className="tooltip-points">{tooltip.points} pts</span>
              </div>
            </div>
          )}
        </div>

        <div className="dartboard-stats">
          <div className="stat-item">
            <span className="stat-label">Total Throws:</span>
            <span className="stat-value">{throws.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">On Board:</span>
            <span className="stat-value">
              {throws.filter(t => isWithinBoard(t.x, t.y)).length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Misses:</span>
            <span className="stat-value">
              {throws.filter(t => t.modifier === 0).length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Best Throw:</span>
            <span className="stat-value">
              {throws.length > 0 ? Math.max(...throws.map(t => t.points)) : '0'}
            </span>
          </div>
        </div>

        {/* Rounds Table */}
        {throws.length > 0 && !showAllPlayers && (
          <div className="rounds-table-container">
            <h4>Rounds Breakdown</h4>
            <table className="rounds-table">
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Throw 1</th>
                  <th>Throw 2</th>
                  <th>Throw 3</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: Math.ceil(throws.length / 3) }, (_, roundIndex) => {
                  const roundThrows = throws.slice(roundIndex * 3, roundIndex * 3 + 3);
                  const roundTotal = roundThrows.reduce((sum, t) => sum + t.points, 0);

                  return (
                    <tr key={roundIndex}>
                      <td className="round-number">{roundIndex + 1}</td>
                      <td>{roundThrows[0]?.points ?? '-'}</td>
                      <td>{roundThrows[1]?.points ?? '-'}</td>
                      <td>{roundThrows[2]?.points ?? '-'}</td>
                      <td className="round-total">{roundTotal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* All Players Rounds Table with Pagination */}
        {throws.length > 0 && showAllPlayers && (() => {
          // Group throws by player
          const throwsByPlayer = new Map<string, Throw[]>();
          throws.forEach(t => {
            if (t.playerName) {
              if (!throwsByPlayer.has(t.playerName)) {
                throwsByPlayer.set(t.playerName, []);
              }
              throwsByPlayer.get(t.playerName)!.push(t);
            }
          });

          // Calculate max rounds across all players
          const maxRounds = Math.max(
            ...Array.from(throwsByPlayer.values()).map(playerThrows =>
              Math.ceil(playerThrows.length / 3)
            )
          );

          const handlePrevRound = () => setCurrentRound(prev => Math.max(1, prev - 1));
          const handleNextRound = () => setCurrentRound(prev => Math.min(maxRounds, prev + 1));

          return (
            <div className="rounds-table-container">
              <div className="rounds-header">
                <h4>Round {currentRound} of {maxRounds}</h4>
                <div className="round-navigation">
                  <button
                    className="round-nav-btn"
                    onClick={handlePrevRound}
                    disabled={currentRound === 1}
                  >
                    ← Prev
                  </button>
                  <button
                    className="round-nav-btn"
                    onClick={handleNextRound}
                    disabled={currentRound === maxRounds}
                  >
                    Next →
                  </button>
                </div>
              </div>
              <table className="rounds-table all-players">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Throw 1</th>
                    <th>Throw 2</th>
                    <th>Throw 3</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(throwsByPlayer.entries()).map(([playerName, playerThrows]) => {
                    const roundIndex = currentRound - 1;
                    const roundThrows = playerThrows.slice(roundIndex * 3, roundIndex * 3 + 3);
                    const roundTotal = roundThrows.reduce((sum, t) => sum + t.points, 0);

                    return (
                      <tr key={playerName}>
                        <td className="player-name-cell">
                          <div className="player-name-badge">
                            <div
                              className="player-color-dot"
                              style={{ background: playerColorMap.get(playerName) }}
                            ></div>
                            {playerName}
                          </div>
                        </td>
                        <td>{roundThrows[0]?.points ?? '-'}</td>
                        <td>{roundThrows[1]?.points ?? '-'}</td>
                        <td>{roundThrows[2]?.points ?? '-'}</td>
                        <td className="round-total">{roundTotal || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default DartBoard;