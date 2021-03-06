import config from './rollup.config'

config.input = 'src/shims.ts'
// remove the exec plugin
delete config.plugins[4]
config.output = [
  {
    file: 'build/asyncmachine-shims.cjs.js',
    format: 'cjs' },
  {
    file: 'build/asyncmachine-shims.umd.js',
    name: 'asyncmachine',
    format: 'umd'
  },
  {
    file: 'build/asyncmachine-shims.es6.js',
    format: 'es'
  }
]

export default config
