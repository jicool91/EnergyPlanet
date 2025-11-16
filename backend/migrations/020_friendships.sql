-- Migration: 020_friendships
-- Description: Friend relationships between players
-- Author: Energy Planet Team
-- Date: 2025-11-16

CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_one_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_two_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    initiator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
    last_action_by UUID REFERENCES users(id) ON DELETE SET NULL,
    last_action_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_one_id, user_two_id),
    CHECK (user_one_id <> user_two_id),
    CHECK (user_one_id < user_two_id)
);

CREATE INDEX idx_friendships_user_one ON friendships(user_one_id);
CREATE INDEX idx_friendships_user_two ON friendships(user_two_id);
CREATE INDEX idx_friendships_status ON friendships(status);

CREATE TABLE friendship_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    friendship_id UUID NOT NULL REFERENCES friendships(id) ON DELETE CASCADE,
    event_type VARCHAR(30) NOT NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_friendship_events_friendship ON friendship_events(friendship_id);

CREATE TRIGGER update_friendships_updated_at
    BEFORE UPDATE ON friendships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE friendships IS 'Symmetric friend relationships and pending requests';
COMMENT ON COLUMN friendships.user_one_id IS 'Lexicographically smaller user id';
COMMENT ON COLUMN friendships.user_two_id IS 'Lexicographically larger user id';
COMMENT ON COLUMN friendships.status IS 'pending: awaiting confirmation, accepted: friends, blocked: restricted';
COMMENT ON TABLE friendship_events IS 'Audit log for friendship actions (request, accept, remove)';
