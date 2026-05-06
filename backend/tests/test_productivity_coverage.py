from __future__ import annotations

from app.domain.productivity.dependencies import get_productivity_use_case


def test_dependencies() -> None:
    """Verify that get_productivity_use_case() returns a non-None use case instance."""
    use_case = get_productivity_use_case()
    assert use_case is not None
