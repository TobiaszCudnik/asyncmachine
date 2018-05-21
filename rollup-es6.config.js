import config from './rollup.config'
import typescript from 'rollup-plugin-typescript2'
import tsc from 'typescript'

// remove the exec plugin
delete config.plugins[4]
config.plugins[0] = typescript({
  check: false,
  tsconfigDefaults: {
    target: 'es6',
    isolatedModules: true,
    module: 'es6'
  },
  typescript: tsc
})
config.output = [
  {
    file: 'build/asyncmachine.es6.js',
    format: 'es'
  }
]

export default config
