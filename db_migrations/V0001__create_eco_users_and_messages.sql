
CREATE TABLE IF NOT EXISTS eco_users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eco_messages (
  id SERIAL PRIMARY KEY,
  from_user_id INT NOT NULL REFERENCES eco_users(id),
  to_user_id INT NOT NULL REFERENCES eco_users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eco_messages_pair ON eco_messages(
  LEAST(from_user_id, to_user_id),
  GREATEST(from_user_id, to_user_id),
  created_at
);
