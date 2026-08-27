CREATE TABLE IF NOT EXISTS games
(
    id integer primary key,
    type text
);

CREATE TABLE IF NOT EXISTS players
(
    id text not null primary key,
    name text
);

CREATE TABLE IF NOT EXISTS game_players
(
    game_id integer not null,
    player_id text,
    id text not null primary key
);

CREATE TABLE IF NOT EXISTS throws
(
    id integer primary key,
    game_id integer,
    player_id text,
    score integer,
    modifier integer,
    x integer,
    y integer
);

-- Compatibility migration for databases initialized by an earlier version.
ALTER TABLE game_players ADD COLUMN IF NOT EXISTS id text;
ALTER TABLE game_players DROP CONSTRAINT IF EXISTS game_players_game_id_fkey;
ALTER TABLE game_players DROP CONSTRAINT IF EXISTS game_players_player_id_fkey;
ALTER TABLE throws DROP CONSTRAINT IF EXISTS throws_game_id_fkey;
ALTER TABLE throws DROP CONSTRAINT IF EXISTS throws_player_id_fkey;
ALTER TABLE throws ALTER COLUMN game_id DROP NOT NULL;
ALTER TABLE throws ALTER COLUMN player_id DROP NOT NULL;
ALTER TABLE throws ALTER COLUMN score DROP NOT NULL;
ALTER TABLE throws ALTER COLUMN modifier DROP NOT NULL;
ALTER TABLE throws ALTER COLUMN x DROP NOT NULL;
ALTER TABLE throws ALTER COLUMN y DROP NOT NULL;

CREATE INDEX IF NOT EXISTS game_players_player_id_idx
    ON game_players(player_id);

CREATE INDEX IF NOT EXISTS throws_game_id_idx
    ON throws(game_id);

CREATE INDEX IF NOT EXISTS throws_player_id_idx
    ON throws(player_id);
