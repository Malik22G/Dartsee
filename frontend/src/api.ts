const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface Game {
  id: number;
  type: string;
  playerCount: number;
  hasThrows: boolean;
  playerNames: string[];
}

export interface GamesByCategory {
  [category: string]: Game[];
}

export interface Player {
  id: string;
  name: string;
  averageScorePerRound: number;
  missCount: number;
  throwCount: number;
}

export interface GameDetail {
  id: number;
  type: string;
  players: Player[];
}

export interface Throw {
  id: number;
  score: number;
  modifier: number;
  points: number;
  x: number;
  y: number;
  playerId?: string;
  playerName?: string;
}

export interface GameTypeStats {
  type: string;
  count: number;
}

export const api = {
  async getGames(): Promise<GamesByCategory> {
    const response = await fetch(`${API_BASE}/games`);
    if (!response.ok) throw new Error('Failed to fetch games');
    return response.json();
  },

  async getGame(id: number): Promise<GameDetail> {
    const response = await fetch(`${API_BASE}/games/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('404: Game not found');
      }
      throw new Error('Failed to fetch game');
    }
    return response.json();
  },

  async getGameThrows(gameId: number, playerId?: string): Promise<Throw[]> {
    const url = playerId
      ? `${API_BASE}/games/${gameId}/throws?playerId=${playerId}`
      : `${API_BASE}/games/${gameId}/throws`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch throws');
    return response.json();
  },

  async getGameTypeStats(): Promise<GameTypeStats[]> {
    const response = await fetch(`${API_BASE}/stats/game-types`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  }
};