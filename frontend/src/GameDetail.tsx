import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, GameDetail as GameDetailType, Throw } from './api';
import DartBoard from './DartBoard';

function GameDetail() {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<GameDetailType | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [throws, setThrows] = useState<Throw[]>([]);
  const [loading, setLoading] = useState(true);
  const [throwsLoading, setThrowsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGame = async () => {
      if (!id) return;

      try {
        const data = await api.getGame(parseInt(id));
        setGame(data);
        setError(null);
      } catch (err: any) {
        if (err.message && err.message.includes('404')) {
          setError('Game does not exist');
        } else {
          setError('Failed to load game details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [id]);

  const handlePlayerSelect = async (playerId: string) => {
    if (!id || !game) return;

    setSelectedPlayer(playerId);
    setThrowsLoading(true);

    try {
      const throwsData = playerId === 'all'
        ? await api.getGameThrows(game.id)
        : await api.getGameThrows(game.id, playerId);
      setThrows(throwsData);
    } catch (err) {
      console.error('Failed to load throws');
    } finally {
      setThrowsLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading game details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!game) return <div className="error">Game not found</div>;

  const selectedPlayerData = game.players.find(p => p.id === selectedPlayer);

  return (
    <div className="container">
      <div className="breadcrumb">
        <Link to="/games">← Back to Games</Link>
      </div>

      <div className="game-detail-header">
        <h2>Game {game.id}</h2>
        <span className="game-type-badge">{game.type}</span>
      </div>

      <div className="players-section">
        <h3>Players</h3>
        {game.players.length === 0 ? (
          <p className="no-players-message">No players registered for this game.</p>
        ) : (
          <div className="players-grid">
            {game.players.map(player => (
              <div key={player.id} className="player-card">
                <h4>{player.name}</h4>
                <div className="player-stats">
                  <div className="stat">
                    <span className="stat-label">Avg Score/Round</span>
                    <span className="stat-value">{player.averageScorePerRound}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Misses</span>
                    <span className="stat-value">{player.missCount}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Total Throws</span>
                    <span className="stat-value">{player.throwCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {game.players.length > 0 && (
        <div className="throws-section">
          <h3>Throws by Player</h3>
          <div className="player-selector">
            <select
              value={selectedPlayer || ''}
              onChange={(e) => handlePlayerSelect(e.target.value)}
            >
              <option value="">Select a player...</option>
              {game.players.length > 1 && (
                <option value="all">All Players</option>
              )}
              {game.players.map(player => (
                <option key={player.id} value={player.id}>{player.name}</option>
              ))}
            </select>
          </div>

          {selectedPlayer && (
            <div className="throws-container">
              <div className="throws-header">
                <h4>{selectedPlayer === 'all' ? 'All Players' : selectedPlayerData?.name}'s Throws</h4>
                <span className="throws-count">Total: {throws.length} throws</span>
              </div>

              {throwsLoading ? (
                <div className="loading">Loading throws...</div>
              ) : throws.length === 0 ? (
                <div className="no-throws-message">
                  <p>No throw data recorded {selectedPlayer === 'all' ? 'for this game' : `for ${selectedPlayerData?.name} in this game`}.</p>
                </div>
              ) : (
                <DartBoard
                  throws={throws}
                  playerName={selectedPlayer === 'all' ? 'All Players' : selectedPlayerData?.name || ''}
                  showAllPlayers={selectedPlayer === 'all'}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GameDetail;