/* 从 icons.svg 生成自包含的预览页 icon-gallery.html（sprite 内联，file:// 直接开） */
const fs = require("fs");
const path = require("path");

const dir = __dirname;
const svg = fs.readFileSync(path.join(dir, "icons.svg"), "utf8");

/* --- 解析 symbol 清单 --- */
const re = /<symbol\s+id="([^"]+)"\s+data-g="([^"]+)"\s+viewBox="([^"]+)"[^>]*>\s*<title>([^<]*)<\/title>/g;
const items = [];
let m;
while ((m = re.exec(svg)) !== null) {
  items.push({ id: m[1], g: m[2], vb: m[3], n: m[4] });
}
if (!items.length) { console.error("没有解析到任何 symbol，检查 icons.svg"); process.exit(1); }

const GROUPS = [
  { k: "step",  n: "三步向导",   d: "每日行事的三个步骤，是这套图标的主角" },
  { k: "brick", n: "积木五层",   d: "目标分解的五个层级，一层一图标" },
  { k: "quad",  n: "四象限",     d: "对应四种处置动作，不只是色块" },
  { k: "cat",   n: "知识库九分类", d: "35 个思维模型的九个抽屉" },
  { k: "nav",   n: "导航与全局", d: "顶栏、设置、搜索" },
  { k: "act",   n: "通用操作",   d: "增删改、导入导出、交付标准" },
  { k: "state", n: "状态与提示", d: "警告、达标、未解锁" },
  { k: "art",   n: "插画",       d: "三步主视觉 + 三个空状态，200×140" }
];

const manifest = GROUPS.map(function (g) {
  return { k: g.k, n: g.n, d: g.d, items: items.filter(function (i) { return i.g === g.k; }) };
});

/* --- 页面 --- */
const html = `<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>自律放大器 · 图标与插画集</title>
<style>
:root{
  --font:system-ui,-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  --r:16px; --r2:12px;
}
html[data-theme="light"]{
  --bgbase:#f1f4fc;
  --blobA:rgba(99,120,255,.30); --blobB:rgba(45,190,215,.22); --blobC:rgba(160,120,255,.20);
  --ink:#131829; --ink2:#4b5674; --mute:#8791aa;
  --glass:rgba(255,255,255,.72); --glass2:rgba(255,255,255,.5);
  --line:rgba(24,34,66,.12); --lineS:rgba(24,34,66,.07);
  --acc:#4a5bd8; --acc2:#1f9fb8;
  --field:rgba(255,255,255,.85);
  --sh:0 1px 2px rgba(20,30,60,.05),0 10px 28px -16px rgba(20,30,60,.24);
  --ok:#12a06a;
}
html[data-theme="dark"]{
  --bgbase:#04060e;
  --blobA:rgba(86,104,255,.34); --blobB:rgba(24,180,210,.22); --blobC:rgba(150,80,255,.26);
  --ink:#e9eeff; --ink2:#a5b1d5; --mute:#6d7a9e;
  --glass:rgba(16,22,42,.66); --glass2:rgba(16,22,42,.44);
  --line:rgba(255,255,255,.11); --lineS:rgba(255,255,255,.06);
  --acc:#8b9bff; --acc2:#3ad3e8;
  --field:rgba(6,10,24,.6);
  --sh:0 1px 2px rgba(0,0,0,.5),0 16px 38px -18px rgba(0,0,0,.8);
  --ok:#12be7e;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{
  margin:0;font-family:var(--font);color:var(--ink);line-height:1.62;
  background:var(--bgbase);min-height:100%;overflow-x:hidden;-webkit-font-smoothing:antialiased;
}
body::before{
  content:"";position:fixed;inset:-25% -12%;z-index:-2;pointer-events:none;
  background:
    radial-gradient(46% 38% at 14% 6%,var(--blobA),transparent 66%),
    radial-gradient(42% 34% at 88% 10%,var(--blobB),transparent 64%),
    radial-gradient(52% 44% at 62% 98%,var(--blobC),transparent 66%);
  filter:blur(34px);
}
body::after{
  content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;
  background-image:linear-gradient(var(--lineS) 1px,transparent 1px),linear-gradient(90deg,var(--lineS) 1px,transparent 1px);
  background-size:58px 58px;
  -webkit-mask-image:radial-gradient(82% 62% at 50% 14%,#000,transparent 80%);
  mask-image:radial-gradient(82% 62% at 50% 14%,#000,transparent 80%);
}
.wrap{max-width:1180px;margin:0 auto;padding:0 18px 90px}

.topbar{position:sticky;top:0;z-index:60;background:var(--glass);
  backdrop-filter:blur(22px) saturate(1.7);-webkit-backdrop-filter:blur(22px) saturate(1.7);
  border-bottom:1px solid var(--lineS)}
.topbarIn{max-width:1180px;margin:0 auto;padding:12px 18px;display:flex;align-items:center;
  gap:14px;justify-content:space-between;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:11px;min-width:0}
.logo{flex:none;width:38px;height:38px;border-radius:11px;display:flex;align-items:center;
  justify-content:center;background:linear-gradient(135deg,var(--acc),var(--acc2));color:#fff}
.logo svg{width:22px;height:22px}
.brand b{font-size:16px;font-weight:800;letter-spacing:-.02em}
.brand span{display:block;font-size:11.5px;color:var(--mute);font-weight:500}

.tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.seg{display:flex;background:var(--glass2);border:1px solid var(--line);border-radius:11px;padding:3px;gap:2px}
.seg button{border:none;background:transparent;color:var(--mute);font:inherit;font-size:12.5px;
  font-weight:600;padding:5px 11px;border-radius:8px;cursor:pointer;transition:.16s}
.seg button.on{background:var(--glass);color:var(--ink);box-shadow:var(--sh)}
.btn{border:1px solid var(--line);background:var(--glass2);color:var(--ink2);font:inherit;font-size:12.5px;
  font-weight:600;padding:8px 13px;border-radius:11px;cursor:pointer;transition:.16s;white-space:nowrap}
.btn:hover{border-color:var(--acc);color:var(--ink)}
.btn.pri{background:linear-gradient(135deg,var(--acc),var(--acc2));color:#fff;border-color:transparent}
.search{position:relative;flex:1;min-width:150px;max-width:260px}
.search input{width:100%;font:inherit;font-size:13px;padding:9px 12px 9px 34px;border-radius:11px;
  border:1px solid var(--line);background:var(--field);color:var(--ink);outline:none}
.search input:focus{border-color:var(--acc)}
.search svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);width:15px;height:15px;
  color:var(--mute);pointer-events:none}

.hero{padding:38px 0 8px}
.kicker{font-family:var(--mono);font-size:11px;letter-spacing:.2em;text-transform:uppercase;
  color:var(--acc);font-weight:700}
.hero h1{font-size:clamp(24px,3.6vw,34px);font-weight:800;letter-spacing:-.024em;margin:8px 0 10px;
  background:linear-gradient(120deg,var(--ink),var(--acc) 62%,var(--acc2));
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.hero p{color:var(--ink2);font-size:14px;max-width:660px;margin:0}
.tips{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.tip{font-size:12px;color:var(--mute);background:var(--glass2);border:1px solid var(--lineS);
  padding:4px 10px;border-radius:999px}

section{margin-top:38px}
.secTop{display:flex;align-items:baseline;gap:12px;margin-bottom:6px;flex-wrap:wrap}
.secTop h2{font-size:17px;font-weight:800;letter-spacing:-.018em;margin:0}
.secTop em{font-style:normal;font-size:12.5px;color:var(--mute)}
.secTop .cnt{font-family:var(--mono);font-size:11px;color:var(--acc);font-weight:700;
  background:var(--glass2);border:1px solid var(--lineS);padding:2px 8px;border-radius:999px}
.secDesc{font-size:12.8px;color:var(--mute);margin:0 0 14px}

.grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(126px,1fr))}
.grid.art{grid-template-columns:repeat(auto-fill,minmax(268px,1fr))}
.cell{background:var(--glass);border:1px solid var(--line);border-radius:var(--r2);padding:15px 10px 12px;
  display:flex;flex-direction:column;align-items:center;gap:9px;cursor:pointer;transition:.18s;
  box-shadow:var(--sh);position:relative}
.cell:hover{transform:translateY(-3px);border-color:var(--acc);box-shadow:0 18px 40px -20px rgba(0,0,0,.4)}
.cell .nm{font-size:12.5px;font-weight:700;text-align:center;line-height:1.35}
.cell .id{font-family:var(--mono);font-size:10.5px;color:var(--mute);word-break:break-all;text-align:center}
.cell.art{padding:16px}
.cell.art .art{width:100%;height:auto;display:block}
.ic{color:var(--ink2);display:block}

.empty{padding:26px 14px;text-align:center;color:var(--mute);font-size:13px;
  background:var(--glass2);border:1px dashed var(--line);border-radius:var(--r2)}

.toast{position:fixed;left:50%;bottom:26px;transform:translate(-50%,20px);z-index:200;
  background:var(--glass);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
  border:1px solid var(--line);box-shadow:var(--sh);border-radius:12px;padding:11px 17px;
  font-size:13px;font-weight:600;opacity:0;pointer-events:none;transition:.24s;max-width:90vw}
.toast.on{opacity:1;transform:translate(-50%,0)}
footer{margin-top:46px;padding-top:18px;border-top:1px solid var(--lineS);
  font-size:12.3px;color:var(--mute);display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
@media (max-width:640px){
  .wrap{padding:0 12px 70px}
  .grid{grid-template-columns:repeat(auto-fill,minmax(104px,1fr))}
  .grid.art{grid-template-columns:1fr}
}
</style>
</head>
<body>

<!-- ============ 内联 sprite（file:// 下外链 use 会被 CORS 拦，必须内联） ============ -->
<!-- 内联 sprite 必须用 width/height=0，不能 display:none：display:none 的容器里渐变不渲染，
     会让所有走 url(#渐变) 的笔触整条消失（只剩 currentColor 的副笔触，看着像半截灰影） -->
${svg.replace(/^<svg[^>]*>/, '<svg id="sprite" xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">')}

<div class="topbar"><div class="topbarIn">
  <div class="brand">
    <div class="logo"><svg><use href="#i-check"/></svg></div>
    <div><b>自律放大器 · 图形资源</b><span>__N__ 个图标 · __ART__ 张插画</span></div>
  </div>
  <div class="tools">
    <div class="search">
      <svg><use href="#i-search"/></svg>
      <input id="q" type="search" placeholder="搜名字或 id…" autocomplete="off">
    </div>
    <div class="seg" id="sizeSeg">
      <button data-s="20">20</button><button data-s="24" class="on">24</button>
      <button data-s="32">32</button><button data-s="48">48</button>
    </div>
    <div class="seg" id="modeSeg">
      <button data-m="brand" class="on">渐变</button><button data-m="mono">单色</button><button data-m="ink">墨色</button>
    </div>
    <button class="btn" id="themeBtn">深色</button>
    <button class="btn pri" id="dlBtn">下载 icons.svg</button>
  </div>
</div></div>

<div class="wrap">
  <div class="hero">
    <div class="kicker">ASSET KIT</div>
    <h1>图标与插画集</h1>
    <p>一套给「自律放大器」画的矢量资源。主笔触走品牌渐变（跟随 <code>--acc / --acc2</code>），副笔触用 <code>currentColor</code>，
       所以深浅两套主题都不用换图。点任意一张即可复制引用代码。</p>
    <div class="tips">
      <span class="tip">24×24 网格</span><span class="tip">描边 1.75 · 圆头圆角</span>
      <span class="tip">渐变与单色可切</span><span class="tip">插画 200×140</span>
    </div>
  </div>

  <div id="body"></div>

  <footer>
    <span>自律放大器 · 图形资源 · 单文件零依赖</span>
    <span>共 __N__ 个图标 / __ART__ 张插画</span>
  </footer>
</div>

<div class="toast" id="toast"></div>

<script>
var MANIFEST = ${JSON.stringify(manifest)};
var PRESET = {
  light:{ brand:["#4a5bd8","#1f9fb8"], mono:["#79839b","#79839b"], ink:["#1b2440","#1b2440"] },
  dark: { brand:["#8b9bff","#3ad3e8"], mono:["#7d8aa8","#7d8aa8"], ink:["#e9eeff","#e9eeff"] }
};
var S = 24, MODE = "brand", THEME = "light";
var themeBtn = document.getElementById("themeBtn");

function paint(){
  var c = PRESET[THEME][MODE];
  document.documentElement.style.setProperty("--acc", c[0]);
  document.documentElement.style.setProperty("--acc2", c[1]);
  document.documentElement.setAttribute("data-theme", THEME);
  themeBtn.textContent = THEME === "light" ? "深色" : "浅色";
}

function iconSvg(id, size, vb){
  return '<svg class="ic" width="' + size + '" height="' + size + '" viewBox="' + vb +
         '" fill="none"><use href="#' + id + '"/></svg>';
}
function artSvg(id, vb){
  return '<svg class="art" viewBox="' + vb + '" fill="none"><use href="#' + id + '"/></svg>';
}

function render(){
  var q = (document.getElementById("q").value || "").trim().toLowerCase();
  var host = document.getElementById("body");
  var html = "";
  MANIFEST.forEach(function(g){
    var list = g.items.filter(function(i){
      return !q || i.n.toLowerCase().indexOf(q) >= 0 || i.id.toLowerCase().indexOf(q) >= 0;
    });
    if(!list.length) return;
    var isArt = g.k === "art";
    html += '<section><div class="secTop"><h2>' + g.n + '</h2><span class="cnt">' +
            list.length + '</span><em>' + g.d + '</em></div>';
    if(isArt) html += '<p class="secDesc">可直接放进空状态或步骤页头；虚线部分是「还没发生」的意思。</p>';
    html += '<div class="grid' + (isArt ? ' art' : '') + '">';
    list.forEach(function(i){
      html += '<div class="cell' + (isArt ? ' art' : '') + '" data-id="' + i.id + '" data-vb="' + i.vb + '">' +
              (isArt ? artSvg(i.id, i.vb) : iconSvg(i.id, S, i.vb)) +
              '<div class="nm">' + i.n + '</div><div class="id">' + i.id + '</div></div>';
    });
    html += '</div></section>';
  });
  if(!html) html = '<div class="empty">没有匹配「' + q + '」的图形</div>';
  host.innerHTML = html;
}

function toast(msg){
  var t = document.getElementById("toast");
  t.textContent = msg; t.classList.add("on");
  clearTimeout(t._t); t._t = setTimeout(function(){ t.classList.remove("on"); }, 1600);
}
function copy(text){
  try{
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){ toast("已复制 " + text.slice(0,26) + "…"); },
        function(){ fallback(); });
    } else fallback();
  }catch(e){ fallback(); }
  function fallback(){
    var ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand("copy"); toast("已复制"); }catch(e){ toast("复制失败，请手动选取"); }
    document.body.removeChild(ta);
  }
}

document.getElementById("body").addEventListener("click", function(e){
  var cell = e.target.closest ? e.target.closest(".cell") : null;
  if(!cell) return;
  var id = cell.getAttribute("data-id"), vb = cell.getAttribute("data-vb");
  var isArt = vb.indexOf("200 140") >= 0;
  var w = isArt ? 200 : 24;
  copy('<svg width="' + w + '" height="' + (isArt ? 140 : w) + '" viewBox="' + vb +
       '" fill="none"><use href="icons.svg#' + id + '"/></svg>');
});

document.getElementById("q").addEventListener("input", render);

document.getElementById("sizeSeg").addEventListener("click", function(e){
  var b = e.target.closest("button"); if(!b) return;
  S = parseInt(b.getAttribute("data-s"), 10);
  [].forEach.call(this.querySelectorAll("button"), function(x){ x.classList.remove("on"); });
  b.classList.add("on"); render();
});
document.getElementById("modeSeg").addEventListener("click", function(e){
  var b = e.target.closest("button"); if(!b) return;
  MODE = b.getAttribute("data-m");
  [].forEach.call(this.querySelectorAll("button"), function(x){ x.classList.remove("on"); });
  b.classList.add("on"); paint();
});
themeBtn.addEventListener("click", function(){ THEME = THEME === "light" ? "dark" : "light"; paint(); });

document.getElementById("dlBtn").addEventListener("click", function(){
  var node = document.getElementById("sprite").cloneNode(true);
  node.removeAttribute("style"); node.removeAttribute("id");
  node.removeAttribute("width"); node.removeAttribute("height"); node.removeAttribute("aria-hidden");
  var src = '<?xml version="1.0" encoding="UTF-8"?>\\n' + node.outerHTML;
  var blob = new Blob([src], {type:"image/svg+xml;charset=utf-8"});
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "icons.svg";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(a.href); }, 2000);
  toast("icons.svg 已开始下载");
});

paint(); render();
<\/script>
</body>
</html>
`;

const out = html
  .replace(/__N__/g, String(items.filter(i => i.g !== "art").length))
  .replace(/__ART__/g, String(items.filter(i => i.g === "art").length))
  .replace("<\\/script>", "</script>");

fs.writeFileSync(path.join(dir, "icon-gallery.html"), out, "utf8");
console.log("解析到 " + items.length + " 个 symbol：");
manifest.forEach(g => console.log("  " + g.n + " × " + g.items.length));
console.log("已生成 icon-gallery.html（" + out.length + " 字符）");
