# Photomask-Cleaner

离线光掩模清洗设备原理演示。直接打开 `Photomask-Cleaner.html`，无需服务器或网络。

仓库：[Aaron-Lzb/Photomask-Cleaner](https://github.com/Aaron-Lzb/Photomask-Cleaner)。

## 使用

- 播放、暂停、重播；支持0.5×、1×、2×，可拖动进度或选择29个步骤。
- 支持斜视、正视、俯视、Cleaner特写、Grip侧视，采用明亮的单一浅色主题。
- 非交互区域：空格播放/暂停，左右箭头切步，Home回起点；按钮保留原生键盘操作。
- WebGL绘图中断时暂停并提示重新加载；重新加载后回到起点暂停。

## 文件用途

| 文件 | 用途 |
|---|---|
| `Photomask-Cleaner.html` | 自包含的正式离线文件 |
| `model.js` | 29步时序、坐标和工艺状态 |
| `scene.js` / `app.js` / `template.html` | 三维绘制、交互和页面源码 |
| `chuck-profile.js` | Chuck轮廓、开孔与Pin数据 |
| `build.mjs` | 将源码嵌入正式HTML |
| `references/Chuck.png` / `trace-chuck.py` | Chuck参考图与轮廓生成工具 |
| `verify.cjs` | 流程、交接、夹持及轮廓回归检查 |
| `clearance-check.cjs` / `geometry-audit.cjs` | LD专项及实际模型全程干涉检查 |
| `tests/motion-baseline.cjs` | 仅供流程回归使用的已验收运动对照，不参与运行或构建 |
| `tests/browser.json` / `tests/playback.json` | 当前交互/布局和完整播放的浏览器测试动作 |
| `VALIDATION.md` | 当前约束、必要验证结论及检查边界 |

## 构建与验证

在项目根目录运行，需Node.js：

```sh
node build.mjs
node verify.cjs
node clearance-check.cjs
AUDIT_DT=.025 node geometry-audit.cjs > /tmp/photomask-geometry.json
```

浏览器动作使用现有Anatomy技能的`scripts/drive.mjs`，不需要给项目安装新依赖；将下方`<anatomy>`替换为该技能目录：

```sh
node <anatomy>/scripts/drive.mjs Photomask-Cleaner.html --actions tests/browser.json --height 1300
node <anatomy>/scripts/drive.mjs Photomask-Cleaner.html --actions tests/browser.json --width 390 --height 1000
node <anatomy>/scripts/drive.mjs Photomask-Cleaner.html --actions tests/playback.json --height 1300
```

测试只向终端输出结果，不在项目中生成截图或日志。几何工具输出候选重叠，需按`VALIDATION.md`区分正常装配；不能仅以退出码判定无碰撞。

重新生成Chuck轮廓时才需要Python、Pillow和NumPy，并运行`python3 trace-chuck.py`；日常使用、构建与Node检查不需要它们。

## 模型边界

Traverser仅沿X/Z移动，LD Arm执行75°翻转与前后送料，圆形Chuck Stage固定，Grip仅前后两组。湿洗时背面DIW持续开启，Dry开始时停止。

尺寸、时长、转速及液路均为工程示意，不作为制造参数或工艺配方。固定悬臂、Grip接合与可变尺寸机构采用简化表达；无WebGL的兼容投影遮挡精度较低。
