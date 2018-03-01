import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'
import tsc from 'typescript'
import uglify from 'rollup-plugin-uglify'
import { minify } from 'uglify-es'

export default {
  input: 'src/asyncmachine.ts',
  plugins: [
    typescript({
      target: 'es5',
      isolatedModules: true,
      module: 'es6',
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
    uglify({}, minify)
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
