"""Base model for all Supabase-backed Tortoise ORM models.

This module provides ``SupabaseModel``, an abstract base that carries Supabase-specific
metadata used exclusively by the migration generator (``manage.py makemigrations``).

The workflow mirrors Entity Framework:

    1. Define your model, including ``sql_policies``, ``sql_indexes``,
       and ``sql_functions`` on the inner ``Meta`` class.
    2. Run ``python manage.py makemigrations <name>`` to generate a full
       Supabase-compatible SQL migration file.
    3. Apply it with ``python manage.py migrate`` (or via the Supabase CLI).

Tortoise ORM itself ignores all three attributes — they exist solely as
structured annotations for the generator so that RLS, custom indexes, and
trigger functions stay co-located with the model they belong to.

Example
-------
::

    class MyTable(SupabaseModel):
        id = fields.UUIDField(primary_key=True)
        user_id = fields.UUIDField()

        class Meta:
            table = "my_table"
            sql_policies = [
                "ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;",
                "CREATE POLICY my_table_owner ON public.my_table "
                "FOR ALL USING (auth.uid() = user_id);",
            ]
            sql_indexes = [
                "CREATE INDEX IF NOT EXISTS my_table_user_id_idx "
                "ON public.my_table (user_id);",
            ]
            sql_functions = [
                \"""
                CREATE OR REPLACE FUNCTION public.my_trigger_fn()
                RETURNS trigger AS $$ BEGIN ... END; $$ LANGUAGE plpgsql;
                \""",
                "CREATE TRIGGER my_trigger AFTER INSERT ON my_table ...",
            ]
"""

from __future__ import annotations

from tortoise import models


class SupabaseModel(models.Model):
    """Abstract base for all application models.

    Subclasses may declare the following on their inner ``Meta`` class.
    All three are optional and default to an empty list.

    ``sql_policies``
        List of SQL statements to enable RLS and define row-level security
        policies for this table. Applied after the CREATE TABLE statement.

    ``sql_indexes``
        List of SQL statements for custom indexes that Tortoise cannot express,
        such as HNSW/IVFFlat vector indexes or GIN full-text indexes.

    ``sql_functions``
        List of SQL statements for PostgreSQL functions and triggers that should
        be created alongside this table (e.g. ``handle_new_user``).
    """

    class Meta:
        abstract = True
