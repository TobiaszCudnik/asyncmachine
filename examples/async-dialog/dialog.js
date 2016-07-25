const asyncmachine = require('../../build/asyncmachine.cjs.js')
require('source-map-support').install()


class States extends asyncmachine.AsyncMachine {}
Object.assign(States.prototype, {
	Enabled: {},

	ButtonClicked: {
		requires: ['Enabled']
	},

	ShowingDialog: {
		drops: ['DialogShown']
	},
	DialogShown: {
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
				.logLevel(1)
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

	DialogShown_state() {
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