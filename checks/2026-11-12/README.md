# Photomask-Cleaner 本地验证（2026-11-12）

从项目根目录运行现有检查：

```sh
node verify.cjs
node clearance-check.cjs
AUDIT_DT=.025 node geometry-audit.cjs
```

浏览器动作JSON配合Anatomy技能的`scripts/drive.mjs`运行；无需给项目安装新依赖。示例：

```sh
node <anatomy>/scripts/drive.mjs Photomask-Cleaner.html --actions checks/2026-11-12/browser.json --height 1300
node <anatomy>/scripts/drive.mjs Photomask-Cleaner.html --actions checks/2026-11-12/mobile.json --width 390 --height 1000
node <anatomy>/scripts/drive.mjs Photomask-Cleaner.html --actions checks/2026-11-12/mobile-320.json --width 320 --height 1000
node <anatomy>/scripts/drive.mjs Photomask-Cleaner.html --actions checks/2026-11-12/playback.json --height 1300
node <anatomy>/scripts/drive.mjs Photomask-Cleaner.html --actions checks/2026-11-12/fallback.json --no-webgl --height 1300
```

- `browser.json`：原生按钮空格、全局快捷键、静态缓存失效条件、上下文丢失后的暂停/提示/禁用与实际重新加载。
- `mobile*.json`：390px/320px布局、离线资源、进度拖动与中断提示。
- `playback.json`：原2×控件和加速测试时钟下的实际RAF连续播放，遍历29步并验证最终状态。
- `performance-actions.json`：相同湿洗场景，10帧预热＋80帧计时。`performance-results.json`记录三轮修改前/后原始统计及汇总；基线为本轮前提交。比较为同机无头Chromium测试，不代表真实手机帧率。首轮优化后P95存在29.7ms波动，其余两轮为17.2/17.3ms，因此不宣称每一帧都更快。
- `pixels-actions.json`、`pixels-before.log`与`pixels-after.log`：六个状态的原始画布RGBA哈希，比较不包含页面名称和图例文字。
- 几何候选仍需人工区分装配连接；`geometry.json`的退出码不能单独代表无碰撞。
