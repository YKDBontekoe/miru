import re

with open("frontend/app/(main)/productivity.tsx", "r") as f:
    content = f.read()

# Fix memoized actions
import_memo_pattern = re.compile(r"import React, \{ useCallback \} from 'react';")
content = import_memo_pattern.sub("import React, { useCallback, useMemo } from 'react';", content)

actions_memo_pattern = re.compile(r"  const \{ state, actions, i18n \} = useProductivityViewModel\(\);\n  const \{ C \} = useTheme\(\);")

memoized_actions = """  const { state, actions: rawActions, i18n } = useProductivityViewModel();
  const { C } = useTheme();

  const actions = useMemo(() => rawActions, [rawActions]);"""

content = actions_memo_pattern.sub(memoized_actions, content)

with open("frontend/app/(main)/productivity.tsx", "w") as f:
    f.write(content)
