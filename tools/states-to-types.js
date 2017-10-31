// TODO watch mode
// TODO group by states to make params copying easier

const fs = require('fs')
const path = require('path')
const asyncmachine = require('..')

if (!process.argv[2]) {
	console.log(`USAGE:

1. Print to the console
node states-to-type.js SOURCE_FILE.js

2. Save as a "SOURCE_FILE-types.ts" file
node states-to-type.js SOURCE_FILE.js -s`)
	process.exit(0)
}

const filename = path.join(process.cwd(), process.argv[2])

let states
if (filename.match(/\.json$/))
	states = Object.keys(JSON.parse(fs.readFileSync(filename, { encoding: 'utf8' })))
else {
	let mod = require(filename)
    states = mod.States || mod.default || mod
    
	if (states.constructor) {
		let instance = new states
		// if (instance instanceof asyncmachine.default)
		if (instance.states_all)
            states = (new states).states_all
	} else
		states = Object.keys(states)
}

// TODO skip state call for exception
states.push('Exception')
let transitions = []

for (let state1 of states) {
    for (let state2 of states) {
        if (state1 == state2) {
            if (state1 == 'Exception')
                continue
            state2 = 'Any'
        }
        transitions.push(state1 + '_' + state2)
    }
}

states = states.filter(state=> state != 'Exception')

let output = `
import { IState as IStateBase } from 'asyncmachine/src/types'


/**
 * Signatures for EventEmitter to bind to transitions.
 */
export interface IBind {

${states.map(name=>(
`    // ${name}
    (event: '${name}_enter', listener: (/* param1, param2 */) => boolean | undefined, context?: Object): this;
    (event: '${name}_state', listener: (/* param1, param2 */) => any, context?: Object): this;
`)).join('')}
}

/**
 * Signatures for EventEmitter to emit transitions.
 */
export interface IEmit {

${states.map(name => (
	`    // ${name}
    (event: '${name}_enter' /*, param1, param2 */): boolean | void;
    (event: '${name}_state' /*, param1, param2 */): boolean | void;
`)).join('')}
}

/**
 * All the possible transition methods machine can define.
 */
export interface ITransitions {

${states.map(name => (
	`    // ${name}
    ${name}_enter?(/*param1, param2 */): boolean | void;
    ${name}_state?(/*param1, param2 */): boolean | void | Promise<boolean | void>;
`)).join('')}

${states.map(name => (
`    ${name}_exit?(): boolean | void;
    ${name}_end?(): boolean | void | Promise<boolean | void>;
`)).join('')}
${transitions.map(name => (
`    ${name}?(): boolean | void;
`)).join('')}
}

/**
 * All the state names.
 */
export type TStates = '${states.join("'\n  | '")}';

/**
 * All the transition names.
 */
export type TTransitions = '${transitions.join("'\n  | '")}';

/**
 * Typesafe state interface.
 */
export interface IState extends IStateBase<TStates> {}

/**
 * Subclassable typesafe state interface.
 */
export interface IStateExt<T extends string> extends IStateBase<T | TStates> {}

export interface IBind {

    // Non-params events
${states.map(name=>(
`    (event: '${name}_exit', listener: () => boolean | undefined, context?: Object): this;
    (event: '${name}_end', listener: () => any, context?: Object): this;
`)).join('')}
    // Transitions
    (event: TTransitions): this;
}

export interface IEmit {
    // Non-params events
${states.map(name=>(
`    (event: '${name}_exit'): boolean | void;
    (event: '${name}_end'): boolean | void;
`)).join('')}
    // Transitions
    (event: TTransitions): boolean | void;
}
`

if (process.argv[3] == '-s')
	fs.writeFileSync(filename.replace(/(\.[^.]+$)/, '-types.ts'), output)
else
	console.log(output)