import re

with open('.github/workflows/ai-agents.yml', 'r') as f:
    content = f.read()

content = content.replace(
    "'- Frontend: Flutter/Dart — flat `frontend/lib/` directory, plain `StatefulWidget` + `setState` only (no Riverpod/BLoC/Provider).',",
    "'- Frontend: React Native/TypeScript — `frontend/src/` directory, Expo Router, and Zustand.',"
)
content = content.replace(
    "- Dart style: 80-char lines, single quotes, `const`/`final` everywhere possible.",
    "- TypeScript style: 100-char lines, single quotes, functional components with hooks."
)
content = content.replace(
    "- Lint: `make lint-backend` (ruff + black + mypy) or `make lint-frontend` (dart format + flutter analyze).",
    "- Lint: `make lint-backend` (ruff + black + mypy) or `make lint-frontend` (eslint + type-check)."
)
content = content.replace(
    "const isFrontend =\n              issue.labels.some(l => l.name === 'frontend') ||\n              /flutter|dart|widget|screen|page/i.test(combined);",
    "const isFrontend =\n              issue.labels.some(l => l.name === 'frontend') ||\n              /react|native|typescript|expo|screen|page/i.test(combined);"
)
content = content.replace(
    "const stack = isFrontend ? 'Flutter/Dart (frontend)' : 'FastAPI/Python (backend)';",
    "const stack = isFrontend ? 'React Native/TypeScript (frontend)' : 'FastAPI/Python (backend)';"
)
content = content.replace(
    "const lintCmd = isFrontend\n              ? 'make lint-frontend (dart format + flutter analyze)'\n              : 'make lint-backend (ruff + black + mypy)';",
    "const lintCmd = isFrontend\n              ? 'make lint-frontend (eslint + type-check)'\n              : 'make lint-backend (ruff + black + mypy)';"
)
content = content.replace(
    "const stacktraceMatch =\n              body.match(/(?:stacktrace|stack trace)[:\\s]*\\n```[\\w]*\\n([\\s\\S]*?)```/i) ||\n              body.match(/```(?:python|dart|text)?\\n([\\s\\S]*?Traceback[\\s\\S]*?)```/i);",
    "const stacktraceMatch =\n              body.match(/(?:stacktrace|stack trace)[:\\s]*\\n```[\\w]*\\n([\\s\\S]*?)```/i) ||\n              body.match(/```(?:python|typescript|javascript|text)?\\n([\\s\\S]*?Traceback[\\s\\S]*?)```/i);"
)
content = content.replace(
    "- Line length: 100 chars (Python) / 80 chars (Dart). Double quotes (Python), single quotes (Dart).",
    "- Line length: 100 chars (Python and TypeScript). Double quotes (Python), single quotes (TypeScript)."
)
content = content.replace(
    "- All functions need type hints (Python) / explicit types (Dart).",
    "- All functions need type hints (Python) / explicit types (TypeScript)."
)
content = content.replace(
    "- Use `const` constructors and `final` where possible (Dart).",
    "- Use `const` for components and internal functions (TypeScript)."
)
content = content.replace(
    "- Frontend pages live flat under `frontend/lib/`; state management is plain `StatefulWidget` + `setState` — do NOT introduce Riverpod, Provider, BLoC, or GetX.",
    "- Frontend pages live under `frontend/app/` (Expo Router); state management uses Zustand (`frontend/src/store/`)."
)

with open('.github/workflows/ai-agents.yml', 'w') as f:
    f.write(content)
