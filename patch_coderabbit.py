import re

with open('.coderabbit.yaml', 'r') as f:
    content = f.read()

# Fix the path instructions for frontend properly
import re
new_instructions = """    - path: "frontend/src/**/*.{ts,tsx,js,jsx}"
      instructions: >
        Ensure `const` and `let` are used appropriately.
        State management uses Zustand (https://zustand-demo.pmnd.rs/).
        Prefer `FlatList` for long lists instead of nested views.
        Ensure hook cleanup in `useEffect` and cleanup of refs/listeners (useRef, add/remove listeners).
        Remove Flutter-only mentions like StatefulWidget, setState, BLoC, GetX, and dispose().
"""

# Replace the whole frontend path instruction block
content = re.sub(
    r'    - path: "frontend/src/\*\*/\*\.\{ts,tsx,js,jsx\}".*?Dispose listeners, controllers, and streams in `dispose\(\)`\.',
    new_instructions.strip('\n'),
    content,
    flags=re.DOTALL
)

with open('.coderabbit.yaml', 'w') as f:
    f.write(content)
