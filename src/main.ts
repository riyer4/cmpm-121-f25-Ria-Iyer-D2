import "./style.css";

const lines: Array<Array<{ x: number; y: number }>> = [];
let currentLine: Array<{ x: number; y: number }> | null = null;

const redoStack: Array<Array<{ x: number; y: number }>> = [];

const h1 = document.createElement("h1");
h1.textContent = "Sticker Sketchpad";
document.body.append(h1);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "canvas";
document.body.append(canvas);

const ctx = canvas.getContext("2d");

const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentLine = [];
  lines.push(currentLine);
  currentLine.push({ x: cursor.x, y: cursor.y });

  redoStack.splice(0, redoStack.length);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active && currentLine) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    currentLine.push({ x: cursor.x, y: cursor.y });

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

  for (const line of lines) {
    if (line.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(line[0]!.x, line[0]!.y);
    for (const point of line) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
  }
});

const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  lines.splice(0, lines.length);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
document.body.append(undoButton);

undoButton.addEventListener("click", () => {
  if (lines.length === 0) return;
  const lastLine = lines.pop()!;
  redoStack.push(lastLine);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
document.body.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoStack.length === 0) return;
  const lineToRedo = redoStack.pop()!;
  lines.push(lineToRedo);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

document.body.append(clearButton, undoButton, redoButton);
