import Tool from "@/components/Editor/Editor2D/tools/Tool"
import CONSTANTS from "../helpers/Constants"

const KEY_MAP = {
  DELETE_ITEM: ['delete', 'backspace'],
  SELECT_CLASS: ['s'],
  TOGGLE_CLASS: ['v'],
  TRANSPORT_TO_CLASS: ['t']
}
export default class PathTool extends Tool {
  constructor(file) {
    super(file)

    this.name = "path"
    this.icon = "fas fa-pencil-alt"
    this.path = null
    this.layer_alias_on_start = ""

    this.add_to_top = false
  }

  newPath(point) {

    if (this.state !== Tool.STATE.Ready) {
      return
    }

    let p = this.path = new paper.Path()

    // add to back
    if (window.editor.isInstanceSegmentation() && !this.add_to_top) {
      p.sendToBack()
    }

    //
    let cls = window.editor.cls.getActiveClassDefinition()
    p.style = cls.style
    this.layer_alias_on_start = cls.mlwt_id

    // todo ID
    p.data = {
      mlwt_id: this.file.getId(),
      class_alias: cls.class_alias
    }

    p.strokeScaling = false
    p.add(point)
    p.add(point)
    this._begun()
  }

  onMouseDown(event) {
    let p = this.path
    if (event.event.button === 2) { // Left button
      event.event.preventDefault()
      if (p && p.segments.length > 2) {
        // Close path and successfully finish tool
        p.closePath()

        this.path = null
        this._done()

        // notify action
        let l = p.layer
        if (window.editor.isInstanceSegmentation()) {
          // if instance segmentation, add polygon to CONSTANTS.MAIN_LAYER_INSTANCE
          // console.log('adding to instance_layer', l.children)
          l = window.editor.cls._findLayerByAlias(CONSTANTS.MAIN_LAYER_INSTANCE)
          l.activate()
        }

        this._action('closePath', function (p) {
          p.remove()
        }.bind(null, p), function (p, l) {
          l.insertChild(l.children.length, p)
        }.bind(null, p, l))


      }
      return;
    }

    if (!this.path) {
      // Start new path
      this.newPath(event.point)
      return
    }

    // Add point to path
    p.add(event.point)
    this._action('point', null, null, {point : event.point})
  }

  onMouseMove(event) {
    if (this.path && this.path.segments.length > 1) {
      this.path.removeSegment(this.path.segments.length -1)
      this.path.add(event.point)
    }
  }

  onKeyUp(e) {
    if (e.key === 'delete' || e.key === 'backspace') {
      paper.project.selectedItems.map(function(r) {
        if (r.className !== 'Path' && r.className !== 'CompoundPath') {
          return
        }
        this._begun()
        let p = r
        let l = p.layer
        p.remove()
        this._action('deletePath', function(p, l) {
          l.addChild(p)
        }.bind(null, p, l), function(p) {
          p.remove()
        }.bind(null, p))
        this._done()
      }.bind(this))
    } else if (e.key === 'v') {
      // hide and un hide actual layer
      let selIt = paper.project.selectedItems.find(function(r) {
        return r.className === 'Path' || r.className === 'CompoundPath'
      })
      this._action('toggleLayer', null, null, { item : selIt })
    } else if (e.key === 's') {
      // select layer of selected item
      let selIt = paper.project.selectedItems.find(function(r) {
        return r.className === 'Path' || r.className === 'CompoundPath'
      })
      // console.log('selIt', selIt)
      if (selIt) {
        this._action('selectLayer', null, null, { item : selIt})
      }
    } else if (e.key === 't') {
      // hide and un hide actual layer
      let selIt = paper.project.selectedItems.find(function(r) {
        return r.className === 'Path' || r.className === 'CompoundPath'
      })

      if (selIt) {
        this._action('transportToLayer', null, null, { item : selIt })
      }
    }
  }

  onKeyDown(event) {
    if (event.key === 'esc' || event.key === 'escape') {
      if (this.state === Tool.STATE.Begun) {
        this.cancel()
      }
    }
  }

  _handleCancel() {
    if (this.state === Tool.STATE.Begun) {
      this.path.remove()
      this.path = null
    }
  }
}
