import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'
import typescript from 'rollup-plugin-typescript'
import tsc from 'typescript'
import uglify from 'rollup-plugin-uglify'
import { minify } from 'uglify-js'

export default {
  entry: 'src/asyncmachine.ts',
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
  sourceMap: true,
  targets: [
    {
      dest: 'build/asyncmachine.cjs.js',
      format: 'cjs' },
    {
      dest: 'build/asyncmachine.umd.js',
      moduleName: 'asyncmachine',
      format: 'umd'
    },
    {
      dest: 'build/asyncmachine.es6.js',
      format: 'es'
    }
  ]
};
