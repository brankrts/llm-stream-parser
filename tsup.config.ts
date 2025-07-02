import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  outDir: 'dist',
  target: 'es2020',
  minify: false,
  bundle: true,
  external: [],
  banner: {
    js: `/*!
 * llm-stream-parser
 * A TypeScript library for parsing and processing structured data from LLM streaming responses
 * 
 * @license MIT
 * @author Baran Karatas
 */`,
  },
});
