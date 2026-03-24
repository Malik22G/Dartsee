import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, GamesByCategory } from './api';

const GAMES_PER_PAGE = 21;

function GamesList() {
  const [gamesByCategory, setGamesByCategory] = useState<GamesByCategory>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const data = await api.getGames();
        setGamesByCategory(data);
        // Auto-select first category
        const categories = Object.keys(data);
        if (categories.length > 0) {
          setSelectedCategory(categories[0]);
        }
      } catch (err) {
        setError('Failed to load games');
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  // Reset to page 1 when category changes or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  if (loading) return <div className="loading">Loading games...</div>;
  if (error) return <div className="error">{error}</div>;

  const categories = Object.keys(gamesByCategory);
  
  // Search across ALL categories
  const allGames = categories.flatMap(cat => 
    gamesByCategory[cat].map(game => ({ ...game, category: cat }))
  );

  // Filter games by search query across all categories
  const filteredGames = searchQuery 
    ? allGames.filter(game => game.id.toString().includes(searchQuery))
    : (selectedCategory ? gamesByCategory[selectedCategory].map(game => ({ ...game, category: selectedCategory })) : []);

  // Pagination logic
  const totalGames = filteredGames.length;
  const totalPages = Math.ceil(totalGames / GAMES_PER_PAGE);
  const startIndex = (currentPage - 1) * GAMES_PER_PAGE;
  const endIndex = startIndex + GAMES_PER_PAGE;
  const currentGames = filteredGames.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  function capitalizeFirstLetter(val: string) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
  };

  return (
    <div className="container">
      <h2>Games by Category</h2>

      <div className="category-selector">
        <div className="category-tabs">
          {categories.map(category => (
            <button
              key={category}
              className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {capitalizeFirstLetter(category)}
              <span className="category-count">({gamesByCategory[category].length})</span>
            </button>
          ))}
        </div>
      </div>

      {(selectedCategory || searchQuery) && (
        <div className="category-section">
          <div className="category-header">
            <h3>{searchQuery ? 'Search Results' : `${selectedCategory!.charAt(0).toUpperCase() + selectedCategory!.slice(1)} Games`}</h3>
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search by Game ID (across all categories)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                className="search-input"
              />
            </div>
          </div>

          {currentGames.length === 0 ? (
            <div className="no-results">
              No games found {searchQuery && `matching "${searchQuery}"`}
            </div>
          ) : (
            <div className="games-grid">
              {currentGames.map(game => (
                <Link key={game.id} to={`/games/${game.id}`} className="game-card">
                  <div className="game-header">
                    <span className="game-id">Game {game.id}</span>
                    <span className="game-type-badge">{game.category}</span>
                  </div>
                  {game.playerNames && game.playerNames.length > 0 && (
                    <div className="player-badges">
                      {game.playerNames.slice(0, 4).map((name, index) => (
                        <span key={index} className="player-badge">
                          {name}
                        </span>
                      ))}
                      {game.playerNames.length > 4 && (
                        <span className="player-badge more">+{game.playerNames.length - 4}</span>
                      )}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}

          <div className="pagination-info-bottom">
            Showing {totalGames > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, totalGames)} of {totalGames} games
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn prev"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>

              <div className="pagination-info-center">
                Page {currentPage} of {totalPages}
              </div>

              <button
                className="pagination-btn next"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GamesList;