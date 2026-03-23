import re

with open('frontend/app/(main)/chat/[id].tsx', 'r') as f:
    content = f.read()

# Remove useTranslation import from its current position
content = content.replace("import { useTranslation } from 'react-i18next';\n", "")

# Find the end of react-native imports to insert it there
rn_imports_end = content.find("} from 'react-native';\n") + len("} from 'react-native';\n")

content = content[:rn_imports_end] + "import { useTranslation } from 'react-i18next';\n" + content[rn_imports_end:]

with open('frontend/app/(main)/chat/[id].tsx', 'w') as f:
    f.write(content)
