/* ============================================================
   自律放大器 · 把 icons.svg / illustrations.svg 嵌进 index.html
   幂等：每步都带「已完成标记」，重复跑不会重复注入
   任何一步没匹配到就 exit 1 —— 不允许静默漏改
   跑法：node inject-assets.js
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const IDX  = path.join(ROOT, 'index.html');
const IC   = path.join(__dirname, 'icons.svg');
const IL   = path.join(__dirname, 'illustrations.svg');

let html = fs.readFileSync(IDX, 'utf8');
const log = [];
let failed = 0;

/* ---------------- 1. 组装 sprite ---------------- */
function parts(file, drop) {
  const src = fs.readFileSync(file, 'utf8');
  const defs = (src.match(/<defs>[\s\S]*?<\/defs>/) || [''])[0];
  let syms = src.match(/<symbol[\s\S]*?<\/symbol>/g) || [];
  if (drop) syms = syms.filter(s => !new RegExp('<symbol id="' + drop).test(s));
  return { defs, syms };
}
// icons.svg 里那 7 个 a-* 是被三套插画取代的旧版，不注入
const A = parts(IC, 'a-');
const B = parts(IL);

const sprite =
  '<!--SPRITE:START-->\n' +
  '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" ' +
  'style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">\n' +
  A.defs + '\n' + B.defs + '\n' +
  A.syms.join('\n') + '\n' + B.syms.join('\n') + '\n' +
  '</svg>\n<!--SPRITE:END-->';

if (html.indexOf('<!--SPRITE:START-->') < 0) {
  log.push('[FAIL] 找不到 sprite 标记位，请确认 body 里保留了 <!--SPRITE:START--><!--SPRITE:END-->');
  failed++;
} else {
  html = html.replace(/<!--SPRITE:START-->[\s\S]*?<!--SPRITE:END-->/, sprite);
  log.push('[ OK ] sprite 注入 · icons ' + A.syms.length + ' 个 + 插画 ' + B.syms.length + ' 张');
}

/* ---------------- 2. 插画令牌（深浅两套） ---------------- */
const light = {
  bg:'#e4eafb', bg2:'#fbfcff', mid:'#a9b8dd', mass:'#1b2133', mass2:'#394161',
  line:'#1b2133', fill:'#ffffff', acc:'#4a5bd8', acc2:'#1f9fb8', gold:'#e2ab52', sh:'rgba(18,26,52,.16)'
};
const dark = {
  bg:'#0c1426', bg2:'#152040', mid:'#465478', mass:'#eef2ff', mass2:'#d3ddf5',
  line:'#ccd8ff', fill:'#1e2b4e', acc:'#8b9bff', acc2:'#3ad3e8', gold:'#f2c884', sh:'rgba(0,0,0,.5)'
};
const tok = o => Object.keys(o).map(k => '--i-' + k + ':' + o[k] + ';').join(' ');
const tokens =
  '/*TOKENS:START*/\n' +
  'html[data-theme="light"]{' + tok(light) + '}\n' +
  'html[data-theme="dark"]{' + tok(dark) + '}\n' +
  '/*TOKENS:END*/';

if (html.indexOf('/*TOKENS:START*/') < 0) {
  log.push('[FAIL] 找不到令牌标记位');
  failed++;
} else {
  html = html.replace(/\/\*TOKENS:START\*\/[\s\S]*?\/\*TOKENS:END\*\//, tokens);
  log.push('[ OK ] 插画令牌注入（深浅两套 --i-*）');
}

/* ---------------- 3. 源码接线 ---------------- */
const CSS_NEW = [
  '/* ---------- 矢量资源：图标 / 插画 ---------- */',
  '.ico{flex:none;display:inline-block;width:18px;height:18px;vertical-align:-3px}',
  '.ico.xs{width:13px;height:13px;vertical-align:-2px}',
  '.ico.s{width:15px;height:15px;vertical-align:-2px}',
  '.ico.l{width:22px;height:22px}',
  '.ico.xl{width:30px;height:30px}',
  '/* 渐变图标落在大面积品牌渐变上时读不出来 —— 直接反相成白 */',
  '.btn.pri .ico,.segBtn.on .ico{filter:brightness(0) invert(1)}',
  '.iconBtn .ico{width:15px;height:15px;margin-right:3px;vertical-align:-2px}',
  '.btn .ico{margin-right:5px;vertical-align:-3px}',
  '.segBtn .ico{display:block;margin:0 auto 2px}',
  '.art{display:block;width:100%;height:auto}',
  '.secGrid{display:grid;grid-template-columns:minmax(0,1fr) 238px;gap:26px;align-items:end}',
  '.secArt{margin:0;justify-self:end}',
  '.secArt .art{width:238px}',
  '.empty.hasArt{padding:20px 16px 18px}',
  '.empty.hasArt .art{width:214px;margin:0 auto 12px}',
  '.artPick{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:11px}',
  '.artOpt{font:inherit;text-align:left;cursor:pointer;padding:9px;border-radius:13px;',
  '  border:1px solid var(--line);background:var(--glass2);color:var(--ink2);transition:.18s}',
  '.artOpt:hover{border-color:var(--acc);transform:translateY(-2px)}',
  '.artOpt.on{border-color:var(--acc);background:var(--accW);box-shadow:0 0 0 2px var(--accW)}',
  '.artOpt .art{width:100%;border-radius:8px;margin-bottom:7px}',
  '.artOpt b{display:block;font-size:12.6px;font-weight:800;color:var(--ink)}',
  '.artOpt span{display:block;font-size:11px;color:var(--mute);line-height:1.5;margin-top:2px}',
  '.brickIco{flex:none;display:flex}',
  '.catDot{background:var(--accW);border:1px solid var(--glassB);color:var(--accInk)}',
  '.catDot .ico{width:19px;height:19px}',
  '.chip .grip{opacity:.4;margin-right:-4px}',
  '@media(max-width:940px){',
  '  .secGrid{grid-template-columns:1fr;gap:12px}',
  '  .secArt{justify-self:start}',
  '  .secArt .art{width:196px}',
  '  .artPick{grid-template-columns:1fr}',
  '  .artOpt{display:flex;gap:11px;align-items:center}',
  '  .artOpt .art{width:104px;margin:0;flex:none}',
  '}',
  '@media(max-width:520px){.secArt .art{width:170px}}',
  ''
].join('\n');

const HELPERS = [
  '/* ---------- 矢量资源：图标 / 插画引用 ---------- */',
  'var STEP_ICO  = ["i-step1","i-step2","i-step3"];',
  'var BRICK_ICO = ["i-brick-text","i-brick-basis","i-brick-target","i-brick-gap","i-brick-action"];',
  'var ART_SETS = {',
  '  sce:{ n:"场景叙事", d:"外板 + 内板撑纵深，道具压中调，主体深描边浅填充，暖色点一下" },',
  '  stk:{ n:"描边贴纸", d:"品牌实色底，白色厚描边主体，深色细内轮廓；不跟主题变" },',
  '  iso:{ n:"立体等距", d:"顶面亮 / 正面中 / 侧面暗，落一道硬投影，最稳重" }',
  '};',
  'function artSet(){ return ART_SETS[DB.ui.art] ? DB.ui.art : "sce"; }',
  'function ico(id, cls){',
  '  return \'<svg class="ico\' + (cls ? " " + cls : "") + \'" viewBox="0 0 24 24" aria-hidden="true">\'',
  '    + \'<use href="#\' + id + \'"/></svg>\';',
  '}',
  'function artFix(id, set, cls){',
  '  return \'<svg class="art\' + (cls ? " " + cls : "") + \'" viewBox="0 0 200 140" aria-hidden="true">\'',
  '    + \'<use href="#a-\' + id + \'-\' + set + \'"/></svg>\';',
  '}',
  'function art(id, cls){ return artFix(id, artSet(), cls); }',
  'function artPick(){',
  '  var cur = artSet(), order = ["sce","stk","iso"], h = \'<div class="artPick">\';',
  '  for(var i=0;i<order.length;i++){',
  '    var k = order[i];',
  '    h += \'<button class="artOpt\' + (cur === k ? " on" : "") + \'" data-set-art="\' + k + \'" type="button">\'',
  '      + artFix("amp", k) + \'<b>\' + ART_SETS[k].n + \'</b><span>\' + ART_SETS[k].d + \'</span></button>\';',
  '  }',
  '  return h + \'</div>\';',
  '}',
  ''
].join('\n');

function secStart(kicker) {
  return {
    from: 'var h = \'<div class="secHead">\'\n    + \'<div class="kicker">' + kicker + '</div>\'',
    to:   'var h = \'<div class="secHead secGrid">\'\n    + \'<div class="secTx">\'\n    + \'<div class="kicker">' + kicker + '</div>\''
  };
}
function secEnd(tail, artId) {
  return {
    from: tail + '\n    + \'</div>\';',
    to:   tail + '\n    + \'</div>\'\n    + \'<figure class="secArt">\' + art("' + artId + '") + \'</figure>\'\n    + \'</div>\';'
  };
}

const T = [
  /* ---- CSS ---- */
  { name:'图标 / 插画 样式', from:'@media (max-width:720px){', to: CSS_NEW + '@media (max-width:720px){' },

  /* ---- helper ---- */
  { name:'图标插画引用函数', from:'function num(v, dft){', to: HELPERS + '\nfunction num(v, dft){' },

  /* ---- 数据层：记住选了哪套插画 ---- */
  { name:'ui.art 默认 sce', from:'return { tab:"daily", step:0, dir:1, cat:"all", q:"", open:null, sel:null,',
    to:  'return { tab:"daily", step:0, dir:1, cat:"all", q:"", open:null, sel:null, art:"sce",' },
  { name:'ui.art 反序列化', from:'    d.ui.q    = str(u.q);\n',
    to:  '    d.ui.q    = str(u.q);\n    d.ui.art  = ART_SETS[u.art] ? u.art : "sce";\n' },

  /* ---- 顶栏 ---- */
  { name:'顶栏 · 主题 / 设置按钮', from:`    +   '<button class="iconBtn" data-act="toggleTheme" title="切换主题">' + (DB.theme === "dark" ? "晨雾" : "夜航") + '</button>'\n    +   '<button class="iconBtn" data-act="openSettings" title="设置与数据">设置</button>'`,
    to:  `    +   '<button class="iconBtn" data-act="toggleTheme" title="切换主题">' + ico("i-theme") + (DB.theme === "dark" ? "晨雾" : "夜航") + '</button>'\n    +   '<button class="iconBtn" data-act="openSettings" title="设置与数据">' + ico("i-settings") + '设置</button>'` },

  /* ---- 主导航 ---- */
  { name:'主导航 · 今日 / 模型库', from:`    + '<button class="segBtn' + (t === 0 ? " on" : "") + '" data-tab="daily">'\n    +   '<span class="sn">TODAY</span><span class="sb">今日行事</span></button>'\n    + '<button class="segBtn' + (t === 1 ? " on" : "") + '" data-tab="kb">'\n    +   '<span class="sn">LIBRARY</span><span class="sb">思维模型库 ' + KB.length + '</span></button>'`,
    to:  `    + '<button class="segBtn' + (t === 0 ? " on" : "") + '" data-tab="daily">'\n    +   ico("i-today") + '<span class="sn">TODAY</span><span class="sb">今日行事</span></button>'\n    + '<button class="segBtn' + (t === 1 ? " on" : "") + '" data-tab="kb">'\n    +   ico("i-library") + '<span class="sn">LIBRARY</span><span class="sb">思维模型库 ' + KB.length + '</span></button>'` },

  /* ---- 三步分段 ---- */
  { name:'三步分段 · 步骤图标', from:`      + '<span class="sn">' + STEPS[i].sn + '</span>'`,
    to:  `      + ico(STEP_ICO[i], "l")\n      + '<span class="sn">' + STEPS[i].sn + '</span>'` },

  /* ---- 三步主视觉 ---- */
  Object.assign({ name:'第 1 步 · 区块头改双栏', }, secStart('STEP 01 · GOAL DECOMPOSITION')),
  Object.assign({ name:'第 1 步 · 主视觉插画', },
    secEnd(`    + '<span class="tag warn">第 5 层 · 现在做什么</span></div>'`, 'step1')),
  Object.assign({ name:'第 2 步 · 区块头改双栏', }, secStart('STEP 02 · PRIORITIZATION')),
  Object.assign({ name:'第 2 步 · 主视觉插画', },
    secEnd(`    + '<span class="tag warn">待分配 ' + pool + ' 条</span></div>'`, 'step2')),
  Object.assign({ name:'第 3 步 · 区块头改双栏', }, secStart('STEP 03 · TIME BLOCKING')),
  Object.assign({ name:'第 3 步 · 主视觉插画', },
    secEnd(`    + '<span class="tag">时限</span></div>'`, 'step3')),

  /* ---- 积木层图标 ---- */
  { name:'积木五层 · 每层一个图标', from:`    + '<span class="brickNo">L' + (i + 1) + '</span>'`,
    to:  `    + '<span class="brickIco">' + ico(BRICK_ICO[i], "s") + '</span>'\n    + '<span class="brickNo">L' + (i + 1) + '</span>'` },

  /* ---- 四个象限 ---- */
  { name:'四象限 · 角标图标', from:`    + '<div class="qzTop"><span class="qzId">' + key.toUpperCase() + '</span>'`,
    to:  `    + '<div class="qzTop">' + ico("i-" + key, "s") + '<span class="qzId">' + key.toUpperCase() + '</span>'` },

  /* ---- 词条 ---- */
  { name:'词条 · 拖动把手 + 关闭图标', from:`  return '<div class="chip' + (DB.ui.sel === g.id ? " sel" : "") + '" data-drag="' + g.id + '">'\n    + warn + '<span class="ct">' + esc(nm) + '</span>'\n    + '<button class="cx" data-del-goal="' + g.id + '" data-nodrag="1" title="删掉">&#10005;</button>'\n    + '</div>';`,
    to:  `  return '<div class="chip' + (DB.ui.sel === g.id ? " sel" : "") + '" data-drag="' + g.id + '">'\n    + '<span class="grip">' + ico("i-drag", "xs") + '</span>' + warn + '<span class="ct">' + esc(nm) + '</span>'\n    + '<button class="cx" data-del-goal="' + g.id + '" data-nodrag="1" title="删掉">' + ico("i-close", "xs") + '</button>'\n    + '</div>';` },
  { name:'待分配 · 加入按钮', from:`    + '<button class="btn pri" data-act="poolAdd">加入</button>'`,
    to:  `    + '<button class="btn pri" data-act="poolAdd">' + ico("i-plus", "s") + '加入</button>'` },
  { name:'待分配区为空时的插画', from:`  h += '<div class="mxGrid">'`,
    to:  `  h += (!DB.goals.length\n    ? '<div class="empty hasArt" style="margin-bottom:16px">' + art("empty-quad")\n      + '<b>还没有待分配的任务</b>回第 1 步新增一张拆解卡，它会先落在这里。</div>'\n    : '');\n  h += '<div class="mxGrid">'` },

  /* ---- 第 1 步空状态 ---- */
  { name:'空状态 · 还没有拆解卡', from:`    return h + '<div class="card"><div class="empty"><b>还没有拆解卡</b>'\n      + '点上面「新增一张」，脑子里那件最堵的事先写上。<br>写不完整没关系——第一层只要一句大白话。</div></div>';`,
    to:  `    return h + '<div class="card"><div class="empty hasArt">' + art("empty-goals") + '<b>还没有拆解卡</b>'\n      + '点上面「新增一张」，脑子里那件最堵的事先写上。<br>写不完整没关系——第一层只要一句大白话。</div></div>';` },

  /* ---- 第 3 步 ---- */
  { name:'空状态 · 今天还是空的', from:`    return h + '<div class="card"><div class="empty"><b>今天还是空的</b>点「加一条」，或从上面的重点格里拉进来。</div></div>';`,
    to:  `    return h + '<div class="card"><div class="empty hasArt">' + art("empty-timeline") + '<b>今天还是空的</b>点「加一条」，或从上面的重点格里拉进来。</div></div>';` },
  { name:'拉进今天 · 加号图标', from:`        + '<span class="cx" title="放进今天">+</span></div>';`,
    to:  `        + '<span class="cx" title="放进今天">' + ico("i-plus", "xs") + '</span></div>';` },

  /* ---- 教练条 ---- */
  { name:'教练条 · 标题图标', from:`  var h = '<div class="ci"><div class="ct">COACH · 今日体检</div><ul>';`,
    to:  `  var h = '<div class="ci"><div class="ct">' + ico("i-spark", "s") + 'COACH · 今日体检</div><ul>';` },

  /* ---- 模型库 ---- */
  Object.assign({ name:'模型库 · 区块头改双栏', }, secStart('LIBRARY · MENTAL MODELS')),
  Object.assign({ name:'模型库 · 品牌主视觉', },
    secEnd(`    + '<div class="tags"><span class="tag">按分类收在下面的抽屉里</span><span class="tag">搜索框能直接找</span></div>'`, 'amp')),
  { name:'模型库 · 展开收起按钮', from:`    + '<button class="btn" data-act="expandAll">全部展开</button>'\n    + '<button class="btn" data-act="collapseAll">全部收起</button>'`,
    to:  `    + '<button class="btn" data-act="expandAll">' + ico("i-expand", "s") + '全部展开</button>'\n    + '<button class="btn" data-act="collapseAll">' + ico("i-expand", "s") + '全部收起</button>'` },
  { name:'九分类 · 分类图标', from:`    + '<span class="catDot">' + total + '</span>'`,
    to:  `    + '<span class="catDot">' + ico("i-cat-" + c.id, "l") + '</span>'` },
  { name:'空状态 · 没有匹配的卡片', from:`    h += '<div class="card"><div class="empty"><b>没有匹配的卡片</b>换个词试试，或者点「全部展开」当索引用。</div></div>';`,
    to:  `    h += '<div class="card"><div class="empty">' + ico("i-search", "xl") + '<b>没有匹配的卡片</b>换个词试试，或者点「全部展开」当索引用。</div></div>';` },

  /* ---- 模型卡抽屉 ---- */
  { name:'模型卡 · 底部动作图标', from:`    + '<button class="btn" data-act="kbCopy">复制填写内容</button>'\n    + '<button class="btn" data-act="kbClear">清空这张卡</button>'\n    + '<button class="btn pri" data-act="closeSheet">收起</button>'`,
    to:  `    + '<button class="btn" data-act="kbCopy">' + ico("i-copy", "s") + '复制填写内容</button>'\n    + '<button class="btn" data-act="kbClear">' + ico("i-trash", "s") + '清空这张卡</button>'\n    + '<button class="btn pri" data-act="closeSheet">' + ico("i-check", "s") + '收起</button>'` },

  /* ---- 设置抽屉 ---- */
  { name:'设置 · 插画风格切换', from:`  h += '<h3 class="t" style="margin-top:22px">每天可用时长</h3>'`,
    to:  `  h += '<h3 class="t" style="margin-top:22px">视觉 · 插画风格</h3>'\n    + '<div class="sub" style="margin-top:6px">三套都用同一套层级结构（底板 / 中景 / 主体 / 强调 / 装饰），只是画法不同，随手换。</div>'\n    + artPick()\n    + '<h3 class="t" style="margin-top:22px">每天可用时长</h3>'` },
  { name:'设置 · 备份动作图标', from:`    + '<button class="btn" data-act="expJson">导出备份（.json）</button>'\n    + '<button class="btn" data-act="impJson">导入备份</button>'\n    + '<button class="btn" data-act="expMd">导出今日清单（.md）</button>'`,
    to:  `    + '<button class="btn" data-act="expJson">' + ico("i-download", "s") + '导出备份（.json）</button>'\n    + '<button class="btn" data-act="impJson">' + ico("i-upload", "s") + '导入备份</button>'\n    + '<button class="btn" data-act="expMd">' + ico("i-download", "s") + '导出今日清单（.md）</button>'` },

  /* ---- 事件：切换插画风格 ---- */
  { name:'事件 · 切换插画风格', from:`  el = t.closest("[data-tab]");`,
    to:  `  el = t.closest("[data-set-art]");\n  if(el){\n    DB.ui.art = el.getAttribute("data-set-art");\n    save(); render({ top:false });\n    toast("插画已换成「" + ART_SETS[DB.ui.art].n + "」", "g");\n    return;\n  }\n\n  el = t.closest("[data-tab]");` }
];

/* 幂等判据直接用 to —— 手写 done 哨兵很容易写错：
   比如把 JS 字面量的收尾引号也写进去（'...+ \'加入\''），
   但 index.html 里那个引号后面还跟着 </button>，于是永远匹配不上，
   表现为「明明改过了却报没匹配到锚点」。 */
for (const t of T) {
  if (html.indexOf(t.to) >= 0) { log.push('[跳过] ' + t.name + '（已处理）'); continue; }
  if (html.indexOf(t.from) < 0) {
    log.push('[FAIL] ' + t.name + ' —— 没匹配到锚点：' + JSON.stringify(t.from.slice(0, 70)));
    failed++; continue;
  }
  const n = html.split(t.from).length - 1;
  if (n !== 1) { log.push('[FAIL] ' + t.name + ' —— 锚点出现 ' + n + ' 次，应为 1 次'); failed++; continue; }
  html = html.replace(t.from, t.to);
  log.push('[ OK ] ' + t.name);
}

if (failed) {
  console.log(log.join('\n'));
  console.log('\n注入中止：' + failed + ' 处没成功，index.html 未写入。');
  process.exit(1);
}

fs.writeFileSync(IDX, html, 'utf8');
console.log(log.join('\n'));
console.log('\nindex.html  ' + html.length + ' chars');
console.log('sprite 引用点  ' + (html.match(/ico\(/g) || []).length + ' 处图标 / ' + (html.match(/art\(/g) || []).length + ' 处插画');
