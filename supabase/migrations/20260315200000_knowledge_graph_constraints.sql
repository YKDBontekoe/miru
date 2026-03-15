-- Add unique constraints required for ON CONFLICT upserts in knowledge graph tables

-- memory_graph_nodes: deduplicate on (user_id, name, entity_type)
ALTER TABLE public.memory_graph_nodes
    ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS name text,
    ADD COLUMN IF NOT EXISTS entity_type text,
    ADD COLUMN IF NOT EXISTS description text;

-- Only add constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'memory_graph_nodes_user_name_type_key'
    ) THEN
        ALTER TABLE public.memory_graph_nodes
            ADD CONSTRAINT memory_graph_nodes_user_name_type_key
            UNIQUE (user_id, name, entity_type);
    END IF;
END $$;

-- memory_graph_edges: deduplicate on (source_node_id, target_node_id, relationship)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'memory_graph_edges_src_tgt_rel_key'
    ) THEN
        ALTER TABLE public.memory_graph_edges
            ADD CONSTRAINT memory_graph_edges_src_tgt_rel_key
            UNIQUE (source_node_id, target_node_id, relationship);
    END IF;
END $$;

-- user_agent_affinity: ensure unique constraint exists for ON CONFLICT
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'user_agent_affinity_user_id_agent_id_key'
    ) THEN
        ALTER TABLE public.user_agent_affinity
            ADD CONSTRAINT user_agent_affinity_user_id_agent_id_key
            UNIQUE (user_id, agent_id);
    END IF;
END $$;

-- Add agent_action_logs table if missing (it may not have been in initial migration)
CREATE TABLE IF NOT EXISTS public.agent_action_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    room_id uuid REFERENCES public.chat_rooms(id) ON DELETE SET NULL,
    action_type text NOT NULL,
    content text NOT NULL,
    meta jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_action_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'agent_action_logs_owner_select') THEN
        CREATE POLICY agent_action_logs_owner_select ON public.agent_action_logs
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'agent_action_logs_owner_insert') THEN
        CREATE POLICY agent_action_logs_owner_insert ON public.agent_action_logs
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
