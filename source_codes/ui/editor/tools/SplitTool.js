import Tool from "@/components/Editor/Editor2D/tools/Tool"
import { store } from "@/_store/index.js"
import tinyColor from 'tinycolor2'

const ALLOWED_DIVERGENCY = 10

/**
 * Universal splitting tool for polygons or paths
 */
export default class SplitPolygonTool extends Tool {
  constructor(file) {
    super(file)

    this.name = "split"
    this.icon = "fas fa-code-branch"
    this.path = null

    this.path = null
    this.polygon = null
    this.polygon_index = null
    this.activePolygonLayer = null
    this.tmpLastLayerSelected = null // changed
    this.hoverPoint = null
    this.hoverItem = null
    this.startPoint = null
  }

  reset() {
    if(this.path) {
      this.deletePolygon(this.path)
    }
    this.path = null
    this.polygon = null
    this.polygon_index = null
    this.activePolygonId = null
    this.activePolygonLayer = null
    this.hoverPoint = null
    this.hoverItem = null
    this.startPoint = null
    this.state = Tool.STATE.Ready

    if (this.circle) {
      this.circle.remove()
      this.circle = null
    }
}

  setPolygonsLayer() {
    let breakException = {}
    try {
      paper.project.layers.forEach(function(item){
        for(let i = 0; i<item.children.length; i++){
          if(item.children[i].id === this.polygon.id){
            this.activePolygonLayer = item;

            store.dispatch('editor/editor2d/setActiveClass', item)
            throw breakException
          }
        }
      }.bind(this))
    } catch (e) {
      if(e !== breakException) {
        throw e
      }
    }
  }

  newPath(point) {
    if (this.state !== Tool.STATE.Ready) {
      return
    }

    let strokeColor = 'red'
    if(this.polygon.fillColor){
        let clr = tinyColor({
          r: this.polygon.fillColor.red*100,
          g: this.polygon.fillColor.green*100,
          b: this.polygon.fillColor.blue*100
        })
        strokeColor = clr.complement().toRgb()
    }

    let p = this.path = new paper.Path({
      strokeColor: strokeColor,
      strokeWidth: 1,
      closed: false
    })
    p.data = {
      mlwt_id: this.file.getId(),
    }
    p.strokeScaling = false
    p.add(point)

    this._begun()
  }

  createNewPolygon(points) {
    let p = new paper.Path()

    p.style = this.polygon.style
    p.data = {
      mlwt_id: this.file.getId(),
      class_alias: this.polygon.data.class_alias
    }
    p.strokeScaling = false

    points.forEach(point => {
      p.add(point)
    })

    // Close path and sucessfully finish tool
    p.closePath()

    // notify action
    let l = this.activePolygonLayer

    if (!l && this.polygon) {
      l = this.polygon.layer
    }

    p.remove()
    l.insertChild(this.polygon_index, p)
    this._action('closePath')

    return p
  }

  createNewLine(points) {
    let p  = new paper.Path()
    p.style = this.polygon.style
    p.data = {
      mlwt_id : this.file.getId()
    }
    p.strokeScaling = false

    points.forEach(point => {
      p.add(point)
    })

    // notify action
    let l = this.activePolygonLayer

    if (!l && this.polygon) {
      l = this.polygon.layer
    }

    this._action('closePath', function(p) {
      p.remove()
    }.bind(null, p), function(p, l) {
      l.addChild(p)
    }.bind(null, p, l))

    return p
  }

  checkIfContains(polygon, child){
    for(let i = 0; i < child.segments.length; i++){
      if(!polygon.contains(child.segments[i].point)){
        return false
      }
    }
    return true
  }

  newHole(hole, path) {
    let p = path
    let l = p.layer

    if (p.className === 'CompoundPath') {
      p.addChild(hole)
    } else {
      p.remove()
      // l.activate()
      p = new paper.CompoundPath({
        style : path.style,
        children : [p, hole],
        selected : false,
        fillRule : 'evenodd',
        data : path.data
      })

      p.remove()
      l.insertChild(this.polygon_index, p)
      p.strokeScaling = false
    }

    return p
  }

  deletePolygon(polygon) {
    let p = polygon
    let l = p.layer
    p.remove()
    this._action('deletePath', function(p, l) {
      l.addChild(p)
    }.bind(null, p, l), function(p) {
      p.remove()
    }.bind(null, p))
  }

  splitClosed(polygon, path) {
    let mainPolygon = (polygon.children)? polygon.children[0]: polygon

    let firstPoint = mainPolygon.getNearestPoint(path.firstSegment.point)
    let lastPoint = mainPolygon.getNearestPoint(path.lastSegment.point)
    let firstIndex = null
    let lastIndex = null

    let _tmpMinDiv = null
    for(let i = 0; i<mainPolygon.segments.length; i++){
      let _div = firstPoint.getDistance(mainPolygon.segments[i].point)
      if(_div < ALLOWED_DIVERGENCY && (_div < _tmpMinDiv || _tmpMinDiv === null)){
        firstIndex = i
        _tmpMinDiv = _div
      }
    }

    _tmpMinDiv = null
    for(let i = 0; i< mainPolygon.segments.length; i++){
      let _div = lastPoint.getDistance(mainPolygon.segments[i].point)
      if(_div < ALLOWED_DIVERGENCY && i != firstIndex && (_div < _tmpMinDiv || _tmpMinDiv === null)){
        lastIndex = i
        _tmpMinDiv = _div
      }
    }

    // add points to array
    let firstToLast = []
    let lastToFirst = []
    let swapped = false

    if(lastIndex < firstIndex){
      [firstIndex, lastIndex] = [lastIndex, firstIndex]
      swapped = true
    }

    // split for 2 parts
    for(let i = firstIndex; i <= lastIndex; i++){
      // console.log('fl:' + i + `[${mainPolygon.segments[i].point.x}, ${mainPolygon.segments[i].point.y}]`)
      firstToLast.push(mainPolygon.segments[i].point);
    }

    for(let i = lastIndex; i <= (firstIndex + mainPolygon.segments.length); i++) {
      lastToFirst.push(mainPolygon.segments[i%mainPolygon.segments.length].point);
    }

    if(!swapped){
      for(let i = path.segments.length - 2; i > 0; i--) {
        firstToLast.push(path.segments[i].point)
      }
      for(let i = 1; i < path.segments.length - 1; i++) {
        lastToFirst.push(path.segments[i].point)
      }
    } else {
      for(let i = path.segments.length - 2; i > 0; i--) {
        lastToFirst.push(path.segments[i].point)
      }
      for(let i = 1; i < path.segments.length - 1; i++) {
        firstToLast.push(path.segments[i].point)
      }
    }


    // create polygons
    let pFirstToLast = this.createNewPolygon(firstToLast)
    let pLastToFirst = this.createNewPolygon(lastToFirst)

    // check if contains children
    let canCreate = true
    if(polygon.children) {
      let children = polygon.children
      // console.log(children)
      // add children to the right polygon
      while (children.length > 1) {
        // console.log('----c1----')
        if (this.checkIfContains(pFirstToLast, children[children.length - 1])) {
          // console.log('----c12----')
          pFirstToLast = this.newHole(children[children.length - 1], pFirstToLast)
        } else if (this.checkIfContains(pLastToFirst, children[children.length - 1])) {
          // console.log('----c13----')
          pLastToFirst = this.newHole(children[children.length - 1], pLastToFirst)
        } else {
          // console.log('----c14----')
          // not necessary to check more children
          canCreate = false
          break
        }
      }
    }

    canCreate = true

    if(!canCreate){
      // we need to delete temp polygons and path
      this.deletePolygon(pFirstToLast)
      this.deletePolygon(pLastToFirst)
      this.deletePolygon(path)
    } else {
      // we need to delete original polygon and path
      this.deletePolygon(path)
      this.deletePolygon(polygon)
    }
  }

  splitNotClosed(polygon, path) {
    let mainPolygon = (polygon.children)? polygon.children[0]: polygon

    let firstPoint = mainPolygon.getNearestPoint(path.firstSegment.point)
    let firstIndex = null

    let _tmpMinDiv = null
    for(let i = 0; i<mainPolygon.segments.length; i++){
      let _div = firstPoint.getDistance(mainPolygon.segments[i].point)
      if(_div < ALLOWED_DIVERGENCY && (_div < _tmpMinDiv || _tmpMinDiv === null)){
        firstIndex = i
        _tmpMinDiv = _div
      }
    }

    // add points to array
    let firstToLast = []
    let lastToFirst = []

    // split for 2 parts
    for(let i = 0; i <= firstIndex; i++){
      firstToLast.push(mainPolygon.segments[i].point);
    }

    for(let i = firstIndex; i < mainPolygon.segments.length; i++) {
      lastToFirst.push(mainPolygon.segments[i].point);
    }

    // create polygons
    let pFirstToLast = this.createNewLine(firstToLast)
    let pLastToFirst = this.createNewLine(lastToFirst)

    this.deletePolygon(path)
    this.deletePolygon(polygon)

  }

  onMouseDown(event) {
    let p = this.path

    if (this.hoverPoint) {
      console.log('hoverPoint')

      if (this.hoverPoint == this.startPoint) {
        return
      }

      const point = this.hoverPoint //.clone()

      if (this.hoverItem.closed === true) {
        // we will start with path inside the polygon
        if(!this.path) {
          if((this.hoverItem.parent.className === 'CompoundPath' && this.hoverItem.previousSibling === null) || this.hoverItem.className === 'Path') {
            this.tmpLastLayerSelected = window.editor.cls.getActiveClassDefinition()
            this.polygon = this.hoverItem.parent.className === 'CompoundPath' ? this.hoverItem.parent : this.hoverItem
            this.polygon_index = this.polygon.layer.children.findIndex(item => this.polygon.id === item.id)
            console.log('1: pi', this.polygon_index)

            this.activePolygonId = this.hoverItem.data.mlwt_id
            this.startPoint = point
            this.newPath(point)
            this.setPolygonsLayer()
          }
        } else if(this.activePolygonId === this.hoverItem.data.mlwt_id
          && (
            (this.hoverItem.parent.className === 'CompoundPath' && this.hoverItem.previousSibling === null) || this.hoverItem.className === 'Path')
        ) {
          console.log('---s32---')
          // Close path and successfully finish tool
          p.add(point)
          this._action('point', null, null, {point : point})
          this.splitClosed(this.polygon, this.path);

          console.log('---split done 1---')
          //
          console.log('x2')

          this.polygon = null
          this.path = null

          this.hoverPoint = null
          this.hoverItem = null
          this.startPoint = null

          if (this.circle) {
            this.circle.remove()
            this.circle = null
          }

          //this.reset()
          this._done()


        }
      } else {
        console.log('---s33---')
        if (!this.path) {
          console.log('---s331---')
          if (this.hoverItem.className === 'Path') {
            console.log('---s332---')
            this.tmpLastLayerSelected = window.editor.cls.getActiveClassDefinition()
            this.polygon = this.hoverItem.parent.className === 'CompoundPath' ? this.hoverItem.parent : this.hoverItem
            this.polygon_index = this.polygon.layer.children.findIndex(item => this.polygon.id === item.id)
            console.log('2: pi', this.polygon_index)
            this.startPoint = point
            this.activePolygonId = this.hoverItem.data.mlwt_id
            this.newPath(point)
            this.setPolygonsLayer()

            // Close path and successfully finish tool
            // p.add(event.point)
            this._action('point', null, null, {point : point})
            this.splitNotClosed(this.polygon, this.path);

            console.log('x1')

            this.polygon = null
            this.path = null

            this.hoverPoint = null
            this.hoverItem = null
            this.startPoint = null

            if (this.circle) {
              this.circle.remove()
              this.circle = null
            }

            // this.reset()
            this._done()

            console.log('path', this.path)
          }
        }
      }
      
      return
    }


    const HitOptions = {
      segments: false,
      stroke: false,
      fill: true,
      tolerance: 1
    }

    let hitResult = paper.project.hitTest(event.point, HitOptions);

    // we dont click over anything
    if (!hitResult || hitResult.type === 'pixel') {
      // empty click (call action to allow activate another tool; without undo/redo)
      this._action('emptyClick', null, null, {event : event})
      return
    }

    // we have clicked on fill
    if (hitResult.type === 'fill' && this.path !== null && this.activePolygonId === hitResult.item.data.mlwt_id) {
      console.log('---s2---')
      p.add(event.point)
      this._action('point', null, null, {point : event.point})
      return
    }


  }

  onMouseMove(e) {

    if (this.circle && this.circle == e.item) {
      return
    }

    // polygon split did not start, select under the cursor
    if(this.polygon === null) {
      paper.project.deselectAll()
      if (e.item && (e.item.className === 'Path' || e.item.className === 'CompoundPath')) {
        e.item.selected = true
      }
    }

    if (this.hoverPoint) {
      this.hoverPoint.selected = false
      this.hoverPoint = null
      this.hoverItem = null
    }

    const HitOptions = {
      segments: true,
      stroke: false,
      fill: false,
      //selected : true,
      tolerance: 10 / paper.view.zoom
    }

    //select vertex
    if (e.item && (e.item.className === 'Path' || e.item.className === 'CompoundPath')) {
      //let hitResult = paper.project.hitTest(e.point, HitOptions);
      let hitResult = e.item.hitTest(e.point, HitOptions);

      if (hitResult && hitResult.type === 'segment' && hitResult.item.data.mlwt_id && (this.polygon === null || (this.polygon.data.mlwt_id === hitResult.item.data.mlwt_id))) {
        //hitResult.segment.point.selected = true
        this.hoverPoint = hitResult.segment.point
        this.hoverItem = hitResult.item
        //e.item.segments[hitResult.segment.index].point.selected = true
        
        if (this.circle) {
          this.circle.center = hitResult.segment.point
        } else {
          this.circle = new paper.Path.Circle({
            center: hitResult.segment.point,
            radius: 10 / paper.view.zoom ,
          })
          this.circle.strokeColor = 'black'
          this.circle.strokeWidth = 2 / paper.view.zoom 
        }

      }

    }
    
    if (!this.hoverPoint && this.circle) {
      this.circle.remove()
      this.circle = null
    }

  }

  onZoom() {
    if (this.circle) {
   
      const position = this.circle.position

      this.circle.remove()
   
      this.circle = new paper.Path.Circle({
        center: position,
        radius: 10 / paper.view.zoom ,
      })

      this.circle.strokeColor = 'black'
      this.circle.strokeWidth = 2 / paper.view.zoom 

    }
  }

  onKeyUp(e) {
    if (e.key === 'esc' || e.key === 'escape') {
      if (this.state === Tool.STATE.Begun) {
        this.reset()
      }
    }
  }

  _handleCancel() {
    if (this.state === Tool.STATE.Begun) {
      this.reset()
    }
  }
}
