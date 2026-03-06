"""Initial migration - create memories table with pgvector support.

Revision ID: 001
Revises:
Create Date: 2026-03-06 00:00:00.000000

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create memories table with pgvector extension and indexes."""
    # Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # Create memories table
    op.create_table(
        "memories",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("embedding", sa.Text(), nullable=False),  # Stored as text, will be cast to vector
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create sequence for id column
    op.execute("CREATE SEQUENCE IF NOT EXISTS memories_id_seq START 1")
    op.execute("ALTER TABLE memories ALTER COLUMN id SET DEFAULT nextval('memories_id_seq')")

    # Alter embedding column to use vector type
    op.execute(
        "ALTER TABLE memories ALTER COLUMN embedding TYPE vector(1536) USING embedding::vector(1536)"
    )

    # Create IVFFlat index for vector similarity search
    op.execute("""
        CREATE INDEX IF NOT EXISTS memories_embedding_idx
        ON memories
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
    """)

    # Create RPC function for vector similarity search
    op.execute("""
        CREATE OR REPLACE FUNCTION match_memories(
            query_embedding vector(1536),
            match_threshold float,
            match_count int
        )
        RETURNS TABLE(
            id bigint,
            content text,
            similarity float
        )
        LANGUAGE plpgsql
        AS $$
        BEGIN
            RETURN QUERY
            SELECT
                memories.id,
                memories.content,
                1 - (memories.embedding <=> query_embedding) AS similarity
            FROM memories
            WHERE 1 - (memories.embedding <=> query_embedding) > match_threshold
            ORDER BY memories.embedding <=> query_embedding
            LIMIT match_count;
        END;
        $$;
    """)


def downgrade() -> None:
    """Drop memories table and related objects."""
    # Drop the RPC function
    op.execute("DROP FUNCTION IF EXISTS match_memories(vector(1536), float, int)")

    # Drop the index
    op.execute("DROP INDEX IF EXISTS memories_embedding_idx")

    # Drop the table
    op.drop_table("memories")

    # Drop the sequence
    op.execute("DROP SEQUENCE IF EXISTS memories_id_seq")
