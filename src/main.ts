import "./style.css";

interface DrawableCommand {
  drag(x: number, y: number): void;
  display(ctx: CanvasRenderingContext2D): void;
}

const displayList: DrawableCommand[] = [];
const redoStack: DrawableCommand[] = [];
let currentLine: DrawableCommand | null = null;

let currentPreview: Tool | Sticker | null = null;

let currentThickness = 2;
let currentTool: "marker" | "sticker" = "marker";
let currentSticker: string | null = null;

const stickers: string[] = ["🌮", "🌯", "🔔"];

//html:

const h1 = document.createElement("h1");
h1.textContent = "Sticker Sketchpad";
document.body.append(h1);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "canvas";

const ctx = canvas.getContext("2d");

//marker
class MarkerLine implements DrawableCommand {
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
    ctx.strokeStyle = "black";
  }
}

//tool
class Tool {
  constructor(
    private x: number,
    private y: number,
    private thickness: number,
  ) {}

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

//stickers

class StickerCommand implements DrawableCommand {
  private x: number;
  private y: number;
  private emoji: string;

  constructor(x: number, y: number, emoji: string) {
    this.x = x;
    this.y = y;
    this.emoji = emoji;
  }

  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.font = "32px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.restore();
  }
}

class Sticker {
  constructor(private x: number, private y: number, private emoji: string) {}

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = 0.5; // semi-transparent
    ctx.font = "32px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.restore();
  }
}

const cursor = { active: false, x: 0, y: 0 };

//cursor events:

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  if (currentTool === "marker") {
    currentLine = new MarkerLine(cursor.x, cursor.y, currentThickness);
    displayList.push(currentLine);
  } else if (currentTool === "sticker" && currentSticker) {
    const sticker = new StickerCommand(cursor.x, cursor.y, currentSticker);
    displayList.push(sticker);
    currentLine = sticker;
  }

  redoStack.splice(0);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  if (cursor.active && currentLine) {
    currentLine.drag(cursor.x, cursor.y);
    canvas.dispatchEvent(new Event("drawing-changed"));
  } else {
    if (currentTool === "marker") {
      currentPreview = new Tool(cursor.x, cursor.y, currentThickness);
    } else if (currentTool === "sticker" && currentSticker) {
      currentPreview = new Sticker(cursor.x, cursor.y, currentSticker);
    } else {
      currentPreview = null;
    }
    canvas.dispatchEvent(new Event("tool-moved"));
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentLine = null;
});

//drawing changed:
canvas.addEventListener("drawing-changed", () => redraw());
canvas.addEventListener("tool-moved", () => redraw());

function redraw() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const cmd of displayList) {
    cmd.display(ctx);
  }

  if (currentPreview && !cursor.active) {
    currentPreview.draw(ctx);
  }
}

//buttons:

const clearButton = document.createElement("button");
clearButton.textContent = "Clear";

clearButton.addEventListener("click", () => {
  displayList.splice(0);
  redoStack.splice(0);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

const undoButton = document.createElement("button");
undoButton.textContent = "Undo";

undoButton.addEventListener("click", () => {
  if (displayList.length === 0) return;
  const undone = displayList.pop()!;
  redoStack.push(undone);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";

redoButton.addEventListener("click", () => {
  if (redoStack.length === 0) return;
  const redone = redoStack.pop()!;
  displayList.push(redone);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

const thinButton = document.createElement("button");
thinButton.textContent = "✏️";
thinButton.classList.add("selectedTool"); //default

const thickButton = document.createElement("button");
thickButton.textContent = "🖌️";

thinButton.addEventListener("click", () => {
  currentThickness = 2;
  currentTool = "marker";
  currentSticker = null;
  updateSelectedTool(thinButton);
});

thickButton.addEventListener("click", () => {
  currentThickness = 6;
  currentTool = "marker";
  currentSticker = null;
  updateSelectedTool(thickButton);
});

function renderStickerButtons() {
  sidePanel.innerHTML = "";

  stickers.forEach((emoji) => {
    const btn = document.createElement("button");
    btn.textContent = emoji;
    btn.onclick = () => selectSticker(emoji, btn);
    sidePanel.appendChild(btn);
  });

  const custom = document.createElement("button");
  custom.textContent = "+";
  custom.onclick = () => {
    const newSticker = prompt("Enter your custom sticker", "🧽"); // from the directions
    if (newSticker && newSticker.trim() !== "") {
      stickers.push(newSticker.trim());
      renderStickerButtons();
    }
  };
  sidePanel.appendChild(custom);
}

function updateSelectedTool(selected: HTMLButtonElement) {
  document.querySelectorAll("button").forEach((btn) => {
    btn.classList.remove("selectedTool");
  });
  selected.classList.add("selectedTool");
  canvas.dispatchEvent(new Event("tool-moved"));
}

function selectSticker(emoji: string, button: HTMLButtonElement) {
  currentTool = "sticker";
  currentSticker = emoji;
  updateSelectedTool(button);
  canvas.dispatchEvent(new Event("tool-moved"));
}

const mainWrapper = document.createElement("div");
mainWrapper.classList.add("main-wrapper");

mainWrapper.appendChild(h1);

const container = document.createElement("div");
container.classList.add("container");

const sidePanel = document.createElement("div");
sidePanel.classList.add("side-panel");

const rightPanel = document.createElement("div");
rightPanel.classList.add("right-panel");

const canvasContainer = document.createElement("div");
canvasContainer.classList.add("canvas-container");
canvasContainer.appendChild(canvas);

const bottomPanel = document.createElement("div");
bottomPanel.classList.add("bottom-panel");

const bottomRow = document.createElement("div");
bottomRow.classList.add("bottom-row");

renderStickerButtons();

container.appendChild(sidePanel);
container.appendChild(canvasContainer);
container.appendChild(rightPanel);

mainWrapper.appendChild(container);
mainWrapper.appendChild(bottomPanel);
mainWrapper.appendChild(bottomRow);

rightPanel.append(thinButton, thickButton);
bottomPanel.append(clearButton, undoButton, redoButton);

document.body.appendChild(mainWrapper);

const exportButton = document.createElement("button");
exportButton.textContent = "Export";

exportButton.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportCtx = exportCanvas.getContext("2d");
  if (!exportCtx) return;

  const scaleX = exportCanvas.width / canvas.width;
  const scaleY = exportCanvas.height / canvas.height;
  exportCtx.scale(scaleX, scaleY);

  displayList.forEach((cmd) => cmd.display(exportCtx));

  const anchor = document.createElement("a");
  anchor.href = exportCanvas.toDataURL("image/png");
  anchor.download = "sketchpad.png";
  anchor.click();
});

bottomRow.appendChild(exportButton);
