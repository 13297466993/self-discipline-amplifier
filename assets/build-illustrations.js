/* ============================================================
   自律放大器 · 插画三套（分层重设）
   每套 = 同 7 个插画槽位 × 一种分层语言，共 21 张
   产出：illustrations.svg（spirit 符号集）+ illustration-sets.html（对比预览页）
   跑法：node build-illustrations.js
   ============================================================ */
const fs = require('fs');
const path = require('path');
const OUT = __dirname;

/* ---------- 颜色令牌：全部走 CSS 变量，深浅主题自动换色 ---------- */
const B   = 'var(--i-bg,#dde6fa)';      // 底板（比内层明显深一档，才撑得出纵深）
const B2  = 'var(--i-bg2,#f7fafe)';     // 内层底板（更亮 = 纵深）
const M   = 'var(--i-mid,#c0cde9)';     // 中景
const K   = 'var(--i-mass,#1b2133)';    // 前景主体实块
const K2  = 'var(--i-mass2,#3a4361)';   // 主体次层（亮面）
const L   = 'var(--i-line,#1b2133)';    // 描边结构线
const F   = 'var(--i-fill,#ffffff)';    // 主体填充（描边风）
const A   = 'var(--i-acc,#4a5bd8)';     // 强调 1
const A2  = 'var(--i-acc2,#1f9fb8)';    // 强调 2
const G   = 'var(--i-gold,#e2ab52)';    // 暖色点缀
const SH  = 'var(--i-sh,rgba(18,26,52,.17))';

/* 贴纸套：品牌实色底 + 白主体 + 深色内轮廓
   刻意不跟随主题 —— 白主体需要稳定的对比度，深浅主题下都是同一张"贴纸卡" */
const SB1 = '#3f5fe6';
const SB2 = '#1f9fb8';
const SI  = '#1b2133';

/* ---------- 绘图原语 ---------- */
const rr = (x, y, w, h, rx, f, ex = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}"${ex}/>`;
const ci = (cx, cy, r, f, ex = '') =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}"${ex}/>`;
const el = (cx, cy, rx, ry, f, ex = '') =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f}"${ex}/>`;
const ln = (x1, y1, x2, y2, st, w, ex = '') =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${st}" stroke-width="${w}" stroke-linecap="round"${ex}/>`;
const pa = (d, f, ex = '') => `<path d="${d}" fill="${f}"${ex}/>`;
const ps = (d, st, w, ex = '') =>
  `<path d="${d}" fill="none" stroke="${st}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${ex}/>`;
const dash = (a = 5, b = 4) => ` stroke-dasharray="${a} ${b}"`;

/* 等距立体块：顶面 + 正面 + 右侧暗面
   注意：暗面必须以「正面色」为底再叠黑。若直接用半透明黑铺在浅色底板上，
   叠出来是浅灰 —— 比正面还亮，立体感会整个反过来。 */
const isoTop   = (x, y, w, d, f) => pa(`M${x} ${y} L${x + d} ${y - d} L${x + w + d} ${y - d} L${x + w} ${y} Z`, f);
const isoFront = (x, y, w, h, rx, f) => rr(x, y, w, h, rx, f);
const isoSide  = (x, y, w, h, d, base) => {
  const p = `M${x + w} ${y} L${x + w + d} ${y - d} L${x + w + d} ${y - d + h} L${x + w} ${y + h} Z`;
  return pa(p, base) + pa(p, '#000', ' opacity=".4"');
};
function isoBlock(x, y, w, h, d, top, front, rx = 4) {
  return isoSide(x, y, w, h, d, front) + isoFront(x, y, w, h, rx, front) + isoTop(x, y, w, d, top);
}
/* 小立方（装饰）：顶面菱形 + 左右立面 */
function cube(x, y, s, top, front) {
  const d = s * 0.5;
  return pa(`M${x} ${y} L${x + s} ${y - d} L${x + 2 * s} ${y} L${x + s} ${y + d} Z`, top) +
         pa(`M${x} ${y} L${x + s} ${y + d} L${x + s} ${y + d + s} L${x} ${y + s} Z`, front) +
         pa(`M${x + 2 * s} ${y} L${x + s} ${y + d} L${x + s} ${y + d + s} L${x + 2 * s} ${y + s} Z`, front, ' opacity=".72"');
}
/* 四角星点 */
function spark(x, y, s, f, op = 1) {
  return pa(`M${x} ${y - s} Q${x + s * .22} ${y - s * .22} ${x + s} ${y} Q${x + s * .22} ${y + s * .22} ${x} ${y + s} ` +
            `Q${x - s * .22} ${y + s * .22} ${x - s} ${y} Q${x - s * .22} ${y - s * .22} ${x} ${y - s} Z`, f, ` opacity="${op}"`);
}
/* 贴纸风图元：白色厚描边（paint-order=stroke 让描边向外扩）+ 细深色内轮廓 */
const skR = (x, y, w, h, rx, fill = '#ffffff', ow = 1.6) =>
  `<g>` +
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="#ffffff" stroke-width="9" paint-order="stroke"/>` +
  (ow ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="none" stroke="${SI}" stroke-width="${ow}" opacity=".9"/>` : '') +
  `</g>`;

/* ---------- 槽位定义（三套共用同一批内容，才能同题对比） ---------- */
const SLOTS = [
  { k: 'amp',            t: '放大器 · 品牌主视觉', tag: '主视觉' },
  { k: 'step1',          t: '第 1 步 · 目标分解',  tag: '三步主视觉' },
  { k: 'step2',          t: '第 2 步 · 优先级排序', tag: '三步主视觉' },
  { k: 'step3',          t: '第 3 步 · 今日时间块', tag: '三步主视觉' },
  { k: 'empty-goals',    t: '空状态 · 还没拆解卡', tag: '空状态' },
  { k: 'empty-quad',     t: '空状态 · 象限还空着', tag: '空状态' },
  { k: 'empty-timeline', t: '空状态 · 时间轴还空着', tag: '空状态' },
];

/* 分层的类名 —— 预览页靠它做「逐层揭示」，把层级关系直接演示出来 */
const g = (cls, body) => `<g class="l-${cls}">${body}</g>`;

/* ============================================================
   套一 · 立体等距
   淡色底板 → 内层光晕 → 立体块（顶面亮 / 正面中 / 侧面暗）→ 强调色面 → 硬投影
   ============================================================ */
const ISO = {
  amp: () =>
    g('bg', rr(10, 8, 180, 124, 26, B) + ci(94, 64, 49, B2)) +
    g('mid', el(94, 112, 42, 6, SH)) +
    /* 立体感的正确做法：底下垫一层"黑"当厚度边缘，而不是垫一层灰（垫灰会看成重影） */
    g('mass',
      ci(95, 65, 30, 'none', ' stroke="#000" stroke-width="12" opacity=".26"') +
      ci(92, 62, 30, 'none', ` stroke="${K}" stroke-width="12"`) +
      ps('M109 80 L131 102', '#000', 13, ' opacity=".26"') +
      ps('M106 77 L128 99', K, 13) +
      ps('M74 42 A 30 30 0 0 0 64 76', K2, 3.4, ' opacity=".5"')) +
    g('acc',
      rr(78, 66, 7, 12, 2, A2) + rr(89, 58, 7, 20, 2, A2) + rr(100, 50, 7, 28, 2, G) +
      ps('M76 62 L102 46', A, 4) +
      pa('M107 42 L96.5 44.5 L102.5 51 Z', A)) +
    g('deco',
      cube(28, 30, 7, A2, A, .8) + cube(158, 42, 6, A, A2) + cube(140, 112, 5, A2, A) +
      spark(170, 28, 6, A2, .75)),

  step1: () =>
    g('bg', rr(10, 8, 180, 124, 26, B) + ci(100, 72, 52, B2)) +
    g('mid', el(100, 114, 44, 6, SH)) +
    g('mass',
      isoBlock(54, 90, 92, 20, 7, K2, K, 4) +
      isoBlock(66, 70, 68, 20, 7, K2, K, 4) +
      isoBlock(78, 50, 44, 20, 7, K2, K, 4)) +
    g('acc', isoTop(78, 50, 44, 7, A)) +
    g('deco',
      rr(88, 29, 24, 14, 5, 'none', ` stroke="${A2}" stroke-width="2.4"${dash(4, 3)}`) +
      spark(38, 42, 6, A2, .7) + spark(162, 74, 5, A, .7)),

  step2: () =>
    g('bg', rr(10, 8, 180, 124, 26, B) + ci(100, 70, 52, B2)) +
    g('mid',
      ln(100, 22, 100, 118, M, 2.5) + ln(22, 70, 178, 70, M, 2.5) +
      rr(38, 22, 62, 48, 10, M, ' opacity=".16"') + rr(100, 70, 62, 48, 10, M, ' opacity=".16"')) +
    g('mass',
      isoBlock(30, 34, 46, 22, 4.5, K2, K, 10) +
      isoBlock(112, 84, 46, 22, 4.5, K2, K, 10)) +
    g('acc',
      isoBlock(104, 26, 46, 22, 4.5, A2, A, 10) +
      ps('M62 58 C 74 44, 86 34, 100 32', A2, 2.5, dash(5, 4)) +
      pa('M100 28 L100 38 L110 33 Z', A2) +
      pa('M100 62 L106 70 L100 78 L94 70 Z', G)) +
    g('deco', spark(30, 104, 6, A2, .7) + cube(158, 30, 5, A2, A)),

  step3: () =>
    g('bg', rr(10, 8, 180, 124, 26, B) + ci(100, 70, 52, B2)) +
    g('mid',
      ln(22, 98, 178, 98, M, 3) +
      [30, 60, 90, 120, 150, 176].map(x => ln(x, 92, x, 104, M, 2)).join('')) +
    g('mass',
      isoBlock(38, 74, 36, 22, 4, K2, K, 6) +
      isoBlock(84, 74, 42, 22, 4, K2, K, 6)) +
    g('acc',
      rr(136, 76, 36, 20, 6, 'none', ` stroke="${A2}" stroke-width="3"${dash(5, 4)}`) +
      ci(166, 38, 15, 'none', ` stroke="${A2}" stroke-width="3"`) +
      ps('M166 38 L166 30 M166 38 L173 42', A2, 2.6)) +
    g('deco', spark(30, 42, 6, A, .7) + cube(56, 30, 5, A2, A)),

  'empty-goals': () =>
    g('bg', rr(10, 8, 180, 124, 26, B) + ci(100, 70, 52, B2)) +
    g('mid', el(100, 112, 42, 6, SH) + rr(56, 40, 88, 60, 13, M, ' opacity=".2"')) +
    g('mass', rr(46, 30, 108, 80, 16, 'none', ` stroke="${K2}" stroke-width="3"${dash(7, 6)}`)) +
    g('acc', ps('M88 70 L112 70 M100 58 L100 82', A, 6)) +
    g('deco', spark(30, 34, 6, A2, .7) + spark(170, 106, 5, G, .8) + cube(164, 30, 5, A2, A)),

  'empty-quad': () =>
    g('bg', rr(10, 8, 180, 124, 26, B) + ci(100, 70, 52, B2)) +
    g('mid',
      ln(100, 22, 100, 118, M, 2.5, dash(6, 5)) + ln(22, 70, 178, 70, M, 2.5, dash(6, 5)) +
      rr(34, 24, 58, 42, 10, M, ' opacity=".14"')) +
    g('mass',
      rr(40, 34, 46, 20, 10, 'none', ` stroke="${K2}" stroke-width="3"${dash(5, 4)}`) +
      rr(112, 84, 46, 20, 10, 'none', ` stroke="${K2}" stroke-width="3"${dash(5, 4)}`)) +
    g('acc',
      ps('M104 92 C 92 70, 80 46, 66 40', A2, 2.5, dash(5, 4)) +
      pa('M66 34 L64 46 L76 42 Z', A2) +
      pa('M100 62 L106 70 L100 78 L94 70 Z', G)) +
    g('deco', spark(158, 34, 6, A, .7)),

  'empty-timeline': () =>
    g('bg', rr(10, 8, 180, 124, 26, B) + ci(100, 70, 52, B2)) +
    g('mid',
      ln(22, 98, 178, 98, M, 3, dash(7, 6)) +
      [30, 60, 90, 120, 150, 176].map(x => ln(x, 92, x, 104, M, 2)).join('')) +
    g('mass',
      rr(36, 76, 36, 20, 6, 'none', ` stroke="${K2}" stroke-width="3"${dash(5, 4)}`) +
      rr(84, 76, 42, 20, 6, 'none', ` stroke="${K2}" stroke-width="3"${dash(5, 4)}`)) +
    g('acc',
      rr(136, 76, 36, 20, 6, 'none', ` stroke="${A2}" stroke-width="3"${dash(5, 4)}`) +
      ci(164, 38, 15, 'none', ` stroke="${A2}" stroke-width="3"${dash(5, 4)}`)) +
    g('deco', spark(32, 40, 5, A, .7)),
};

/* ============================================================
   套二 · 描边贴纸
   品牌实色底 → 白色厚描边主体 → 深色细内轮廓 → 暖色强调
   ============================================================ */
const STK = {
  amp: () =>
    g('bg', rr(10, 8, 180, 124, 26, 'url(#gIs)')) +
    g('mid', ci(94, 62, 24, '#ffffff', ' opacity=".16"')) +
    g('mass',
      ci(98, 66, 28, 'none', ' stroke="#ffffff" stroke-width="12"') +
      ci(94, 62, 28, 'none', ' stroke="#ffffff" stroke-width="12"') +
      ci(94, 62, 21, 'none', ` stroke="${SI}" stroke-width="1.5" opacity=".22"`) +
      ps('M110.5 76.5 L132 98', '#ffffff', 14)) +
    g('acc',
      rr(79, 64, 7, 12, 2, '#ffffff') + rr(90, 56, 7, 20, 2, '#ffffff') + rr(101, 48, 7, 28, 2, '#ffd479') +
      ps('M76 60 L100 45', '#ffffff', 3.6) +
      pa('M104 41 L94.5 43.5 L100 49.5 Z', '#ffffff')) +
    g('deco',
      ci(34, 34, 3.5, '#ffffff', ' opacity=".55"') + ci(168, 46, 3, '#ffffff', ' opacity=".5"') +
      ci(150, 112, 2.6, '#ffffff', ' opacity=".45"')),

  step1: () =>
    g('bg', rr(10, 8, 180, 124, 26, 'url(#gIs)')) +
    g('mid', el(100, 116, 44, 7, '#ffffff', ' opacity=".2"')) +
    g('mass', skR(52, 84, 96, 22, 7) + skR(64, 64, 72, 22, 7)) +
    g('acc', skR(76, 44, 48, 22, 7, '#ffd479')) +
    g('deco',
      rr(88, 26, 24, 16, 5, 'none', ' stroke="#ffffff" stroke-width="3"' + dash(5, 4)) +
      ci(38, 40, 3.4, '#ffffff', ' opacity=".5"') + ci(164, 78, 3, '#ffffff', ' opacity=".45"')),

  step2: () =>
    g('bg', rr(10, 8, 180, 124, 26, 'url(#gIs)')) +
    g('mid',
      ln(100, 22, 100, 118, '#ffffff', 4.5, ' opacity=".95"') +
      ln(22, 70, 178, 70, '#ffffff', 4.5, ' opacity=".95"')) +
    g('mass', skR(34, 34, 46, 20, 10) + skR(112, 84, 46, 20, 10)) +
    g('acc',
      skR(106, 24, 48, 20, 10, '#ffd479') +
      ps('M62 58 C 76 44, 88 32, 102 30', '#ffffff', 2.6, dash(5, 4)) +
      pa('M100 25 L100 36 L111 30.5 Z', '#ffffff')) +
    g('deco', ci(100, 70, 3.6, '#ffffff')),

  step3: () =>
    g('bg', rr(10, 8, 180, 124, 26, 'url(#gIs)')) +
    g('mid',
      ln(22, 98, 178, 98, '#ffffff', 4.5) +
      [34, 62, 90, 118, 146, 176].map(x => ln(x, 92, x, 104, '#ffffff', 2.6, ' opacity=".8"')).join('')) +
    g('mass', skR(36, 76, 36, 20, 6) + skR(82, 76, 42, 20, 6)) +
    g('acc',
      skR(136, 76, 36, 20, 6, '#ffd479') +
      ci(164, 38, 15, '#ffffff') +
      ci(164, 38, 15, 'none', ` stroke="${SI}" stroke-width="1.6" opacity=".85"`) +
      ps('M164 38 L164 30 M164 38 L171 42', SI, 2.4)) +
    g('deco', ci(32, 44, 3.2, '#ffffff', ' opacity=".5"')),

  'empty-goals': () =>
    g('bg', rr(10, 8, 180, 124, 26, 'url(#gIs)')) +
    g('mid', rr(56, 40, 88, 60, 13, '#ffffff', ' opacity=".14"')) +
    g('mass', rr(46, 30, 108, 80, 16, 'none', ' stroke="#ffffff" stroke-width="5"' + dash(9, 7))) +
    g('acc', ps('M88 70 L112 70 M100 58 L100 82', '#ffd479', 6)) +
    g('deco', ci(30, 34, 3.2, '#ffffff', ' opacity=".5"') + ci(170, 108, 3, '#ffffff', ' opacity=".45"')),

  'empty-quad': () =>
    g('bg', rr(10, 8, 180, 124, 26, 'url(#gIs)')) +
    g('mid',
      ln(100, 22, 100, 118, '#ffffff', 3.6, dash(8, 6)) +
      ln(22, 70, 178, 70, '#ffffff', 3.6, dash(8, 6))) +
    g('mass', rr(48, 36, 46, 20, 10, 'none', ' stroke="#ffffff" stroke-width="4"' + dash(5, 4))) +
    g('acc',
      rr(108, 84, 46, 20, 10, 'none', ' stroke="#ffd479" stroke-width="4"' + dash(5, 4)) +
      ps('M104 92 C 92 70, 80 46, 66 40', '#ffffff', 2.6, dash(5, 4)) +
      pa('M66 34 L64 46 L76 42 Z', '#ffffff')) +
    g('deco', ci(158, 34, 3, '#ffffff', ' opacity=".5"')),

  'empty-timeline': () =>
    g('bg', rr(10, 8, 180, 124, 26, 'url(#gIs)')) +
    g('mid',
      ln(22, 98, 178, 98, '#ffffff', 3.6, dash(8, 6)) +
      [34, 62, 90, 118, 146, 176].map(x => ln(x, 92, x, 104, '#ffffff', 2.6, ' opacity=".7"')).join('')) +
    g('mass',
      rr(36, 76, 36, 20, 6, 'none', ' stroke="#ffffff" stroke-width="4"' + dash(5, 4)) +
      rr(84, 76, 42, 20, 6, 'none', ' stroke="#ffffff" stroke-width="4"' + dash(5, 4))) +
    g('acc', ci(164, 38, 15, 'none', ' stroke="#ffd479" stroke-width="4"' + dash(5, 4))) +
    g('deco', ci(32, 40, 3, '#ffffff', ' opacity=".5"')),
};

/* ============================================================
   套三 · 场景叙事
   外板 + 内板（纵深）→ 中景道具（淡描边半透明）→ 前景主体（深描边浅填充）→ 暖色点缀 + 星点
   ============================================================ */
const SCE = {
  amp: () =>
    g('bg', rr(10, 8, 180, 124, 26, B) + rr(26, 22, 148, 96, 18, '#000', ' opacity=".07"') + rr(24, 20, 152, 100, 20, B2)) +
    g('mid',
      rr(30, 104, 140, 9, 4.5, M, ' opacity=".5"') +
      rr(122, 38, 44, 56, 8, F, ' opacity=".75"') +
      rr(122, 38, 44, 56, 8, 'none', ` stroke="${M}" stroke-width="1.8"`) +
      [50, 60, 70].map(y => ln(131, y, 157, y, M, 1.8)).join('') +
      ln(36, 34, 36, 96, M, 1.6, ' opacity=".5"') + ln(110, 30, 110, 96, M, 1.6, ' opacity=".5"')) +
    g('mass',
      ci(86, 62, 28, F) + ci(86, 62, 28, 'none', ` stroke="${L}" stroke-width="4"`) +
      ps('M106 82 L128 104', L, 9)) +
    g('acc',
      rr(72, 66, 7, 12, 2, A2) + rr(83, 58, 7, 20, 2, A2) + rr(94, 50, 7, 28, 2, G) +
      ps('M76 62 L100 47', A, 3.4) + pa('M104 43 L94 45.5 L99.5 51 Z', A)) +
    g('deco',
      spark(38, 40, 7, G, .9) + spark(166, 96, 5, A2, .8) + spark(56, 118, 4.5, A, .7)),

  step1: () =>
    g('bg', rr(10, 8, 180, 124, 26, B) + rr(26, 22, 148, 96, 18, '#000', ' opacity=".07"') + rr(24, 20, 152, 100, 20, B2)) +
    g('mid',
      rr(30, 104, 140, 9, 4.5, M, ' opacity=".5"') +
      [38, 58, 78].map(y => ln(36, y, 164, y, M, 1.6, ' opacity=".35"' + dash(5, 6))).join('')) +
    g('mass',
      rr(52, 84, 96, 22, 7, F) + rr(52, 84, 96, 22, 7, 'none', ` stroke="${L}" stroke-width="3"`) +
      rr(64, 64, 72, 22, 7, F) + rr(64, 64, 72, 22, 7, 'none', ` stroke="${L}" stroke-width="3"`) +
      rr(76, 44, 48, 22, 7, F) + rr(76, 44, 48, 22, 7, 'none', ` stroke="${L}" stroke-width="3"`)) +
    g('acc', rr(76, 44, 48, 8, 4, G, ' opacity=".92"')) +
    g('deco', spark(40, 50, 6.5, G, .9) + spark(164, 66, 5, A2, .8)),

  step2: () =>
    g('bg', rr(10, 8, 180, 124, 26, B) + rr(26, 22, 148, 96, 18, '#000', ' opacity=".07"') + rr(24, 20, 152, 100, 20, B2)) +
    g('mid',
      rr(40, 26, 120, 88, 12, M, ' opacity=".18"') +
      ln(100, 26, 100, 114, M, 2) + ln(40, 70, 160, 70, M, 2)) +
    g('mass',
      rr(48, 36, 44, 20, 10, F) + rr(48, 36, 44, 20, 10, 'none', ` stroke="${L}" stroke-width="2.6"`) +
      rr(108, 84, 44, 20, 10, F) + rr(108, 84, 44, 20, 10, 'none', ` stroke="${L}" stroke-width="2.6"`)) +
    g('acc',
      rr(104, 34, 44, 20, 10, A) + rr(104, 34, 44, 20, 10, 'none', ` stroke="${L}" stroke-width="2"`) +
      ps('M62 58 C 74 44, 86 36, 100 34', A2, 2.4, dash(5, 4)) +
      pa('M100 30 L100 40 L110 35 Z', A2) +
      pa('M100 62 L106 70 L100 78 L94 70 Z', G)) +
    g('deco', spark(34, 108, 6, A2, .8) + spark(166, 34, 5, G, .85)),

  step3: () =>
    g('bg', rr(10, 8, 180, 124, 26, B) + rr(26, 22, 148, 96, 18, '#000', ' opacity=".07"') + rr(24, 20, 152, 100, 20, B2)) +
    g('mid',
      [46, 70, 94, 118, 142].map(x => ln(x, 30, x, 92, M, 1.6, ' opacity=".35"')).join('') +
      ln(22, 98, 178, 98, M, 2.6) +
      [34, 62, 90, 118, 146, 176].map(x => ln(x, 92, x, 104, M, 2)).join('')) +
    g('mass',
      rr(36, 76, 36, 20, 6, F) + rr(36, 76, 36, 20, 6, 'none', ` stroke="${L}" stroke-width="2.8"`) +
      rr(82, 76, 42, 20, 6, F) + rr(82, 76, 42, 20, 6, 'none', ` stroke="${L}" stroke-width="2.8"`)) +
    g('acc',
      rr(136, 76, 36, 20, 6, A) + rr(136, 76, 36, 20, 6, 'none', ` stroke="${L}" stroke-width="2"`) +
      ci(164, 38, 15, F) + ci(164, 38, 15, 'none', ` stroke="${L}" stroke-width="2.6"`) +
      ps('M164 38 L164 30 M164 38 L171 42', G, 2.6)) +
    g('deco', spark(32, 42, 6, G, .85) + spark(172, 112, 4.5, A2, .75)),

  'empty-goals': () =>
    g('bg', rr(10, 8, 180, 124, 26, B) + rr(26, 22, 148, 96, 18, '#000', ' opacity=".07"') + rr(24, 20, 152, 100, 20, B2)) +
    g('mid', rr(30, 104, 140, 9, 4.5, M, ' opacity=".5"')) +
    g('mass', rr(46, 30, 108, 74, 16, F, ` stroke="${L}" stroke-width="3"${dash(9, 7)}`)) +
    g('acc', ps('M88 66 L112 66 M100 54 L100 78', G, 6)) +
    g('deco', spark(34, 40, 6, G, .85) + spark(168, 100, 5, A2, .75)),

  'empty-quad': () =>
    g('bg', rr(10, 8, 180, 124, 26, B) + rr(26, 22, 148, 96, 18, '#000', ' opacity=".07"') + rr(24, 20, 152, 100, 20, B2)) +
    g('mid',
      rr(40, 26, 120, 88, 12, M, ' opacity=".14"') +
      ln(100, 26, 100, 114, M, 2, dash(6, 5)) + ln(40, 70, 160, 70, M, 2, dash(6, 5))) +
    g('mass',
      rr(48, 36, 44, 20, 10, F, ` stroke="${L}" stroke-width="2.8"${dash(6, 5)}`)) +
    g('acc',
      rr(108, 84, 44, 20, 10, F, ` stroke="${G}" stroke-width="3"${dash(6, 5)}`) +
      ps('M104 92 C 92 70, 80 46, 66 40', A2, 2.4, dash(5, 4)) +
      pa('M66 34 L64 46 L76 42 Z', A2)) +
    g('deco', spark(160, 32, 6, A2, .8)),

  'empty-timeline': () =>
    g('bg', rr(10, 8, 180, 124, 26, B) + rr(26, 22, 148, 96, 18, '#000', ' opacity=".07"') + rr(24, 20, 152, 100, 20, B2)) +
    g('mid',
      [46, 70, 94, 118, 142].map(x => ln(x, 30, x, 92, M, 1.6, ' opacity=".35"')).join('') +
      ln(22, 98, 178, 98, M, 2.6, dash(7, 6)) +
      [34, 62, 90, 118, 146, 176].map(x => ln(x, 92, x, 104, M, 2)).join('')) +
    g('mass',
      rr(36, 76, 36, 20, 6, F, ` stroke="${L}" stroke-width="2.8"${dash(6, 5)}`) +
      rr(82, 76, 42, 20, 6, F, ` stroke="${L}" stroke-width="2.8"${dash(6, 5)}`)) +
    g('acc',
      ci(164, 38, 15, F, ` stroke="${G}" stroke-width="3"${dash(6, 5)}`)) +
    g('deco', spark(32, 40, 5, A2, .75)),
};

/* ---------- 组装 sprite ---------- */
const SETS = [
  {
    id: 'iso', cn: '套一 · 立体等距', art: ISO,
    sub: '淡色底板 → 内层光晕 → 立体块（顶亮 / 面中 / 侧暗）→ 强调色面 + 硬投影',
    good: '想要「有厚度、像实体」的稳重感；适合放在功能入口、能力矩阵这类需要「一块一块」的位置。',
    note: '最接近你发的第三张图（3D 仓库）：深色实块 + 淡色底 + 一个强调色 + 硬投影。',
  },
  {
    id: 'stk', cn: '套二 · 描边贴纸', art: STK,
    sub: '品牌实色底 → 白色厚描边主体 → 深色细内轮廓 → 暖色强调',
    good: '想要「强识别、最像 App 图标」的冲击力；适合空状态、引导页、分享图。',
    note: '对应你发的第二张图（白色器物）：白主体 + 厚描边浮在实色底上，主体自己就能从背景里跳出来。',
  },
  {
    id: 'sce', cn: '套三 · 场景叙事', art: SCE,
    sub: '外板 + 内板造纵深 → 中景道具（淡描边半透明）→ 前景主体（深描边浅填充）→ 暖色点缀',
    good: '想要「一幅小插画」的细腻与叙事感；适合品牌头图、空状态、教学说明。',
    note: '对应你发的第一张图（机器人导师）：大底板 + 中景道具 + 前景主体 + 金色点缀，层次最多。',
  },
];

function buildSprite() {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" ` +
          `style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">\n`;
  s += `<defs>\n`;
  /* 贴纸套专用：品牌实色渐变，固定色值，刻意不跟随深浅主题 */
  s += `  <linearGradient id="gIs" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="200" y2="140">\n`;
  s += `    <stop offset="0" stop-color="${SB1}"/>\n    <stop offset="1" stop-color="${SB2}"/>\n`;
  s += `  </linearGradient>\n`;
  s += `</defs>\n\n`;
  for (const set of SETS) {
    s += `<!-- ===== ${set.cn} ===== -->\n`;
    for (const sl of SLOTS) {
      const id = `a-${sl.k}-${set.id}`;
      const body = set.art[sl.k]();
      s += `<symbol id="${id}" data-set="${set.id}" data-slot="${sl.k}" viewBox="0 0 200 140">\n`;
      s += `  <title>${sl.t}（${set.cn}）</title>\n`;
      s += body.replace(/(<g class="l-[a-z]+">)/g, '  $1').replace(/<\/g>/g, '  </g>') + `\n`;
      s += `</symbol>\n`;
    }
    s += `\n`;
  }
  s += `</svg>\n`;
  return s;
}

const sprite = buildSprite();
fs.writeFileSync(path.join(OUT, 'illustrations.svg'), sprite, 'utf8');
console.log('illustrations.svg  ' + sprite.length + ' chars  symbols=' + (sprite.match(/<symbol /g) || []).length);

/* ============================================================
   对比预览页
   注意：<use> 是影子树，页面 CSS 选不中里面的 .l-* 图层，
   所以卡片里改成「内联展开图形本体」，这样逐层揭示才有效。
   ============================================================ */
const LAYERS = [
  { i: 1, k: 'bg',   n: '底板',   d: '场景边界 + 明度基线' },
  { i: 2, k: 'mid',  n: '中景',   d: '结构 / 道具，压在中调' },
  { i: 3, k: 'mass', n: '主体',   d: '最深最实，视觉重心' },
  { i: 4, k: 'acc',  n: '强调',   d: '唯一的彩色焦点' },
  { i: 5, k: 'deco', n: '装饰',   d: '点状提亮，破呆板' },
];

const card = (sl, set, big) => {
  const id = `a-${sl.k}-${set.id}`;
  const body = set.art[sl.k]();
  return `<figure class="cell${big ? ' big' : ''}" data-id="${id}" data-tag="${sl.tag}">
      <div class="stage"><svg class="ill" viewBox="0 0 200 140">${body}</svg></div>
      <figcaption><b>${sl.t}</b><span class="mono">${id}</span><span class="tag">${sl.tag}</span></figcaption>
      <button class="copy" type="button">复制引用</button>
    </figure>`;
};

const css = `
*{box-sizing:border-box}
:root{
  --acc:#4a5bd8; --acc2:#1f9fb8;
  --i-bg:#dde6fa; --i-bg2:#f7fafe; --i-mid:#c0cde9;
  --i-mass:#1b2133; --i-mass2:#3a4361; --i-line:#1b2133; --i-fill:#ffffff;
  --i-acc:#4a5bd8; --i-acc2:#1f9fb8; --i-gold:#e2ab52; --i-sh:rgba(18,26,52,.17);
  --ink:#131829; --ink2:#5a6480; --line:#e3e8f4; --card:#ffffff;
  --glass:rgba(255,255,255,.72); --bg:#eef1f8;
}
html[data-theme="dark"]{
  --acc:#8b9bff; --acc2:#3ad3e8;
  --i-bg:#1b2338; --i-bg2:#252f4c; --i-mid:#45527a;
  --i-mass:#dfe7ff; --i-mass2:#a9b8e0; --i-line:#cfdaf7; --i-fill:#212a45;
  --i-acc:#8b9bff; --i-acc2:#3ad3e8; --i-gold:#f0c46a; --i-sh:rgba(0,0,0,.45);
  --ink:#e8edfb; --ink2:#98a4c4; --line:#2b3450; --card:#171e30;
  --glass:rgba(23,30,48,.72); --bg:#0e1322;
}
html,body{margin:0}
body{background:var(--bg);color:var(--ink);font:14px/1.6 system-ui,"PingFang SC","Microsoft YaHei",sans-serif;
  -webkit-font-smoothing:antialiased;
  background-image:radial-gradient(900px 500px at 8% -10%,color-mix(in srgb,var(--acc) 16%,transparent),transparent 60%),
                   radial-gradient(800px 460px at 100% 6%,color-mix(in srgb,var(--acc2) 14%,transparent),transparent 60%);
  background-attachment:fixed}
.mono{font-family:ui-monospace,Consolas,monospace}
.bar{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:14px;padding:10px 22px;
  background:var(--glass);backdrop-filter:blur(20px) saturate(1.7);-webkit-backdrop-filter:blur(20px) saturate(1.7);
  border-bottom:1px solid var(--line)}
.bar .lg{display:flex;align-items:center;gap:9px;font-weight:800;letter-spacing:.2px}
.bar .lg i{display:block;width:22px;height:22px;border-radius:7px;background:linear-gradient(135deg,var(--acc),var(--acc2));
  box-shadow:0 6px 16px -6px var(--acc)}
.bar .sp{flex:1}
.bar button{cursor:pointer}
.btn{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:10px;
  padding:7px 13px;font:600 12.5px system-ui;cursor:pointer}
.btn:hover{border-color:var(--acc);color:var(--acc)}
.btn.pri{background:linear-gradient(135deg,var(--acc),var(--acc2));color:#fff;border-color:transparent}
.wrap{max-width:1180px;margin:0 auto;padding:30px 22px 120px}
h1{font-size:30px;line-height:1.25;margin:6px 0 10px;letter-spacing:-.5px}
h1 em{font-style:normal;background:linear-gradient(120deg,var(--ink),var(--acc) 60%,var(--acc2));
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.lede{color:var(--ink2);max-width:76ch;margin:0 0 8px}
.eyebrow{font:800 11px ui-monospace,Consolas,monospace;letter-spacing:.16em;color:var(--acc);
  text-transform:uppercase;margin:34px 0 8px}
h2{font-size:21px;margin:0 0 6px;letter-spacing:-.2px}
h3{font-size:15.5px;margin:0 0 4px}
p{margin:0 0 8px}
.rule{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:14px 0 6px}
.rule div{background:var(--card);border:1px solid var(--line);border-radius:13px;padding:11px 12px}
.rule b{display:flex;align-items:center;gap:7px;font-size:13px;margin-bottom:3px}
.rule b i{width:16px;height:16px;border-radius:5px;display:block;flex:none;
  background:linear-gradient(135deg,var(--acc),var(--acc2));opacity:.85}
.rule span{font:500 11.5px/1.5 system-ui;color:var(--ink2);display:block}
.rule .lv{font:800 10px ui-monospace,monospace;color:var(--acc);letter-spacing:.1em}
.note{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px 18px;margin:12px 0 18px;
  display:grid;grid-template-columns:1.4fr 1fr;gap:16px;align-items:start}
.note .sub{font:600 12.5px/1.6 ui-monospace,Consolas,monospace;color:var(--ink2);margin:6px 0 0}
.note .ref{font-size:12.5px;color:var(--ink2);border-left:2px solid var(--acc);padding-left:11px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(258px,1fr));gap:16px}
.cell{margin:0;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:11px 11px 9px;
  position:relative;transition:transform .25s cubic-bezier(.2,.7,.2,1),box-shadow .25s,border-color .25s}
.cell:hover{transform:translateY(-4px);border-color:var(--acc);box-shadow:0 22px 44px -26px rgba(0,0,0,.5)}
.stage{border-radius:12px;overflow:hidden;background:var(--card)}
.ill{display:block;width:100%;height:auto}
.cell figcaption{display:flex;flex-direction:column;gap:1px;padding:9px 3px 3px;position:relative}
.cell figcaption b{font-size:13px;font-weight:700;padding-right:66px}
.cell .mono{font-size:10.5px;color:var(--ink2)}
.cell .tag{position:absolute;right:3px;top:9px;font:700 9.5px ui-monospace,Consolas,monospace;
  letter-spacing:.06em;color:var(--acc);background:color-mix(in srgb,var(--acc) 12%,transparent);
  padding:2px 8px;border-radius:20px;white-space:nowrap}
.cell .copy{position:absolute;right:10px;bottom:9px;opacity:0;transition:opacity .2s;
  border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:8px;padding:3px 8px;
  font:600 10.5px system-ui;cursor:pointer}
.cell:hover .copy{opacity:1}
.cell .copy:hover{border-color:var(--acc);color:var(--acc)}
.cmpStrip{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.stagebar{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:30;
  display:flex;align-items:center;gap:6px;padding:7px 9px;border-radius:16px;border:1px solid var(--line);
  background:var(--glass);backdrop-filter:blur(22px) saturate(1.7);-webkit-backdrop-filter:blur(22px) saturate(1.7);
  box-shadow:0 18px 40px -22px rgba(0,0,0,.55)}
.stagebar .cap{font:800 10px ui-monospace,monospace;letter-spacing:.12em;color:var(--ink2);padding:0 6px 0 4px}
.seg{position:relative;display:flex;background:color-mix(in srgb,var(--ink) 7%,transparent);border-radius:11px;padding:3px}
.seg button{position:relative;z-index:1;border:0;background:none;color:var(--ink2);cursor:pointer;
  padding:6px 12px;border-radius:9px;font:700 12px system-ui}
.seg button.on{color:#fff}
.seg i{position:absolute;z-index:0;top:3px;bottom:3px;left:0;width:0;border-radius:9px;
  background:linear-gradient(135deg,var(--acc),var(--acc2));transition:transform .3s cubic-bezier(.2,.7,.2,1),width .3s}
/* 逐层揭示：图层本体内联在文档里，页面选择器才选得中 */
.l-bg,.l-mid,.l-mass,.l-acc,.l-deco{transition:opacity .38s ease}
body[data-stage="1"] .l-mid,body[data-stage="1"] .l-mass,body[data-stage="1"] .l-acc,body[data-stage="1"] .l-deco,
body[data-stage="2"] .l-mass,body[data-stage="2"] .l-acc,body[data-stage="2"] .l-deco,
body[data-stage="3"] .l-acc,body[data-stage="3"] .l-deco,
body[data-stage="4"] .l-deco{opacity:0}
.toast{position:fixed;left:50%;bottom:78px;transform:translate(-50%,14px);z-index:40;opacity:0;
  background:var(--ink);color:var(--bg);padding:8px 15px;border-radius:11px;font:600 12.5px system-ui;
  transition:opacity .22s,transform .22s;pointer-events:none}
.toast.on{opacity:1;transform:translate(-50%,0)}
.foot{color:var(--ink2);font-size:12px;border-top:1px solid var(--line);margin-top:34px;padding-top:14px;
  display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
@media(max-width:880px){
  .rule{grid-template-columns:repeat(2,1fr)}
  .note{grid-template-columns:1fr}
  .cmpStrip{grid-template-columns:1fr}
  h1{font-size:24px}
  .stagebar{left:12px;right:12px;transform:none;overflow-x:auto}
  .stagebar .cap{display:none}
}
@media(max-width:620px){
  .bar{padding:9px 12px;gap:8px}
  .bar .lg{font-size:12.5px;line-height:1.25;gap:7px}
  .bar .lg i{width:18px;height:18px;border-radius:6px}
  .btn{padding:6px 10px;font-size:11.5px}
  .bar .fn{display:none}
  .wrap{padding:20px 14px 120px}
}
`;

const spriteDefs = sprite.slice(sprite.indexOf('<defs>'), sprite.indexOf('</defs>') + 7);

const secHead = (set, n) => `<section>
  <div class="eyebrow">Set ${n} · ${set.id}</div>
  <h2>${set.cn}</h2>
  <div class="note">
    <div>
      <h3>分层构成</h3>
      <p class="sub">${set.sub}</p>
      <p style="margin-top:9px">${set.good}</p>
    </div>
    <div class="ref">${set.note}</div>
  </div>
  <div class="grid">${SLOTS.map(sl => card(sl, set, false)).join('')}</div>
</section>`;

const page = `<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>自律放大器 · 插画三套（分层重设）</title>
<style>${css}</style>
</head>
<body data-stage="5">
<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">${spriteDefs}</svg>
<div class="bar">
  <div class="lg"><i></i>插画三套 · 分层重设</div>
  <div class="sp"></div>
  <button class="btn" id="themeBtn" type="button">切深色</button>
  <button class="btn pri" id="dlBtn" type="button">下载 <span class="fn">illustrations.svg</span></button>
</div>
<div class="wrap">
  <h1>同一批插画，三种<em>分层语言</em></h1>
  <p class="lede">上一版的问题是「平铺」—— 图形都堆在同一层明度上，所以看不出纵深，也撑不起版面层级。
     这次先把结构定死：每张插画都必须走完<strong>五层台阶</strong>，再让三套各自用不同的手法去表达这五层。</p>

  <div class="rule">
    ${LAYERS.map(L => `<div><b><i></i>${L.n}</b><span class="lv">L${L.i}</span><span>${L.d}</span></div>`).join('')}
  </div>
  <p class="lede" style="margin-top:12px">想验证这件事，把页面底部的<strong>层级推进</strong>拨到 1，再一路拨到 5 ——
     每一张插画都会按 底板 → 中景 → 主体 → 强调 → 装饰 的顺序长出来。层级不是形容词，是能一格格看的。</p>

  <div class="eyebrow">同一题 · 三套对比</div>
  <h2>放大器（品牌主视觉）</h2>
  <div class="cmpStrip">${SETS.map(set => card(SLOTS[0], set, true)).join('')}</div>

  ${SETS.map((set, i) => secHead(set, i + 1)).join('')}

  <div class="foot">
    <span>自律放大器 · 图形资源 · 单文件零依赖</span>
    <span class="mono">21 张插画 = 7 槽位 × 3 套</span>
  </div>
</div>

<div class="stagebar">
  <span class="cap">层级推进</span>
  <div class="seg" id="stageSeg">
    <i></i>
    ${LAYERS.map(L => `<button type="button" data-s="${L.i}">${L.n}</button>`).join('')}
  </div>
</div>
<div class="toast" id="toast"></div>

<script>
var root=document.documentElement, body=document.body;
var THEME=document.documentElement.getAttribute("data-theme")||"light";

function toast(msg){
  var t=document.getElementById("toast");
  t.textContent=msg; t.classList.add("on");
  clearTimeout(t._h); t._h=setTimeout(function(){t.classList.remove("on")},1500);
}
function copy(text){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){toast("已复制 "+text.slice(0,34)+"…")},
      function(){fallback(text)});
  } else fallback(text);
}
function fallback(text){
  var ta=document.createElement("textarea");
  ta.value=text; ta.style.position="fixed"; ta.style.opacity="0";
  document.body.appendChild(ta); ta.select();
  try{document.execCommand("copy");toast("已复制");}catch(e){toast("复制失败，请手动选取");}
  document.body.removeChild(ta);
}
function refFor(id,label){
  return '<svg width="200" height="140" viewBox="0 0 200 140" role="img" aria-label="'+label+'">\\n'+
         '  <use href="#'+id+'"/>\\n</svg>';
}

document.getElementById("themeBtn").addEventListener("click",function(){
  THEME = THEME==="light" ? "dark" : "light";
  root.setAttribute("data-theme",THEME);
  this.textContent = THEME==="light" ? "切深色" : "切浅色";
});

document.body.addEventListener("click",function(e){
  var c=e.target.closest(".copy");
  if(c){
    var cell=c.closest(".cell"), id=cell.getAttribute("data-id");
    copy(refFor(id, cell.querySelector("figcaption b").textContent));
    return;
  }
  var cell2=e.target.closest(".cell");
  if(cell2){
    var id2=cell2.getAttribute("data-id");
    copy(refFor(id2, cell2.querySelector("figcaption b").textContent));
  }
});

/* 层级推进分段控件（滑动指示条） */
var seg=document.getElementById("stageSeg");
var ind=seg.querySelector("i");
function markStage(n){
  body.setAttribute("data-stage",String(n));
  var btns=seg.querySelectorAll("button");
  for(var i=0;i<btns.length;i++) btns[i].classList.toggle("on", (+btns[i].getAttribute("data-s"))===n);
  var on=seg.querySelector("button.on");
  if(on){ ind.style.width=on.offsetWidth+"px"; ind.style.transform="translateX("+on.offsetLeft+"px)"; }
}
seg.addEventListener("click",function(e){
  var b=e.target.closest("button"); if(!b) return;
  markStage(+b.getAttribute("data-s"));
});
window.addEventListener("resize",function(){ markStage(+body.getAttribute("data-stage")); });
markStage(5);

document.getElementById("dlBtn").addEventListener("click",function(){
  var blob=new Blob([document.getElementById("dl").textContent],{type:"image/svg+xml"});
  var a=document.createElement("a");
  a.href=URL.createObjectURL(blob); a.download="illustrations.svg";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  toast("已下载 illustrations.svg");
});
</script>
<script type="text/plain" id="dl">${sprite}</script>
</body>
</html>
`;

fs.writeFileSync(path.join(OUT, 'illustration-sets.html'), page, 'utf8');
console.log('illustration-sets.html  ' + page.length + ' chars');
console.log('图层分组计数  l-bg=' + (page.match(/class="l-bg"/g) || []).length +
            '  l-mid=' + (page.match(/class="l-mid"/g) || []).length +
            '  l-mass=' + (page.match(/class="l-mass"/g) || []).length +
            '  l-acc=' + (page.match(/class="l-acc"/g) || []).length +
            '  l-deco=' + (page.match(/class="l-deco"/g) || []).length);
