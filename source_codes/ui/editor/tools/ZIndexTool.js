import Tool from "@/components/Editor/Editor2D/tools/Tool"
import CONSTANTS from "../helpers/Constants"

export default class ZIndexTool extends Tool {
  constructor(file) {
    super(file)

    this.name = "z-index"
    this.icon = "fas fa-layer-group"

    this.tmp_style = null

    this.path = null
    this.overlapping_polygons = []
  }

  selectPath(path) {
    this.path = path

    path.selected = true
    this.tmp_style = {
      strokeColor: path.style.getStrokeColor(),
      strokeWidth: Object.assign(path.style.strokeWidth)
    }

    path.style.strokeWidth = 3
    path.style.strokeColor = 'red'

    this._begun()

    this.overlapping_polygons = this.getOverlappingPolygons(path)

    for (const p of this.overlapping_polygons) {
      if (!p.visible) {
        p.visible = true
        p.to_hide = true
      }
    }

    this.setInfo()
  }

  getOverlappingPolygons(path) {
    let res = []

    let l = window.editor.paper.project._activeLayer
    for (let i = 0; i < l.children.length; i++) {
      if(path.id === l.children[i].id) {
        l.children[i]._selected_for_move = true;
        res.push(l.children[i])
        continue
      } else {
        let is = path.getIntersections(l.children[i])
        if(is.length){
            res.push(l.children[i])
            for(const is_p of is) {
              is_p.path.selected = true
            }
        } else {
          // try to find at least 1 point inside second polygon
          let test_polygon = l.children[i]

          let inside_or_outside = this.testOverlapping(path, test_polygon)

          if(inside_or_outside) {
            res.push(l.children[i])
          }
        }
       }
    }

    return res
  }

  testOverlapping(poly_a, poly_b) {
    try {
      // CompoudPath
      let is_poly_A_compoud = Array.isArray(poly_a.children)
      let is_poly_B_compoud = Array.isArray(poly_b.children)

      let pointA = (is_poly_A_compoud) ? poly_a.children[0].segments[0].point : poly_a.segments[0].point
      let pointB = (is_poly_B_compoud) ? poly_b.children[0].segments[0].point : poly_b.segments[0].point

      if (poly_a.contains(pointB) || poly_b.contains(pointA)) {
        return true
      } else {
        return false
      }
    } catch (e) {
      console.error(e)
      return false
    }
  }

  testOverlapping0(poly_a, poly_b) {
    let inside_or_outside = false

    // CompoudPath
    let is_poly_A_compoud = Array.isArray(poly_a.children)
    let is_poly_B_compoud = Array.isArray(poly_b.children)

    if (is_poly_A_compoud === false && is_poly_B_compoud === false) {
      // console.log('!is_poly_A_compoud && !is_poly_B_compoud')

      // test if selected path contains at least 1 point of polygon to compare
      for (const segment of poly_a.segments) {
        if (poly_b.contains(segment.point)) {
          inside_or_outside = true
          break
        }
      }

      if (!inside_or_outside) {
        for (const segment of poly_b.segments) {
          if (poly_a.contains(segment.point)) {
            inside_or_outside = true
            break
          }
        }
      }
    } else if (!is_poly_A_compoud && is_poly_B_compoud) {
      // console.log('!is_poly_A_compoud && is_poly_B_compoud')
      // test if selected path contains at least 1 point of polygon to compare
      for (const segment of poly_a.segments) {
        if (poly_b.contains(segment.point)) {
          inside_or_outside = true
          break
        }
      }

      if (!inside_or_outside) {
        for (const poly_b_child of poly_b.children) {
          for (const segment of poly_b_child.segments) {
            if (poly_a.contains(segment.point)) {
              inside_or_outside = true
              break
            }
          }
          if (inside_or_outside) {
            break
          }
        }
      }

    } else if (is_poly_A_compoud && !is_poly_B_compoud) {
      // console.log('is_poly_A_compoud && !is_poly_B_compoud')
      // test if selected path contains at least 1 point of polygon to compare
      for (const segment of poly_b.segments) {
        if (poly_a.contains(segment.point)) {
          inside_or_outside = true
          break
        }
      }

      if (!inside_or_outside) {
        for (const poly_a_child of poly_a.children) {
          for (const segment of poly_a_child.segments) {
            if (poly_b.contains(segment.point)) {
              inside_or_outside = true
              break
            }
          }
          if (inside_or_outside) {
            break
          }
        }
      }
    } else {
      for (const poly_a_child of poly_a.children) {
        for (const segment of poly_a_child.segments) {
          if (poly_b.contains(segment.point)) {
            inside_or_outside = true
            break
          }
        }
        if (inside_or_outside) {
          break
        }
      }

      if (!inside_or_outside) {
        // test if selected path contains at least 1 point of polygon to compare
        for (const poly_b_child of poly_b.children) {
          for (const segment of poly_b_child.segments) {
            if (poly_a.contains(segment.point)) {
              inside_or_outside = true
              break
            }
          }
          if (inside_or_outside) {
            break
          }
        }
      }
    }

    return inside_or_outside
  }


  onMouseDown(e) {
    // if (this.state === Tool.STATE.Begun) {
      if (e.item && (e.item.className === 'Path' || e.item.className === 'CompoundPath')) {
        this._handleCancel()
        this.state = Tool.STATE.Ready

        this.selectPath(e.item)
        return
      }
    // }
  }

  getIndexOfSelected() {
    return this.overlapping_polygons.findIndex(item => item._selected_for_move === true)
  }

  setInfo(text) {
    let index = this.getIndexOfSelected()
    document.getElementById("z-index-info").innerHTML = text ? `<div class="label">${text}</div>` :
      `<div>
        <button id="arrow-up-z-index" ${(index === this.overlapping_polygons.length - 1)? "disabled":""} rel='(q)'><i class="fas fa-arrow-up"></i></button>
          <span>
            <strong>${this.overlapping_polygons.length - index}</strong>
            /${this.overlapping_polygons.length}
          </span>
        <button id="arrow-down-z-index" ${(index === 0)? "disabled":""}><i class="fas fa-arrow-down"></i></button>
       </div>`


    let arrow_up = document.getElementById("arrow-up-z-index")
    if (arrow_up) {
      arrow_up.addEventListener('click', function () {
        this.tool.moveAbove(this.tool)
      }.bind({tool: this}))
    }

    let arrow_down = document.getElementById("arrow-down-z-index")
    if (arrow_down) {
      arrow_down.addEventListener('click', function () {
        this.tool.moveBelow(this.tool)
      }.bind({tool: this}))
    }
  }

  onMouseMove(e) {
    // if (this.state === Tool.STATE.Ready) {
      paper.project.deselectAll()
      if (e.item) {
        e.item.selected = true
      }
    // }
  }

  onKeyDown(e) {
    if (document.activeElement.tagName == 'INPUT' || document.activeElement.tagName == 'TEXTAREA') {
      return
    }
    
    if (e.key === 'q' || e.key === 'Q') {
      e.preventDefault()
      this.moveAbove(this)
    } else if (e.key === 'a' || e.key === 'A') {
      e.preventDefault()
      this.moveBelow(this)
    }
  }

  moveAbove(tool) {
    let _tool = this
    if (tool) {
      _tool = tool
    }

    // if not last
    let current_index = _tool.getIndexOfSelected()
    if (current_index < (_tool.overlapping_polygons.length - 1)) {
      _tool.path.moveAbove(_tool.overlapping_polygons[current_index + 1])

      // swap in temp array
      _tool.overlapping_polygons[current_index] = _tool.overlapping_polygons[current_index + 1]
      _tool.overlapping_polygons[current_index + 1] = _tool.path

      _tool.setInfo()

      this._action()
    }
  }

  moveBelow() {
    // if not last
    let current_index = this.getIndexOfSelected()
    if (current_index > 0) {
      this.path.moveBelow(this.overlapping_polygons[current_index - 1])
      // swap in temp array
      this.overlapping_polygons[current_index] = this.overlapping_polygons[current_index - 1]
      this.overlapping_polygons[current_index - 1] = this.path

      this.setInfo()

      this._action()
    }
  }

  onKeyUp(e) {
    if (e.key === 'esc' || e.key === 'escape') {
      if (this.state === Tool.STATE.Begun) {
        this.cancel()
      }
    }
  }

  _restoreVisibility() {
    for (const p of this.overlapping_polygons) {
      if (p.to_hide === true) {
        p.visible = false
        delete p.to_hide
      }
    }
  }

  _handleCancel() {
    // if (this.state === Tool.STATE.Begun) {
      this._reset()
    // }
  }

  _reset() {
    paper.project.deselectAll()

    this._restoreVisibility()

    // reset style
    if (this.tmp_style) {
      this.path.style.strokeColor = this.tmp_style.strokeColor
      this.path.style.strokeWidth = JSON.parse(this.tmp_style.strokeWidth)
    }

    // reset activity for this
    if (this.path) {
      this.path._selected_for_move = false;
    }

    this.tmp_style = null
    this.path = null
    this.overlapping_polygons = []
    this.setInfo('-')
  }

  onActivate() {
    if (this.state === Tool.STATE.Begun) {
      // already started
      this._begun()
    }
  }
}
