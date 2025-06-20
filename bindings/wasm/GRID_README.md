# Taffy Grid WASM 绑定

本文档介绍了 Taffy 的 CSS Grid 布局功能在 WASM 绑定中的使用方法。

## 新增的 Grid 方法

### Grid 容器属性

#### 1. Grid Template Rows/Columns
```javascript
// 设置 grid-template-rows
node.setGridTemplateRows(["100px", "1fr", "auto"]);

// 设置 grid-template-columns  
node.setGridTemplateColumns(["200px", "1fr", "min-content"]);
```

#### 2. Grid Auto Rows/Columns
```javascript
// 设置 grid-auto-rows
node.setGridAutoRows(["50px", "1fr"]);

// 设置 grid-auto-columns
node.setGridAutoColumns(["100px"]);
```

#### 3. Grid Auto Flow
```javascript
// 设置 grid-auto-flow (已存在)
node.setGridAutoFlow(GridAutoFlow.Row);
node.setGridAutoFlow(GridAutoFlow.Column);
node.setGridAutoFlow(GridAutoFlow.RowDense);
node.setGridAutoFlow(GridAutoFlow.ColumnDense);
```

### Grid 项目属性

#### 1. Grid Row/Column 位置
```javascript
// 设置 grid-row: 1 / 3
node.setGridRow(1, 3);

// 设置 grid-column: 2 / 4
node.setGridColumn(2, 4);
```

#### 2. Grid Row/Column Span
```javascript
// 设置 grid-row: span 2
node.setGridRowSpan(2);

// 设置 grid-column: span 3
node.setGridColumnSpan(3);
```

#### 3. Grid Auto Placement
```javascript
// 设置 grid-row: auto
node.setGridRowAuto();

// 设置 grid-column: auto
node.setGridColumnAuto();
```

## 支持的 Track 值类型

### 字符串格式
- `"100px"` - 固定像素值
- `"50%"` - 百分比值
- `"1fr"` - 弹性单位
- `"auto"` - 自动大小
- `"min-content"` - 最小内容大小
- `"max-content"` - 最大内容大小

### 对象格式
```javascript
// 单个 track
{
  min: "50px",
  max: "1fr"
}

// 重复 track
{
  repeat: {
    count: 3,
    tracks: ["100px", "1fr"]
  }
}
```

## 完整示例

```javascript
import init, * as Taffy from './pkg/taffy_layout.js';
await init();

const { Node, TaffyTree, Display, GridAutoFlow, StyleUnit } = Taffy;

// 创建 grid 容器
const tree = new TaffyTree();
const container = new Node(tree);

// 设置 grid 容器属性
container.setDisplay(Display.Grid);
container.setGridTemplateRows(["100px", "1fr", "50px"]);
container.setGridTemplateColumns(["200px", "1fr", "150px"]);
container.setGridAutoFlow(GridAutoFlow.Row);
container.setGap(10, StyleUnit.Px);

// 创建 grid 项目
const item1 = new Node(tree);
item1.setGridRow(1, 2);
item1.setGridColumn(1, 3);
item1.setWidth(100, StyleUnit.Px);
item1.setHeight(50, StyleUnit.Px);

const item2 = new Node(tree);
item2.setGridRow(2, 3);
item2.setGridColumn(2, 4);
item2.setWidth(80, StyleUnit.Px);
item2.setHeight(60, StyleUnit.Px);

const item3 = new Node(tree);
item3.setGridRowAuto();
item3.setGridColumnAuto();
item3.setWidth(70, StyleUnit.Px);
item3.setHeight(40, StyleUnit.Px);

// 添加到容器
container.addChild(item1);
container.addChild(item2);
container.addChild(item3);

// 计算布局
const layout = container.computeLayout({ width: 600, height: 400 });
console.log("布局结果:", layout);
```

## 测试

运行 `grid_test.html` 来测试所有 grid 功能：

```bash
cd bindings/wasm
npm run build  # 或 wasm-pack build
python -m http.server  # 或其他 HTTP 服务器
# 然后在浏览器中打开 grid_test.html
```

## 注意事项

1. **Grid Line 索引**: Grid line 索引从 1 开始，0 会被视为 auto
2. **Track 解析**: 支持字符串和对象两种格式的 track 定义
3. **错误处理**: 所有方法都返回 `Result<(), JsError>`，需要处理可能的错误
4. **性能**: Grid 布局计算比 Flexbox 更复杂，对于大型网格可能需要更多时间

## 与 CSS 的对应关系

| CSS 属性 | WASM 方法 | 示例 |
|---------|----------|------|
| `grid-template-rows` | `setGridTemplateRows()` | `["100px", "1fr"]` |
| `grid-template-columns` | `setGridTemplateColumns()` | `["200px", "1fr"]` |
| `grid-auto-rows` | `setGridAutoRows()` | `["50px"]` |
| `grid-auto-columns` | `setGridAutoColumns()` | `["100px"]` |
| `grid-auto-flow` | `setGridAutoFlow()` | `GridAutoFlow.Row` |
| `grid-row` | `setGridRow()` | `(1, 3)` |
| `grid-column` | `setGridColumn()` | `(2, 4)` |
| `grid-row: span 2` | `setGridRowSpan()` | `(2)` |
| `grid-column: span 3` | `setGridColumnSpan()` | `(3)` |
| `grid-row: auto` | `setGridRowAuto()` | - |
| `grid-column: auto` | `setGridColumnAuto()` | - | 