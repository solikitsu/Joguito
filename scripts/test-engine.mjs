import { createServer } from 'vite';

// Loads the same TypeScript engine without starting an HTTP server or a browser.
const vite = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
});

try {
  const { runEngineTests } = await vite.ssrLoadModule('/src/game/tests.ts');
  const results = runEngineTests();
  console.table(results.map(result => ({ test: result.name, result: result.passed ? 'PASS' : 'FAIL', detail: result.detail })));
  const passed = results.filter(result => result.passed).length;
  console.log(`\nIRONVEIL: ${passed}/${results.length} engine checks passed.`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await vite.close();
}