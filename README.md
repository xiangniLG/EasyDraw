# EasyDraw · DSE 数学绘图素材库（离线）

双击 `index.html` 即可使用（Chrome / Edge / Safari），无需联网。本分支 `feature-math` 是数学版；物理版在 `feature-physics` 分支。

## 目录结构
```
├── index.html        界面（PD.edition = 'math'）
├── css/app.css
├── js/core.js        核心：注册 API、TeX 排版、函数解析器、3D 投影
├── js/app.js         编辑器（各学科共用）
└── lib/
    ├── basic.js      基础几何、文字公式
    ├── graph.js      坐标图表（函数、不等式区域、交点…）
    ├── solid3d.js    3D 立体（通用）
    ├── mgeo.js       平面几何作图语言、立体几何、三角学、数线
    └── mstat.js      统计、概率、表格、坐标几何/函数图像预设、常用公式
```

## 平面几何作图（例）
```
A = 0, 110
B = -90, -40
C = 120, -40
poly A B C
angle B A C x
tick A B
tick A C
```
输入框留空时会显示全部指令说明。蓝色圆点可以直接拖动顶点。

## 图表函数语法
`2x+1`、`x^2`、`sin(x)`（可选「按度」）、`log(x)`（以 10 为底）、`ln(x)`、`2^x`、`x<3 ? 1 : 0`。不等式区域写 `y <= -x + 5`、`x >= 0`。写错时图表上方显示红字。

详细设计见 HANDOFF.md 第 0 节。
