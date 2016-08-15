const asyncmachine = require('../../build/asyncmachine.cjs.js')
require('source-map-support').install()


/**
 * Scenario:
 * 1. User clicks the button
 * 2. Data download begins
 * 3. Preloader appears
 * 4. Once data is fetched, the dialog replaces the preloader
 * 
 * This example presents following concepts:
 * - usage of auto states
 * - working with async actions
 * - loosely coupling states (data downloading logic doesnt know anything about the preloader)
 * 
 * Log output (level 1):
[DialogManager] [states] +Enabled                                                                                                                              
[DialogManager] [states] +ButtonClicked
[DialogManager] [states] +ShowingDialog
[DialogManager] [states] +DownloadingData +PreloaderVisible
Preloader show()
[DialogManager] [states] -ButtonClicked
[DialogManager] [states] +DataDownloaded -DownloadingData -PreloaderVisible
Preloader hide()
[DialogManager] [states] +DialogVisible
Dialog shown
 * 
 * Log output (level 2):
[DialogManager] [add] Enabled
[DialogManager] [states] +Enabled
[DialogManager] [add] ButtonClicked
[DialogManager] [states] +ButtonClicked
[DialogManager] [transition] ButtonClicked_state
[DialogManager] [queue:add] ShowingDialog
[DialogManager] [queue:drop] ButtonClicked
[DialogManager] [add] ShowingDialog
[DialogManager] [states] +ShowingDialog
[DialogManager] [states] +DownloadingData +PreloaderVisible
[DialogManager] [transition] DownloadingData_state
[DialogManager] [transition] PreloaderVisible_state
Preloader show()
[DialogManager] [drop] ButtonClicked
[DialogManager] [states] -ButtonClicked
[DialogManager] [add] DataDownloaded
[DialogManager] [drop] DownloadingData by DataDownloaded
[DialogManager] [rejected] PreloaderVisible(-DownloadingData)
[DialogManager] [states] +DataDownloaded -DownloadingData -PreloaderVisible
[DialogManager] [transition] PreloaderVisible_end
Preloader hide()
[DialogManager] [states] +DialogVisible
[DialogManager] [transition] DialogVisible_state
Dialog shown
 */


class States extends asyncmachine.AsyncMachine {}
// you can save the state map directly to the prototype
Object.assign(States.prototype, {
	Enabled: {},

	ButtonClicked: {
		requires: ['Enabled']
	},

	ShowingDialog: {
		drops: ['DialogVisible']
	},
	DialogVisible: {
		auto: true,
		requires: ['DataDownloaded']
	},

	DownloadingData: {
		auto: true,
		requires: ['ShowingDialog']
	},
	DataDownloaded: {
		blocks: ['DownloadingData']
	},

	PreloaderVisible: {
		auto: true,
		requires: ['DownloadingData']
	}
})

class DialogManager {

	constructor(button, preloader) {
		this.preloader = preloader
		this.states = new States(this)
				.logLevel(2)
				.id('DialogManager')

		this.dialog = new Dialog()
		button.addEventListener('click',
				this.states.addByListener('ButtonClicked'))
	}

	// Methods

	enable() {
		this.states.add('Enabled')
	}

	disable() {
		this.states.drop('Enabled')
	}

	// Transitions

	ButtonClicked_state() {
		this.states.add('ShowingDialog')
		// drop the state immediately after this transition
		this.states.drop('ButtonClicked')
	}

	DialogVisible_state() {
		// this.data is guaranteed by the DataDownloaded state
		this.dialog.show(this.data)
	}

	DownloadingData_state() {
		let abort = this.states.getAbort('DownloadingData')
		fetchData().then( data => {
			// break if the state is no longer set (or has been re-set)
			// during the async call
			if (abort()) return
			this.data = data
			this.states.add('DataDownloaded')
		})
	}

	PreloaderVisible_state() {
		this.preloader.show()
	}

	PreloaderVisible_end() {
		this.preloader.hide()
	}
}


// Mocks used in this example
class Dialog {
	show() {
		console.log('Dialog shown')
	}
}


class Button {
	addEventListener(fn) {}
}

class Preloader {
	show() {
		console.log('Preloader show()')
	}
	hide() {
		console.log('Preloader hide()')
	}
}


function fetchData() {
	var data = [1, 2, 3]
	return new Promise( resolve => setTimeout( resolve.bind(data), 1000 ) );
}

// Create and run the instance

var dm = new DialogManager(new Button(), new Preloader())
dm.enable()
// simulate a button click
dm.states.add('ButtonClicked')