with open("app/domain/memory/service.py") as f:
    content = f.read()

content = content.replace(
    """        # 3. Handle Relationships
        if related_to:
            try:
                for rid in related_to:
                    await self.repo.create_relationship(memory_id, rid)
            except Exception as e:
                logger.warning(f"Relationship creation failed: {e}")

        return memory_id""",
    """        # 3. Handle Relationships
        if related_to:
            try:
                for rid in related_to:
                    await self.repo.create_relationship(memory_id, rid)
            except Exception as e:
                logger.warning(f"Relationship creation failed: {e}")

        # 4. Trigger intelligent graph extraction in the background
        if u_id:
            try:
                import asyncio
                from app.domain.memory.graph_service import GraphExtractionService
                asyncio.create_task(  # noqa: RUF006
                    GraphExtractionService.process_and_store_graph(content, u_id)
                )
            except Exception:
                logger.warning("Failed to trigger background graph extraction", exc_info=True)

        return memory_id""",
)

with open("app/domain/memory/service.py", "w") as f:
    f.write(content)
