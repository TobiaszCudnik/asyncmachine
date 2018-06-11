/**
 * AsyncMachine Async Dialog Example
 *
 * Scenario:
 * 1. User clicks the button
 * 2. Data download begins
 * 3. Pre-loader appears
 * 4. Once data is fetched, the dialog replaces the preloader
 *
 * This example presents following concepts:
 * - automatic states
 * - synchronous mutations
 * - delayed mutations
 * - loose coupling (data downloading logic doesnt know anything about
 *   the preloader)
 *
 * Scroll down to see log outputs.
 *
 * @link https://github.com/TobiaszCudnik/asyncmachine
 */

const { machine } = require('asyncmachine')
require('source-map-support').install()

const state = {
  Enabled: {},

  ButtonClicked: {
    require: ['Enabled']
  },

  ShowingDialog: {},
  DialogVisible: {
    auto: true,
    drop: ['ShowingDialog'],
    require: ['DataDownloaded']
  },

  DownloadingData: {
    auto: true,
    require: ['ShowingDialog']
  },
  DataDownloaded: {
    drop: ['DownloadingData']
  },

  PreloaderVisible: {
    auto: true,
    require: ['DownloadingData']
  }
}

class DialogManager {
  constructor(button, preloader) {
    this.preloader = preloader
    this.state = new machine(state)
      .logLevel(1)
      .id('DialogManager')
      .setTarget(this)

    this.dialog = new Dialog()
    button.addEventListener('click', this.state.addByListener('ButtonClicked'))
  }

  // Methods

  enable() {
    this.state.add('Enabled')
  }

  disable() {
    this.state.drop('Enabled')
  }

  // Transitions

  ButtonClicked_state() {
    this.state.add('ShowingDialog')
    // drop the state immediately after this transition
    this.state.drop('ButtonClicked')
  }

  DialogVisible_state() {
    // this.data is guaranteed by the DataDownloaded state
    this.dialog.show(this.data)
  }

  DownloadingData_state() {
    let abort = this.state.getAbort('DownloadingData')
    fetchData().then(data => {
      // break if the state is no longer set (or has been re-set)
      // during the async call
      if (abort()) return
      this.data = data
      this.state.add('DataDownloaded')
    })
  }

  PreloaderVisible_state() {
    this.preloader.show()
  }

  PreloaderVisible_end() {
    this.preloader.hide()
  }
}

// --- Mock classes used in this example

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
  const data = [1, 2, 3]
  return new Promise(resolve => setTimeout(resolve.bind(data), 1000))
}

// Create and run the instance

const dm = new DialogManager(new Button(), new Preloader())
dm.enable()
// simulate a button click
dm.state.add('ButtonClicked')

/*

Log output (level 1):

[DialogManager] [states] +Enabled
[DialogManager] [states] +ButtonClicked
[DialogManager] [states] +ShowingDialog
[DialogManager] [states] +DownloadingData +PreloaderVisible
Preloader show()
[DialogManager] [states] -ButtonClicked
[DialogManager] [states] +DataDownloaded -DownloadingData -PreloaderVisible
Preloader hide()
[DialogManager] [states] +DialogVisible -ShowingDialog
Dialog shown

Log output (level 2):

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
[DialogManager] [drop] ShowingDialog by DialogVisible
[DialogManager] [states] +DialogVisible -ShowingDialog
[DialogManager] [transition] DialogVisible_state
Dialog shown

*/
