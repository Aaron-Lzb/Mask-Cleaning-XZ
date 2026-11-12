# Mask Cleaning · XZ Anatomy

打开 `Mask-Cleaning-XZ.html` 即可播放，无需联网或本地服务器。所有脚本已内嵌在该文件内。

这是按本轮约束从零建立的独立基础项目。主文件、模型、绘图和交互源码均位于本目录。

## 最新：全流程干涉复核与配色
- 修正LD滑动柱座与导轨后挡块重叠、Traverser升降导向件与后横轨重叠；Mask凸起装饰边改为表面标线。
- 配色：暖灰地面、中性银灰设备、低饱和青绿色运动件、淡蓝色半透明玻璃质感Mask、石墨灰Chuck；界面与液路图例同步统一。
- `model.js`和`app.js`与本轮前逐字节一致：动作、时序、夹持位置及工艺信号不变。
- 新离线`geometry-audit.cjs`直接提取实际模型基本几何，检查完整238秒，配合原流程/包络测试与浏览器复核。运行：`AUDIT_DT=.025 node geometry-audit.cjs`；不会向动画加入碰撞系统。
- 最新检查范围、发现、正常装配重叠分类与限制详见`VALIDATION.md`。修改前源码保存在`baseline-before-palette-audit/`。

## Mask / LD Arm适配
Mask按8 Pin内侧范围居中缩至72.6892×82.6428示意单位，边缘留0.6间隙；四角背面支撑及Mask取放接触面已适配。Mask落在原有中央连接环顶面，Chuck和Pin保持不变。详情见`VALIDATION.md`。

## Chuck厚度更新
统一Chuck模型局部Z尺寸为上一版50%（总厚9→4.5示意单位），X/Y轮廓与孔位不变；Mask及Grip接触高度已适配，原动作时序保留。修改前版本见`baseline-before-thickness/`。

## 操作
- 播放/暂停、重播、0.5×/1×/2×；拖动进度或点击29段步骤。
- 斜视、正面、俯视、Cleaner特写、Grip侧视；暖灰/纯白，两种均为浅色主题。
- 空格播放/暂停，左右方向键切换步骤，Home回起点。
- 默认暂停，不自动循环；播放结束停留。系统减少动态效果时不自动重播。

## 本轮内部托架与完整卸载归位
- 移除Stocker外部固定支架。每层内置伸缩托持机构，顶层托架带Chuck伸出；Chuck被提走后空托架缩回。
- 清洗组合体回Stage后共同顺时针90°；按用户确认，先上提Mask，再移入空Arm接料，下降交接后由Arm带水平Mask回LD口。
- 空Chuck逆时针90°恢复前后Grip方向；Traverser送至右侧交接位，原层内部托架伸出接料，头部退出后带Chuck缩回入库。
- `baseline-before-unload/`保存本轮修改前版本；最新时序见`UNLOAD-PLAN.md`，验收见`VALIDATION.md`。原0–156秒姿态与工艺信号保持。

## 前轮转向、待机与回搬优化（保留）
- 空Chuck放上Stage后，按俯视顺时针转90°；Mask放上后，组合体逆时针转90°。Stage始终固定，Chuck尺寸不变。
- 组合体放入Cleaner后，Traverser上提退出并回LD等待；清洗结束且旋转停止对位后，再去Cleaner取回组合体，放回Stage。
- 按上级目录`traverser arm.png`重建细长双梁悬臂；仅前后两组Grip，接触面对应Chuck前后实心突出块。Grip侧视可检查接触关系。
- 保留已确认的图片派生八臂Chuck、Stocker右推交接、1/3直径固定Stage及既有LD送料顺序。
- `baseline-before-return/`保留本轮修改前版本；`RETURN-PLAN.md`与`VALIDATION.md`记录本轮变更和验收。

## 前轮局部修正（保留）
- Stage顶盘直径为初版的1/3：128→42.6667示意单位；固定顶面高度104，Chuck整体外廓宽119不变。
- Stocker为三层，顶层先完全右推至架外交接位，再由Traverser下降取走。
- 用户已确认新版Chuck按图片实际八条连接臂建模，所有工位共用同一外轮廓及真实开孔网格。
- `baseline-before-stock-fix/`与`STOCK-PLAN.md`保留该轮历史记录。

## 前轮视觉建模（结构保留，配色已更新）
- 原白灰/浅蓝方案已由本轮暖灰、青绿、石墨灰和浅绿Mask方案替代。
- Cleaner增加留出后部悬臂通道的腔体框架、透明侧护罩、开口集液槽、圆润主轴、三路喷嘴与下部DIW。
- 工艺液蓝/橙/绿软锥喷淋、流动液滴、薄液膜、旋转方向箭头；Dry起点关闭喷淋。
- 构件使用小倒角、平滑圆柱法线和柔和金属高光。
- `baseline-before-visual/`和`visual-check.log`保留前轮视觉优化记录；本轮前段模型按授权更新，以`stock-check.log`和下游姿态回归为当前证据。

## 本版明确的机构关系
- 三大区域从左到右：3层 Chuck Stocker → LD/ULD → Cleaner。
- Rear Traverser 滑座在后方；固定水平悬臂把取放头连接到工位中心线。只有X/Z运动，没有Y伸缩或前后送料。
- LD arm 从前方沿Y向后送料：75°承接 → 水平 → 到Chuck上方 → Traverser向上取片 → arm回前方 → Traverser下降放片。
- Stage 是圆形固定装置，无升降部件或动画。
- 同一新版八臂多孔Chuck几何用于所有位置；中央和端部孔为真实几何开孔。
- 上方三路喷淋只示意多液体来源；湿段背面DIW连续，Dry开始时关闭。

## 源码与重建
`model.js` 是纯时序与空间模型；`chuck-profile.js`是`references/Chuck.png`派生的轮廓/开孔数据；`scene.js` 用WebGL深度测试显示三维实体；`app.js` 提供控件和状态。无WebGL时提供兼容投影，遮挡精度低于主模式。

```
node build.mjs
node verify.cjs
```

Chuck轮廓原图随项目保存在`references/Chuck.png`；历史Cleaner原理图与Outline Drawing未包含在当前项目目录中。`PLAN.md`保留最初计划，卸载时序见`UNLOAD-PLAN.md`；最新修改与检查结论以`VALIDATION.md`最上方记录为准，历史记录位于其后。

几何尺寸、时长、喷淋与旋转速度均为示意；Grip接触与短程竖直接合为原理示意，未按带尺寸制造图确认；未展开完整夹紧执行器设计。可变size arm仅示意可调结构，未展开尺寸切换。未进行CAD精度干涉、强度或真实设备可达性认证。

重新派生Chuck轮廓时运行`trace-chuck.py`（需要Pillow和NumPy）；普通HTML打开与Node重建不需要Python。原始图片只读。
