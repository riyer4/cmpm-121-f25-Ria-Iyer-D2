//import exampleIconUrl from "./noun-paperclip-7598668-00449F.png";
import "./style.css";

//document.body.innerHTML = `
//  <p>Example image asset: <img src="${exampleIconUrl}" class="icon" /></p>
//`;

const h1 = document.createElement("h1");
h1.textContent = "Sticker Sketchpad";
document.body.append(h1);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.style.width = "256px";
canvas.style.height = "256px";
canvas.id = "sketch_canvas";
document.body.append(canvas);

const ctx = canvas.getContext("2d");
if (ctx){
  ctx.fillStyle = "green";
  ctx.fillRect(10, 10, 150, 100);
}

