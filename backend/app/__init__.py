"""Miru Backend Application Package."""

# Fix for Python 3.13 circular import bugs in some libraries (pyparsing/pyiceberg)
# triggered by Supabase/storage3 imports.
import contextlib

with contextlib.suppress(ImportError):
    import pyparsing  # noqa: F401
