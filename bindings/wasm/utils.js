// 公共方法：Taffy 构建、HTML 构建、bbox 渲染
export function buildTaffyFromJson(json, tree, Taffy) {
  const node = new Taffy.Node(tree);

  // 尺寸
  setNodeDimension(node, json.width, node.setWidth, Taffy);
  setNodeDimension(node, json.height, node.setHeight, Taffy);
  // min/max
  setNodeDimension(node, json.minWidth, node.setMinWidth, Taffy);
  setNodeDimension(node, json.maxWidth, node.setMaxWidth, Taffy);
  setNodeDimension(node, json.minHeight, node.setMinHeight, Taffy);
  setNodeDimension(node, json.maxHeight, node.setMaxHeight, Taffy);
  // flexBasis
  setNodeDimension(node, json.flexBasis, node.setFlexBasis, Taffy);

  // margin/padding
  if (json.margin) node.setMarginAll(json.margin.val, Taffy.StyleUnit.Px);
  if (json.padding) node.setPaddingAll(json.padding.val, Taffy.StyleUnit.Px);

  // gap
  if (json.gap) node.setGap(json.gap.val, Taffy.StyleUnit.Px);
  if (json.rowGap) node.setRowGap(json.rowGap.val, Taffy.StyleUnit.Px);
  if (json.columnGap) node.setColumnGap(json.columnGap.val, Taffy.StyleUnit.Px);

  // flex
  if (json.flexGrow !== undefined) node.setFlexGrow(json.flexGrow);
  if (json.flexShrink !== undefined) node.setFlexShrink(json.flexShrink);
  if (json.flexWrap) node.setFlexWrap(Taffy.FlexWrap[json.flexWrap.charAt(0).toUpperCase() + json.flexWrap.slice(1)]);
  if (json.flexDirection) node.setFlexDirection(Taffy.FlexDirection[json.flexDirection.charAt(0).toUpperCase() + json.flexDirection.slice(1)]);

  // display
  if (json.display) node.setDisplay(Taffy.Display[json.display.charAt(0).toUpperCase() + json.display.slice(1)]);

  // align/justify
  if (json.alignItems) node.setAlignItems(Taffy.AlignItems[json.alignItems.charAt(0).toUpperCase() + json.alignItems.slice(1)]);
  if (json.justifyContent) node.setJustifyContent(Taffy.JustifyContent[json.justifyContent.charAt(0).toUpperCase() + json.justifyContent.slice(1)]);
  if (json.alignContent) node.setAlignContent(Taffy.AlignContent[json.alignContent.charAt(0).toUpperCase() + json.alignContent.slice(1)]);

  // grid
  if (json.gridAutoFlow) node.setGridAutoFlow(Taffy.GridAutoFlow[json.gridAutoFlow.charAt(0).toUpperCase() + json.gridAutoFlow.slice(1)]);
  if (json.gridTemplateRows) node.setGridTemplateRows(json.gridTemplateRows);
  if (json.gridTemplateColumns) node.setGridTemplateColumns(json.gridTemplateColumns);
  if (json.gridAutoRows) node.setGridAutoRows(json.gridAutoRows);
  if (json.gridAutoColumns) node.setGridAutoColumns(json.gridAutoColumns);
  if (json.gridRow) node.setGridRow(json.gridRow[0], json.gridRow[1]);
  if (json.gridColumn) node.setGridColumn(json.gridColumn[0], json.gridColumn[1]);
  if (json.gridRowSpan) node.setGridRowSpan(json.gridRowSpan);
  if (json.gridColumnSpan) node.setGridColumnSpan(json.gridColumnSpan);

  // aspect ratio
  if (json.aspectRatio !== undefined) node.setAspectRatio(json.aspectRatio);

  // overflow
  if (json.overflow) node.setOverflow(Taffy.Overflow[json.overflow.charAt(0).toUpperCase() + json.overflow.slice(1)]);

  // 递归 children
  (json.children || []).forEach(childJson => {
    const child = buildTaffyFromJson(childJson, tree, Taffy);
    node.addChild(child);
  });

  return node;
}

export function buildHtmlFromJson(json, isRoot = true) {
  const el = document.createElement('div');
  el.className = 'native-box' + (isRoot ? ' root' : '');

  // display
  if (json.display) el.style.display = json.display;

  // 尺寸
  if (json.width) el.style.width = buildDimension(json.width);
  if (json.height) el.style.height = buildDimension(json.height);

  // min/max
  if (json.minWidth) el.style.minWidth = buildDimension(json.minWidth);
  if (json.maxWidth) el.style.maxWidth = buildDimension(json.maxWidth);
  if (json.minHeight) el.style.minHeight = buildDimension(json.minHeight);
  if (json.maxHeight) el.style.maxHeight = buildDimension(json.maxHeight);

  // margin/padding
  if (json.margin) el.style.margin = buildDimension(json.margin);
  if (json.padding) el.style.padding = buildDimension(json.padding);

  // gap
  if (json.gap) el.style.gap = buildDimension(json.gap);
  if (json.rowGap) el.style.rowGap = buildDimension(json.rowGap);
  if (json.columnGap) el.style.columnGap = buildDimension(json.columnGap);

  // flex
  if (json.flexGrow !== undefined) el.style.flexGrow = json.flexGrow;
  if (json.flexShrink !== undefined) el.style.flexShrink = json.flexShrink;
  if (json.flexBasis) el.style.flexBasis = buildDimension(json.flexBasis);
  if (json.flexWrap) el.style.flexWrap = json.flexWrap;
  if (json.flexDirection) el.style.flexDirection = json.flexDirection;

  // align/justify
  if (json.alignItems) el.style.alignItems = json.alignItems;
  if (json.justifyContent) el.style.justifyContent = json.justifyContent;
  if (json.alignContent) el.style.alignContent = json.alignContent;

  // grid
  if (json.gridAutoFlow) el.style.gridAutoFlow = json.gridAutoFlow;
  if (json.gridTemplateRows) el.style.gridTemplateRows = json.gridTemplateRows.join(' ');
  if (json.gridTemplateColumns) el.style.gridTemplateColumns = json.gridTemplateColumns.join(' ');
  if (json.gridAutoRows) el.style.gridAutoRows = json.gridAutoRows.join(' ');
  if (json.gridAutoColumns) el.style.gridAutoColumns = json.gridAutoColumns.join(' ');
  if (json.gridRow) el.style.gridRow = json.gridRow.join(' / ');
  if (json.gridColumn) el.style.gridColumn = json.gridColumn.join(' / ');
  if (json.gridRowSpan) el.style.gridRowEnd = `span ${json.gridRowSpan}`;
  if (json.gridColumnSpan) el.style.gridColumnEnd = `span ${json.gridColumnSpan}`;

  // aspect ratio
  if (json.aspectRatio !== undefined) el.style.aspectRatio = json.aspectRatio;

  // overflow
  if (json.overflow) el.style.overflow = json.overflow;

  // label
  if (json.label) {
    const labelDiv = document.createElement('div');
    labelDiv.className = 'box-label';
    labelDiv.innerText = json.label;
    el.appendChild(labelDiv);
  }

  // tooltip
  let tip = '';
  if (json.label) tip += `label: ${json.label}\n`;
  if (json.width) tip += `width: ${json.width.val}${json.width.unit}\n`;
  if (json.height) tip += `height: ${json.height.val}${json.height.unit}\n`;
  if (json.flexGrow !== undefined) tip += `flexGrow: ${json.flexGrow}\n`;
  if (json.flexWrap) tip += `flexWrap: ${json.flexWrap}\n`;
  if (json.flexDirection) tip += `flexDirection: ${json.flexDirection}\n`;
  if (json.alignItems) tip += `alignItems: ${json.alignItems}\n`;
  if (json.margin) tip += `margin: ${json.margin.val}${json.margin.unit}\n`;
  el.title = tip.trim();

  // 递归 children
  (json.children || []).forEach(childJson => {
    const child = buildHtmlFromJson(childJson, false);
    el.appendChild(child);
  });

  return el;
}

function buildDimension(dimension) {
  if (!dimension) return;
  if (dimension.unit === 'px') return dimension.val + 'px';
  if (dimension.unit === '%') return dimension.val + '%';
  if (dimension.unit === 'auto') return 'auto';
}

export function renderBboxes(rootLayout, container, colorList, depth = 0) {
  const color = colorList[depth % colorList.length] || '#888';
  const div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.left = rootLayout.x + 'px';
  div.style.top = rootLayout.y + 'px';
  div.style.width = rootLayout.width + 'px';
  div.style.height = rootLayout.height + 'px';
  div.style.border = `2px dashed ${color}`;
  div.style.boxSizing = 'border-box';
  div.style.background = color + '11';
  div.style.borderRadius = '8px';
  div.style.pointerEvents = 'auto';
  // label
  const label = document.createElement('div');
  label.className = 'bbox-label';
  div.appendChild(label);
  // tooltip
  container.appendChild(div);
  for (let i = 0; i < (rootLayout.childCount || 0); i++) {
    const child = rootLayout.child(i);
    child.label = rootLayout.child && rootLayout.child(i).label;
    renderBboxes(child, container, colorList, depth + 1);
  }
}

export async function loadJsonList(url) {
  const res = await fetch(url);
  return await res.json();
}

// 辅助函数：统一设置 dimension
function setNodeDimension(node, jsonKey, setFn, Taffy) {
  if (!jsonKey) return;
  if (jsonKey.unit === 'px') setFn.call(node, jsonKey.val, Taffy.StyleUnit.Px);
  else if (jsonKey.unit === '%') setFn.call(node, jsonKey.val, Taffy.StyleUnit.Percent);
  else if (jsonKey.unit === 'auto') setFn.call(node, 0, Taffy.StyleUnit.Auto);
} 