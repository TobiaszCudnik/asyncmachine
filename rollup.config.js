import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'
import tsc from 'typescript'
import uglify from 'rollup-plugin-uglify'
import { minify } from 'uglify-es'
import execute from 'rollup-plugin-execute'

export default {
  input: 'src/asyncmachine.ts',
  plugins: [
    typescript({
      check: false,
      tsconfigDefaults: {
        target: 'es5',
        isolatedModules: true,
        module: 'es6'
      },
      typescript: tsc
    }),
    nodeResolve({
      jsnext: true,
      main: true,
      preferBuiltins: false
    }),
    commonjs({
      include: 'node_modules/**',
      ignoreGlobal: true
    }),
    uglify({}, minify),
    // dirty dirty dirty
    // propagate @ts-ignore statements to the generated definitions
    execute([
      `./node_modules/.bin/replace-in-file "  on(" "// @ts-ignore
        /**/on(" build/asyncmachine.d.ts`,
      `./node_modules/.bin/replace-in-file "  on: " "// @ts-ignore
        /**/on: " build/asyncmachine.d.ts`,
      `./node_modules/.bin/replace-in-file "  once: " "// @ts-ignore
        /**/once: " build/asyncmachine.d.ts`,
      `./node_modules/.bin/replace-in-file "  once(" "// @ts-ignore
        /**/once(" build/asyncmachine.d.ts`,
      `./node_modules/.bin/replace-in-file "  emit: " "// @ts-ignore
        /**/emit: " build/asyncmachine.d.ts`,
    ])
  ],
  exports: 'named',
  sourcemap: true,
  output: [
    {
      file: 'build/asyncmachine.cjs.js',
      format: 'cjs' },
    {
      file: 'build/asyncmachine.umd.js',
      name: 'asyncmachine',
      format: 'umd'
    }
  ]
};
