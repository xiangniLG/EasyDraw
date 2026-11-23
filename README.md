# PhyDraw · DSE 物理绘图素材库（离线）

双击 `index.html` 即可使用（Chrome / Edge），无需联网、无需安装。

## 目录结构
```
phydraw/
├── index.html        界面
├── css/app.css
├── js/core.js        核心：注册 API、迷你 TeX 文本、箭头、填充/渐变/阴影线、3D 投影、多面体
├── js/app.js         编辑器：拖放、控制点、属性面板、撤销、导出
└── lib/              素材库（每章一个文件）
    ├── basic.js      基础几何
    ├── graph.js      图表
    ├── solid3d.js    3D / 投影
    ├── lab.js        实验器材
    ├── heat.js       热与气体
    ├── mechanics.js  力与运动 + 天体与航天
    ├── optics.js     光与波(上)：反射、折射、透镜
    ├── waves.js      光与波(下)：波动、干涉衍射、光的波动性、声音
    ├── circuit.js    电与磁：电路、家居电路
    ├── electro.js    电与磁：静电学、磁场、磁场中受到的力
    ├── induction.js  电与磁：电磁感应、变压器
    └── nuclear.js    辐射与核能
```

## 新增一章素材
新建 `lib/xxx.js`，在 index.html 中 app.js 之前加一行 `<script src="lib/xxx.js"></script>`：
```js
PD.register({
  type: 'spring', name: '弹簧',
  defaults: { L: 120, n: 10, amp: 8 },
  handles: [['L', 'zero']],
  fields: [{ k: 'L', t: 'num', l: '长度' }, { k: 'n', t: 'num', l: '圈数' }],
  render(p, ctx) { return `<path d="..." fill="none" ${PD.strokeAttr(p)}/>`; },
});
PD.preset('力学', '弹簧', 'spring', {});
```
字段类型：num / text / area / sel / bool / color / range；`when:(p)=>…` 条件显示。

## 文本语法
| 效果 | 写法 |
|---|---|
| 上下标 | `x_1` `v^2` `x_1^2`（自动上下叠放） `F_{net}` |
| 希腊字母/符号 | `\theta` `\Delta` `\lambda` `\to` `\times` `\odot` `\otimes` |
| 正体/粗体 | `\rm{m s^{-1}}` `\bf{F}` |
| 矢量箭头/根号 | `\vec{F}` `\sqrt{2gh}` |
| 分式 | `\frac{1}{2}mv^2` 或 `{1}/{2}mv^2`（竖式/横式可切换），`\dfrac` 总竖式，`\tfrac` 总横式 |
| 核素 | `\nuc{235}{92}{U}` 或 `{}^{235}_{92}\rm{U}`，β 粒子 `\nuc{0}{-1}{e}` |
| 罗马数字 | `\Roman{3}` → III，`(\roman{2})` → (ii)；也可以直接输入 I、II、(i) |
| 空格 | `\,` 细空格  `\quad` 宽空格 |

## 电路连线
选中导线后会显示所有元件端口（橙色圈）。把导线两端的蓝点拖到端口上即可连接；之后移动或旋转元件，导线会跟着走。拖动导线中间的蓝点可以调整转折位置。按住 Alt 拖动则不吸附。

## 图表函数语法
`2x+1`、`x^2`、`-x^2`（= −x²）、`sin(x)`、`exp(-x/2)`、`sqrt(x)`、`ln(x)`、`log(x)`（以 10 为底）、`abs(x)`、`PI`、`x<3 ? 1 : 0`。写错时图表上方会显示红色提示。

## 插入元件
把电阻、灯泡等两端元件拖到导线上松开，会自动串联进去。
