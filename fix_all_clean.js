const fs = require('fs');

const fixDisplayNames = (filePath) => {
  let code = fs.readFileSync(filePath, 'utf8');

  // Let's use a simpler strategy. Just append Name.displayName = "Name" after the memo declarations
  // Find all React.memo
  let matches = [...code.matchAll(/const ([A-Z][a-zA-Z0-9_]*) = React\.memo\(/g)];
  let displayNames = new Set();

  matches.forEach(m => displayNames.add(m[1]));

  let toAppend = "\n// --- Auto-added display names ---\n";
  displayNames.forEach(name => {
      if (!code.includes(`${name}.displayName`)) {
          toAppend += `${name}.displayName = '${name}';\n`;
      }
  });

  if (displayNames.size > 0) {
      code += toAppend;
  }

  // Also fix the loadMemories dependency in settings
  if (filePath.includes('settings.tsx')) {
      code = code.replace("loadMemories();\n  }, []);", "loadMemories();\n  }, [loadMemories]);");
  }

  fs.writeFileSync(filePath, code);
}

['frontend/app/(main)/chat.tsx', 'frontend/app/(main)/chat/[id].tsx', 'frontend/app/(main)/home.tsx', 'frontend/app/(main)/settings.tsx'].forEach(f => fixDisplayNames(f));
