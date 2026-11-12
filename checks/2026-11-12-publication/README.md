# 最终页面与发布验证（2026-11-12）

- `process.log` / `clearance.log`：现有流程与LD几何专项验证。
- `preservation.log`：与本轮前本地版本比较，模型状态/时间点/关键帧一致；仅步骤文字改变，渲染和交互函数不变；HTML构建一致。
- `browser.json`：沿用上一轮交互验证；`mobile*.json`：手机视口、拖动与异常提示；`playback.json`：完整29步连续播放；`fallback.json`：无WebGL降级。动作JSON使用Anatomy技能的`scripts/drive.mjs`执行。
- `layout*.json`：在0、108、121、197和238秒检查整页及文字溢出，桌面和320px/390px整页截图已查看。
- `status.json`：验证湿洗/Dry/完成状态及喷淋开关对应关系。
- `pixels-before.log` / `pixels-after.log` / `pixels-summary.json`：本轮前后六个关键画布状态逐像素一致。

复现示例（从项目根目录执行）：

```sh
node verify.cjs
node clearance-check.cjs
node <anatomy>/scripts/drive.mjs Photomask-Cleaner.html --actions checks/2026-11-12-publication/browser.json --height 1300
node <anatomy>/scripts/drive.mjs Photomask-Cleaner.html --actions checks/2026-11-12-publication/layout-320.json --width 320 --height 1000
node <anatomy>/scripts/drive.mjs Photomask-Cleaner.html --actions checks/2026-11-12-publication/playback.json --height 1300
```

历史验证资料保留在原目录。本次只对有变化的页面与交互进行必要复核，不增加运行时机制或依赖。
