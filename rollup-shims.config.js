import config from './rollup.config'

config.entry = 'src/shims.ts'
config.targets = [
  {
    dest: 'build/asyncmachine-shims.cjs.js',
    format: 'cjs' },
  {
    dest: 'build/asyncmachine-shims.umd.js',
    moduleName: 'asyncmachine',
    format: 'umd'
  },
  {
    dest: 'build/asyncmachine-shims.es6.js',
    format: 'es'
  }
]

export default config
