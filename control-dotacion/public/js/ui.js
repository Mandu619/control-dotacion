export function card(title){
  const d = document.createElement("div");
  d.className = "card";
  if(title){
    const h = document.createElement("h2");
    h.textContent = title;
    d.appendChild(h);
  }
  return d;
}

export function btn(text, cls="btn"){
  const b = document.createElement("button");
  b.className = cls;
  b.textContent = text;
  return b;
}

export function hr(){
  return document.createElement("hr");
}
