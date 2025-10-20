import "./style.css";

const displayList: MarkerLine[] = [];
const redoStack: MarkerLine[] = [];
let currentLine: MarkerLine | null = null;
let currentThickness = 2;
let toolDisplay: Tool | null = null;

//html:

const h1 = document.createElement("h1");
h1.textContent = "Sticker Sketchpad";
document.body.append(h1);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "canvas";
document.body.append(canvas);

const ctx = canvas.getContext("2d");

//marker
class MarkerLine {
  private points: { x: number; y: number }[] = [];
  private thickness: number;

  constructor(startX: number, startY: number, thickness: number) {
    this.points.push({ x: startX, y: startY });
    this.thickness = thickness;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;
    ctx.lineWidth = this.thickness;
    ctx.beginPath();
    ctx.moveTo(this.points[0]!.x, this.points[0]!.y);
    for (const { x, y } of this.points) {
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

//tool
class Tool {
  private x: number;
  private y: number;
  private thickness: number;

  constructor(x: number, y: number, thickness: number) {
    this.x = x;
    this.y = y;
    this.thickness = thickness;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }
}

const cursor = { active: false, x: 0, y: 0 };

//cursor events:
canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentLine = new MarkerLine(cursor.x, cursor.y, currentThickness);
  displayList.push(currentLine);
  redoStack.splice(0);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  if (!cursor.active) {
    toolDisplay = new Tool(cursor.x, cursor.y, currentThickness);
    canvas.dispatchEvent(new Event("tool-moved"));
  }

  if (cursor.active && currentLine) {
    currentLine.drag(cursor.x, cursor.y);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentLine = null;
  toolDisplay = null;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

//drawing changed:
canvas.addEventListener("drawing-changed", () => {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const line of displayList) {
    line.display(ctx);
  }

  if (toolDisplay && !cursor.active) {
    toolDisplay.draw(ctx);
  }
});

//tool moved:
canvas.addEventListener("tool-moved", () => {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const line of displayList) {
    line.display(ctx);
  }
  if (toolDisplay) {
    toolDisplay.draw(ctx);
  }
});

//buttons:

const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  displayList.splice(0);
  redoStack.splice(0);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
document.body.append(undoButton);

undoButton.addEventListener("click", () => {
  if (displayList.length === 0) return;
  const undone = displayList.pop()!;
  redoStack.push(undone);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
document.body.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoStack.length === 0) return;
  const redone = redoStack.pop()!;
  displayList.push(redone);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

const thinButton = document.createElement("button");
thinButton.textContent = "Thin Marker";
thinButton.classList.add("selectedTool"); //default
document.body.append(thinButton);

const thickButton = document.createElement("button");
thickButton.textContent = "Thick Marker";
document.body.append(thickButton);

thinButton.addEventListener("click", () => {
  currentThickness = 2;
  thinButton.classList.add("selectedTool");
  thickButton.classList.remove("selectedTool");
});

thickButton.addEventListener("click", () => {
  currentThickness = 6;
  thickButton.classList.add("selectedTool");
  thinButton.classList.remove("selectedTool");
});
