// @ts-nocheck
/** UniversityBowl — bowl que se monta passo a passo (visual idêntico ao mockup aprovado). Componente puro. */
import React, { useMemo } from "react";

const CSS = `@keyframes sprinkle {
  0%   { transform: translate(var(--sx,0px), -64px) rotate(var(--sr,0deg)) scale(.5); opacity:0; }
  25%  { opacity:1; }
  72%  { transform: translate(0,3px) rotate(0deg) scale(1.08); }
  100% { transform: translate(0,0) rotate(0deg) scale(1); opacity:1; }
}
.uni-sprinkle .sprinkle { transform-box: fill-box; transform-origin:center; animation: sprinkle .7s cubic-bezier(.4,.7,.5,1) both; }
.uni-sprinkle .fadein { animation: fadein .6s ease both; }
@keyframes fadein { from{opacity:0} to{opacity:1} }
@keyframes draw { from { stroke-dashoffset:1; } to { stroke-dashoffset:0; } }
.uni-sprinkle .sauce-draw { stroke-dasharray:1; stroke-dashoffset:1; animation: draw 2.5s ease both; }
@media (prefers-reduced-motion: reduce){ .uni-sprinkle .sprinkle,.uni-sprinkle .fadein,.uni-sprinkle .sauce-draw{ animation:none !important; stroke-dashoffset:0 !important; } }`;

const ART = {
  "180g Arroz de sushi": { kind:"grain", color:"#E6D279" },   // amarelado
  "270g Arroz de sushi": { kind:"grain", color:"#E6D279" },
  "Arroz basmati":       { kind:"grain", color:"#F2EAD4" },   // bege/branco
  "Coconut Basmati":     { kind:"grain", color:"#F2EAD4" },
  "Mix Salad":           { kind:"leafMix" },                  // folhas verde→amarelo
  "Espinafres":          { kind:"leafSpinach" },              // folhas pequenas verde escuro
  "Espinafre":           { kind:"leafSpinach" },
  // greens — each with its own archetype (see gShape)
  "Abacate":             { kind:"cube",       color:"#8FBF66" },
  "Azeitonas":           { kind:"olive",      color:"#6B7B2A" },
  "Batata Doce com Alecrim":{ kind:"roastCube", color:"#F19A4C" },
  "Brócolis":            { kind:"floret",     color:"#2E7D32" },
  "Cebola Roxa":         { kind:"crescent",   color:"#9C4DCC" },
  "Cenoura":             { kind:"grated",     color:"#F08A24" },
  "Courgette":           { kind:"grated",     color:"#9CCC65" },
  "Couve roxa":          { kind:"grated",     color:"#9C5CC4" },
  "Edamame":             { kind:"bean",       color:"#7CB342" },
  "Espargos Grelhados":  { kind:"log",        color:"#3F6B2E" },
  "Grana Padano":        { kind:"flake",      color:"#F2E6A8" },
  "Hummus":              { kind:"dome",       color:"#E7C9A0" },
  "Manga":               { kind:"mangoCube",  color:"#FFB74D" },
  "Morangos":            { kind:"strawberry", color:"#E53935" },
  "Pepino":              { kind:"ring",       color:"#C5E1A5" },
  "Philadelphia":        { kind:"dome",       color:"#F2F2F2" },
  "Tomate Cherry":       { kind:"halfTomato", color:"#E53935" },
  "Wakame":              { kind:"wavy",       color:"#2E6B2E" },
  // proteins: scoop of cubes (salmão/atum), strips (frango), or 4 units (camarão)
  "Juicy Salmon":            { kind:"scoop",  color:"#FF8A65" },
  "Salmão":                  { kind:"scoop",  color:"#FF8A65" },
  "Salmão Braseado":         { kind:"scoop",  color:"#FB7A52" },
  "Atum":                    { kind:"scoop",  color:"#E2496B" },
  "Juicy Tuna":              { kind:"scoop",  color:"#E2496B" },
  "Frango":                  { kind:"strips", color:"#E6C9A3" },
  "Frango Teriyaki":         { kind:"strips", color:"#6E4326" },
  "Camarão c/ Lima e Tomilho":{ kind:"shrimp", color:"#F4A98C" },
  "Camarão Panado":          { kind:"shrimp", color:"#D9A14E" },
  "Miso Glazed Salmon":      { kind:"misoSalmon", color:"#D9A441" },
  "Baked Halloumi":          { kind:"halloumi",   color:"#EAD9A6" },
  // molhos: espiral (3 voltas, fora→dentro) ou zig zag (10 linhas)
  "Sriracha Mayo":       { kind:"zigzag", color:"#ECC94B" },
  "Vinagrete":           { kind:"spiral", color:"#7B5E3B" },
  "Azeite de Limão":     { kind:"spiral", color:"#C9A227" },
  "Azeite + Sal":        { kind:"spiral", color:"#D4B43A" },
  "Ponzu":               { kind:"spiral", color:"#5D4037" },
  "Azeite":              { kind:"spiral", color:"#C9A227" },
  "Creme de Abacate":    { kind:"zigzag", color:"#AED581" },
  "Spicy Peanuts":       { kind:"zigzag", color:"#C77F43" },
  "Manjericão e Hortelã":{ kind:"zigzag", color:"#66BB6A" },
  "Teriyaki":            { kind:"zigzag", color:"#4E342E" },
  "Creamy Caesar":       { kind:"zigzag", color:"#EAD9A0" },
  "Iogurte com Ervas":   { kind:"zigzag", color:"#DDE8C2" },
  "Sim":                 { kind:"sesame" },        // sésamo
  "Não leva":            { kind:"none" },
  "Não":                 { kind:"none" },
  // crispy (toppings)
  "Cebola Crocante":     { kind:"onionBits" },
  "Chilli Flakes":       { kind:"chilli" },
  "Amêndoa":             { kind:"almond" },
  "Ervilhas Wasabi":     { kind:"wasabi" },
  "Algas Nori":          { kind:"nori" },
  "Bacon":               { kind:"baconBit" },
  "Croutons":            { kind:"crouton" },
  "Lima":                { kind:"lime" },
  "Nozes com Mel":       { kind:"walnut" }
};

const SURF = { cx:100, cy:74, rx:72, ry:53 };

// point on the contents ellipse at a given angle and radius fraction
function ptOnEllipse(angle, rfrac, lift=0){
  return {
    x: SURF.cx + rfrac*SURF.rx*Math.cos(angle),
    y: SURF.cy + rfrac*SURF.ry*Math.sin(angle) - lift
  };
}
// positions that pack a sector (radial rings × angular slots)
function fillSector(a0, a1, ri, ro){
  const pts=[]; const rings=4;
  for(let r=0;r<rings;r++){
    const rf = ri + (ro-ri)*(r+0.5)/rings;
    const n = 4 + r;                              // 4,5,6,7 — enche bem a fatia
    for(let j=0;j<n;j++){
      const jit = ((r*7+j*13)%5-2)*0.012;         // pequena variação aleatória
      const a=a0+(a1-a0)*(j+0.5)/n;
      pts.push(ptOnEllipse(a+jit, rf+jit, 3));
    }
  }
  return pts;
}
// filled pie-slice (annular sector) on the ellipse, sampled for smoothness
function sectorPath(a0, a1, ri, ro){
  const N=12; let pts=[];
  for(let i=0;i<=N;i++){ const a=a0+(a1-a0)*i/N; const p=ptOnEllipse(a,ro); pts.push(p); }
  for(let i=N;i>=0;i--){ const a=a0+(a1-a0)*i/N; const p=ptOnEllipse(a,ri); pts.push(p); }
  return "M"+pts.map(p=>p.x.toFixed(1)+" "+p.y.toFixed(1)).join(" L")+" Z";
}

// ---- shapes: centred at (0,0), no position/animation (added by put()) ----
// each green has its own archetype shape
function gShape(kind, color){
  switch(kind){
    case "cube": // abacate
      return `<rect x="-7" y="-7" width="14" height="14" rx="3" fill="${color}" stroke="#000" stroke-opacity=".08"/><rect x="-7" y="-7" width="14" height="4.5" rx="3" fill="#fff" fill-opacity=".22"/>`;
    case "mangoCube": { // manga — cubos amarelos e laranjas misturados
      const c=(_mc++ %2) ? "#FFB74D" : "#FFE082";
      return `<rect x="-6" y="-6" width="12" height="12" rx="2.5" fill="${c}" stroke="#000" stroke-opacity=".08"/><rect x="-6" y="-6" width="12" height="4" rx="2.5" fill="#fff" fill-opacity=".22"/>`;
    }
    case "roastCube": // batata doce assada + alecrim
      return `<rect x="-7" y="-7" width="14" height="14" rx="3" fill="#F19A4C" stroke="#000" stroke-opacity=".1"/>`
           + `<path d="M-7 2 q5 3 9 0 t5 1 v4 q-3 2 -7 2 t-7 -2 Z" fill="#8C5A2B" fill-opacity=".7"/>`
           + `<ellipse cx="-3" cy="-3" rx="2.4" ry="1.6" fill="#7B4A22" fill-opacity=".55"/>`
           + `<path d="M-5 -6 l9 8 M3 -6 l-3 11" stroke="#3F6B36" stroke-width="1" stroke-linecap="round" opacity=".85"/>`;
    case "floret": // brócolis (sugestão)
      return `<rect x="-1.6" y="0" width="3.2" height="7" rx="1.4" fill="#5C8A3A"/>`
           + `<circle cx="-4" cy="-3" r="4.2" fill="#2E7D32"/><circle cx="3" cy="-4" r="4.6" fill="#2E7D32"/><circle cx="0" cy="0" r="4.4" fill="#388E3C"/><circle cx="5" cy="0" r="3.6" fill="#2E7D32"/><circle cx="-5" cy="1" r="3.4" fill="#388E3C"/>`
           + `<circle cx="-3" cy="-4" r=".9" fill="#6D4C41"/><circle cx="3" cy="-2" r=".9" fill="#6D4C41"/><circle cx="0" cy="-1" r=".7" fill="#5D4037"/><circle cx="4" cy="1" r=".7" fill="#5D4037"/>`;
    case "crescent": // cebola roxa — luas de tamanhos diferentes
      return `<g fill="none" stroke="${color}" stroke-linecap="round">`
           + `<path d="M-8 -2 a7 7 0 0 0 7 7" stroke-width="2.6"/>`
           + `<path d="M-2 -6 a5 5 0 0 0 5 5" stroke-width="2.1"/>`
           + `<path d="M2 0 a6 6 0 0 0 6 6" stroke-width="2.3"/></g>`;
    case "grated": // cenoura / courgette / couve roxa — ralado
      return `<g><rect x="-9" y="-4.5" width="18" height="2.3" rx="1.2" fill="${color}" transform="rotate(-12)"/>`
           + `<rect x="-9" y="-1" width="17" height="2.3" rx="1.2" fill="${color}" fill-opacity=".85" transform="rotate(7)"/>`
           + `<rect x="-8" y="3" width="16" height="2.3" rx="1.2" fill="${color}" fill-opacity=".9" transform="rotate(-4)"/></g>`;
    case "log": // espargos grelhados — troncos
      return `<g transform="rotate(-25)"><rect x="-9" y="-3" width="18" height="6" rx="3" fill="#3F6B2E"/><rect x="-9" y="-3" width="18" height="2" rx="2" fill="#fff" fill-opacity=".15"/><path d="M-5 -3 v6 M0 -3 v6 M5 -3 v6" stroke="#26401C" stroke-width="1" opacity=".7"/></g>`;
    case "flake": // grana padano — lascas
      return `<g><rect x="-8" y="-5" width="13" height="6" rx="1.5" fill="#F2E6A8" stroke="#D9C77E" stroke-width=".6" transform="rotate(-10)"/><rect x="-3" y="0" width="11" height="5" rx="1.5" fill="#EFE08C" stroke="#D9C77E" stroke-width=".6" transform="rotate(8)"/></g>`;
    case "dome": // hummus / philadelphia — meia bola
      return `<path d="M-8 4 a8 8 0 0 1 16 0 Z" fill="${color}" stroke="#000" stroke-opacity=".06"/><path d="M-6 2 a6 5 0 0 1 9 -1" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.4"/>`;
    case "strawberry": // morango — triângulo c/ faixa branca
      return `<path d="M0 -8 L7 6 L-7 6 Z" fill="#E53935"/><path d="M0 -5 L2.3 6 L-2.3 6 Z" fill="#fff" fill-opacity=".88"/>`;
    case "ring": // pepino — meia fatia (semicírculo), casca verde escuro
      return `<path d="M-7.5 0 A7.5 7.5 0 0 1 7.5 0 Z" fill="#4F8A2E"/><path d="M-5.8 0 A5.8 5.8 0 0 1 5.8 0 Z" fill="#C5E1A5"/><path d="M-4 0 A4 4 0 0 1 4 0 Z" fill="#EAF6DA"/>`;
    case "halfTomato": // tomate cherry cortado ao meio
      return `<path d="M-8 0 a8 8 0 0 1 16 0 Z" fill="#E53935"/><path d="M-5.5 0 a5.5 5.5 0 0 1 11 0 Z" fill="#EF7B72" fill-opacity=".75"/><circle cx="-2.4" cy="-2" r=".8" fill="#fff" fill-opacity=".55"/><circle cx="2.4" cy="-2" r=".8" fill="#fff" fill-opacity=".55"/>`;
    case "wavy": // wakame — tirinhas onduladas
      return `<path d="M-9 -2 q3 -4 6 0 t6 0 t6 0" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/><path d="M-9 3 q3 -4 6 0 t6 0 t6 0" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`;
    case "olive": // azeitonas (proposta — confirmar)
      return `<ellipse rx="4.6" ry="5.6" fill="#6B7B2A"/><ellipse rx="2" ry="2.7" fill="#A9B765"/>`;
    case "bean": // edamame
      return `<ellipse rx="8" ry="5.5" fill="${color}"/><ellipse cx="-2" cy="-1.5" rx="2.6" ry="1.8" fill="#fff" fill-opacity=".3"/>`;
    default:
      return `<rect x="-7" y="-7" width="14" height="14" rx="3" fill="${color}"/>`;
  }
}
function shape(kind, color, s=1){
  if(kind==="cube")
    return `<rect x="${-8*s}" y="${-8*s}" width="${16*s}" height="${16*s}" rx="${3*s}" fill="${color}" stroke="#000" stroke-opacity=".08"/><rect x="${-8*s}" y="${-8*s}" width="${16*s}" height="${5*s}" rx="${3*s}" fill="#fff" fill-opacity=".22"/>`;
  if(kind==="bean")
    return `<ellipse rx="${9*s}" ry="${6*s}" fill="${color}"/><ellipse cx="${-2*s}" cy="${-1.5*s}" rx="${3*s}" ry="${2*s}" fill="#fff" fill-opacity=".3"/>`;
  if(kind==="shred")
    return `<g transform="rotate(-18)"><rect x="${-10*s}" y="${-3*s}" width="${20*s}" height="${5*s}" rx="${2.5*s}" fill="${color}"/><rect x="${-9*s}" y="${1.5*s}" width="${16*s}" height="${4*s}" rx="${2*s}" fill="${color}" fill-opacity=".75"/></g>`;
  return "";
}
// scoop of small cubes — salmão / atum (1 scoop = 1 portion)
function shapeScoop(color){
  const cubes=[[0,-4],[-6,0],[6,1],[-2,3],[3,-2],[-1,-1]]; let g="";
  cubes.forEach(([dx,dy])=>{ g+=`<rect x="${dx-3.6}" y="${dy-3.6}" width="7.2" height="7.2" rx="1.5" fill="${color}" stroke="#000" stroke-opacity=".08"/><rect x="${dx-3.6}" y="${dy-3.6}" width="7.2" height="2.4" rx="1.5" fill="#fff" fill-opacity=".22"/>`; });
  return g;
}
// strips — frango (beige) / frango teriyaki (dark brown)
function shapeStrips(color){
  const strips=[[-2,-3,-22],[1,0,8],[-1,3,-6]]; let g="";
  strips.forEach(([dx,dy,rot])=>{ g+=`<rect x="${dx-11}" y="${dy-3}" width="22" height="6" rx="3" fill="${color}" transform="rotate(${rot} ${dx} ${dy})" stroke="#000" stroke-opacity=".1"/>`; });
  return g;
}
// single shrimp curl — camarão (4 units = 1 portion)
function shapeShrimp(color){
  return `<path d="M-5 4 q-3 -8 5 -9 q8 -1 7 6 q-1 4 -5 3 q3 -3 -1 -5 q-5 -1 -6 5 Z" fill="${color}" stroke="#000" stroke-opacity=".12"/>`;
}

// ---- put(): position a shape; if new, give it a staggered "sprinkle" toss ----
let _order=0;
let _mc=0;
function put(markup, x, y, isNew, delay){
  const pos=`translate(${(+x).toFixed(1)},${(+y).toFixed(1)})`;
  const rot=(((Math.round((+x)*7+(+y)*13))%60)+60)%60 - 30;   // -30..29, stable per position
  const inner=`<g transform="rotate(${rot})">${markup}</g>`;
  if(!isNew) return `<g transform="${pos}">${inner}</g>`;
  const k=_order++;
  const d=(delay==null)? k*28 : delay;            // explicit delay marks distinct portions
  const sx=((k%2)?1:-1)*(5+(k*29)%9);             // sideways scatter at start
  const sr=((k%2)?1:-1)*(18+(k*13)%28);           // tumble at start
  return `<g transform="${pos}"><g class="sprinkle" style="animation-delay:${d}ms;--sx:${sx}px;--sr:${sr}deg">${inner}</g></g>`;
}

// molho zig zag — 10 linhas atravessando a bowl
function svgZigzag(color,isNew,seed=0,n=15){
  // serpentine that descends top→bottom, touching the rim on every pass
  const pts=[];
  for(let i=0;i<=n;i++){
    const yn = -0.9 + 1.8*i/n;
    const edge = 0.92*Math.sqrt(Math.max(0,1-yn*yn));
    const xn = (i%2 ? edge : -edge);
    pts.push([SURF.cx + xn*SURF.rx, SURF.cy + yn*SURF.ry]);
  }
  const d = "M"+pts.map(p=>p[0].toFixed(1)+" "+p[1].toFixed(1)).join(" L");
  return `<g transform="rotate(${seed*9} ${SURF.cx} ${SURF.cy})"><path pathLength="1" class="${isNew?'sauce-draw':''}" d="${d}" fill="none" stroke="${color}" stroke-opacity=".9" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}
// molho espiral — 3 voltas, de fora para dentro
function svgSpiral(color,isNew,seed=0){
  const turns=3, steps=120, pts=[];
  for(let i=0;i<=steps;i++){
    const t=i/steps, ang=t*turns*2*Math.PI, rf=0.9*(1-t);
    pts.push([SURF.cx + rf*SURF.rx*Math.cos(ang), SURF.cy + rf*SURF.ry*Math.sin(ang)]);
  }
  const d = "M"+pts.map(p=>p[0].toFixed(1)+" "+p[1].toFixed(1)).join(" L");
  return `<g transform="rotate(${seed*47} ${SURF.cx} ${SURF.cy})"><path pathLength="1" class="${isNew?'sauce-draw':''}" d="${d}" fill="none" stroke="${color}" stroke-opacity=".9" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}

function svgSesame(isNew){
  let dots="";
  for(let i=0;i<40;i++){
    const a=(i*137.5)*Math.PI/180, r=0.12+ (i%6)*0.16;
    const x=SURF.cx+r*SURF.rx*Math.cos(a), y=SURF.cy+r*SURF.ry*Math.sin(a)-6;
    const black=(i%2===0);
    const fill=black?"#33312C":"#FBF6E9", stroke=black?"#000":"#D9CBA8";
    const seed=`<ellipse rx="1.8" ry="1.1" fill="${fill}" stroke="${stroke}" stroke-opacity=".5" transform="rotate(${i*40})"/>`;
    dots+=put(seed,x,y,isNew);
  }
  return dots;
}

function _dir(a,b){ const dx=b[0]-a[0], dy=b[1]-a[1]; const L=Math.hypot(dx,dy)||1; return [dx/L,dy/L]; }
function roundedHexPath(cx,cy,rx,ry,rad){
  const pts=[]; for(let k=0;k<6;k++){ const a=(k*60)*Math.PI/180; pts.push([cx+rx*Math.cos(a), cy+ry*Math.sin(a)]); }
  let d="";
  for(let k=0;k<6;k++){
    const p0=pts[(k+5)%6], p1=pts[k], p2=pts[(k+1)%6];
    const d1=_dir(p1,p0), d2=_dir(p1,p2);
    const A=[p1[0]+d1[0]*rad, p1[1]+d1[1]*rad];
    const B=[p1[0]+d2[0]*rad, p1[1]+d2[1]*rad];
    d += (k===0?`M${A[0].toFixed(1)} ${A[1].toFixed(1)}`:`L${A[0].toFixed(1)} ${A[1].toFixed(1)}`);
    d += `Q${p1[0].toFixed(1)} ${p1[1].toFixed(1)} ${B[0].toFixed(1)} ${B[1].toFixed(1)}`;
  }
  return d+"Z";
}
function bowlShell(scale, isSalad){
  if(isSalad){
    // bowl HEXAGONAL com cantos levemente arredondados (saladas)
    return `
    <g transform="translate(100,86) scale(${scale}) translate(-100,-86)">
      <path d="${roundedHexPath(100,80,86,66,15)}" fill="#01579B" fill-opacity=".06"/>
      <path d="${roundedHexPath(100,76,84,64,14)}" fill="#ECEFF1" stroke="#CFD8DC" stroke-width="2.5"/>
      <path d="${roundedHexPath(100,79,79,60,13)}" fill="#DCE3E7"/>
      <path d="${roundedHexPath(100,74,76,58,12)}" fill="#F4FBFF" stroke="#E1F0F7" stroke-width="1"/>
      <g id="CONTENTS"></g>
      <path d="${roundedHexPath(100,74,76,58,12)}" fill="none" stroke="#B0BEC5" stroke-width="1.4" stroke-opacity=".5"/>
    </g>`;
  }
  // near top-down bowl: outer lip + thin wall + interior surface (circular/elíptica)
  return `
  <g transform="translate(100,86) scale(${scale}) translate(-100,-86)">
    <ellipse cx="100" cy="80" rx="86" ry="66" fill="#01579B" fill-opacity=".06"/>
    <ellipse cx="100" cy="76" rx="84" ry="64" fill="#ECEFF1" stroke="#CFD8DC" stroke-width="2.5"/>
    <ellipse cx="100" cy="79" rx="79" ry="60" fill="#DCE3E7"/>
    <ellipse cx="100" cy="74" rx="76" ry="58" fill="#F4FBFF" stroke="#E1F0F7" stroke-width="1"/>
    <g id="CONTENTS"></g>
    <ellipse cx="100" cy="74" rx="76" ry="58" fill="none" stroke="#B0BEC5" stroke-width="1.4" stroke-opacity=".5"/>
  </g>`;
}

function leafShape(color,s=1){
  return `<path d="M0 ${-7*s} q ${5*s} ${7*s} 0 ${14*s} q ${-5*s} ${-7*s} 0 ${-14*s} Z" fill="${color}" stroke="#000" stroke-opacity=".06"/><path d="M0 ${-5*s} V ${5*s}" stroke="#fff" stroke-opacity=".25" stroke-width=".7"/>`;
}
// base layer — grains (rice) or a bed of leaves (salad/spinach)
function baseFill(item, isNew, secondary){
  const a=ART[item]||{}, leaf=(a.kind==="leafMix"||a.kind==="leafSpinach");
  let out= secondary ? "" : `<ellipse class="fadein" cx="${SURF.cx}" cy="${SURF.cy}" rx="${SURF.rx+2}" ry="${SURF.ry+2}" fill="${leaf?'#EAF3DE':'#FAF7EE'}" stroke="#EADFC8" stroke-width="1"/>`;
  if(leaf){
    const tones = a.kind==="leafSpinach" ? ["#2E5D2E","#357A38","#2F6B30"] : ["#7CB342","#AED581","#C5D86B","#9CCC65","#D4E157"];
    const N = a.kind==="leafSpinach" ? 26 : 26;
    for(let i=0;i<N;i++){ const ang=i*137.5*Math.PI/180, r=0.08+(i%6)*0.15; const x=SURF.cx+r*SURF.rx*Math.cos(ang), y=SURF.cy+r*SURF.ry*Math.sin(ang);
      const sc = 3.0 + ((i*37)%11)/10*1.5;   // mix e espinafre: 3.0–4.5, aleatório
      out+=put(leafShape(tones[i%tones.length],sc), x, y, isNew, i*14); }
  } else {
    const gc=a.color||"#E6D279";
    for(let i=0;i<64;i++){ const ang=i*137.5*Math.PI/180, r=0.06+(i%8)*0.115; const x=SURF.cx+r*SURF.rx*Math.cos(ang)+((i*53)%7-3)*0.6, y=SURF.cy+r*SURF.ry*Math.sin(ang)+((i*29)%5-2)*0.6; out+=put(`<ellipse rx="2.4" ry="1.3" fill="${gc}" stroke="#D9C9A0" stroke-opacity=".4" transform="rotate(${(i*47)%180})"/>`, x, y, isNew, i*6); }
  }
  return out;
}
// miso glazed salmon — caramelo, cantos de cima arredondados + tostado
function shapeMiso(color){
  return `<g transform="scale(1.5)"><path d="M-9 7 V-3 a9 4 0 0 1 18 0 V7 Z" fill="${color||'#D9A441'}" stroke="#000" stroke-opacity=".1"/>`
       + `<circle cx="-3" cy="-1" r="1.1" fill="#7A4B1E"/><circle cx="3" cy="1" r="1.1" fill="#7A4B1E"/><circle cx="0" cy="3" r="1" fill="#8C5A2B"/><circle cx="4" cy="-2" r=".9" fill="#7A4B1E"/></g>`;
}
// baked halloumi — cubos beige com pontos tostados
function shapeHalloumi(){
  const cubes=[[0,-4],[-6,0],[6,1],[-2,3],[3,-2],[-1,-1]]; let g="";
  cubes.forEach(([dx,dy])=>{ g+=`<rect x="${dx-3.6}" y="${dy-3.6}" width="7.2" height="7.2" rx="1.5" fill="#EAD9A6" stroke="#000" stroke-opacity=".1"/><circle cx="${dx}" cy="${dy}" r=".9" fill="#9C6B2E" fill-opacity=".7"/>`; });
  return g;
}
// crispy bits — one small piece each
function cShape(kind,i){
  switch(kind){
    case "onionBits": return `<path d="M-2 -2 L2 -3 L3 1 L0 3 L-3 1 Z" fill="#8B5A2B"/>`;
    case "chilli":    return `<rect x="-2.4" y="-1.2" width="4.8" height="2.4" rx=".6" fill="${(i%2)?'#E53935':'#FFC107'}"/>`;
    case "almond":    return `<ellipse rx="3.6" ry="2" fill="#EFE3CC" stroke="#D9C9A8" stroke-width=".5"/>`;
    case "wasabi":    return `<circle r="2.4" fill="${(i%2)?'#A5D66A':'#4F8A2E'}"/>`;
    case "nori":      return `<rect x="-10.2" y="-5.1" width="20.4" height="10.2" rx="2" fill="#23262A"/><rect x="-10.2" y="-5.1" width="20.4" height="3" rx="2" fill="#3A4046" fill-opacity=".5"/>`;
    case "baconBit":  return `<g transform="rotate(-12)"><rect x="-5" y="-1.8" width="10" height="3.6" rx="1.8" fill="#8C3B2B"/><rect x="-5" y="-1.8" width="10" height="1.1" fill="#E8C9B0"/><rect x="-5" y="0.6" width="10" height="1" fill="#C24A33"/></g>`;
    case "crouton":   return `<rect x="-3" y="-3" width="6" height="6" rx="1.2" fill="#E4C98F" stroke="#000" stroke-opacity=".08"/><circle cx="-1" cy="-1" r=".7" fill="#A9762F" fill-opacity=".7"/><circle cx="1.5" cy="1" r=".6" fill="#A9762F" fill-opacity=".7"/>`;
    case "lime":      return `<g transform="scale(4)"><path d="M-6 0 a6 6 0 0 1 12 0 Z" fill="#3F7A2E"/><path d="M-4.2 0 a4.2 4.2 0 0 1 8.4 0 Z" fill="#D8E66A"/><path d="M0 0 v-3.8 M-2 0 l-1.4 -3 M2 0 l1.4 -3" stroke="#3F7A2E" stroke-width=".5" opacity=".6"/></g>`;
    case "walnut":    return `<path d="M-3 -2 L1 -3 L3 0 L1 3 L-3 2 Z" fill="#7A4B25"/><path d="M-3 -2 L1 -3 L3 0" fill="none" stroke="#B07A3E" stroke-width=".6"/>`;
    default:          return `<circle r="2" fill="#C9A227"/>`;
  }
}
// markup instances for one protein portion (camarão = 4 unidades)
function protShapes(p){
  if(p.kind==="shrimp")     return [shapeShrimp(p.color),shapeShrimp(p.color),shapeShrimp(p.color),shapeShrimp(p.color)];
  if(p.kind==="strips")     return [shapeStrips(p.color)];
  if(p.kind==="misoSalmon") return [shapeMiso(p.color)];
  if(p.kind==="halloumi")   return [shapeHalloumi()];
  if(p.kind==="scoop")      return [shapeScoop(p.color)];
  return [gShape(p.kind,p.color)];
}

function renderBowlInner(steps, current, zigLines, isSalad, scale){
  const newStepIdx = current-1;
  // total greens of THIS recipe → fixed number of equal wedges (layout stays put)
  const totalGreens = steps.filter(s=>s.phase==="greens" && s.item!=="Hummus").reduce((n,s)=>n+s.count,0);

  let baseItems=[], greens=[], proteins=[], baseDrizzles=[], drizzles=[], crispy=[], showSesame=false, sesameNew=false;
  for(let i=0;i<current;i++){
    const st=steps[i], art=ART[st.item]||{kind:"none"}, isNew=(i===newStepIdx);
    if(st.phase==="base"){ baseItems.push({item:st.item, isNew}); }
    else if(st.phase==="greens"){
      if(st.item==="Hummus"){ for(let c=0;c<st.count;c++) proteins.push({kind:art.kind,color:art.color,isNew}); }   // hummus = proteína (centro)
      else { for(let c=0;c<st.count;c++) greens.push({kind:art.kind,color:art.color,isNew}); }
    }
    else if(st.phase==="protein"){ if(art.kind!=="none"){ for(let c=0;c<st.count;c++) proteins.push({kind:art.kind,color:art.color,isNew}); } }
    else if(st.phase==="sauce_base"){ if(art.kind!=="none") baseDrizzles.push({pattern:art.kind,color:art.color,isNew}); }
    else if(st.phase==="sauce_final"){ if(art.kind!=="none") drizzles.push({pattern:art.kind,color:art.color,isNew}); }
    else if(st.phase==="crispy"){ if(art.kind!=="none"){ for(let c=0;c<st.count;c++) crispy.push({kind:art.kind,isNew}); } }
    else if(st.phase==="sesame"){ if(st.item==="Sim"){ showSesame=true; sesameNew=isNew; } }
  }

  _order=0; _mc=0;                             // restart the sprinkle stagger each step
  const GAP=260, INTRA=30;                      // GAP = pause between distinct portions
  let contents = "";
  baseItems.forEach((b,i)=> contents += baseFill(b.item, b.isNew, i>0));
  // MOLHO DA BASE — sobre a base, por baixo dos greens/proteína
  baseDrizzles.sort((a,b)=>(a.pattern==="spiral"?0:1)-(b.pattern==="spiral"?0:1));
  baseDrizzles.forEach((d,i)=> contents += (d.pattern==="spiral" ? svgSpiral(d.color,d.isNew,i) : svgZigzag(d.color,d.isNew,i,zigLines)));

  const RI=0.36, RO=0.97, startA=-Math.PI/2;

  if(isSalad){
    // SALAD → greens + proteínas espalhados aleatoriamente por toda a base
    let scatter=[], npc=0;
    greens.forEach(g=>{
      const base = g.isNew ? npc*GAP : 0; if(g.isNew) npc++;
      const reps = g.kind==="dome" ? 1 : 4;
      for(let c=0;c<reps;c++) scatter.push({m: g.kind==="dome"?`<g transform="scale(1.4)">${gShape(g.kind,g.color)}</g>`:gShape(g.kind,g.color), isNew:g.isNew, base, sub:c});
    });
    proteins.forEach(p=>{
      const base = p.isNew ? npc*GAP : 0; if(p.isNew) npc++;
      protShapes(p).forEach((m,c)=> scatter.push({m, isNew:p.isNew, base, sub:c}));
    });
    scatter.forEach((it,i)=>{ const a=i*137.5*Math.PI/180, r=0.1+(i%6)*0.14; const pos=ptOnEllipse(a,r,3); contents+=put(it.m,pos.x,pos.y,it.isNew, it.base+it.sub*16); });
  } else {
    // HOUSE → greens em fatias iguais; proteína no centro
    const step = totalGreens>0 ? (2*Math.PI/totalGreens) : 0;
    let gp=0;
    greens.forEach((g,idx)=>{
      const a0=startA+idx*step, a1=startA+(idx+1)*step, amid=(a0+a1)/2;
      const base = g.isNew ? gp*GAP : 0;
      contents += `<path class="${g.isNew?'fadein':''}" style="${g.isNew?`animation-delay:${base}ms`:''}" d="${sectorPath(a0,a1,RI,RO)}" fill="${g.color}" fill-opacity=".7" stroke="#fff" stroke-opacity=".55" stroke-width="1.2"/>`;
      if(g.kind==="dome"){
        const pos=ptOnEllipse(amid,(RI+RO)/2,5);
        contents += put(`<g transform="scale(1.5)">${gShape(g.kind,g.color)}</g>`, pos.x, pos.y, g.isNew, base);
      } else if(g.kind==="strawberry"){              // morango — 4 fatias distintas por porção
        for(let s=0;s<4;s++){ const aa=a0+(a1-a0)*(s+0.5)/4; const rr=RI+0.12+(s%2)*0.34; const pos=ptOnEllipse(aa, rr, 4); contents += put(gShape(g.kind,g.color), pos.x, pos.y, g.isNew, base + s*45); }
      } else {
        const spots=fillSector(a0,a1,RI+0.04,RO-0.03);
        spots.forEach((pt,si)=> contents += put(gShape(g.kind,g.color), pt.x, pt.y, g.isNew, base + si*15));
      }
      if(g.isNew) gp++;
    });

    const pn=proteins.length;
    if(pn>0 && proteins.every(p=>p.kind==="shrimp")){
      const col=proteins[0].color, anyNew=proteins.some(p=>p.isNew);
      contents += `<path class="${anyNew?'fadein':''}" d="${sectorPath(-Math.PI/2,-Math.PI/2+2*Math.PI,0,RI+0.02)}" fill="${col}" fill-opacity=".92" stroke="#fff" stroke-opacity=".4" stroke-width="1"/>`;
      proteins.forEach((p,u)=>{ const a=u*137.5*Math.PI/180, r=0.1+(u%4)*0.13; const pos=ptOnEllipse(a,r,4); contents+=put(shapeShrimp(p.color),pos.x,pos.y,p.isNew, u*26); });
    } else {
      const stepP = pn>0 ? 2*Math.PI/pn : 0;
      let ppi=0;
      proteins.forEach((p,idx)=>{
        const a0=-Math.PI/2+idx*stepP, a1=-Math.PI/2+(idx+1)*stepP;
        const base = p.isNew ? ppi*GAP : 0;
        contents += `<path class="${p.isNew?'fadein':''}" style="${p.isNew?`animation-delay:${base}ms`:''}" d="${sectorPath(a0,a1,0,RI+0.02)}" fill="${p.color}" fill-opacity=".92" stroke="#fff" stroke-opacity=".4" stroke-width="1"/>`;
        if(p.kind==="strips"){
          for(let k=0;k<3;k++){ const ua=a0+(a1-a0)*(k+0.5)/3; const pos=ptOnEllipse(ua,0.18,4); contents+=put(shapeStrips(p.color),pos.x,pos.y,p.isNew, base+k*30); }
        } else if(p.kind==="misoSalmon"){
          for(let k=0;k<2;k++){ const ua=a0+(a1-a0)*(k+0.5)/2; const pos=ptOnEllipse(ua,0.15,4); contents+=put(shapeMiso(p.color),pos.x,pos.y,p.isNew, base+k*30); }
        } else if(p.kind==="halloumi"){
          for(let k=0;k<3;k++){ const ua=a0+(a1-a0)*(k+0.5)/3; const rr=(k===1)?0.10:0.26; const pos=ptOnEllipse(ua,rr,4); contents+=put(shapeHalloumi(),pos.x,pos.y,p.isNew, base+k*30); }
        } else if(p.kind==="scoop"){
          for(let k=0;k<3;k++){ const ua=a0+(a1-a0)*(k+0.5)/3; const rr=(k===1)?0.10:0.26; const pos=ptOnEllipse(ua,rr,4); contents+=put(shapeScoop(p.color),pos.x,pos.y,p.isNew, base+k*30); }
        } else {
          const mk = p.kind==="dome" ? `<g transform="scale(1.5)">${gShape(p.kind,p.color)}</g>` : gShape(p.kind,p.color);
          const pos=ptOnEllipse((a0+a1)/2,0.14,4); contents+=put(mk,pos.x,pos.y,p.isNew,base);
        }
        if(p.isNew) ppi++;
      });
    }
  }

  // MOLHO FINAL (sobre os toppings, sob os crispy)
  drizzles.sort((a,b)=>(a.pattern==="spiral"?0:1)-(b.pattern==="spiral"?0:1));
  drizzles.forEach((d,i)=> contents += (d.pattern==="spiral" ? svgSpiral(d.color,d.isNew,i) : svgZigzag(d.color,d.isNew,i,zigLines)));

  // CRISPY (por cima dos molhos)
  const CRISPY_COUNT={onionBits:20,chilli:20,almond:20,wasabi:20,nori:5,baconBit:10,crouton:10,lime:1,walnut:10};
  let ci=0;
  crispy.forEach(cb=>{
    const count = CRISPY_COUNT[cb.kind] ?? 10;
    for(let j=0;j<count;j++){ const a=ci*137.5*Math.PI/180, r= cb.kind==="lime"?0.5:(0.14+(ci%5)*0.16); const pos=ptOnEllipse(a,r,7); contents+=put(cShape(cb.kind,j),pos.x,pos.y,cb.isNew, j*20); ci++; }
  });

  // SÉSAMO (por cima dos crispy)
  if(showSesame) contents += svgSesame(sesameNew);

  const shell = bowlShell(scale, isSalad);
  return shell.replace('<g id="CONTENTS"></g>', '<g id="CONTENTS">'+contents+'</g>');
}



let _cssDone = false;
function ensureCSS(){ if (_cssDone || typeof document === "undefined") return; _cssDone = true; const s = document.createElement("style"); s.textContent = CSS; document.head.appendChild(s); }
export interface BowlColumnStep { phase: string; item: string; count: number; }
export default function UniversityBowl({ steps, step, zigLines = 15, isSalad = false, scale = 1, className = "" }:{
  steps: BowlColumnStep[]; step: number; zigLines?: number; isSalad?: boolean; scale?: number; className?: string;
}) {
  ensureCSS();
  const inner = useMemo(() => renderBowlInner(steps, step, zigLines, isSalad, scale), [steps, step, zigLines, isSalad, scale]);
  return <svg viewBox="0 0 200 175" className={"uni-sprinkle " + className} style={{ width: "100%" }} dangerouslySetInnerHTML={{ __html: inner }} />;
}
