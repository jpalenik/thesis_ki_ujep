import PathTool from "@/components/Editor/Editor2D/tools/PathTool"
import PathToolTop from "@/components/Editor/Editor2D/tools/PathToolTop"
import PointerTool from "@/components/Editor/Editor2D/tools/PointerTool"
import LineTool from "@/components/Editor/Editor2D/tools/LineTool"
import LineToolTop from "@/components/Editor/Editor2D/tools/LineToolTop"
import SplitTool from "@/components/Editor/Editor2D/tools/SplitTool"
import CutTool from "@/components/Editor/Editor2D/tools/CutTool"
import ZIndexTool from "@/components/Editor/Editor2D/tools/ZIndexTool"

export default {
  pointer: PointerTool,
  path: PathTool,
  "path-top": PathToolTop,
  line: LineTool,
  "line-top": LineToolTop,
  cut: CutTool,
  split: SplitTool,
  'z-index': ZIndexTool
}
