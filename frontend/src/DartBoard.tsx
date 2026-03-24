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
const OUTER_RING = 300;
const DOUBLE_INNER = 280;
const TRIPLE_OUTER = 188;
const TRIPLE_INNER = 173;
const BULL_OUTER = 25;
const BULL_INNER = 10;

const segments = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

const PLAYER_COLORS = [
  '#4F46E5', '#22C55E', '#F59E0B', '#8B5CF6', '#06B6D4', '#EC4899', '#10B981',
];

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

function DartBoard({ throws, playerName, showAllPlayers = false }: DartBoardProps) {
  const [currentRound, setCurrentRound] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipData>({
    throwNumber: 0, points: 0, x: 0, y: 0, visible: false,
  });

  const uniquePlayers = showAllPlayers
    ? Array.from(new Set(throws.map(t => t.playerName).filter(Boolean)))
    : [];

  const playerColorMap = new Map(
    uniquePlayers.map((name, i) => [name, PLAYER_COLORS[i % PLAYER_COLORS.length]])
  );

  const getThrowColor = (throw_: Throw) => {
    if (showAllPlayers && throw_.playerName) return playerColorMap.get(throw_.playerName) || '#64748B';
    return throw_.modifier === 0 ? '#EF4444' : '#22C55E';
  };

  const getThrowPosition = (throw_: Throw) => {
    if (throw_.x && throw_.y) return { x: throw_.x, y: throw_.y };

    const segmentIndex = segments.indexOf(throw_.score);
    const angle = segmentIndex >= 0 ? segmentIndex * 18 : Math.random() * 360;

    let radius;
    if (throw_.modifier === 0) radius = OUTER_RING + 20;
    else if (throw_.modifier === 2) radius = (DOUBLE_INNER + OUTER_RING) / 2;
    else if (throw_.modifier === 3) radius = (TRIPLE_INNER + TRIPLE_OUTER) / 2;
    else radius = throw_.score === 50 ? BULL_INNER : throw_.score === 25 ? (BULL_INNER + BULL_OUTER) / 2 : (TRIPLE_INNER + DOUBLE_INNER) / 2;

    const pos = polarToCartesian(angle, radius);
    return { x: pos.x, y: pos.y };
  };

  const handleMouseEnter = (e: React.MouseEvent<SVGCircleElement>, throwNumber: number, points: number, playerName?: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgRect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (svgRect) {
      setTooltip({ throwNumber, points, x: rect.left - svgRect.left + rect.width / 2, y: rect.top - svgRect.top, visible: true, playerName });
    }
  };

  const handleMouseLeave = () => setTooltip(prev => ({ ...prev, visible: false }));

  return (
    <div className="dartboard-container">
      <div className="dartboard-header">
        <h4>{playerName}'s Throw Pattern</h4>
        <div className="dartboard-header-actions">
          <button className="fullscreen-btn" onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}>
            {isFullscreen ? '✕' : '⛶'}
          </button>
          <div className="throw-legend">
            {showAllPlayers ? (
              uniquePlayers.map(player => (
                <div key={player} className="legend-item">
                  <div className="legend-dot" style={{ background: playerColorMap.get(player) }}></div>
                  <span>{player}</span>
                </div>
              ))
            ) : (
              <>
                <div className="legend-item"><div className="legend-dot miss"></div><span>Miss</span></div>
                <div className="legend-item"><div className="legend-dot hit"></div><span>Hit</span></div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={`dartboard-wrapper ${isFullscreen ? 'fullscreen' : ''}`}>
        {isFullscreen && (
          <button className="fullscreen-close-btn" onClick={() => setIsFullscreen(false)}>✕ Close</button>
        )}
        <div className="dartboard-svg-container">
          <svg viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`} className="dartboard-svg">
            <circle cx={CENTER} cy={CENTER} r={OUTER_RING + 5} fill="#1a1a1a" />

            {segments.map((num, i) => {
              const startAngle = i * 18 - 9;
              const endAngle = startAngle + 18;
              const isBlack = i % 2 === 0;
              return (
                <g key={num}>
                  <path d={createSegmentPath(startAngle, endAngle, BULL_OUTER, DOUBLE_INNER)} fill={isBlack ? '#2d3748' : '#f7fafc'} stroke="#1a1a1a" strokeWidth="1" />
                  <path d={createSegmentPath(startAngle, endAngle, DOUBLE_INNER, OUTER_RING)} fill={isBlack ? '#22C55E' : '#EF4444'} stroke="#1a1a1a" strokeWidth="1.5" />
                  <path d={createSegmentPath(startAngle, endAngle, TRIPLE_INNER, TRIPLE_OUTER)} fill={isBlack ? '#22C55E' : '#EF4444'} stroke="#1a1a1a" strokeWidth="1.5" />
                </g>
              );
            })}

            <circle cx={CENTER} cy={CENTER} r={BULL_OUTER} fill="#22C55E" stroke="#1a1a1a" strokeWidth="1" />
            <circle cx={CENTER} cy={CENTER} r={BULL_INNER} fill="#EF4444" />

            {segments.map((num, i) => {
              const pos = polarToCartesian(i * 18, OUTER_RING + 18);
              return (
                <text key={`num-${num}`} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fill="#0F172A" fontSize="24" fontWeight="bold">
                  {num}
                </text>
              );
            })}

            {throws.map((throw_, index) => {
              const { x, y } = getThrowPosition(throw_);
              return (
                <circle
                  key={throw_.id}
                  cx={x} cy={y} r={5}
                  fill={getThrowColor(throw_)}
                  stroke="white" strokeWidth="2"
                  opacity={throw_.modifier !== 0 ? 1 : 0.7}
                  className="throw-dot"
                  onMouseEnter={e => handleMouseEnter(e, index + 1, throw_.points, throw_.playerName)}
                  onMouseLeave={handleMouseLeave}
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
                />
              );
            })}
          </svg>

          {tooltip.visible && (
            <div className="throw-tooltip" style={{ left: `${tooltip.x}px`, top: `${tooltip.y - 10}px` }}>
              <div className="tooltip-content">
                {tooltip.playerName && <span className="tooltip-label">{tooltip.playerName}</span>}
                <span className="tooltip-label">Throw #{tooltip.throwNumber}</span>
                <span className="tooltip-points">{tooltip.points} pts</span>
              </div>
            </div>
          )}
        </div>

        <div className="dartboard-stats">
          <div className="stat-item"><span className="stat-label">Total Throws:</span><span className="stat-value">{throws.length}</span></div>
          <div className="stat-item"><span className="stat-label">On Board:</span><span className="stat-value">{throws.filter(t => t.modifier !== 0).length}</span></div>
          <div className="stat-item"><span className="stat-label">Misses:</span><span className="stat-value">{throws.filter(t => t.modifier === 0).length}</span></div>
          <div className="stat-item"><span className="stat-label">Best Throw:</span><span className="stat-value">{throws.length > 0 ? Math.max(...throws.map(t => t.points)) : 0}</span></div>
        </div>

        {throws.length > 0 && !showAllPlayers && (
          <div className="rounds-table-container">
            <h4>Rounds Breakdown</h4>
            <table className="rounds-table">
              <thead>
                <tr><th>Round</th><th>Throw 1</th><th>Throw 2</th><th>Throw 3</th><th>Total</th></tr>
              </thead>
              <tbody>
                {Array.from({ length: Math.ceil(throws.length / 3) }, (_, i) => {
                  const roundThrows = throws.slice(i * 3, i * 3 + 3);
                  return (
                    <tr key={i}>
                      <td className="round-number">{i + 1}</td>
                      <td>{roundThrows[0]?.points ?? '-'}</td>
                      <td>{roundThrows[1]?.points ?? '-'}</td>
                      <td>{roundThrows[2]?.points ?? '-'}</td>
                      <td className="round-total">{roundThrows.reduce((s, t) => s + t.points, 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {throws.length > 0 && showAllPlayers && (() => {
          const throwsByPlayer = new Map<string, Throw[]>();
          throws.forEach(t => {
            if (t.playerName) {
              if (!throwsByPlayer.has(t.playerName)) throwsByPlayer.set(t.playerName, []);
              throwsByPlayer.get(t.playerName)!.push(t);
            }
          });

          const maxRounds = Math.max(...Array.from(throwsByPlayer.values()).map(pt => Math.ceil(pt.length / 3)));

          return (
            <div className="rounds-table-container">
              <div className="rounds-header">
                <h4>Round {currentRound} of {maxRounds}</h4>
                <div className="round-navigation">
                  <button className="round-nav-btn" onClick={() => setCurrentRound(p => Math.max(1, p - 1))} disabled={currentRound === 1}>← Prev</button>
                  <button className="round-nav-btn" onClick={() => setCurrentRound(p => Math.min(maxRounds, p + 1))} disabled={currentRound === maxRounds}>Next →</button>
                </div>
              </div>
              <table className="rounds-table all-players">
                <thead>
                  <tr><th>Player</th><th>Throw 1</th><th>Throw 2</th><th>Throw 3</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {Array.from(throwsByPlayer.entries()).map(([name, playerThrows]) => {
                    const roundThrows = playerThrows.slice((currentRound - 1) * 3, (currentRound - 1) * 3 + 3);
                    return (
                      <tr key={name}>
                        <td className="player-name-cell">
                          <div className="player-name-badge">
                            <div className="player-color-dot" style={{ background: playerColorMap.get(name) }}></div>
                            {name}
                          </div>
                        </td>
                        <td>{roundThrows[0]?.points ?? '-'}</td>
                        <td>{roundThrows[1]?.points ?? '-'}</td>
                        <td>{roundThrows[2]?.points ?? '-'}</td>
                        <td className="round-total">{roundThrows.reduce((s, t) => s + t.points, 0) || '-'}</td>
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
