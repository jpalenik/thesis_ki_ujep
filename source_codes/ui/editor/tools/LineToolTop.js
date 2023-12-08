import LineTool from "@/components/Editor/Editor2D/tools/LineTool"

export default class LineToolTop extends LineTool {
  constructor(file) {
    super(file)

    this.name = "line-top"
    this.icon = "fas fa-edit"

    this.add_to_top = true
  }
}
