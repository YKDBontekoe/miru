/* global __dirname */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function checkImportDefer() {
  const result = execSync('grep -r "import .* defer" src/ || true', { encoding: 'utf-8' });
  if (result.trim()) {
    const pkgPath = path.resolve(__dirname, '../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const prettierVersion = pkg.devDependencies.prettier;
    console.error(`Error: "import defer" found. Prettier ${prettierVersion} may misparse this syntax.`);
    console.error(`Please upgrade Prettier to a compatible version or remove the "import defer" syntax before formatting.`);
    process.exit(1);
  }
}

checkImportDefer();
