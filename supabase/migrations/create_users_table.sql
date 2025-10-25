-- Create users table for CRUD operations
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO users (name, email, role) VALUES
('John Doe', 'john@example.com', 'admin'),
('Jane Smith', 'jane@example.com', 'user'),
('Bob Johnson', 'bob@example.com', 'moderator')
ON CONFLICT (email) DO NOTHING;