import PathTool from "@/components/Editor/Editor2D/tools/PathTool"

export default class PathToolTop extends PathTool {
  constructor(file) {
    super(file)

    this.name = "path-top"
    this.icon = "fas fa-edit"

    this.add_to_top = true
  }
}
