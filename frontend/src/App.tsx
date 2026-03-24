import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import GamesList from './GamesList';
import GameDetail from './GameDetail';
import Stats from './Stats';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="nav">
          <div className="nav-container">
            <h1 className="nav-title">Darts Analytics</h1>
            <div className="nav-links">
              <Link to="/games" className="nav-link">Games</Link>
              <Link to="/stats" className="nav-link">Stats</Link>
            </div>
          </div>
        </nav>

        <main className="main">
          <Routes>
            <Route path="/" element={<Navigate to="/games" replace />} />
            <Route path="/games" element={<GamesList />} />
            <Route path="/games/:id" element={<GameDetail />} />
            <Route path="/stats" element={<Stats />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;