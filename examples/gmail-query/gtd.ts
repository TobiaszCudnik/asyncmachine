///<reference path="externs.d.ts"/>
///<reference path="node.d.ts"/>
///<reference path="../../node_modules/multistatemachine/build/lib/multistatemachine.d.ts"/>

// require 'longjohn'
import flow = module('flow')
var def = flow.define
var ex = flow.exec
import settings = module('../../settings')
import imap = module("imap")
var ImapConnection = imap.ImapConnection
import util = module( "util")
import repl = module( 'repl')
import Promise = module( 'when')
import jsprops = module('jsprops')
var prop = jsprops.property
import sugar = module('sugar')
import multistatemachine = module('multistatemachine')
import rsvp = module('rsvp')

// TODO add event emitter
class BaseClass {
	repl() {
		var repl = repl.start({
		  prompt: "repl> ",
		  input: process.stdin,
		  output: process.stdout
		})
		repl.context.this = this
	}
	log(...msgs: string[]) {
		console.log.apply( console, msgs )
	}
}

// TODO config
Object.merge( settings, {gmail_max_results: 300})

/*
TODO emit:
- new-msg msg
- changed-label {msg, new_labels, removed_labels}
*/

declare class Message {
	test: any;
}

class GmailSearch extends BaseClass {
	active: bool = true;
	last_update: number = 0;
	cmd: (string?) => string = prop('cmd');
	private monitored: (set?: Message[]) => Message[] 
        = prop('monitored', null, []);

	constructor(
		public manager: GmailManager,
		public name: string = "noname",
		public update_interval: number = 10*1000
	) {
		super()
	}

	fetch(next: () => any): Promise.Promise {
		this.log( "performing a search for #{@name}" )
		var deferred = Promise.defer()
		if (next) {
			deferred.promise.then( next )
		}
		this.query_( deferred )
		return deferred.promise
	}

	query_(deferred: Promise.Deferred) {
		var imap = this.manager.connection
		var next = (err, results) =>
			this.results_( deferred, err, results )
		imap.search( [ [ 'X-GM-RAW', this.name ] ], next )
        this.monitored()[0].test
	}

	results_(deferred: Promise.Deferred, err, results) {
 		var imap = this.manager.connection
// 		# TODO labels
 		this.log ('got search results')
 		var content = { headers: [ "id", "from", "to", "subject", "date" ] }
 		var fetch = imap.fetch( results, content )
 		fetch.on( "message", (msg) => {
			msg.on( "end", () => {
				if (!~ this.monitored().indexOf( msg.id )) {
					// # TODO event
					this.log( 'new msg' )
					this.monitored().push( msg.id )
					// # TODO later
					// # this.emit "new-msg"
				}
			})
		})
		fetch.on( "end", (err) => {
			this.log( 'fetch ended' )
			deferred.resolve()
		})
		fetch.on( "error", (err) => {
			// # new Error ???
			deferred.reject( err )
		})
	}
}

//class GmailManager extends BaseClass {

class GmailManager extends multistatemachine.AsyncMachine {
	
	// STATES
	
	state_Disconnected = {
		blocks: ['Connected', 'Connecting', 'Disconnecting']
	}
	
	state_Disconnecting = {
		blocks: ['Connected', 'Connecting', 'Disconnected']
	}
	
	state_Connected = {
		blocks: ['Connecting', 'Disconnecting', 'Disconnected']
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
	
	state_BoxOpened = {
		requires: [ 'Active' ],
		blocks: [ 'BoxOpening', 'BoxClosing' ]
	}
	
	state_BoxOpening = {
		requires: [ 'Active' ],
		blocks: [ 'BoxOpened', 'BoxClosing' ]
	}
	
	state_BoxClosing = {
		blocks: [ 'BoxOpened', 'BoxOpening' ]
	}
	
	// PROPERTIES
	
	searches = prop('searches', null, []);
	connection: imap.ImapConnection;
	last_promise: rsvp.Promise;
	box_opening_promise: rsvp.Promise;
	delayed_timer: number;
	
	// API
		
	constructor( public settings ) {
		super( 'Disconnected' )
		// # TODO no auto connect 
		this.pushState( 'Connecting')

		if (settings.repl)
			this.repl()
	}

	addSearch( name: string, update_interval: number ) {
		this.searches().push( new GmailSearch( this, name, update_interval ) )
	}
	
	// STATE TRANSITIONS

	Connecting_enter() {
		var data = this.settings
		this.connection = new ImapConnection({
			username: data.gmail_username,
			password: data.gmail_password,
			host: data.gmail_host || "imap.gmail.com",
			port: 993,
			secure: true
		})
		this.connection.connect( this,
			this.pushStateLater('Connected')
		)
	}

	Connecting_exit( target_states ) {
		if ( ~target_states.indexOf('Disconnected') ) {
			// TODO cleanup
		}
	}
	
	Connect_exit() {
		// TODO callback?
		this.connection.logout( this.pushStateLater('Disconnected') )
		this.pushState('Disconnecting')
	}
	
	BoxOpening_enter() {
		this.connection.openBox( "[Gmail]/All Mail", false, 
			this.pushStateLater('BoxOpened').fulfill
		)
		this.box_opening_promise = this.last_promise
	}
	
	BoxOpening_exit() {
		var promise = this.box_opening_promise
		if ( promise && ! promise.isResolved )
			promise.reject()
	}

	BoxClosing_enter() {
		this.connection.closeBox( this.dropStateLater('BoxClosing').fulfill )
	}

	BoxClosing_exit() {
	}
	
	Delayed_enter() {
		this.delayed_timer = setTimeout(
			this.pushStateLater('Fetching').fulfill, this.minInterval_()
		)
	}
	
	Delayed_exit() {
		clearTimeout( this.delayed_timer )
	}
	
	Fetching_enter() {
		this.log( "activating #{search.name}")
		// TODO skip searches which interval haven't passed yet
		var search = this.searches().sortBy("last_update").first()
		search.fetch( this.pushStateLater( [ 'Fetched', 'Delayed' ] ) )
	}
	
	Fetching_exit( target_states ) {
		if ( ! ~target_states.indexOf('Active') ) {
			this.log('cancel fetching')
			// TODO cancel fetching process
		}
	}
	
	// PRIVATES
					
	private minInterval_() {
		var intervals: number[] = this.searches().map( (ch) => {
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
	log(...msgs: string[]) {
		console.log.apply( console, msgs )
	}
}

class App extends GmailManager {
	Connected_enter( states ) {
//		if ( super.Connected_enter( states ) === false )
//			return false
		this.addSearch( '*', 5000 )
		this.pushState('Activate')
	}
}
var gmail: GmailManager = new App(settings)
//ex(
//	function() {
//		gmail = new GmailManager( settings )
//	},
//	function() {
//		gmail.addSearch( '*', 5000 )
//		gmail.activate()
//	}
//)
setTimeout( gmail.setStateLater('Disconnected'), 10*1000 )