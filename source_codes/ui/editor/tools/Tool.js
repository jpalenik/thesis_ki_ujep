import paper from "paper"
import { store } from '@/_store'

/**
 * Main function of paper.Tool
 */
export default class Tool {
  constructor(file) {
    this.tool = new paper.Tool()
    this.tool.onMouseDown = this.onMouseDown.bind(this)
    this.tool.onMouseUp = this.onMouseUp.bind(this)
    this.tool.onMouseDrag = this.onMouseDrag.bind(this)
    this.tool.onMouseMove = this.onMouseMove.bind(this)
    this.tool.onKeyDown = this.onKeyDown.bind(this)
    this.tool.onKeyUp = this.onKeyUp.bind(this)
    this.tool.cancel = this.cancel.bind(this)
    this.tool.onDeactivate = this.onDeactivate.bind(this)
    this.tool.onActivate = this.onActivate.bind(this)

    this.file = file

    this.store = store

    this.hdls = {
      'ready' : [],
      'begun' : [],
      'action' : {
        all : []
      },
      'inactive' : [],
      'done' : []
    }
  }

  onMouseDown(event) {}
  onMouseUp(event) {}
  onMouseDrag(event){}
  onMouseMove(event) {}
  onKeyDown(event) {}
  onKeyUp(event) {}

  //_handleGrab = function() {}
  //_handleCancel = function() {}
  //_handleRelease = function() {}
  //_handleInactive = function() {}

  cancel() {
    if (this.state !== Tool.STATE.Begun) {
      return
    }

    this._handleCancel()

    this.state = Tool.STATE.Ready
    this._notify(Tool.NOTIF.Done, { cancelled : true })
  }

  static STATE = {
    Inactive : 'inactive',
    Ready : 'ready',
    Begun : 'begun',
    Action : 'action',
    Done: 'done'
  }

  static NOTIF = {
    Inactive : 'inactive',
    Ready : 'ready',
    Begun : 'begun',
    Done : 'done',
    Action : 'action'
  }

  get state() {
    return store.getters["editor/editor2d/activeToolState"]
  }

  set state(state) {
    store.dispatch('editor/editor2d/setActiveToolState', state)
  }

  get name(){
    return this.tool.name
  }

  set name(val){
    this.tool.name = val
  }

  handlers (notif) {
    return this.hdls[notif]
  }

  onNotif(notif, hnd, type){
    if (!this.hdls[notif]) {
      throw 'Unknown notification type'
    }

    if (notif !== Tool.NOTIF.Action) {
      if (this.hdls[notif].indexOf(hnd) < 0) {
        this.hdls[notif].push(hnd)
      }
      return
    }

    if (typeof type !== 'string') {
      type = 'all';
    }
    if (!this.hdls.action[type]) {
      this.hdls.action[type] = []
    }
    if (this.hdls.action[type].indexOf(hnd) < 0) {
      this.hdls.action[type].push(hnd)
    }
  }

  _notify (notif, params, type) {
    let not = function(list, params) {
      list.forEach(function(hdl) {
        hdl(this, params)
      }.bind(this))
    }.bind(this)

    let list = []

    if (notif === Tool.NOTIF.Action) {
      if (typeof type === 'string' && this.hdls.action[type] && this.hdls.action[type] instanceof Array) {
        list = this.hdls.action[type]
      }
      list = list.concat(this.hdls.action.all)
    } else {
      list = this.hdls[notif]
    }

    not(list, params)
  }

  _action(type, undo, redo, params) {
    if(typeof params !== 'object') {
      params = {}
    }

    if (typeof undo === 'function' && typeof redo === 'function') {
      params.undo = undo
      params.redo = redo
      params.undoAction = true
    }
    params.type = type
    this._notify(Tool.NOTIF.Action, params, type)
  }

  _begun() {
    if (this.state !== Tool.STATE.Ready) {
      throw `Cannot start tool in ${this.state} state`
    }
    this.state = Tool.STATE.Begun
    this._notify(Tool.NOTIF.Begun)
  }

  _done() {
    if (this.state !== Tool.STATE.Begun) {
      throw `Cannot end tool in ${this.state} state`
    }
    this.state = Tool.STATE.Ready
    this._notify(Tool.NOTIF.Done, { cancelled : false })
  }

  onDeactivate() {
    if (this.state === Tool.STATE.Begun) {
      this.cancel()
    }
  }

  onActivate() {
    //
  }

  activate() {
    this.tool.activate()
  }
}
