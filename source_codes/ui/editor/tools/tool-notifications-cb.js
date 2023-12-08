import Tool from "@/components/Editor/Editor2D/tools/Tool"
import { store } from '@/_store'
import CONSTANTS from '../helpers/Constants'


const cb = {
  pointer: {},
  path: {},
  split: {},
  cut: {},
  line: {},
  'z-index': {},
}

// path-top is child class of path with same specifications
cb['path-top'] = cb.path

// line-top is child class of line with same specifications
cb['line-top'] = cb.line

cb.path[Tool.NOTIF.Done] = [
  () => {
     store.dispatch('editor/editor2d/saveState', {push_to_history: true})
     store.dispatch('editor/editor2d/setEditorTool', 'pointer')
  }
]

cb.pointer[Tool.NOTIF.Done] = [
  () => {
    store.dispatch('editor/editor2d/saveState', {push_to_history: false})
  }
]

/**
 * Split tool callbacks
 * @type {(function(...[*]=))[]}
 */
cb.split[Tool.NOTIF.Done] = [
  (tool) => {
    // tool.reset()
    store.dispatch('editor/editor2d/saveState', {push_to_history: true})
    store.dispatch('editor/editor2d/setEditorTool', 'pointer')
  }
]
cb.split[Tool.NOTIF.Inactive] = [
  (tool) => {
      // console.log('inactive')
      // tool.reset()
  }
]

cb.cut[Tool.NOTIF.Done] = [
  () => {
    store.dispatch('editor/editor2d/saveState', {push_to_history: true})
    store.dispatch('editor/editor2d/setEditorTool', 'pointer')
  }
]

/**
 * Pointer Tool callbacks
 * @type {{type: string, fun: fun}[]}
 */
cb.pointer[Tool.NOTIF.Action] = [
  {
    /**
     * Active tool after empty Click, depends on active class type
     * @param {*} tool
     * @param {*} p
     */
    fun: function (tool, p) {
          let cls = window.editor.cls.getActiveClassDefinition()
          let activeTool = null
          switch (cls.layer_type){
            case CONSTANTS.LINE_CLASS_ALIAS:
              store.dispatch('editor/editor2d/setEditorTool', 'line')
              activeTool = store.getters['editor/editor2d/activeTool']
              activeTool.newPath(p.event.point)
              break;
            case CONSTANTS.POLYGON_CLASS_ALIAS:
              store.dispatch('editor/editor2d/setEditorTool', 'path')
              activeTool = store.getters['editor/editor2d/activeTool']
              activeTool.newPath(p.event.point)
              break;
          }
        },
    type: 'emptyClick'
  },
  {
    fun: function(tool, p) {
      let cls = window.editor.cls.getActiveClassDefinition()
      let activeTool = null
      try {
        if (cls.layer_type === 'polygon_2d' &&
            (
              (
                (p.event.item.layer.data.mlwt_id !== CONSTANTS.MAIN_LAYER_INSTANCE)
                && (cls.mlwt_id === p.event.item.layer.data.mlwt_id)
              )
              ||
                (p.event.item.layer.data.mlwt_id === CONSTANTS.MAIN_LAYER_INSTANCE)
                  && (cls.class_alias === p.event.item.data.class_alias)
              )
        ) {
          store.dispatch('editor/editor2d/setEditorTool', 'cut')
          activeTool = store.getters['editor/editor2d/activeTool']
          activeTool.newHole(p.event.point, p.path)
        } else {
          switch (cls.layer_type){
            case CONSTANTS.LINE_CLASS_ALIAS:
              store.dispatch('editor/editor2d/setEditorTool', 'line')
              activeTool = store.getters['editor/editor2d/activeTool']
              activeTool.newPath(p.event.point)
              break;
            case CONSTANTS.POLYGON_CLASS_ALIAS:
              store.dispatch('editor/editor2d/setEditorTool', 'path')
              activeTool = store.getters['editor/editor2d/activeTool']
              activeTool.newPath(p.event.point)
              break;
          }
        }
      } catch(e){
        switch (cls.layer_type){
          case CONSTANTS.LINE_CLASS_ALIAS:
            store.dispatch('editor/editor2d/setEditorTool', 'line')
            activeTool = store.getters['editor/editor2d/activeTool']
            activeTool.newPath(p.event.point)
            break;
          case CONSTANTS.POLYGON_CLASS_ALIAS:
            store.dispatch('editor/editor2d/setEditorTool', 'path')
            activeTool = store.getters['editor/editor2d/activeTool']
            activeTool.newPath(p.event.point)
            break;
        }
      }
    },
    type: 'fillClick'
  },
  {
    /**
     * Save state after segmet added
     * @param {*} tool
     * @param {*} p
     */
    fun: function (tool, p) {
      store.dispatch('editor/editor2d/saveState', {push_to_history: true})
    },
    type: 'newSegment'
  },
  {
    /**
     * Save state on segment move
     * @param {*} tool
     * @param {*} p
     */
    fun: function (tool, p) {
      store.dispatch('editor/editor2d/saveState', {push_to_history: true})
    },
    type: 'segmentMoved'
  },
  {
    /**
     * Save state on path delete
     * @param {*} tool
     * @param {*} p
     */
    fun: function (tool, p) {
      store.dispatch('editor/editor2d/saveState', {push_to_history: true})
    },
    type: 'deletePath'
  },
  {
    /**
     * Save state on segment delete
     * @param {*} tool
     * @param {*} p
     */
    fun: function (tool, p) {
      store.dispatch('editor/editor2d/saveState', {push_to_history: true})
    },
    type: 'deleteSegment'
  },
  {
    /**
     * Hide all items of selected item
     * @param {} tool
     * @param {*} p
     */
    fun: function (tool, p) {
      if (window.editor.isInstanceSegmentation()) {
        if (p.item) {
          p.item.visible = false
          p.item.selected = false
          window.editor.lastHiddenPoly.push(p.item)
          window.editor.lc._resolveUI(p.item.data.class_alias)
        } else {
          let item = window.editor.lastHiddenPoly.pop()
          if (item) {
            item.selected = false
            item.visible = true
            window.editor.lc._resolveUI(item.data.class_alias)
          }
        }
      } else {
        if (p.item && p.item.layer) {
          store.dispatch('editor/editor2d/toggleVisibilityClass', p.item.layer)
          tool.lastHiddenClass.push(p.item.layer)
        } else {
          let l = tool.lastHiddenClass.pop()
          if (l) {
            store.dispatch('editor/editor2d/toggleVisibilityClass', l)
          }
        }
      }
    },
    type: 'toggleClass'
  },
  {
    /**
     * Set active class same as selected item
     * @param {*} tool
     * @param {*} p
     */
    fun: function (tool, p) {
      if (p.item && p.item.layer) {
        store.dispatch('editor/editor2d/setActiveClass', p.item)
      }
    },
    type: 'selectClass'
  },
  {
    /**
     * Transport selected item to active class
     * @param {} tool
     * @param {*} p
     */
    fun: function (tool, p) {

      if (window.editor.instance_segmentation) {
        let cls = window.editor.cls.getActiveClassDefinition()
        p.item.style = cls.style
        p.item.data.class_alias = cls.class_alias

        store.dispatch('editor/editor2d/saveState', {push_to_history: true})
      } else {
        let toLrs = paper.project.activeLayer
        p.item.remove()
        toLrs.addChild(p.item)
        p.item.style = toLrs.data.style

        store.dispatch('editor/editor2d/saveState', {push_to_history: true})
      }
    },
    type: 'transportToClass'
  }
]


cb.line[Tool.NOTIF.Done] = [
  () => {
     store.dispatch('editor/editor2d/saveState', {push_to_history: true})
     store.dispatch('editor/editor2d/setEditorTool', 'pointer')
  }
]

cb['z-index'][Tool.NOTIF.Done] = [
  () => {
     store.dispatch('editor/editor2d/saveState', {push_to_history: true})
     store.dispatch('editor/editor2d/setEditorTool', 'pointer')
  }
]

cb['z-index'][Tool.NOTIF.Action] = [
  () => {
     store.dispatch('editor/editor2d/saveState', {push_to_history: true})
  }
]

cb['z-index'][Tool.NOTIF.Inactive] = [
  (tool) => {
      // console.log('inactive')
      //tool.reset()
  }
]





export default cb
