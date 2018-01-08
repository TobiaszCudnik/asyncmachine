import config from './rollup.config'
import typescript from 'rollup-plugin-typescript'
import tsc from 'typescript'

config.plugins[0] = typescript({
  target: 'es6',
  isolatedModules: true,
  module: 'es6',
  typescript: tsc
})
config.output = [
  {
    file: 'build/asyncmachine.es6.js',
    format: 'es'
  }
]

export default config
