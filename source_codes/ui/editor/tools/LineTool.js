import Tool from "@/components/Editor/Editor2D/tools/Tool";
import { store } from "@/_store/index.js"

export default class LineTool extends Tool {
  constructor(file) {
    super(file)

    this.name = "line"
    this.icon = "fas fa-pencil-alt"
    this.path = null

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

    let cls = window.editor.cls.getActiveClassDefinition()
    p.style = cls.style
    p.closed = false

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
      if (p && p.segments.length >= 2) {
        // Close path and successfully finish tool

        this.path = null
        this._done()

        // notify action
        let l = p.layer
        this._action('closePath', function(p) {
          p.remove()
        }.bind(null, p), function (p, l) {
          l.addChild(p)
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



