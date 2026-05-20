import re

with open("frontend/app/(main)/productivity.tsx", "r") as f:
    content = f.read()

# Add actions to the dependency arrays
content = re.sub(
    r"  useEffect\(\(\) => \{\n    if \(openCreateTask === '1' \|\| openCreateTask === 'true'\) \{\n      actions\.setShowCreateTask\(true\);\n      const nextParams = Object\.fromEntries\(\n        Object\.entries\(params\)\.filter\(\n          \(\[key, value\]\) => key !== 'openCreateTask' && typeof value === 'string'\n        \)\n      \);\n      router\.replace\(\{ pathname, params: nextParams \}\);\n    \}\n  \}, \[openCreateTask, params, pathname, router, actions\.setShowCreateTask\]\);",
    r"  useEffect(() => {\n    if (openCreateTask === '1' || openCreateTask === 'true') {\n      actions.setShowCreateTask(true);\n      const nextParams = Object.fromEntries(\n        Object.entries(params).filter(\n          ([key, value]) => key !== 'openCreateTask' && typeof value === 'string'\n        )\n      );\n      router.replace({ pathname, params: nextParams });\n    }\n  }, [openCreateTask, params, pathname, router, actions, actions.setShowCreateTask]);",
    content,
    flags=re.MULTILINE
)

content = re.sub(
    r"  useEffect\(\(\) => \{\n    if \(openCreateNote === '1' \|\| openCreateNote === 'true'\) \{\n      actions\.setShowCreateNote\(true\);\n      const nextParams = Object\.fromEntries\(\n        Object\.entries\(params\)\.filter\(\n          \(\[key, value\]\) => key !== 'openCreateNote' && typeof value === 'string'\n        \)\n      \);\n      router\.replace\(\{ pathname, params: nextParams \}\);\n    \}\n  \}, \[openCreateNote, params, pathname, router, actions\.setShowCreateNote\]\);",
    r"  useEffect(() => {\n    if (openCreateNote === '1' || openCreateNote === 'true') {\n      actions.setShowCreateNote(true);\n      const nextParams = Object.fromEntries(\n        Object.entries(params).filter(\n          ([key, value]) => key !== 'openCreateNote' && typeof value === 'string'\n        )\n      );\n      router.replace({ pathname, params: nextParams });\n    }\n  }, [openCreateNote, params, pathname, router, actions, actions.setShowCreateNote]);",
    content,
    flags=re.MULTILINE
)

with open("frontend/app/(main)/productivity.tsx", "w") as f:
    f.write(content)
