/* ============================================================
   build-v3.js —— 从 v2 备份派生 v3（参考 zenofthinking + ai-bot.cn 的目录式卡片设计）
   用法：node assets/build-v3.js
   输入：assets/index-v2-backup.html
   输出：index.html
   铁律：每个替换必须精确命中 1 次，否则 exit 1 且不写文件
   ============================================================ */
"use strict";
var fs = require("fs");
var path = require("path");

var ROOT = path.resolve(__dirname, "..");
var SRC = path.join(ROOT, "assets", "index-v2-backup.html");
var CSS = path.join(ROOT, "assets", "theme-v3.css");
var OUT = path.join(ROOT, "index.html");

var src = fs.readFileSync(SRC, "utf8").replace(/\r\n/g, "\n");
var css = fs.readFileSync(CSS, "utf8").replace(/\r\n/g, "\n");
var out = src;
var fails = [];

function count(hay, needle){
  if(needle instanceof RegExp){
    return (hay.match(needle) || []).length;
  }
  var n = 0, i = 0;
  while(true){
    var p = hay.indexOf(needle, i);
    if(p < 0) break;
    n++; i = p + needle.length;
  }
  return n;
}
/* 精确替换：必须命中 exactly 次 */
function rep(tag, from, to, times){
  times = (times === undefined) ? 1 : times;
  var c = typeof from === "string" ? count(out, from) : (out.match(from) || []).length;
  if(c !== times){ fails.push(tag + "：期望命中 " + times + " 次，实际 " + c); return; }
  if(typeof from === "string"){
    if(times === 0) return;
    out = out.split(from).join(to);
  }else{
    out = out.replace(from, to);
  }
}
/* 正则全部替换：必须至少命中 min 次 */
function repAll(tag, re, to, min){
  var c = (out.match(re) || []).length;
  if(c < min){ fails.push(tag + "：期望至少 " + min + " 处，实际 " + c); return; }
  out = out.replace(re, to);
}

/* ---------- 1. 样式整体换新 ---------- */
rep("style", /<style>[\s\S]*?<\/style>/, "<style>\n" + css.replace(/\s+$/, "\n") + "</style>");

/* ---------- 2. sprite：删掉全部插画，只留图标 ---------- */
repAll("插画渐变 defs", /  <!-- 200×140 插画用 -->[\s\S]*?<\/defs>\n<defs>\n  <linearGradient id="gIs"[\s\S]*?<\/defs>\n/, "</defs>\n", 1);
repAll("插画 symbol", /<symbol id="a-[^"]*"[\s\S]*?<\/symbol>\n/g, "", 21);

/* ---------- 3. 数据与状态：去掉插画风格字段，加 home tab ---------- */
rep("tab-home", '    d.ui.tab  = (u.tab === "kb") ? "kb" : "daily";',
                '    d.ui.tab  = (u.tab === "kb") ? "kb" : (u.tab === "home" ? "home" : "daily");');
rep("art-normalize", '    d.ui.art  = ART_SETS[u.art] ? u.art : "sce";\n', "");
rep("art-default", 'sel:null, art:"sce",', 'sel:null,');

/* ---------- 4. 资源引用区：删插画函数，留图标 ---------- */
rep("art-block",
'/* ---------- 矢量资源：图标 / 插画引用 ---------- */\n' +
'var STEP_ICO  = ["i-step1","i-step2","i-step3"];\n' +
'var BRICK_ICO = ["i-brick-text","i-brick-basis","i-brick-target","i-brick-gap","i-brick-action"];\n' +
'var ART_SETS = {\n' +
'  sce:{ n:"场景叙事", d:"外板 + 内板撑纵深，道具压中调，主体深描边浅填充，暖色点一下" },\n' +
'  stk:{ n:"描边贴纸", d:"品牌实色底，白色厚描边主体，深色细内轮廓；不跟主题变" },\n' +
'  iso:{ n:"立体等距", d:"顶面亮 / 正面中 / 侧面暗，落一道硬投影，最稳重" }\n' +
'};\n' +
'function artSet(){ return ART_SETS[DB.ui.art] ? DB.ui.art : "sce"; }\n' +
'function ico(id, cls){\n' +
'  return \'<svg class="ico\' + (cls ? " " + cls : "") + \'" viewBox="0 0 24 24" aria-hidden="true">\'\n' +
'    + \'<use href="#\' + id + \'"/></svg>\';\n' +
'}\n' +
'function artFix(id, set, cls){\n' +
'  return \'<svg class="art\' + (cls ? " " + cls : "") + \'" viewBox="0 0 200 140" aria-hidden="true">\'\n' +
'    + \'<use href="#a-\' + id + \'-\' + set + \'"/></svg>\';\n' +
'}\n' +
'function art(id, cls){ return artFix(id, artSet(), cls); }\n' +
'function artPick(){\n' +
'  var cur = artSet(), order = ["sce","stk","iso"], h = \'<div class="artPick">\';\n' +
'  for(var i=0;i<order.length;i++){\n' +
'    var k = order[i];\n' +
'    h += \'<button class="artOpt\' + (cur === k ? " on" : "") + \'" data-set-art="\' + k + \'" type="button">\'\n' +
'      + artFix("amp", k) + \'<b>\' + ART_SETS[k].n + \'</b><span>\' + ART_SETS[k].d + \'</span></button>\';\n' +
'  }\n' +
'  return h + \'</div>\';\n' +
'}\n',
'/* ---------- 矢量资源：图标引用 ---------- */\n' +
'var STEP_ICO  = ["i-step1","i-step2","i-step3"];\n' +
'var BRICK_ICO = ["i-brick-text","i-brick-basis","i-brick-target","i-brick-gap","i-brick-action"];\n' +
'function ico(id, cls){\n' +
'  return \'<svg class="ico\' + (cls ? " " + cls : "") + \'" viewBox="0 0 24 24" aria-hidden="true">\'\n' +
'    + \'<use href="#\' + id + \'"/></svg>\';\n' +
'}\n');

/* ---------- 5. 去插画：章节配图 ×4 ---------- */
rep("secArt-1", '    + \'<figure class="secArt">\' + art("step1") + \'</figure>\'\n', "");
rep("secArt-2", '    + \'<figure class="secArt">\' + art("step2") + \'</figure>\'\n', "");
rep("secArt-3", '    + \'<figure class="secArt">\' + art("step3") + \'</figure>\'\n', "");
rep("secArt-4", '    + \'<figure class="secArt">\' + art("amp") + \'</figure>\'\n', "");

/* ---------- 6. 去插画：空状态 ×3（换成图标） ---------- */
rep("empty-1",
  'return h + \'<div class="card"><div class="empty hasArt">\' + art("empty-goals") + \'<b>还没有拆解卡</b>\'',
  'return h + \'<div class="card"><div class="empty">\' + ico("i-brick-text", "xl") + \'<b>还没有拆解卡</b>\'');
rep("empty-2",
  '? \'<div class="empty hasArt" style="margin-bottom:16px">\' + art("empty-quad")',
  '? \'<div class="empty" style="margin-bottom:16px">\' + ico("i-q1", "xl")');
rep("empty-3",
  'return h + \'<div class="card"><div class="empty hasArt">\' + art("empty-timeline") + \'<b>今天还是空的</b>',
  'return h + \'<div class="card"><div class="empty">\' + ico("i-timer", "xl") + \'<b>今天还是空的</b>');

/* ---------- 7. 顶栏 ---------- */
rep("topbar",
'function topbar(){\n' +
'  return \'<div class="topbar"><div class="topbarIn">\'\n' +
'    + \'<div class="brand"><div class="logo">自</div>\'\n' +
'    +   \'<div class="brandTx"><b>自律放大器</b><span>把决策前置，让执行当场不需要做选择</span></div>\'\n' +
'    + \'</div>\'\n' +
'    + \'<div class="tAct">\'\n' +
'    +   \'<button class="iconBtn" data-act="toggleTheme" title="切换主题">\' + ico("i-theme") + (DB.theme === "dark" ? "晨雾" : "夜航") + \'</button>\'\n' +
'    +   \'<button class="iconBtn" data-act="openSettings" title="设置与数据">\' + ico("i-settings") + \'设置</button>\'\n' +
'    + \'</div>\'\n' +
'    + \'</div></div>\';\n' +
'}',
'function topbar(){\n' +
'  return \'<div class="topbar"><div class="topbarIn">\'\n' +
'    + \'<div class="brand" data-tab="home" role="button" tabindex="0" title="回到总览"><div class="logo">自</div>\'\n' +
'    +   \'<div class="brandTx"><b>自律放大器</b><span>把决策前置，让执行当场不需要做选择</span></div>\'\n' +
'    + \'</div>\'\n' +
'    + \'<div class="tAct">\'\n' +
'    +   \'<button class="iconBtn" data-act="toggleTheme" title="切换主题">\' + ico("i-theme") + (DB.theme === "dark" ? "晨雾" : "夜航") + \'</button>\'\n' +
'    +   \'<button class="iconBtn" data-act="openSettings" title="设置与数据">\' + ico("i-settings") + \'设置</button>\'\n' +
'    + \'</div>\'\n' +
'    + \'</div></div>\';\n' +
'}');

/* ---------- 8. 主导航：分段控件 → 横向类目 tab ---------- */
rep("mainNav",
'function mainNav(){\n' +
'  var t = DB.ui.tab === "kb" ? 1 : 0;\n' +
'  return \'<div class="mainNav"><div class="seg" style="--n:2;--i:\' + t + \'">\'\n' +
'    + \'<div class="segInd"></div>\'\n' +
'    + \'<button class="segBtn\' + (t === 0 ? " on" : "") + \'" data-tab="daily">\'\n' +
'    +   ico("i-today") + \'<span class="sn">TODAY</span><span class="sb">今日行事</span></button>\'\n' +
'    + \'<button class="segBtn\' + (t === 1 ? " on" : "") + \'" data-tab="kb">\'\n' +
'    +   ico("i-library") + \'<span class="sn">LIBRARY</span><span class="sb">思维模型库 \' + KB.length + \'</span></button>\'\n' +
'    + \'</div></div>\';\n' +
'}',
'function mainNav(){\n' +
'  var t = DB.ui.tab;\n' +
'  var items = [\n' +
'    { id:"home",  ic:"i-spark",   tx:"总览" },\n' +
'    { id:"daily", ic:"i-today",   tx:"今日行事" },\n' +
'    { id:"kb",    ic:"i-library", tx:"思维模型库" }\n' +
'  ];\n' +
'  var counts = { daily:DB.goals.length, kb:KB.length, home:0 };\n' +
'  var h = \'<div class="navbar"><nav class="tabs">\';\n' +
'  for(var i=0;i<items.length;i++){\n' +
'    var it = items[i];\n' +
'    h += \'<button class="tab\' + (t === it.id ? " on" : "") + \'" data-tab="\' + it.id + \'">\'\n' +
'      + ico(it.ic, "s") + \'<span>\' + esc(it.tx) + \'</span>\'\n' +
'      + (counts[it.id] ? \'<span class="n">\' + counts[it.id] + \'</span>\' : \'\')\n' +
'      + \'</button>\';\n' +
'  }\n' +
'  return h + \'</nav></div>\';\n' +
'}');

/* ---------- 9. render：加首页路由 ---------- */
rep("render",
'  var h = topbar();\n' +
'  h += \'<div class="wrap">\';\n' +
'  h += mainNav();\n' +
'  h += (DB.ui.tab === "kb") ? viewKB() : viewDaily();\n' +
'  h += \'<div class="foot">自律放大器 · 行动操作系统<br>数据只存在<b>这台设备</b>的浏览器里，换设备或清缓存前先点右上角导出备份</div>\';\n' +
'  h += \'</div>\';',
'  var h = topbar();\n' +
'  h += mainNav();\n' +
'  if(DB.ui.tab === "home"){\n' +
'    h += viewHome();\n' +
'  }else{\n' +
'    h += \'<div class="wrap">\';\n' +
'    h += (DB.ui.tab === "kb") ? viewKB() : viewDaily();\n' +
'    h += \'<div class="foot">自律放大器 · 行动操作系统<br>数据只存在<b>这台设备</b>的浏览器里，换设备或清缓存前先点右上角导出备份</div>\';\n' +
'    h += \'</div>\';\n' +
'  }');

/* ---------- 10. 每日行事：stepper 化 ---------- */
rep("viewDaily",
'function viewDaily(){\n' +
'  var h = coachStrip();\n' +
'  h += \'<div class="seg" style="--n:3;--i:\' + DB.ui.step + \'">\'\n' +
'    + \'<div class="segInd"></div>\';\n' +
'  var counts = [DB.goals.length, DB.goals.length - assignedCount(), DB.today.length];\n' +
'  for(var i=0;i<STEPS.length;i++){\n' +
'    h += \'<button class="segBtn\' + (DB.ui.step === i ? " on" : "") + \'" data-step="\' + i + \'">\'\n' +
'      + ico(STEP_ICO[i], "l")\n' +
'      + \'<span class="sn">\' + STEPS[i].sn + \'</span>\'\n' +
'      + \'<span class="sb">\' + STEPS[i].n + (counts[i] ? " " + counts[i] : "") + \'</span>\'\n' +
'      + \'</button>\';\n' +
'  }\n' +
'  h += \'</div>\';\n',
'function viewDaily(){\n' +
'  var h = coachStrip();\n' +
'  h += \'<div class="seg" style="--n:3;--i:\' + DB.ui.step + \'">\'\n' +
'    + \'<div class="segInd"></div>\';\n' +
'  var counts = [DB.goals.length, DB.goals.length - assignedCount(), DB.today.length];\n' +
'  for(var i=0;i<STEPS.length;i++){\n' +
'    h += \'<button class="segBtn\' + (DB.ui.step === i ? " on" : "") + \'" data-step="\' + i + \'">\'\n' +
'      + \'<span class="sno">0\' + (i + 1) + \'</span>\'\n' +
'      + \'<span class="stx">\' + ico(STEP_ICO[i], "l")\n' +
'      +   \'<span class="sw"><span class="sn">\' + STEPS[i].sn + \'</span>\'\n' +
'      +   \'<span class="sb">\' + STEPS[i].n + (counts[i] ? " " + counts[i] : "") + \'</span></span></span>\'\n' +
'      + \'</button>\';\n' +
'  }\n' +
'  h += \'</div>\';\n');

/* ---------- 11. 思维模型库：搜索 + 类目 chips + 卡片网格 ---------- */
rep("viewKB",
'function viewKB(){\n' +
'  var h = \'<div class="secHead secGrid">\'\n' +
'    + \'<div class="secTx">\'\n' +
'    + \'<div class="kicker">LIBRARY · MENTAL MODELS</div>\'\n' +
'    + \'<h1 class="t">思维模型库</h1>\'\n' +
'    + \'<p class="lede">\' + KB.length + \' 个模型，\' + CATS.length + \' 类。点分类展开，点卡片进去——\'\n' +
'    + \'卡片里按方法论的步骤<b>一格一格填</b>，填完自动存在本机。想不起来用哪个，就当索引翻。</p>\'\n' +
'    + \'<div class="tags"><span class="tag">按分类收在下面的抽屉里</span><span class="tag">搜索框能直接找</span></div>\'\n' +
'    + \'</div>\'\n' +
'    + \'</div>\';\n' +
'\n' +
'  h += \'<div class="kbTools">\'\n' +
'    + \'<input type="text" id="kbSearch" data-search="1" placeholder="搜模型名、适用场景或步骤关键词…" value="\' + esc(DB.ui.q) + \'">\'\n' +
'    + \'<button class="btn" data-act="expandAll">\' + ico("i-expand", "s") + \'全部展开</button>\'\n' +
'    + \'<button class="btn" data-act="collapseAll">\' + ico("i-expand", "s") + \'全部收起</button>\'\n' +
'    + \'</div>\';\n' +
'\n' +
'  var any = false;\n' +
'  for(var i=0;i<CATS.length;i++){\n' +
'    var b = catBlock(CATS[i]);\n' +
'    if(b){ h += b; any = true; }\n' +
'  }\n' +
'  if(!any){\n' +
'    h += \'<div class="card"><div class="empty">\' + ico("i-search", "xl") + \'<b>没有匹配的卡片</b>换个词试试，或者点「全部展开」当索引用。</div></div>\';\n' +
'  }\n' +
'  return h;\n' +
'}',
'function viewKB(){\n' +
'  var h = \'<div class="secHead">\'\n' +
'    + \'<div class="kicker">LIBRARY · MENTAL MODELS</div>\'\n' +
'    + \'<h1 class="t">思维模型库</h1>\'\n' +
'    + \'<p class="lede">\' + KB.length + \' 个模型，\' + CATS.length + \' 类。上面按类目筛，点卡片进去——\'\n' +
'    + \'卡片里按方法论的步骤<b>一格一格填</b>，填完自动存在本机。想不起来用哪个，就当索引翻。</p>\'\n' +
'    + \'</div>\';\n' +
'\n' +
'  h += \'<div class="kbTools">\'\n' +
'    + \'<input type="text" id="kbSearch" data-search="1" placeholder="搜模型名、适用场景或步骤关键词…" value="\' + esc(DB.ui.q) + \'">\'\n' +
'    + \'<button class="btn" data-act="expandAll">\' + ico("i-expand", "s") + \'全部展开</button>\'\n' +
'    + \'<button class="btn" data-act="collapseAll">\' + ico("i-expand", "s") + \'全部收起</button>\'\n' +
'    + \'</div>\';\n' +
'\n' +
'  h += \'<div class="catChips">\';\n' +
'  h += \'<button class="cbtn\' + (DB.ui.cat === "all" ? " on" : "") + \'" data-catbtn="all">全部\'\n' +
'    + \'<span class="n">\' + KB.length + \'</span></button>\';\n' +
'  for(var ci=0;ci<CATS.length;ci++){\n' +
'    var ct = CATS[ci], cn = 0;\n' +
'    for(var cj=0;cj<KB.length;cj++) if(KB[cj].c === ct.id) cn++;\n' +
'    if(!cn) continue;\n' +
'    h += \'<button class="cbtn\' + (DB.ui.cat === ct.id ? " on" : "") + \'" data-catbtn="\' + ct.id + \'">\'\n' +
'      + ico("i-cat-" + ct.id, "s") + esc(ct.n) + \'<span class="n">\' + cn + \'</span></button>\';\n' +
'  }\n' +
'  h += \'</div>\';\n' +
'\n' +
'  var any = false;\n' +
'  for(var i=0;i<CATS.length;i++){\n' +
'    var b = catBlock(CATS[i]);\n' +
'    if(b){ h += b; any = true; }\n' +
'  }\n' +
'  if(!any){\n' +
'    h += \'<div class="card"><div class="empty">\' + ico("i-search", "xl") + \'<b>没有匹配的卡片</b>换个词试试，或者切回「全部」看看。</div></div>\';\n' +
'  }\n' +
'  return h;\n' +
'}\n' +
'\n' +
'/* ---------- 首页总览：工具卡片目录 ---------- */\n' +
'function tileCard(o){\n' +
'  var h = \'<div class="tile" role="button" tabindex="0"\' + o.attr + \'>\';\n' +
'  h += \'<span class="tileIco">\' + ico(o.ico) + \'</span>\';\n' +
'  h += \'<span class="tileName">\' + esc(o.n) + \'<span class="tagx">\' + esc(o.tag) + \'</span></span>\';\n' +
'  h += \'<span class="tileDesc">\' + esc(o.d) + \'</span>\';\n' +
'  h += \'<ul class="tileList">\';\n' +
'  for(var i=0;i<o.l.length;i++) h += \'<li>\' + esc(o.l[i]) + \'</li>\';\n' +
'  h += \'</ul>\';\n' +
'  h += \'<span class="tileGo">\' + esc(o.go) + \'<span class="arw">→</span></span>\';\n' +
'  return h + \'</div>\';\n' +
'}\n' +
'\n' +
'function viewHome(){\n' +
'  var un = DB.goals.length - assignedCount(), filled = 0;\n' +
'  for(var j=0;j<KB.length;j++) if(kbFilled(KB[j].id) > 0) filled++;\n' +
'  var h = \'<div class="hero"><div class="heroIn">\'\n' +
'    + \'<div class="heroKick">SELF-DISCIPLINE AMPLIFIER</div>\'\n' +
'    + \'<h1>把「要做」拆成「现在就动手」</h1>\'\n' +
'    + \'<p class="heroLede">三张工具卡连成一条流水线：先把想法拆到能动手的一层，再按重要 / 紧急排进四个格，\'\n' +
'    + \'最后落成今天的时间块。右侧还有 \' + KB.length + \' 个思维模型，卡住的时候当索引翻。</p>\'\n' +
'    + \'<div class="heroStats">\'\n' +
'    + \'<div class="stat a"><b>\' + DB.goals.length + \'</b><span>拆解卡</span></div>\'\n' +
'    + \'<div class="stat"><b>\' + un + \'</b><span>未进象限</span></div>\'\n' +
'    + \'<div class="stat"><b>\' + DB.today.length + \'</b><span>今日时间块</span></div>\'\n' +
'    + \'<div class="stat"><b>\' + minLabel(dayMins()) + \'</b><span>今日已排</span></div>\'\n' +
'    + \'<div class="stat"><b>\' + filled + \'/\' + KB.length + \'</b><span>已填模型</span></div>\'\n' +
'    + \'</div></div></div>\';\n' +
'\n' +
'  h += \'<div class="wrap">\';\n' +
'  h += \'<div class="secBar"><h2>\' + ico("i-today", "l") + \'今日行事\'\n' +
'    + \'<span class="h2x">3 步流水线</span></h2>\'\n' +
'    + \'<span class="hint">按顺序走，别跳步——上一步没落的东西，下一步会卡住</span></div>\';\n' +
'  h += \'<div class="tiles">\'\n' +
'    + tileCard({ attr:\' data-gostep="0"\', ico:"i-step1", tag:"STEP 01", n:"目标分解",\n' +
'        d:"像搭积木一样一层一层往下拆，上一层答完，下一层才解锁，直到拆出一个今天就能做的动作。",\n' +
'        l:["五层：是什么 / 为什么 / 到什么程度 / 缺什么 / 第一步","逐层解锁，不用一次填完一张长表单","拆到底的那层直接流进象限"],\n' +
'        go:"进入目标分解" })\n' +
'    + tileCard({ attr:\' data-gostep="1"\', ico:"i-step2", tag:"STEP 02", n:"优先级排序",\n' +
'        d:"先把拆好的条目全部丢进待分配池，再拖进四个象限；四个格子之间也能来回拖。",\n' +
'        l:["艾森豪威尔四象限，带坐标轴与象限角标","池子 → 象限，象限 ↔ 象限都能拖","今天第二格空着会被体检提醒"],\n' +
'        go:"进入优先级矩阵" })\n' +
'    + tileCard({ attr:\' data-gostep="2"\', ico:"i-timer", tag:"STEP 03", n:"今日时间块",\n' +
'        d:"把选中要做的事排进今天的钟点，每条写明交付标准，负载条实时显示排超没有。",\n' +
'        l:["时间轨可视化，一眼看今天满不满","交付标准写清楚，才不会永远觉得没做完","可用时长可调，超出会标红提醒"],\n' +
'        go:"进入今日时间块" })\n' +
'    + \'</div>\';\n' +
'\n' +
'  h += \'<div class="secBar"><h2>\' + ico("i-library", "l") + \'更多\'\n' +
'    + \'<span class="h2x">REFERENCE</span></h2>\'\n' +
'    + \'<span class="hint">工具之外，还有可以翻的东西</span></div>\';\n' +
'  h += \'<div class="tiles">\'\n' +
'    + tileCard({ attr:\' data-tab="kb"\', ico:"i-library", tag:KB.length + " 个", n:"思维模型库",\n' +
'        d:KB.length + " 个模型按九个类目收好，点开卡片按步骤一格一格填，填完存在本机。",\n' +
'        l:["搜索框按名称、场景、步骤关键词一起搜","九个类目，卡片右上角显示已填进度","每个模型都写了「不适用时换用什么」"],\n' +
'        go:"打开模型库" })\n' +
'    + tileCard({ attr:\' data-act="openSettings"\', ico:"i-settings", tag:"DATA", n:"设置与数据",\n' +
'        d:"切主题、调整每天可用时长，以及导出备份。数据只存在这台设备的浏览器里。",\n' +
'        l:["晨雾 / 夜航两套主题","每天可用时长决定负载条基准","导出 .json 备份，或导出今日清单 .md"],\n' +
'        go:"打开设置" })\n' +
'    + \'</div>\';\n' +
'  h += \'<div class="foot">自律放大器 · 行动操作系统<br>数据只存在<b>这台设备</b>的浏览器里，换设备或清缓存前先点右上角导出备份</div>\';\n' +
'  return h + \'</div>\';\n' +
'}');

/* ---------- 12. 设置面板：删掉插画风格 ---------- */
rep("settings-art",
'  h += \'<h3 class="t" style="margin-top:22px">视觉 · 插画风格</h3>\'\n' +
'    + \'<div class="sub" style="margin-top:6px">三套都用同一套层级结构（底板 / 中景 / 主体 / 强调 / 装饰），只是画法不同，随手换。</div>\'\n' +
'    + artPick()\n' +
'    + \'<h3 class="t" style="margin-top:22px">每天可用时长</h3>\'\n',
'  h += \'<h3 class="t" style="margin-top:22px">每天可用时长</h3>\'\n');

/* ---------- 13. 事件：删切插画，加类目 chips / 直达某一步 ---------- */
rep("event-art",
'  el = t.closest("[data-set-art]");\n' +
'  if(el){\n' +
'    DB.ui.art = el.getAttribute("data-set-art");\n' +
'    save(); render({ top:false });\n' +
'    toast("插画已换成「" + ART_SETS[DB.ui.art].n + "」", "g");\n' +
'    return;\n' +
'  }\n', "");

rep("event-new",
'  el = t.closest("[data-step]");\n' +
'  if(el){\n',
'  el = t.closest("[data-catbtn]");\n' +
'  if(el){\n' +
'    DB.ui.tab = "kb";\n' +
'    DB.ui.cat = el.getAttribute("data-catbtn");\n' +
'    save(); render({ top:false }); return;\n' +
'  }\n' +
'\n' +
'  el = t.closest("[data-gostep]");\n' +
'  if(el){\n' +
'    DB.ui.tab = "daily";\n' +
'    DB.ui.step = parseInt(el.getAttribute("data-gostep"), 10) || 0;\n' +
'    DB.ui.open = null; DB.ui.settings = false;\n' +
'    save(); render({ top:true }); return;\n' +
'  }\n' +
'\n' +
'  el = t.closest("[data-step]");\n' +
'  if(el){\n');

/* ---------- 14. 默认落地页：首次进入停在总览 ---------- */
rep("default-tab", 'return { tab:"daily", step:0,', 'return { tab:"home", step:0,');

/* ---------- 收尾校验 ---------- */
if(fails.length){
  console.error("[build-v3] 有 " + fails.length + " 处替换没按预期命中，已放弃写文件：");
  for(var i=0;i<fails.length;i++) console.error("  - " + fails[i]);
  process.exit(1);
}
if(/art\(|ART_SETS|artPick|data-set-art|class="art\b|<symbol id="a-/.test(out)){
  console.error("[build-v3] 产物里仍残留插画引用，已放弃写文件");
  var m = out.match(/[^\n]*(art\(|ART_SETS|artPick|data-set-art|<symbol id="a-)[^\n]*/g);
  if(m) for(var k=0;k<Math.min(m.length, 10);k++) console.error("  - " + m[k]);
  process.exit(1);
}
fs.writeFileSync(OUT, out.replace(/\n/g, "\n"), "utf8");
console.log("[build-v3] 已生成 index.html：" + out.length + " 字节（源 " + src.length + " 字节）");
