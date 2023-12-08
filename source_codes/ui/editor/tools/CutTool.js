import Tool from "@/components/Editor/Editor2D/tools/Tool"
import CONSTANTS from "../helpers/Constants"

export default class CutTool extends Tool {
  constructor(file) {
    super(file)

    this.name = "cut"
    this.icon = "fas fa-cut"

    this.path = null
    this.hole = null
  }

  newHole(point, path) {
    if (this.state !== Tool.STATE.Ready) {
      return
    }

    let p = this.path = path

    let l = p.layer
    if (window.editor.isInstanceSegmentation()) {
      // if instance segmentation, add polygon to CONSTANTS.MAIN_LAYER_INSTANCE
      // console.log('adding to instance_layer')
      l = window.editor.cls._findLayerByAlias(CONSTANTS.MAIN_LAYER_INSTANCE)
      l.activate()
    }

    this.hole = new paper.Path({
      style : p.style
    })
    this.hole.strokeScaling = false
    this.hole.add(point)
    this.hole.add(point)

    if (p.className === 'CompoundPath') {
      p.addChild(this.hole)
    } else {
      let index = p.layer.children.findIndex(item => p.id === item.id)

      p.remove()
      this.path = new paper.CompoundPath({
        style : p.style,
        children : [p, this.hole],
        selected : true,
        fillRule : 'evenodd',
        data : {
          mlwt_id: p.data.mlwt_id,
          class_alias: p.data.class_alias
        }
      })
      this.path.remove()

      l.insertChild(index, this.path)

      this.path.strokeScaling = false
    }
    this._begun()
  }

  onMouseDown(e) {
    if (!this.path && e.item && (e.item.className === 'Path' || e.item.className === 'CompoundPath')) {
      this.newHole(e.point, e.item)
      return
    }

    if (this.state === Tool.STATE.Begun) {
      if (e.event.button === 2) {
        if (this.hole.segments.length > 2) {
          this.hole.closePath()
          this.path = null
          this.hole = null
          // TODO undo
          this._action('closePath')
          this._done()
        }
        return
      }

      this.hole.add(e.point)
    }
  }

  onMouseMove(e) {
    if (this.hole && this.hole.segments.length > 1) {
      this.hole.removeSegment(this.hole.segments.length -1)
      this.hole.add(e.point)
    }

    if (this.state === Tool.STATE.Ready) {
      paper.project.deselectAll()
      if (e.item) {
        e.item.selected = true
      }
    }
  }

  onKeyDown(e) {
    if (e.key === 'esc' || e.key === 'escape') {
      if (this.state === Tool.STATE.Begun) {
        this.cancel()
      }
    }
  }

  _handleCancel() {
    if (this.state === Tool.STATE.Begun) {
      this.hole.remove()
      this.hole = null
      this.path = null
    }
  }
}
