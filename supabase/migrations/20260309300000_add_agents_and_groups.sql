-- Migration: Add multi-persona agents and group chats
-- 1. Create agents table
-- 2. Create chat_rooms table
-- 3. Create chat_room_agents join table
-- 4. Create chat_messages table to store message history
-- 5. Add Row Level Security (RLS) policies

-- ---------------------------------------------------------------------------
-- 1. Create agents table
-- ---------------------------------------------------------------------------

CREATE TABLE public.agents (
    id             uuid        NOT NULL DEFAULT gen_random_uuid(),
    user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name           text        NOT NULL,
    personality    text        NOT NULL,
    created_at     timestamptz NOT NULL DEFAULT now(),

    PRIMARY KEY (id)
);

CREATE INDEX idx_agents_user_id ON public.agents(user_id);

-- ---------------------------------------------------------------------------
-- 2. Create chat_rooms table
-- ---------------------------------------------------------------------------

CREATE TABLE public.chat_rooms (
    id             uuid        NOT NULL DEFAULT gen_random_uuid(),
    user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name           text        NOT NULL,
    created_at     timestamptz NOT NULL DEFAULT now(),

    PRIMARY KEY (id)
);

CREATE INDEX idx_chat_rooms_user_id ON public.chat_rooms(user_id);

-- ---------------------------------------------------------------------------
-- 3. Create chat_room_agents join table
-- ---------------------------------------------------------------------------

CREATE TABLE public.chat_room_agents (
    room_id        uuid        NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    agent_id       uuid        NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    created_at     timestamptz NOT NULL DEFAULT now(),

    PRIMARY KEY (room_id, agent_id)
);

-- ---------------------------------------------------------------------------
-- 4. Create chat_messages table
-- ---------------------------------------------------------------------------

CREATE TABLE public.chat_messages (
    id             uuid        NOT NULL DEFAULT gen_random_uuid(),
    room_id        uuid        NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    user_id        uuid        REFERENCES auth.users(id) ON DELETE CASCADE, -- Sender if human
    agent_id       uuid        REFERENCES public.agents(id) ON DELETE CASCADE, -- Sender if agent
    content        text        NOT NULL,
    created_at     timestamptz NOT NULL DEFAULT now(),

    -- Ensure a message is either from a user or an agent, but not both or neither
    CONSTRAINT chk_sender CHECK (
        (user_id IS NOT NULL AND agent_id IS NULL) OR
        (user_id IS NULL AND agent_id IS NOT NULL)
    ),
    PRIMARY KEY (id)
);

CREATE INDEX idx_chat_messages_room_id ON public.chat_messages(room_id);

-- ---------------------------------------------------------------------------
-- 5. Enable Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.agents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_agents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages     ENABLE ROW LEVEL SECURITY;

-- agents: users can only see/modify their own agents
CREATE POLICY "agents_select_own"
    ON public.agents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "agents_insert_own"
    ON public.agents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "agents_update_own"
    ON public.agents FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "agents_delete_own"
    ON public.agents FOR DELETE
    USING (auth.uid() = user_id);

-- chat_rooms: users can only see/modify their own rooms
CREATE POLICY "chat_rooms_select_own"
    ON public.chat_rooms FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "chat_rooms_insert_own"
    ON public.chat_rooms FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_rooms_update_own"
    ON public.chat_rooms FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "chat_rooms_delete_own"
    ON public.chat_rooms FOR DELETE
    USING (auth.uid() = user_id);

-- chat_room_agents: restricted by the user's ownership of the chat_room
CREATE POLICY "chat_room_agents_select_own"
    ON public.chat_room_agents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_rooms r
            WHERE r.id = chat_room_agents.room_id AND r.user_id = auth.uid()
        )
    );

CREATE POLICY "chat_room_agents_insert_own"
    ON public.chat_room_agents FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_rooms r
            WHERE r.id = chat_room_agents.room_id AND r.user_id = auth.uid()
        )
    );

CREATE POLICY "chat_room_agents_delete_own"
    ON public.chat_room_agents FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_rooms r
            WHERE r.id = chat_room_agents.room_id AND r.user_id = auth.uid()
        )
    );

-- chat_messages: restricted by the user's ownership of the chat_room
CREATE POLICY "chat_messages_select_own"
    ON public.chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_rooms r
            WHERE r.id = chat_messages.room_id AND r.user_id = auth.uid()
        )
    );

CREATE POLICY "chat_messages_insert_own"
    ON public.chat_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_rooms r
            WHERE r.id = chat_messages.room_id AND r.user_id = auth.uid()
        )
    );

CREATE POLICY "chat_messages_delete_own"
    ON public.chat_messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_rooms r
            WHERE r.id = chat_messages.room_id AND r.user_id = auth.uid()
        )
    );
