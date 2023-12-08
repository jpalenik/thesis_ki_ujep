import Tool from "@/components/Editor/Editor2D/tools/Tool";

const KEY_MAP = {
  DELETE_ITEM: ['delete', 'backspace'],
  SELECT_CLASS: ['s'],
  TOGGLE_CLASS: ['v'],
  TRANSPORT_TO_CLASS: ['t'],
}
export default class PointerTool extends Tool {
  constructor(file) {
    super(file)

    this.name = "pointer"
    this.icon = "fas fa-location-arrow"
    this.title = "edit"

    this.path = null
    this.segment = null
    this.lastPoint = null
    this.lastHiddenClass = [] // array, LIFO structure
  }

  /**
   * Pointer tool - on mouse down
   *  - call action 'emptyClick'
   *  - call action 'fillClick'
   *  - deleteSegment if command pressed
   *  - add segment on segment click
   * @param {} event
   */
  onMouseDown(event) {
    let hitResult = paper.project.hitTest(event.point, PointerTool.HitOptions);


    // we dont click over anything
    if (!hitResult || hitResult.type === 'pixel') {
      this._action('emptyClick', null, null, {event : event})
      return
    }

    // we have clicked on fill
    if (hitResult.type === 'fill') {
      this._action('fillClick', null, null, {event : event, path : hitResult.item})
      return
    }

    // definitelly something going to happen
    this._begun()

    // we trying to remove segment, now not possible with shift
    if (event.modifiers.meta || event.modifiers.command || event.modifiers.space || event.modifiers.alt) {
      if (hitResult.type === 'segment') {
        let s = hitResult.segment
        s.remove()
        this._action('deleteSegment', null, null, {segment : s})
        if ((paper.project.activeLayer.data.layer_type === 'polygon' && hitResult.item.segments.length < 3) || (paper.project.activeLayer.data.layer_type === 'line' && hitResult.item.segments.length < 2)) {
          hitResult.item.remove()
          let p = hitResult.item
          let l = p.layer
          this._action('deletePath', function(p, l) {
            l.addChild(p)
          }.bind(null, p, l), function(p) {
            p.remove()
          }.bind(null, p), { path : p })
        }
      }
      this._done()
      return
    }


    this.path = hitResult.item
    if (hitResult.type == 'segment') {
      this.segment = hitResult.segment;
    } else if (hitResult.type == 'stroke') {
      let location = hitResult.location
      this.segment = this.path.insert(
        location.index + 1,
        event.point
      );
      this._action('newSegment', null, null, { segment: this.segment })
    }
  }

  /**
   * End of segment movement
   * @param {} event
   */
  onMouseUp(event) {
    let action = !!this.segment
    this.segment = null
    this.path = null
    if (action) {
      this._action('segmentMoved', null, null, { segment : location.index + 1 })
      this._done()
    }
  }

  /**
   *
   * @param {*} event
   */
  onMouseMove(event) {
    if (event.event.ctrlKey) {
      if (this.lastPoint === null) {
        this.lastPoint = event.point
        return
      }
      let point = paper.view.projectToView(event.point)
      let last = paper.view.viewToProject(this.lastPoint);
      let move = last.subtract(event.point)
      paper.view.scrollBy()
      this.lastPoint = point;
      return
    }

    this.lastPoint = null
    paper.project.deselectAll()
    if (event.item && (event.item.className === 'Path' || event.item.className === 'CompoundPath')) {
      event.item.selected = true
    }
  }

  /**
   * Change position of point on moving
   * @param {} event
   */
  onMouseDrag(event) {
    if (this.segment) {
      this.segment.point.x += event.delta.x
      this.segment.point.y += event.delta.y
    }
  }

  /**
   * On key down event
   * @param {} event
   */
  onKeyDown(event) {
    if (KEY_MAP.DELETE_ITEM.indexOf(event.key) > -1) {
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
    } else if (KEY_MAP.TOGGLE_CLASS.indexOf(event.key) > -1) {
      // hide and unhide actual layer
      var selIt = paper.project.selectedItems.find(function(r) {
        return r.className === 'Path' || r.className === 'CompoundPath'
      })
      this._action('toggleClass', null, null, { item : selIt })
    } else if (KEY_MAP.SELECT_CLASS.indexOf(event.key) > -1) {
      // select layer of selected item
      var selIt = paper.project.selectedItems.find(function(r) {
        return r.className === 'Path' || r.className === 'CompoundPath'
      })
      if (selIt) {
        this._action('selectClass', null, null, { item : selIt})
      }
    } else if (KEY_MAP.TRANSPORT_TO_CLASS.indexOf(event.key) > -1) {
      // hide and unhide actual layer
      var selIt = paper.project.selectedItems.find(function(r) {
        return r.className === 'Path' || r.className === 'CompoundPath'
      })
      if (selIt) {
        this._action('transportToClass', null, null, { item : selIt })
      }
    }
  }

  static HitOptions = {
    segments: true,
    stroke: true,
    fill: true,
    tolerance: 2
  }
}

