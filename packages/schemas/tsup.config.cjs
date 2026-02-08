const { defineConfig } = require('tsup');

module.exports = defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  skipNodeModulesBundle: true,
  external: ['zod'],
});
