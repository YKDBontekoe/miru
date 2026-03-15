"""Affinity service: tracks relationship strength between users and agents."""

from __future__ import annotations

import json
import logging
from uuid import UUID

from tortoise import Tortoise

logger = logging.getLogger(__name__)

# Milestone affinity scores that trigger level-up events
MILESTONES = [10, 25, 50, 100, 250, 500]


async def increment_affinity(user_id: UUID, agent_id: UUID) -> str | None:
    """Increment affinity score for a user-agent pair.

    Returns a ``[[STATUS:level_up:{agent_id}:{level}]]`` string when a
    milestone is crossed, or ``None`` otherwise.
    """
    conn = Tortoise.get_connection("default")
    try:
        # Upsert affinity row; include milestones default so NOT NULL is satisfied
        rows = await conn.execute_query_dict(
            """
            INSERT INTO user_agent_affinity
                (user_id, agent_id, affinity_score, milestones, last_interaction_at)
            VALUES ($1::uuid, $2::uuid, 1.0, '[]'::jsonb, NOW())
            ON CONFLICT (user_id, agent_id) DO UPDATE
              SET affinity_score = user_agent_affinity.affinity_score + 1.0,
                  last_interaction_at = NOW()
            RETURNING affinity_score, milestones
            """,
            [str(user_id), str(agent_id)],
        )
    except Exception as exc:
        logger.warning("Affinity increment failed for agent %s: %s", agent_id, exc)
        return None

    if not rows:
        return None

    new_score = float(rows[0]["affinity_score"])
    milestones_hit = rows[0].get("milestones") or []

    # Check if we just crossed a milestone
    for milestone in MILESTONES:
        if new_score >= milestone and milestone not in milestones_hit:
            try:
                milestones_hit.append(milestone)
                await conn.execute_query(
                    """
                    UPDATE user_agent_affinity
                    SET milestones = $1::jsonb
                    WHERE user_id = $2::uuid AND agent_id = $3::uuid
                    """,
                    [json.dumps(milestones_hit), str(user_id), str(agent_id)],
                )
            except Exception as exc:
                logger.warning("Failed to update milestones: %s", exc)
            level = MILESTONES.index(milestone) + 1
            return f"[[STATUS:level_up:{agent_id}:{level}]]"

    return None


async def log_agent_action(
    user_id: UUID,
    agent_id: UUID,
    action_type: str,
    content: str,
    room_id: UUID | None = None,
    meta: dict | None = None,
) -> None:
    """Write an entry to the agent_action_logs table."""
    conn = Tortoise.get_connection("default")
    try:
        await conn.execute_query(
            """
            INSERT INTO agent_action_logs (user_id, agent_id, room_id, action_type, content, meta)
            VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6::jsonb)
            """,
            [
                str(user_id),
                str(agent_id),
                str(room_id) if room_id else None,
                action_type,
                content,
                json.dumps(meta or {}),
            ],
        )
    except Exception as exc:
        logger.warning("Failed to log agent action: %s", exc)
