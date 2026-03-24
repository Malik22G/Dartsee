import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'darts_analytics',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://dartsee-api.onrender.com',
        /\.vercel\.app$/,
        /\.yourdomain\.com$/
      ]
    : '*',
  credentials: true
}));
app.use(express.json());

interface Game {
  id: number;
  type: string;
  playerCount: number;
  hasThrows: boolean;
  playerNames: string[];
}

interface GamesByCategory {
  [category: string]: Game[];
}

interface Player {
  id: string;
  name: string;
  averageScorePerRound: number;
  missCount: number;
  throwCount: number;
}

interface GameDetail {
  id: number;
  type: string;
  players: Player[];
}

interface Throw {
  id: number;
  score: number;
  modifier: number;
  points: number;
  x: number;
  y: number;
  playerId?: string;
  playerName?: string;
}

interface GameTypeStats {
  type: string;
  count: number;
}

// GET /api/games - Returns all games grouped by category
app.get('/api/games', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        g.id,
        g.type,
        COUNT(DISTINCT gp.player_id) as playerCount,
        EXISTS(SELECT 1 FROM throws t WHERE t.game_id = g.id) as hasThrows,
        ARRAY_AGG(p.name ORDER BY p.name) FILTER (WHERE p.name IS NOT NULL) as playerNames
      FROM games g
      LEFT JOIN game_players gp ON g.id = gp.game_id
      LEFT JOIN players p ON gp.player_id = p.id
      GROUP BY g.id, g.type
      ORDER BY g.type, g.id DESC
    `);

    const gamesByCategory: GamesByCategory = {};

    result.rows.forEach(row => {
      const game: Game = {
        id: row.id,
        type: row.type,
        playerCount: parseInt(row.playercount),
        hasThrows: row.hasthrows,
        playerNames: row.playernames || []
      };

      if (!gamesByCategory[game.type]) {
        gamesByCategory[game.type] = [];
      }
      gamesByCategory[game.type].push(game);
    });

    res.json(gamesByCategory);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/games/:id - Returns game details with player stats
app.get('/api/games/:id', async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);

    const result = await pool.query(`
      WITH throw_rounds AS (
        SELECT
          t.game_id,
          t.player_id,
          t.score,
          t.modifier,
          CEIL(ROW_NUMBER() OVER (
            PARTITION BY t.player_id, t.game_id
            ORDER BY t.id
          ) / 3.0) AS round_num
        FROM throws t
        WHERE t.game_id = $1
      ),
      complete_rounds AS (
        SELECT 
          game_id, 
          player_id, 
          round_num,
          SUM(score * modifier) AS round_score
        FROM throw_rounds
        GROUP BY game_id, player_id, round_num
        HAVING COUNT(*) = 3
      ),
      player_stats AS (
        SELECT
          t.player_id,
          COUNT(CASE WHEN t.modifier = 0 THEN 1 END) AS miss_count,
          COUNT(t.id) AS throw_count
        FROM throws t
        WHERE t.game_id = $1
        GROUP BY t.player_id
      )
      SELECT
        g.id,
        g.type,
        p.id AS player_id,
        p.name AS player_name,
        COALESCE(AVG(cr.round_score), 0) AS avg_score,
        COALESCE(ps.miss_count, 0) AS miss_count,
        COALESCE(ps.throw_count, 0) AS throw_count
      FROM games g
      JOIN game_players gp ON g.id = gp.game_id
      JOIN players p ON gp.player_id = p.id
      LEFT JOIN complete_rounds cr ON cr.player_id = p.id AND cr.game_id = g.id
      LEFT JOIN player_stats ps ON ps.player_id = p.id
      WHERE g.id = $1
      GROUP BY g.id, g.type, p.id, p.name, ps.miss_count, ps.throw_count
      ORDER BY p.name
    `, [gameId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const gameDetail: GameDetail = {
      id: result.rows[0].id,
      type: result.rows[0].type,
      players: result.rows.map(row => ({
        id: row.player_id,
        name: row.player_name,
        averageScorePerRound: Math.round(parseFloat(row.avg_score) * 100) / 100,
        missCount: parseInt(row.miss_count),
        throwCount: parseInt(row.throw_count)
      }))
    };

    res.json(gameDetail);
  } catch (error) {
    console.error('Error fetching game details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/games/:id/throws?playerId=... - Returns throws for a player or all players in a game
app.get('/api/games/:id/throws', async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const playerId = req.query.playerId as string;

    const query = playerId
      ? `SELECT t.id, t.score, t.modifier, t.score * t.modifier as points, t.x, t.y, t.player_id, p.name as player_name
         FROM throws t
         LEFT JOIN players p ON t.player_id = p.id
         WHERE t.game_id = $1 AND t.player_id = $2
         ORDER BY t.id`
      : `SELECT t.id, t.score, t.modifier, t.score * t.modifier as points, t.x, t.y, t.player_id, p.name as player_name
         FROM throws t
         LEFT JOIN players p ON t.player_id = p.id
         WHERE t.game_id = $1
         ORDER BY t.id`;

    const params = playerId ? [gameId, playerId] : [gameId];
    const result = await pool.query(query, params);

    res.json(result.rows.map(row => ({
      id: row.id,
      score: row.score,
      modifier: row.modifier,
      points: row.points,
      x: row.x,
      y: row.y,
      playerId: row.player_id,
      playerName: row.player_name
    })));
  } catch (error) {
    console.error('Error fetching throws:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stats/game-types - Returns game type statistics
app.get('/api/stats/game-types', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT type, COUNT(*) as count
      FROM games
      GROUP BY type
      ORDER BY count DESC
    `);

    res.json(result.rows.map(row => ({
      type: row.type,
      count: parseInt(row.count)
    })));
  } catch (error) {
    console.error('Error fetching game type stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});