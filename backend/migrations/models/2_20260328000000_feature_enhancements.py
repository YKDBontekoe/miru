from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "recurrence_rule" VARCHAR(50);
        ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "recurrence_end_date" TIMESTAMPTZ;
        ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "calendar_event_id" UUID;
        ALTER TABLE "calendar_events" ADD COLUMN IF NOT EXISTS "recurrence_rule" VARCHAR(50);
        ALTER TABLE "calendar_events" ADD COLUMN IF NOT EXISTS "recurrence_end_date" TIMESTAMPTZ;
        ALTER TABLE "calendar_events" ADD COLUMN IF NOT EXISTS "linked_task_id" UUID;
        ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "personality_history" JSONB NOT NULL DEFAULT '[]';
    """


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "tasks" DROP COLUMN IF EXISTS "recurrence_rule";
        ALTER TABLE "tasks" DROP COLUMN IF EXISTS "recurrence_end_date";
        ALTER TABLE "tasks" DROP COLUMN IF EXISTS "calendar_event_id";
        ALTER TABLE "calendar_events" DROP COLUMN IF EXISTS "recurrence_rule";
        ALTER TABLE "calendar_events" DROP COLUMN IF EXISTS "recurrence_end_date";
        ALTER TABLE "calendar_events" DROP COLUMN IF EXISTS "linked_task_id";
        ALTER TABLE "agents" DROP COLUMN IF EXISTS "personality_history";
    """
