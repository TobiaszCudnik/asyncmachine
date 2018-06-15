#!/usr/bin/env node

// TODO expose API
// TODO provide a mapped type to for jsons
// TODO make it a separate package
// TODO watch mode
// TODO read ts files directly
// TODO dont import from /src/
// TODO integrate with pretter
// - https://github.com/prettier/prettier/issues/4078

const fs = require('fs')
const path = require('path')
const asyncmachine = require('../asyncmachine')
const cli = require('commander')

let cli_filename
cli
  .usage('<filename> [options]')
  .arguments('<filename> [env]')
  .action(function(filename) {
    cli_filename = filename
  })
  .option(
    '-o, --output [output]',
    'save the result to a file, default `./<filename>-types.ts`'
  )
  .option('-e, --export <name>', 'use the following export')
  .version('0.1.0')
  .on('--help', function() {
    console.log('')
    console.log('  Examples:')
    console.log('')
    console.log('    $ am-types file.js')
    console.log('    $ am-types file.json')
    console.log('    $ am-types file.js -s')
    console.log('    $ am-types file.js -s -e my_state')
    console.log('')
  })
cli.parse(process.argv)

if (!cli_filename) {
  // TODO this should show the help screen
  console.error('Filename required, try --help')
  process.exit(1)
}
const filename = path.join(process.cwd(), cli_filename)
const export_name = cli.export
let output_path = cli.output
if (output_path === true) {
  output_path = filename.replace(/(\.[^.]+$)/, '-types.ts')
}

if (!filename.match(/\.(js|json)$/i)) {
  console.error('Only JS and JSON input allowed at the moment')
  process.exit(1)
}

let states
if (filename.match(/\.json$/))
  states = Object.keys(
    JSON.parse(fs.readFileSync(filename, { encoding: 'utf8' }))
  )
else {
  let mod = require(filename)
  states =
    mod[export_name] ||
    mod.state ||
    mod.State ||
    mod.states ||
    mod.States ||
    mod.default ||
    mod

  if (typeof states == 'function') {
    let instance = new states()
    // if (instance instanceof asyncmachine.default)
    if (instance.states_all) states = new states().states_all
  } else {
    states = Object.keys(states)
  }
}

states.push('Exception')
let transitions = []

for (let state1 of states) {
  for (let state2 of states) {
    if (state1 == state2) {
      if (state1 == 'Exception') continue
      state2 = 'Any'
    }
    transitions.push(state1 + '_' + state2)
  }
  transitions.push(state1 + '_exit')
  transitions.push(state1 + '_end')
}

states = states.filter(state => state != 'Exception')

// ----- ----- -----
// PER STATE OUTPUT
// ----- ----- -----

let output =
`import {
  IState as IStateBase,
  IBind as IBindBase,
  IEmit as IEmitBase
} from 'asyncmachine/types'
import AsyncMachine from 'asyncmachine'

export { IBindBase, IEmitBase, AsyncMachine }
`

output += states
  .map(
    name => `
// ----- ----- ----- ----- -----
// STATE: ${name}
// ----- ----- ----- ----- -----

/** machine.bind('${name}', (param1, param2) => {}) */
export interface IBind extends IBindBase {
  (event: '${name}_enter', listener: (/* param1: any?, param2: any? */) => boolean | undefined, context?: Object): this;
  (event: '${name}_state', listener: (/* param1: any?, param2: any? */) => any, context?: Object): this;
}

/** machine.emit('${name}', param1, param2) */
export interface IEmit extends IEmitBase {
  (event: '${name}_enter' /*, param1: any?, param2: any? */): boolean | void;
  (event: '${name}_state' /*, param1: any?, param2: any? */): boolean | void;
}

/** Method declarations */
export interface ITransitions {
  ${name}_enter?(/* param1: any?, param2: any? */): boolean | void;
  ${name}_state?(/* param1: any?, param2: any? */): boolean | void | Promise<boolean | void>;
}
`
  )
  .join('')

// ----- ----- -----
// COMBINED OUTPUT
// ----- ----- -----

output += `
// ----- ----- -----
// GENERAL TYPES
// ----- ----- -----

/** All the possible transition methods the machine can define */
export interface ITransitions {${transitions
  .map(t => t.endsWith('_end')
    ? `\n  ${t}?(): boolean | void | Promise<boolean | void>;`
    : `\n  ${t}?(): boolean | void;`)
  .join('')}
}

/** All the state names */
export type TStates = '${states.join("'\n  | '")}';

/** All the transition names */
export type TTransitions = '${transitions.join("'\n  | '")}';

/** Typesafe state interface */
export interface IState extends IStateBase<TStates> {}

/** Subclassable typesafe state interface */
export interface IStateExt<T extends string> extends IStateBase<T | TStates> {}

export interface IBind extends IBindBase {
  // Non-params events and transitions
  (event: TTransitions, listener: () => boolean | void, context?: Object): this;
}

export interface IEmit extends IEmitBase {
  // Non-params events and transitions
  (event: TTransitions): boolean | void;
}

export interface IJSONStates {
  ${states.join(`: IState;\n  `)}: IState;
  Exception?: IState;
}
`

if (output_path) {
  fs.writeFileSync(output_path, output)
  console.log(`Saved to ${output_path}`)
} else {
  console.log(output)
}
