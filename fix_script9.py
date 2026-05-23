with open("backend/tests/test_memory_service.py", "r") as f:
    content = f.read()

import re


# Fix get_memory_graph assertions as requested
# Baseline fix for store_memory_dedup_hit
def replace_dedup(match):
    return """
    # Capture local baseline
    baseline_count = await Memory.all().count()

    # Mock match_memories since pgvector isn't supported in SQLite
    with patch.object(memory_service.repo, "match_memories", new_callable=AsyncMock) as mock_match:
        mock_match.return_value = [Memory(content="existing fact", embedding=[0.1, 0.2])]

        res = await memory_service.store_memory("already exists", user_id=uuid4())

        assert res is None
        # Assert nothing was saved
        assert await Memory.all().count() == baseline_count"""


content = re.sub(
    r'    # Mock match_memories since pgvector isn\'t supported in SQLite\n    with patch.object\(memory_service.repo, "match_memories", new_callable=AsyncMock\) as mock_match:\n        mock_match.return_value = \[Memory\(content="existing fact", embedding=\[0.1, 0.2\]\)\]\n\n        res = await memory_service.store_memory\("already exists", user_id=uuid4\(\)\)\n\n        assert res is None\n        # Assert nothing was saved\n        memories = await Memory.all\(\)\n        assert len\(memories\) == 0',
    replace_dedup,
    content,
)


def replace_graph(match):
    return """    # Act
    res = await memory_service.get_memory_graph(u_id)

    # Assert
    assert set(n.id for n in res["nodes"]) == {m1.id, m2.id}
    assert len(res["nodes"]) == 2
    assert len(res["edges"]) == 1
    assert res["edges"][0].id == edge.id"""


content = re.sub(
    r'    # Act\n    res = await memory_service.get_memory_graph\(u_id\)\n\n    # Assert\n    assert len\(res\["nodes"\]\) == 2\n    assert res\["nodes"\]\[0\].id in \[m1.id, m2.id\]\n    assert len\(res\["edges"\]\) == 1\n    assert res\["edges"\]\[0\].id == edge.id',
    replace_graph,
    content,
)

with open("backend/tests/test_memory_service.py", "w") as f:
    f.write(content)
