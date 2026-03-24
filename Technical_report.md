# Dartsee Analytics - Technical Report

## Project Overview

This full-stack web application visualizes dart game data collected by the Dartsee auto-scoring system. The application provides comprehensive analytics including game listings, detailed player statistics, and interactive dartboard visualizations.

## Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Key Libraries**:
  - `pg` - PostgreSQL client
  - `cors` - Cross-origin resource sharing
  - `dotenv` - Environment configuration

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Routing**: React Router v6
- **Visualization**: Recharts (for pie charts)
- **Build Tool**: Vite
- **Styling**: Custom CSS with modern design system

## Architecture

### Backend Architecture

The backend follows a RESTful API design with the following endpoints:

1. **GET /api/games** - Returns all games grouped by category
2. **GET /api/games/:id** - Returns detailed game information with player statistics
3. **GET /api/games/:id/throws** - Returns throw data for visualization
4. **GET /api/stats/game-types** - Returns game type statistics for charts

### Frontend Architecture

The frontend is organized into modular components:

```
frontend/src/
├── App.tsx              # Main application with routing
├── GamesList.tsx        # Games list view with search and pagination
├── GameDetail.tsx       # Individual game detail view
├── DartBoard.tsx        # Interactive dartboard visualization
├── Stats.tsx            # Statistics and pie chart view
├── api.ts              # API client layer
└── styles.css          # Global styles and design system
```

## Key Technical Decisions

### 1. Average Score Per Round Calculation

**Requirement**: Calculate average score per round where one round = 3 consecutive throws.

**Implementation**:
```sql
WITH throw_rounds AS (
  SELECT
    CEIL(ROW_NUMBER() OVER (
      PARTITION BY player_id, game_id
      ORDER BY id
    ) / 3.0) AS round_num
  FROM throws
),
complete_rounds AS (
  SELECT SUM(score * modifier) AS round_score
  FROM throw_rounds
  GROUP BY game_id, player_id, round_num
  HAVING COUNT(*) = 3  -- Only complete rounds
)
SELECT AVG(round_score) AS avg_score
```

**Rationale**:
- Uses window functions to assign round numbers to consecutive throws
- Filters to only complete rounds (exactly 3 throws)
- Discards incomplete rounds to maintain accuracy
- Calculates average across complete rounds only

### 2. Miss Count Calculation

**Implementation**: `COUNT(CASE WHEN modifier = 0 THEN 1 END)`

**Rationale**: The `modifier = 0` indicates a complete miss of the dartboard, as specified in the requirements.

### 3. Separate Statistics CTE

To avoid duplicate counting issues when joining multiple tables, we separated the throw count and miss count calculations into a dedicated CTE (`player_stats`). This ensures accurate counts regardless of the number of complete rounds.

### 4. Search Functionality

**Decision**: Implement global search across all game categories.

**Rationale**: 
- Better user experience - users can find any game without knowing its category
- Searches all games in the database, not just visible ones
- Maintains category filtering for browsing

### 5. Pagination Strategy

**Implementation**: Client-side pagination with 21 games per page.

**Rationale**:
- All games are loaded once, reducing server requests
- Fast filtering and searching
- Suitable for the dataset size
- For larger datasets, server-side pagination would be recommended

## Dartboard Visualization

### Coordinate System

The dartboard visualization uses the provided X/Y coordinate data:
- **Coordinate Range**: 0-800 (both X and Y)
- **Dartboard Center**: (400, 400)
- **Dartboard Radius**: 300 pixels
- **Detection Area**: 800x800 square (includes out-of-bounds throws)

### Implementation Details

The dartboard is rendered as an SVG with:
- 20 segments (standard dartboard layout)
- Double and triple rings
- Bull and bullseye
- Throw markers plotted using actual X/Y coordinates

### Visualization Accuracy Considerations

**Important Note**: The dartboard visualization is an approximation overlay and may have minor inaccuracies:

1. **Hardware Calibration**: The visualization assumes a standard dartboard layout, but actual accuracy depends on the specific Dartsee hardware calibration used during data collection.

2. **Coordinate Mapping**: While we use the provided 800x800 coordinate system with a 300-pixel radius, the exact physical dimensions of the hardware dartboard may vary.

3. **Segment Boundaries**: The visual segment boundaries are calculated mathematically and may not perfectly align with the physical dartboard segments if the hardware has slight calibration differences.

4. **Recommendation**: For production use with exact accuracy requirements, the visualization should be calibrated against the specific hardware unit's dimensions and coordinate mapping.

Despite these considerations, the visualization provides a highly useful and intuitive representation of throw patterns and accuracy.

### Bonus Features

1. **Fullscreen Dartboard View**: Allows users to see throw patterns in detail
2. **Multi-Player Visualization**: Color-coded throws when viewing all players
3. **Interactive Tooltips**: Hover over throws to see detailed information
4. **Round-by-Round Breakdown**: Tabular view of throws grouped by rounds
5. **Statistics Dashboard**: Quick stats (total throws, misses, best throw)

## Design System

### Color Palette

Primary color: `#65558f` (Purple)
- Used consistently across buttons, badges, links, and accents
- Provides a modern, professional appearance
- Good contrast for accessibility

### UI/UX Decisions

1. **Category Tabs**: Visual grouping of games by type
2. **Card-Based Layout**: Clean, scannable game cards
3. **Responsive Design**: Mobile-friendly layouts
4. **Loading States**: Clear feedback during data fetching
5. **Error Handling**: User-friendly error messages

## Database Schema

The application uses the provided schema with four main tables:

- **games**: Game metadata (id, type)
- **players**: Player information (id, name)
- **game_players**: Many-to-many relationship between games and players
- **throws**: Individual throw data (score, modifier, x, y coordinates)

## Performance Considerations

1. **Query Optimization**: 
   - Uses CTEs for complex calculations
   - Indexes on foreign keys (recommended for production)
   - Efficient window functions for round calculations

2. **Frontend Optimization**:
   - Component-level state management
   - Efficient re-rendering with React hooks
   - SVG-based dartboard for smooth rendering

3. **Data Loading**:
   - Lazy loading of throw data (only when player is selected)
   - Pagination to limit DOM elements
   - Efficient filtering and searching

## Setup and Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Backend Setup
```bash
cd backend
npm install
# Configure .env file with database credentials
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Database Setup
```bash
psql -U postgres -d darts_analytics -f schema.sql
psql -U postgres -d darts_analytics -f data.sql
```

## API Documentation

### GET /api/games
Returns all games grouped by category.

**Response**:
```json
{
  "x01": [
    {
      "id": 1000,
      "type": "x01",
      "playerCount": 2,
      "hasThrows": true,
      "playerNames": ["Alice", "Bob"]
    }
  ]
}
```

### GET /api/games/:id
Returns detailed game information with player statistics.

**Response**:
```json
{
  "id": 1000,
  "type": "x01",
  "players": [
    {
      "id": "player1",
      "name": "Alice",
      "averageScorePerRound": 45.5,
      "missCount": 2,
      "throwCount": 30
    }
  ]
}
```

### GET /api/games/:id/throws?playerId=...
Returns throw data for visualization. Optional `playerId` parameter filters to specific player.

**Response**:
```json
[
  {
    "id": 1,
    "score": 20,
    "modifier": 3,
    "points": 60,
    "x": 450,
    "y": 380,
    "playerId": "player1",
    "playerName": "Alice"
  }
]
```

### GET /api/stats/game-types
Returns game type statistics for pie chart.

**Response**:
```json
[
  {
    "type": "x01",
    "count": 15
  }
]
```

## Testing Recommendations

For production deployment, the following testing should be implemented:

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test API endpoints with test database
3. **E2E Tests**: Test complete user flows
4. **Performance Tests**: Verify query performance with large datasets
5. **Accessibility Tests**: Ensure WCAG compliance

---

**Author**: Abdul Basit 
