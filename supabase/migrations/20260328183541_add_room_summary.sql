-- Migration: add_room_summary
-- Generated: 2026-03-28T18:35:41.597215+00:00
-- Type: incremental

-- Schema changes --------------------------------------------------------

ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS "summary" TEXT;
