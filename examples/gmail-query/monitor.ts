///<reference path="externs.d.ts"/>
///<reference path="node.d.ts"/>
// ///<reference path="../../node_modules/multistatemachine/build/lib/multistatemachine.d.ts"/>

import settings = module('../../settings')
import imap = module("imap")
var ImapConnection = imap.ImapConnection
import repl = module( 'repl')
//import sugar = module('sugar')
require('sugar')
import asyncmachine = module('asyncmachine/asyncmachine')
import rsvp = module('rsvp')

// TODO config
Object.merge( settings, {gmail_max_results: 300})

//class GmailSearch extends asyncmachine.AsyncMachine {
class GmailSearch extends asyncmachine.AsyncMachine {

	// Attributes

	active: bool = true;
	last_update: number = 0;
	headers: string[] = [ "id", "from", "to", "subject", "date" ];
	private monitored: number[] = [];

//	private msg: imap.ImapMessage;

	// States

	// Tells that the instance has some monitored messages.
	state_Fetched = { }

	// Aggregating state
	state_Fetching = {
		blocks: [ 'Idle' ]
	}

	state_Idle = {
		blocks: [ 'Fetching' ]
	}

	state_FetchingQuery = {
		implies: [ 'Fetching' ],
		blocks: [ 'FetchingResults' ]
	}

	state_FetchingResults = {
		implies: [ 'Fetching' ],
		blocks: [ 'FetchingQuery' ]
	}

	state_ResultsFetchingError = {
		implies: [ 'Idle' ]
	}

	state_FetchingMessage = {
		blocks: [ 'MessageFetched' ],
		requires: [ 'FetchingResults' ]
	}

	state_MessageFetched = {
		blocks: [ 'FetchingMessage' ],
		requires: [ 'FetchingResults' ]
	}

	constructor(
		public manager: GmailManager,
		public name: string = "*",
		public update_interval: number = 10*1000
	) {
		super()
		this.debugStates('[search] ')
		this.initStates('Idle')
	}

	// Signals

	labelsChangedSignal(thread: imap.ImapMessage, old_labels): bool;
	labelsChangedSignal(block: (msg: imap.ImapMessage, old_labels) => bool);
	labelsChangedSignal(block?: any, old_labels?: any) {
		var thread = block
		if ( block instanceof Function )
			return this.on('labelsAdded', block)
		else
			return this.trigger('labelsAdded', thread, old_labels)
	}

	threadRemovedSignal(thread, search: GmailSearch[]) {}
	threadAddedSignal(thread, search: GmailSearch[]) {}

	// Transitions

//	Idle_FetchingQuery() {
	FetchingQuery_enter() {
		this.last_update = Date.now()
		this.log( "performing a search for " + this.name )
		var imap = this.manager.connection
		imap.search( [ [ 'X-GM-RAW', this.name ] ], (err, results) => {
			this.addState('FetchingResults', err, results)
		})
	}

//	FetchingQuery_FetchingResults( states, params, err, results) {
	FetchingQuery_FetchingResults( states, err, results ) {
		// TODO handle err
 		this.log ('got search results')
 		var imap = this.manager.connection
 		var fetch = imap.fetch( results, this.headers )
		// Subscribe state changes to fetching events.
		fetch.on( "error", this.addStateLater('ResultsFetchingError') )
		fetch.on( "end", () => {
			this.addState('Fetched')
			this.dropState('FetchingResults')
		} )
		// TODO fix when params will work
 		fetch.on( "message", (msg: imap.ImapMessage) => {
			 this.addState('FetchingMessage', msg)
		 } )
	}

//	FetchingMessage_enter( states, state_params, msg ) {
	FetchingMessage_enter( states, msg ) {
		msg.on('end', () => {
			this.addState('MessageFetched', msg)
		} )
	}

//	FetchingMessage_MessageFetched( states, params ) {
	FetchingMessage_MessageFetched( states, msg ) {
		var id = msg['x-gm-msgid']
		if ( ! ~this.monitored.indexOf( id ) ) {
			// # TODO event
			var labels = msg['x-gm-labels'].join(', ')
			this.log( 'New msg "' + msg.headers.subject + '" (' + labels + ')' )
			this.monitored.push( id )
		}
	}

	ResultsFetchingError_enter(err) {
		this.log( 'fetching error', err )
		setTimeout( this.addStateLater('Idle'), 0 )
		if ( err )
			throw new Error(err)
	}
	
	// TODO FIXME
	repl() {
		var repl = repl.start({
		  prompt: "repl> ",
		  input: process.stdin,
		  output: process.stdout
		})
		repl.context.this = this
	}
	log(...msgs: any[]) {
		this.log.apply( console, msgs )
	}
}

//class GmailManager extends BaseClass {

// TODO IDLE state
class GmailManager extends asyncmachine.AsyncMachine {

	// ATTRIBUTES

	max_concurrency: number = 3;
	searches: GmailSearch[] = [];
	connection: imap.ImapConnection;
	box_opening_promise: rsvp.Promise;
	delayed_timer: number;
	concurrency: GmailSearch[] = [];
	threads: number[] = [];
	
	// STATES
	
	state_Disconnected = {
		blocks: ['Connected', 'Connecting', 'Disconnecting']
	}
	
	state_Disconnecting = {
		blocks: ['Connected', 'Connecting', 'Disconnected']
	}
	
	state_Connected = {
		blocks: [ 'Connecting', 'Disconnecting', 'Disconnected' ],
		implies: [ 'BoxClosed' ]
	}
	
	state_Connecting = {
		blocks: ['Connected', 'Disconnecting', 'Disconnected']
	}
	
	state_Idle = {
		requires: [ 'Connected' ]
	}
	
	state_Active = {
		requires: [ 'Connected' ]
	}

	state_Fetched = { }
	
	state_Fetching = {
		requires: [ 'BoxOpened' ],
		blocks: [ 'Idle', 'Delayed' ]
	}
	
	state_Delayed = {
		requires: [ 'Active' ], 
		blocks: [ 'Fetching', 'Idle' ]
	}
	
	state_BoxOpening = {
		requires: [ 'Active' ],
		blocks: [ 'BoxOpened', 'BoxClosing', 'BoxClosed' ],
		group: 'OpenBox'
	}

	state_BoxOpened = {
		depends: [ 'Connected' ],
		requires: [ 'Active' ],
		blocks: [ 'BoxOpening', 'BoxClosed', 'BoxClosing' ],
		group: 'OpenBox'
	}
	
	state_BoxClosing = {
		blocks: [ 'BoxOpened', 'BoxOpening', 'Box' ],
		group: 'OpenBox'
	}

	state_BoxClosed = {
		requires: [ 'Active' ],
		blocks: [ 'BoxOpened', 'BoxOpening', 'BoxClosing' ],
		group: 'OpenBox'
	}
	
	// API
		
	constructor( public settings ) {
		super()
		this.debugStates('[manager] ')
		this.initStates('Disconnected')
		
		// # TODO no auto connect 
		this.setState( 'Connecting')

		if (settings.repl)
			this.repl()
	}

	addSearch( name: string, update_interval: number ) {
		this.searches.push( new GmailSearch( this, name, update_interval ) )
	}
	
	// STATE TRANSITIONS

	Connected_enter(states: string[]) {
		setTimeout( this.setStateLater('BoxClosed'), 0 )
	}
	
	Connected_Disconnected() {
		process.exit()
	}

	Connecting_enter(states) {
		var data = this.settings
		this.connection = new ImapConnection({
			username: data.gmail_username,
			password: data.gmail_password,
			host: data.gmail_host || "imap.gmail.com",
			port: 993,
			secure: true
		})
		this.connection.connect( this.addStateLater('Connected') )
	}

	Connecting_exit( target_states ) {
		if ( ~target_states.indexOf('Disconnected') ) {
			// TODO cleanup
		}
	}
	
	Connected_exit() {
		// TODO callback?
		this.connection.logout( this.addStateLater('Disconnected') )
	}
	
	BoxOpening_enter() {
		var fetch = this.addStateLater('Fetching')
		if ( this.state('BoxOpened') ) {
			setTimeout( fetch, 0 )
			return false
		} else {
			this.once('Box.Opened.enter', fetch )
		}
		if ( this.box_opening_promise )
			this.box_opening_promise.reject()
		// TODO try and set to Disconnected on catch
		// Error: Not connected or authenticated
		// TODO support err param to the callback
		this.connection.openBox( "[Gmail]/All Mail", false, 
			this.addStateLater('BoxOpened')
		)
		this.box_opening_promise = this.last_promise
	}

	BoxOpening_BoxOpening() {
		// TODO move to boxopened_enter??/
		this.once( 'Box.Opened.enter', this.setStateLater('Fetching') )
	}
	
	BoxOpening_exit() {
		// TODO stop openbox
		var promise = this.box_opening_promise
		if ( promise && ! promise.isResolved )
			promise.reject()
	}

	BoxClosing_enter() {
		this.connection.closeBox( this.addStateLater('BoxClosed') )
	}

	BoxClosing_exit() {
		// TODO proxy via a promise
	}

	BoxOpened_enter() {
		// TODO Add inner state
		setTimeout( () => {
			if ( ! this.addState('Fetching') )
				this.log('Cant set Fetching', this.state() )
		}, 0)
	}
	
	Delayed_enter() {
		this.delayed_timer = setTimeout(
			this.addStateLater('Fetching'), this.minInterval_()
		)
	}
	
	Delayed_exit() {
		clearTimeout( this.delayed_timer )
	}
	
	Fetching_enter() {
		// Add new search only if there's a free limit.
		if ( this.concurrency.length >= this.max_concurrency )
			return false
		// TODO skip searches which interval haven't passed yet
		var searches = this.searches.sortBy("last_update"),
			search = searches.first(),
			i = 0
		// Optimise for more justice selection.
		// TODO encapsulate to needsUpdate()
		while ( search.last_update + search.update_interval > Date.now() ) {
			search = searches[ i++ ]
			if ( ! search )
				return false
		}
		this.log( "activating " + search.name )
		// Performe the search
		if ( this.concurrency.some( (s) => s.name == search.name ) )
			return false
		this.log('concurrency++')
		this.concurrency.push( search )
		search.addState( 'FetchingQuery' )
		// Subscribe to a finished query
		search.once( 'Fetching.Results.exit', () => {
//			this.concurrency = this.concurrency.exclude( search )
			this.concurrency = this.concurrency.filter( (row) => {
				return row !== search
			})
			this.log('concurrency--')
//			this.addStatesLater( 'Fetched', 'Delayed' )
			this.addStateLater( 'Delayed' )
			this.addStateLater( 'Fetched')
			// TODO GC?
			search = undefined
			this.newSearchThread( this.minInterval_() )
		})
	}

	statesLog_() {
		if ( ! this.log_handler_ )
			return
		this.log_handler_.apply( this, arguments )
	}

	Fetching_exit(states, args) {
		if ( ! ~states.indexOf('Active') )
			// TODO wil appear anytime?
			this.log('cancel fetching')
		if ( this.concurrency.length && ! args['force'] )
			return false
		// Exit from all queries.
		var exits = this.concurrency.map( (search) => {
			return search.dropState('Fetching')
		})
		return !~exits.indexOf(false)
	}

	Fetching_Fetching() {
		return this.Fetching_enter.apply( this, arguments )
	}

	Active_enter() {
		while ( this.threads.length < this.max_concurrency )
			this.newSearchThread()
	}

	newSearchThread(delay: number = 0) {
		this.threads.push( setTimeout( () => {
			if ( this.state('BoxOpened') )
				this.addState('Fetching')
			else if ( ! this.addState('BoxOpening') )
				this.log('BoxOpening not set', this.state())
		}, delay ) )
	}
	
	// PRIVATES
					
	private minInterval_() {
		var intervals: number[] = this.searches.map( (ch) => {
			return ch.update_interval
		})
		return Math.min.apply( this, intervals )
	}
	
//	repl: BaseClass.prototype.repl;
//	log: BaseClass.prototype.log;
	
	// TODO FIXME
	repl() {
		var repl = repl.start({
		  prompt: "repl> ",
		  input: process.stdin,
		  output: process.stdout
		})
		repl.context.this = this
	}
	log(...msgs: any[]) {
		this.log.apply( console, msgs )
	}
}

class App extends GmailManager {
	Connected_enter( states: string[] ) {
		super
//		if ( super.Connected_enter( states ) === false )
//			return false
		// TODO support sync inner state change
		setTimeout( () => {
			this.log('adding searches')
			this.addSearch( '*', 1000 )
			this.addSearch( 'label:sent', 5000 )
			this.addSearch( 'label:T-foo', 5000 )
			if (! this.addState('Active') ) {
				this.log('cant activate', this.state())
			}
		}, 0)
	}
}
var gmail: GmailManager = new App(settings)

var timeout = () => {
	if ( gmail.state('Connecting') )
		gmail.addState('Disconnected')
	else
		setTimeout( gmail.addStateLater('Disconnected'), 10*1000 )
}
setTimeout( timeout, 10*1000 )