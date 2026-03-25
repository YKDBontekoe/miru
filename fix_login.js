const fs = require('fs');
const file = 'frontend/__tests__/LoginScreen.test.tsx';
let content = fs.readFileSync(file, 'utf8');

// There are formatting errors from Prettier in the test file and login.tsx
// I will just run `npm run format`
