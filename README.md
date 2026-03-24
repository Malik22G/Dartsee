# Dartsee Analytics - Full-Stack Web Application

A comprehensive full-stack web application for visualizing and analyzing dart game data collected by the Dartsee auto-scoring system. Features interactive dartboard visualizations, player statistics, and game analytics.

**Live Demo**: [https://dartsee.vercel.app](https://dartsee.vercel.app)

> **Note**: The backend is hosted on Render's free tier, which spins down after inactivity. The first load may take 30–60 seconds for data to appear after that it works fine.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Key Implementation Details](#key-implementation-details)

## Features

### Core Features (Required)

#### 1. Games List View
- Browse all games grouped by category (x01, cricket, etc.)
- Search functionality across all game categories
- Pagination (21 games per page)
- Display game ID, type, player count, and player names
- Click any game to view detailed statistics

#### 2. Game Detail View
- Complete game information with all participating players
- **Average Score Per Round**: Calculated from complete rounds only (3 consecutive throws)
- **Miss Count**: Number of times each player missed the board (modifier = 0)
- **Total Throws**: Complete throw count for each player
- Interactive player selection for throw visualization

#### 3. Game Popularity Statistics
- Interactive pie chart showing game type distribution
- Hover tooltips with detailed counts
- Summary statistics (total games, game types)
- Clean legend with game type names

### Bonus Features

#### Interactive Dartboard Visualization
- Visual representation of throw patterns using X/Y coordinates
- Accurate dartboard layout with 20 segments, double/triple rings, and bull
- Color-coded throws:
  - Single player: Green (hit) / Red (miss)
  - Multiple players: Unique color per player
- **Fullscreen mode** for detailed analysis
- Hover tooltips showing throw details
- Statistics dashboard (total throws, on-board, misses, best throw)

#### Round-by-Round Breakdown
- Tabular view of throws grouped by rounds
- For multiple players: Paginated view showing one round at a time
- Color-coded player indicators
- Round totals and individual throw scores

#### Advanced Search
- Global search across all game categories
- Real-time filtering
- Search by game ID

####  Modern Design System
- Consistent purple color scheme (#65558f)
- Responsive layout (mobile-friendly)
- Smooth animations and transitions
- Clean, professional UI

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 14+
- **Libraries**:
  - `pg` - PostgreSQL client
  - `cors` - Cross-origin resource sharing
  - `dotenv` - Environment configuration

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Charts**: Recharts
- **Styling**: Custom CSS with modern design system

## Quick Start

### Prerequisites
```bash
Node.js >= 18.0.0
PostgreSQL >= 14.0
npm or yarn
```

### 1. Clone the Repository
```bash
git clone <repository-url>
cd dartsee-analytics
```

### 2. Database Setup

Create the database and import data:
```bash
# Create database
createdb darts_analytics

# Import schema
psql -d darts_analytics -f schema.sql

# Import data
psql -d darts_analytics -f data.sql
```

### 3. Backend Setup

```bash
cd backend
npm install

# Create .env file
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=darts_analytics
DB_USER=postgres
DB_PASSWORD=your_password
PORT=3001
EOF

# Start development server
npm run dev
```

Backend runs on `http://localhost:3001`

### 4. Frontend Setup

```bash
cd frontend
npm install

# Start development server
npm run dev
```

Frontend runs on `http://localhost:5173`

**Note**: The API URL defaults to `http://localhost:3001/api`. For production deployment, set the `VITE_API_BASE_URL` environment variable to your production API URL.

### 5. Access the Application

Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
dartsee-analytics/
├── backend/
│   ├── src/
│   │   └── index.ts           # Express server & API routes
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── main.tsx           # Application entry point
│   │   ├── App.tsx            # Main app with routing
│   │   ├── api.ts             # API client layer
│   │   ├── GamesList.tsx      # Games list view
│   │   ├── GameDetail.tsx     # Game detail view
│   │   ├── DartBoard.tsx      # Dartboard visualization
│   │   ├── Stats.tsx          # Statistics view
│   │   └── styles.css         # Global styles
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── schema.sql                  # Database schema
├── README.md                   # This file
└── TECHNICAL_REPORT.md         # Detailed technical documentation
```

## API Documentation

### GET /api/games
Returns all games grouped by category.

**Response:**
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

**Response:**
```json
{
  "id": 0,
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
Returns throw data for visualization. Optional `playerId` parameter.

**Response:**
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
Returns game type statistics.

**Response:**
```json
[
  {
    "type": "x01",
    "count": 15
  }
]
```

## Key Implementation Details

### Average Score Per Round Calculation

**Definition**: One round = 3 consecutive throws

**Implementation**:
```sql
WITH throw_rounds AS (
  -- Assign round numbers to groups of 3 consecutive throws
  SELECT CEIL(ROW_NUMBER() OVER (
    PARTITION BY player_id, game_id 
    ORDER BY id
  ) / 3.0) AS round_num
  FROM throws
),
complete_rounds AS (
  -- Only include complete rounds (exactly 3 throws)
  SELECT SUM(score * modifier) AS round_score
  FROM throw_rounds
  GROUP BY game_id, player_id, round_num
  HAVING COUNT(*) = 3
)
-- Calculate average of complete rounds only
SELECT AVG(round_score) AS avg_score
```

**Key Points**:
- Uses window functions for consecutive throw grouping
- Filters to complete rounds only (HAVING COUNT(*) = 3)
- Discards incomplete rounds
- Accurate per-round averaging
 
### Miss Detection

**Definition**: A miss occurs when `modifier = 0`

**Implementation**: `COUNT(CASE WHEN modifier = 0 THEN 1 END)`

### Dartboard Coordinate System

- **Coordinate Range**: 0-800 (X and Y)
- **Dartboard Center**: (400, 400)
- **Dartboard Radius**: 300 pixels
- **Detection Area**: 800x800 square (includes out-of-bounds)

**Note**: The dartboard visualization is an approximation overlay. For exact accuracy in production, hardware-specific calibration data should be integrated. See `TECHNICAL_REPORT.md` for details.

## Design Features

- **Modern Purple Theme**: Consistent #65558f color scheme
- **Responsive Design**: Mobile and desktop optimized
- **Interactive Elements**: Smooth hover effects and transitions
- **Card-Based Layout**: Clean, organized information display
- **Accessibility**: Proper contrast ratios and semantic HTML
- **Loading States**: Clear feedback during data fetching
- **Error Handling**: User-friendly error messages

## Development

### Backend Development
```bash
cd backend
npm run dev      # Development with hot reload
npm run build    # Compile TypeScript
npm start        # Run production build
```

### Frontend Development
```bash
cd frontend
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

## Additional Documentation

For detailed technical information, implementation decisions, and architecture details, see:
- **[TECHNICAL_REPORT.md](./Technical_report.md)** - Comprehensive technical documentation


---

**Developed by**: Abdul Basit
