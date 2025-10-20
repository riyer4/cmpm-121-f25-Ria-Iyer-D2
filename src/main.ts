import "./style.css";

const displayList: MarkerLine[] = [];
const redoStack: MarkerLine[] = [];
let currentLine: MarkerLine | null = null;

const h1 = document.createElement("h1");
h1.textContent = "Sticker Sketchpad";
document.body.append(h1);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "canvas";
document.body.append(canvas);

const ctx = canvas.getContext("2d");

class MarkerLine {
  private points: { x: number; y: number }[] = [];

  constructor(startX: number, startY: number) {
    this.points.push({ x: startX, y: startY });
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(this.points[0]!.x, this.points[0]!.y);
    for (const { x, y } of this.points) {
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentLine = new MarkerLine(cursor.x, cursor.y);
  displayList.push(currentLine);
  redoStack.splice(0);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active && currentLine) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    currentLine.drag(cursor.x, cursor.y);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentLine = null;
});

canvas.addEventListener("drawing-changed", () => {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const line of displayList) {
    line.display(ctx);
  }
});

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

document.body.append(clearButton, undoButton, redoButton);
