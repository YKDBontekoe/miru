"""Dependencies for the productivity domain."""

from __future__ import annotations

from app.domain.productivity.use_cases.manage_productivity import \
    ManageProductivityUseCase
from app.infrastructure.repositories.productivity_repo import \
    ProductivityRepository


def get_productivity_use_case() -> ManageProductivityUseCase:
    """Dependency injection for the productivity use case.

    A new ProductivityRepository is created on each call because the repository is
    stateless. This is an intentional composition-root pattern choice for clarity
    and consistency with the API layer.
    """
    return ManageProductivityUseCase(repository=ProductivityRepository())
