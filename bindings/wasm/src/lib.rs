#![deny(unsafe_code)]
#![forbid(unsafe_code)]
// #![warn(missing_docs)]
// #![warn(clippy::missing_docs_in_private_items)]
#![allow(non_snake_case)] // JS uses camelCase by default
#![allow(clippy::new_without_default)] // Default is useless for WASM

#[allow(dead_code)]
pub fn set_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

// mod grid_track_parser;

use std::cell::RefCell;
use std::rc::Rc;

use js_sys::Array;
use js_sys::Function;
use js_sys::Reflect;
use taffy::prelude::*;
use taffy::TraversePartialTree;
use wasm_bindgen::prelude::*;

// Grid-specific imports - use public paths
use taffy::{
    GridAutoFlow, GridPlacement, GridTrackRepetition, 
    MaxTrackSizingFunction, MinTrackSizingFunction, NonRepeatedTrackSizingFunction, TrackSizingFunction
};
use taffy::compute::grid::types::GridLine;
use taffy::util::sys::GridTrackVec;

/// Get the value of a property named "key" from the JsValue "obj"
fn get_key(obj: &JsValue, key: &str) -> Option<JsValue> {
    Reflect::get(obj, &key.into()).ok()
}

/// Get a property named "key" from the JsValue "obj" assuming that it is a number and casting it to f32
fn get_f32(obj: &JsValue, key: &str) -> Option<f32> {
    get_key(obj, key).and_then(|val| val.as_f64().map(|v| v as f32))
}

/// Convert a JS number or string to an AvailableSpace.
///   - Numbers will be converted to AvailableSpace::Definite
///   - Strings are expected to be "min-context", "max-content" or a numeric value followed by "px"
fn try_parse_available_space(obj: &JsValue, key: &str) -> Option<AvailableSpace> {
    if let Some(val) = get_key(obj, key) {
        if let Some(number) = val.as_f64() {
            return Some(AvailableSpace::Definite(number as f32));
        }
        if let Some(string) = val.as_string() {
            match string.as_str() {
                "min-content" => return Some(AvailableSpace::MinContent),
                "max-content" => return Some(AvailableSpace::MaxContent),
                s if s.ends_with("px") => {
                    if let Ok(num) = s.trim_end_matches("px").parse::<f32>() {
                        return Some(AvailableSpace::Definite(num));
                    }
                }
                s => {
                    if let Ok(num) = s.parse::<f32>() {
                        return Some(AvailableSpace::Definite(num));
                    }
                }
            }
        }
    }
    None
}

#[wasm_bindgen]
#[repr(u8)]
pub enum StyleUnit {
    Px,
    Percent,
    Auto,
    MinContent,
    MaxContent,
    FitContentPx,
    FitContentPercent,
    Fr,
}

impl StyleUnit {
    fn try_into_dimension(self, val: f32) -> Result<Dimension, ()> {
        match self {
            StyleUnit::Px => Ok(Dimension::length(val)),
            StyleUnit::Percent => Ok(Dimension::percent(val)),
            StyleUnit::Auto => Ok(Dimension::auto()),
            _ => Err(()),
        }
    }

    fn try_into_length_percentage_auto(self, val: f32) -> Result<LengthPercentageAuto, ()> {
        match self {
            StyleUnit::Px => Ok(LengthPercentageAuto::length(val)),
            StyleUnit::Percent => Ok(LengthPercentageAuto::percent(val)),
            StyleUnit::Auto => Ok(LengthPercentageAuto::auto()),
            _ => Err(()),
        }
    }

    fn try_into_length_percentage(self, val: f32) -> Result<LengthPercentage, ()> {
        match self {
            StyleUnit::Px => Ok(LengthPercentage::length(val)),
            StyleUnit::Percent => Ok(LengthPercentage::percent(val)),
            _ => Err(()),
        }
    }
}

impl TryFrom<u8> for StyleUnit {
    type Error = ();

    fn try_from(value: u8) -> Result<Self, Self::Error> {
        match value {
            0 => Ok(StyleUnit::Px),
            1 => Ok(StyleUnit::Percent),
            2 => Ok(StyleUnit::Auto),
            3 => Ok(StyleUnit::MinContent),
            4 => Ok(StyleUnit::MaxContent),
            5 => Ok(StyleUnit::FitContentPx),
            6 => Ok(StyleUnit::FitContentPercent),
            7 => Ok(StyleUnit::Fr),
            _ => Err(()),
        }
    }
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct Layout {
    #[wasm_bindgen(readonly)]
    pub width: f32,

    #[wasm_bindgen(readonly)]
    pub height: f32,

    #[wasm_bindgen(readonly)]
    pub x: f32,

    #[wasm_bindgen(readonly)]
    pub y: f32,

    #[wasm_bindgen(readonly)]
    pub childCount: usize,

    children: Vec<Layout>,
}

#[wasm_bindgen]
impl Layout {
    fn new(tree: &TaffyTree, node: taffy::NodeId) -> Layout {
        let taffy = tree.taffy.borrow();
        let layout = taffy.layout(node).unwrap();
        let children = taffy.children(node).unwrap();

        Layout {
            width: layout.size.width,
            height: layout.size.height,
            x: layout.location.x,
            y: layout.location.y,
            childCount: children.len(),
            children: children.into_iter().map(|child| Layout::new(tree, child)).collect(),
        }
    }

    #[wasm_bindgen]
    pub fn child(&self, at: usize) -> Layout {
        self.children[at].clone()
    }
}

struct WasmNodeContext {
    measure_func: Function,
}

impl WasmNodeContext {
    fn from_js_measure(measure_func: Function) -> Self {
        Self { measure_func }
    }
}

#[wasm_bindgen]
#[derive(Clone)]
pub struct TaffyTree {
    taffy: Rc<RefCell<taffy::TaffyTree<WasmNodeContext>>>,
}

#[wasm_bindgen]
impl TaffyTree {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self { taffy: Rc::new(RefCell::new(taffy::TaffyTree::new())) }
    }
}

#[wasm_bindgen]
pub struct Node {
    tree: TaffyTree,
    node: taffy::NodeId,
}

fn wasm_measure_function(
    known_dimensions: Size<Option<f32>>,
    available_space: Size<AvailableSpace>,
    _node_id: NodeId,
    context: Option<&mut WasmNodeContext>,
    _style: &Style,
) -> Size<f32> {
    fn convert_available_space(val: AvailableSpace) -> JsValue {
        match val {
            AvailableSpace::Definite(val) => val.into(),
            AvailableSpace::MaxContent => JsValue::from_str("max-content"),
            AvailableSpace::MinContent => JsValue::from_str("min-content"),
        }
    }

    let Some(context) = context else { return Size::ZERO };

    let known_width = known_dimensions.width.map(|val| val.into()).unwrap_or(JsValue::UNDEFINED);
    let known_height = known_dimensions.height.map(|val| val.into()).unwrap_or(JsValue::UNDEFINED);

    let available_width = convert_available_space(available_space.width);
    let available_height = convert_available_space(available_space.height);

    let args = Array::new_with_length(4);
    args.set(0, known_width);
    args.set(1, known_height);
    args.set(2, available_width);
    args.set(3, available_height);

    if let Ok(result) = context.measure_func.apply(&JsValue::UNDEFINED, &args) {
        let width = get_f32(&result, "width");
        let height = get_f32(&result, "height");

        if let (Some(width), Some(height)) = (width, height) {
            return Size { width, height };
        }
    }

    known_dimensions.unwrap_or(Size::ZERO)
}

#[wasm_bindgen]
impl Node {
    #[wasm_bindgen(constructor)]
    pub fn new(tree: &TaffyTree) -> Self {
        Self { tree: tree.clone(), node: tree.taffy.borrow_mut().new_leaf(Style::DEFAULT).unwrap() }
    }

    #[wasm_bindgen(js_name = setMeasure)]
    pub fn set_measure(&mut self, measure: &JsValue) {
        let js_measure_func = Function::from(measure.clone());
        self.tree
            .taffy
            .borrow_mut()
            .set_node_context(self.node, Some(WasmNodeContext::from_js_measure(js_measure_func)))
            .unwrap();
    }

    #[wasm_bindgen(js_name = addChild)]
    pub fn add_child(&mut self, child: &Node) {
        self.tree.taffy.borrow_mut().add_child(self.node, child.node).unwrap();
    }


    #[wasm_bindgen(js_name = insertChildAtIndex)]
    pub fn insert_child_at_index(&mut self, child: &Node, index: usize) {
        self.tree.taffy.borrow_mut().insert_child_at_index(self.node, index, child.node).unwrap();
    }

    #[wasm_bindgen(js_name = removeChild)]
    pub fn remove_child(&mut self, child: &Node) {
        self.tree.taffy.borrow_mut().remove_child(self.node, child.node).unwrap();
    }

    #[wasm_bindgen(js_name = replaceChildAtIndex)]
    pub fn replace_child_at_index(&mut self, index: usize, child: &Node) {
        self.tree.taffy.borrow_mut().replace_child_at_index(self.node, index, child.node).unwrap();
    }

    #[wasm_bindgen(js_name = removeChildAtIndex)]
    pub fn remove_child_at_index(&mut self, index: usize) {
        self.tree.taffy.borrow_mut().remove_child_at_index(self.node, index).unwrap();
    }

    #[wasm_bindgen(js_name = markDirty)]
    pub fn mark_dirty(&mut self) {
        self.tree.taffy.borrow_mut().mark_dirty(self.node).unwrap()
    }

    #[wasm_bindgen(js_name = isDirty)]
    pub fn is_dirty(&self) -> bool {
        self.tree.taffy.borrow().dirty(self.node).unwrap()
    }

    #[wasm_bindgen(js_name = childCount)]
    pub fn child_count(&mut self) -> usize {
        self.tree.taffy.borrow_mut().child_count(self.node)
    }

    #[wasm_bindgen(js_name = computeLayout)]
    pub fn compute_layout(&mut self, size: &JsValue) -> Layout {
        self.tree
            .taffy
            .borrow_mut()
            .compute_layout_with_measure(
                self.node,
                taffy::geometry::Size {
                    width: try_parse_available_space(size, "width").unwrap_or(AvailableSpace::MaxContent),
                    height: try_parse_available_space(size, "height").unwrap_or(AvailableSpace::MaxContent),
                },
                wasm_measure_function,
            )
            .unwrap();
        Layout::new(&self.tree, self.node)
    }

    #[wasm_bindgen(js_name = resetStyle)]
    pub fn reset_style(&mut self) -> Result<(), JsError> {
        let mut taffy = self.tree.taffy.borrow_mut();
        taffy.set_style(self.node, Style::DEFAULT)?;
        Ok(())
    }

    #[wasm_bindgen(js_name = debugPrintStyle)]
    pub fn debug_print_style(&self) -> Result<String, JsError> {
        let taffy = self.tree.taffy.borrow();
        let style = taffy.style(self.node)?;
        Ok(format!("{:#?}", style))
    }
}

macro_rules! get_style {
    ($self:expr, $style_ident:ident, $block:expr) => {{
        let taffy = $self.tree.taffy.borrow();
        let $style_ident = taffy.style($self.node)?;
        Ok($block)
    }};
}

macro_rules! with_style_mut {
    ($self:expr, $style_ident:ident, $block:expr) => {{
        let mut taffy = $self.tree.taffy.borrow_mut();
        let $style_ident = taffy.style_mut($self.node)?;
        $block;
        Ok(())
    }};
}

// Style getter/setter methods
#[wasm_bindgen]
impl Node {
    // Display / Position
    pub fn getDisplay(&mut self) -> Result<Display, JsError> {
        get_style!(self, style, style.display)
    }
    pub fn setDisplay(&mut self, value: Display) -> Result<(), JsError> {
        with_style_mut!(self, style, style.display = value)
    }
    pub fn getPosition(&mut self) -> Result<Position, JsError> {
        get_style!(self, style, style.position)
    }
    pub fn setPosition(&mut self, value: Position) -> Result<(), JsError> {
        with_style_mut!(self, style, style.position = value)
    }

    // Overflow
    pub fn getOverflowX(&mut self) -> Result<WasmOverflow, JsError> {
        get_style!(self, style, WasmOverflow::from(style.overflow.x))
    }
    pub fn setOverflowX(&mut self, value: WasmOverflow) -> Result<(), JsError> {
        with_style_mut!(self, style, style.overflow.x = value.into())
    }
    pub fn getOverflowY(&mut self) -> Result<WasmOverflow, JsError> {
        get_style!(self, style, WasmOverflow::from(style.overflow.y))
    }
    pub fn setOverflowY(&mut self, value: WasmOverflow) -> Result<(), JsError> {
        with_style_mut!(self, style, style.overflow.y = value.into())
    }
    pub fn setOverflow(&mut self, value: WasmOverflow) -> Result<(), JsError> {
        with_style_mut!(self, style, {
            style.overflow.x = value.into();
            style.overflow.y = value.into();
        })
    }
    pub fn setScrollbarWidth(&mut self, value: f32) -> Result<(), JsError> {
        with_style_mut!(self, style, style.scrollbar_width = value)
    }

    // inset
    pub fn setInsetTop(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, style.inset.top = unit.try_into_length_percentage_auto(value).unwrap())
    }
    pub fn setInsetBottom(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, style.inset.bottom = unit.try_into_length_percentage_auto(value).unwrap())
    }
    pub fn setInsetLeft(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, style.inset.left = unit.try_into_length_percentage_auto(value).unwrap())
    }
    pub fn setInsetRight(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, style.inset.right = unit.try_into_length_percentage_auto(value).unwrap())
    }
    pub fn setInsetHorizontal(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, {
            let value = unit.try_into_length_percentage_auto(value).unwrap();
            style.inset.left = value;
            style.inset.right = value;
        })
    }
    pub fn setInsetVertical(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, {
            let value = unit.try_into_length_percentage_auto(value).unwrap();
            style.inset.left = value;
            style.inset.right = value;
        })
    }
    pub fn setInsetAll(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, {
            let value = unit.try_into_length_percentage_auto(value).unwrap();
            style.inset.top = value;
            style.inset.bottom = value;
            style.inset.left = value;
            style.inset.right = value;
        })
    }

    // Sizes
    pub fn setWidth(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, style.size.width = unit.try_into_dimension(value).unwrap())
    }
    pub fn setHeight(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, style.size.height = unit.try_into_dimension(value).unwrap())
    }
    pub fn setMinWidth(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, style.min_size.width = unit.try_into_dimension(value).unwrap())
    }
    pub fn setMinHeight(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, style.min_size.height = unit.try_into_dimension(value).unwrap())
    }
    pub fn setMaxWidth(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, style.max_size.width = unit.try_into_dimension(value).unwrap())
    }
    pub fn setMaxHeight(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, style.max_size.height = unit.try_into_dimension(value).unwrap())
    }
    pub fn setAspectRatio(&mut self, value: Option<f32>) -> Result<(), JsError> {
        with_style_mut!(self, style, style.aspect_ratio = value)
    }

    // Padding
    pub fn setPaddingTop(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, style.padding.top = unit.try_into_length_percentage(value).unwrap())
    }
    pub fn setPaddingBottom(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, style.padding.bottom = unit.try_into_length_percentage(value).unwrap())
    }
    pub fn setPaddingLeft(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, style.padding.left = unit.try_into_length_percentage(value).unwrap())
    }
    pub fn setPaddingRight(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, style.padding.right = unit.try_into_length_percentage(value).unwrap())
    }
    pub fn setPaddingHorizontal(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, {
            let value = unit.try_into_length_percentage(value).unwrap();
            style.padding.left = value;
            style.padding.right = value;
        })
    }
    pub fn setPaddingVertical(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, {
            let value = unit.try_into_length_percentage(value).unwrap();
            style.padding.left = value;
            style.padding.right = value;
        })
    }
    pub fn setPaddingAll(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, {
            let value = unit.try_into_length_percentage(value).unwrap();
            style.padding.top = value;
            style.padding.bottom = value;
            style.padding.left = value;
            style.padding.right = value;
        })
    }

    // Margin
    pub fn setMarginTop(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, style.margin.top = unit.try_into_length_percentage_auto(value).unwrap())
    }
    pub fn setMarginBottom(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, style.margin.bottom = unit.try_into_length_percentage_auto(value).unwrap())
    }
    pub fn setMarginLeft(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, style.margin.left = unit.try_into_length_percentage_auto(value).unwrap())
    }
    pub fn setMarginRight(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, style.margin.right = unit.try_into_length_percentage_auto(value).unwrap())
    }
    pub fn setMarginHorizontal(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, {
            let value = unit.try_into_length_percentage_auto(value).unwrap();
            style.margin.left = value;
            style.margin.right = value;
        })
    }
    pub fn setMarginVertical(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, {
            let value = unit.try_into_length_percentage_auto(value).unwrap();
            style.margin.left = value;
            style.margin.right = value;
        })
    }
    pub fn setMarginAll(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, {
            let value = unit.try_into_length_percentage_auto(value).unwrap();
            style.margin.top = value;
            style.margin.bottom = value;
            style.margin.left = value;
            style.margin.right = value;
        })
    }

    // Border
    pub fn setBorderWidthTop(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, style.border.top = unit.try_into_length_percentage(value).unwrap())
    }
    pub fn setBorderWidthBottom(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, style.border.bottom = unit.try_into_length_percentage(value).unwrap())
    }
    pub fn setBorderWidthLeft(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, style.border.left = unit.try_into_length_percentage(value).unwrap())
    }
    pub fn setBorderWidthRight(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, style.border.right = unit.try_into_length_percentage(value).unwrap())
    }
    pub fn setBorderWidthHorizontal(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, {
            let value = unit.try_into_length_percentage(value).unwrap();
            style.border.left = value;
            style.border.right = value;
        })
    }
    pub fn setBorderWidthVertical(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, {
            let value = unit.try_into_length_percentage(value).unwrap();
            style.border.left = value;
            style.border.right = value;
        })
    }
    pub fn setBorderWidthAll(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, {
            let value = unit.try_into_length_percentage(value).unwrap();
            style.border.top = value;
            style.border.bottom = value;
            style.border.left = value;
            style.border.right = value;
        })
    }

    // Gap
    pub fn setRowGap(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, style.gap.width = unit.try_into_length_percentage(value).unwrap())
    }
    pub fn setColumnGap(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, style.gap.height = unit.try_into_length_percentage(value).unwrap())
    }
    pub fn setGap(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, {
            let value = unit.try_into_length_percentage(value).unwrap();
            style.gap.width = value;
            style.gap.height = value;
        })
    }

    // Alignment
    pub fn setAlignContent(&mut self, value: Option<AlignContent>) -> Result<(), JsError> {
        with_style_mut!(self, style, style.align_content = value)
    }
    pub fn setJustifyContent(&mut self, value: Option<JustifyContent>) -> Result<(), JsError> {
        with_style_mut!(self, style, style.justify_content = value)
    }
    pub fn setAlignItems(&mut self, value: Option<AlignItems>) -> Result<(), JsError> {
        with_style_mut!(self, style, style.align_items = value)
    }
    pub fn setJustifyItems(&mut self, value: Option<JustifyItems>) -> Result<(), JsError> {
        with_style_mut!(self, style, style.justify_items = value)
    }
    pub fn setAlignSelf(&mut self, value: Option<AlignSelf>) -> Result<(), JsError> {
        with_style_mut!(self, style, style.align_self = value)
    }
    pub fn setJustifySelf(&mut self, value: Option<JustifySelf>) -> Result<(), JsError> {
        with_style_mut!(self, style, style.justify_self = value)
    }

    // Flex
    pub fn setFlexDirection(&mut self, value: FlexDirection) -> Result<(), JsError> {
        with_style_mut!(self, style, style.flex_direction = value)
    }
    pub fn setFlexWrap(&mut self, value: FlexWrap) -> Result<(), JsError> {
        with_style_mut!(self, style, style.flex_wrap = value)
    }
    pub fn setFlexGrow(&mut self, value: f32) -> Result<(), JsError> {
        with_style_mut!(self, style, style.flex_grow = value)
    }
    pub fn setFlexShrink(&mut self, value: f32) -> Result<(), JsError> {
        with_style_mut!(self, style, style.flex_shrink = value)
    }
    pub fn setFlexBasis(&mut self, value: f32, unit: StyleUnit) -> Result<(), JsError> {
        with_style_mut!(self, style, style.flex_basis = unit.try_into_dimension(value).unwrap())
    }

    // Grid
    pub fn setGridAutoFlow(&mut self, value: GridAutoFlow) -> Result<(), JsError> {
        with_style_mut!(self, style, style.grid_auto_flow = value)
    }

    // Grid Template Rows/Columns
    pub fn setGridTemplateRows(&mut self, tracks: &JsValue) -> Result<(), JsError> {
        with_style_mut!(self, style, {
            style.grid_template_rows = parse_grid_tracks(tracks)?;
        })
    }

    pub fn setGridTemplateColumns(&mut self, tracks: &JsValue) -> Result<(), JsError> {
        with_style_mut!(self, style, {
            style.grid_template_columns = parse_grid_tracks(tracks)?;
        })
    }

    // Grid Auto Rows/Columns
    pub fn setGridAutoRows(&mut self, tracks: &JsValue) -> Result<(), JsError> {
        with_style_mut!(self, style, {
            style.grid_auto_rows = parse_auto_grid_tracks(tracks)?;
        })
    }

    pub fn setGridAutoColumns(&mut self, tracks: &JsValue) -> Result<(), JsError> {
        with_style_mut!(self, style, {
            style.grid_auto_columns = parse_auto_grid_tracks(tracks)?;
        })
    }

    // Grid Item Placement
    pub fn setGridRow(&mut self, start: i16, end: i16) -> Result<(), JsError> {
        with_style_mut!(self, style, {
            style.grid_row.start = if start == 0 { GridPlacement::Auto } else { GridPlacement::Line(GridLine::from(start)) };
            style.grid_row.end = if end == 0 { GridPlacement::Auto } else { GridPlacement::Line(GridLine::from(end)) };
        })
    }

    pub fn setGridColumn(&mut self, start: i16, end: i16) -> Result<(), JsError> {
        with_style_mut!(self, style, {
            style.grid_column.start = if start == 0 { GridPlacement::Auto } else { GridPlacement::Line(GridLine::from(start)) };
            style.grid_column.end = if end == 0 { GridPlacement::Auto } else { GridPlacement::Line(GridLine::from(end)) };
        })
    }

    pub fn setGridRowSpan(&mut self, span: u16) -> Result<(), JsError> {
        with_style_mut!(self, style, {
            style.grid_row.start = GridPlacement::Span(span);
            style.grid_row.end = GridPlacement::Auto;
        })
    }

    pub fn setGridColumnSpan(&mut self, span: u16) -> Result<(), JsError> {
        with_style_mut!(self, style, {
            style.grid_column.start = GridPlacement::Span(span);
            style.grid_column.end = GridPlacement::Auto;
        })
    }

    // Grid Item Placement with Auto
    pub fn setGridRowAuto(&mut self) -> Result<(), JsError> {
        with_style_mut!(self, style, {
            style.grid_row.start = GridPlacement::Auto;
            style.grid_row.end = GridPlacement::Auto;
        })
    }

    pub fn setGridColumnAuto(&mut self) -> Result<(), JsError> {
        with_style_mut!(self, style, {
            style.grid_column.start = GridPlacement::Auto;
            style.grid_column.end = GridPlacement::Auto;
        })
    }
}

// Helper functions for parsing grid tracks
fn parse_grid_tracks(tracks: &JsValue) -> Result<GridTrackVec<TrackSizingFunction>, JsError> {
    if let Some(array) = tracks.dyn_ref::<js_sys::Array>() {
        let mut track_vec = GridTrackVec::new();
        for i in 0..array.length() {
            let track = array.get(i);
            let track_func = parse_track_sizing_function(&track)?;
            track_vec.push(track_func);
        }
        Ok(track_vec)
    } else {
        Err(JsError::new("Expected array for grid tracks"))
    }
}

fn parse_auto_grid_tracks(tracks: &JsValue) -> Result<GridTrackVec<NonRepeatedTrackSizingFunction>, JsError> {
    if let Some(array) = tracks.dyn_ref::<js_sys::Array>() {
        let mut track_vec = GridTrackVec::new();
        for i in 0..array.length() {
            let track = array.get(i);
            let track_func = parse_non_repeated_track_sizing_function(&track)?;
            track_vec.push(track_func);
        }
        Ok(track_vec)
    } else {
        Err(JsError::new("Expected array for grid auto tracks"))
    }
}

fn parse_track_sizing_function(track: &JsValue) -> Result<TrackSizingFunction, JsError> {
    if let Some(string) = track.as_string() {
        // Handle string-based track definitions like "1fr", "100px", etc.
        return parse_track_string(&string);
    }
    
    if let Some(obj) = track.dyn_ref::<js_sys::Object>() {
        // Handle object-based track definitions
        if let Some(repeat) = get_key(obj, "repeat") {
            return parse_repeat_track(repeat);
        }
        
        // Single track
        let track_func = parse_non_repeated_track_sizing_function(track)?;
        Ok(TrackSizingFunction::Single(track_func))
    } else {
        Err(JsError::new("Invalid track sizing function"))
    }
}

fn parse_track_string(track_str: &str) -> Result<TrackSizingFunction, JsError> {
    let track_func = parse_non_repeated_track_sizing_function_from_string(track_str)?;
    Ok(TrackSizingFunction::Single(track_func))
}

fn parse_repeat_track(repeat: JsValue) -> Result<TrackSizingFunction, JsError> {
    if let Some(obj) = repeat.dyn_ref::<js_sys::Object>() {
        let count = get_key(obj, "count").and_then(|v| v.as_f64()).unwrap_or(1.0) as u16;
        let tracks = get_key(obj, "tracks").ok_or_else(|| JsError::new("Missing tracks in repeat"))?;
        
        if let Some(array) = tracks.dyn_ref::<js_sys::Array>() {
            let mut track_vec = GridTrackVec::new();
            for i in 0..array.length() {
                let track = array.get(i);
                let track_func = parse_non_repeated_track_sizing_function(&track)?;
                track_vec.push(track_func);
            }
            
            let repetition = GridTrackRepetition::Count(count);
            Ok(TrackSizingFunction::Repeat(repetition, track_vec))
        } else {
            Err(JsError::new("Expected array for repeat tracks"))
        }
    } else {
        Err(JsError::new("Invalid repeat object"))
    }
}

fn parse_non_repeated_track_sizing_function(track: &JsValue) -> Result<NonRepeatedTrackSizingFunction, JsError> {
    if let Some(string) = track.as_string() {
        return parse_non_repeated_track_sizing_function_from_string(&string);
    }
    
    if let Some(obj) = track.dyn_ref::<js_sys::Object>() {
        let min = if let Some(min_val) = get_key(obj, "min") {
            parse_min_track_sizing_function(&min_val)?
        } else {
            MinTrackSizingFunction::AUTO
        };
        
        let max = if let Some(max_val) = get_key(obj, "max") {
            parse_max_track_sizing_function(&max_val)?
        } else {
            MaxTrackSizingFunction::AUTO
        };
        
        Ok(NonRepeatedTrackSizingFunction { min, max })
    } else {
        Err(JsError::new("Invalid non-repeated track sizing function"))
    }
}

fn parse_non_repeated_track_sizing_function_from_string(track_str: &str) -> Result<NonRepeatedTrackSizingFunction, JsError> {
    let track_str = track_str.trim();
    
    match track_str {
        "auto" => Ok(NonRepeatedTrackSizingFunction::AUTO),
        "min-content" => Ok(NonRepeatedTrackSizingFunction::MIN_CONTENT),
        "max-content" => Ok(NonRepeatedTrackSizingFunction::MAX_CONTENT),
        s if s.ends_with("fr") => {
            let val = s.trim_end_matches("fr").parse::<f32>()
                .map_err(|_| JsError::new("Invalid fr value"))?;
            Ok(NonRepeatedTrackSizingFunction::from_fr(val))
        }
        s if s.ends_with("%") => {
            let val = s.trim_end_matches("%").parse::<f32>()
                .map_err(|_| JsError::new("Invalid percentage value"))?;
            Ok(NonRepeatedTrackSizingFunction::from_percent(val))
        }
        s if s.ends_with("px") => {
            let val = s.trim_end_matches("px").parse::<f32>()
                .map_err(|_| JsError::new("Invalid pixel value"))?;
            Ok(NonRepeatedTrackSizingFunction::from_length(val))
        }
        s => {
            // Try parsing as a number (assume pixels)
            let val = s.parse::<f32>()
                .map_err(|_| JsError::new("Invalid track value"))?;
            Ok(NonRepeatedTrackSizingFunction::from_length(val))
        }
    }
}

fn parse_min_track_sizing_function(track: &JsValue) -> Result<MinTrackSizingFunction, JsError> {
    if let Some(string) = track.as_string() {
        let track_str = string.trim();
        match track_str {
            "auto" => Ok(MinTrackSizingFunction::AUTO),
            "min-content" => Ok(MinTrackSizingFunction::MIN_CONTENT),
            "max-content" => Ok(MinTrackSizingFunction::MAX_CONTENT),
            s if s.ends_with("fr") => {
                let val = s.trim_end_matches("fr").parse::<f32>()
                    .map_err(|_| JsError::new("Invalid fr value"))?;
                // MinTrackSizingFunction doesn't have from_fr, use auto for min and fr for max
                Ok(MinTrackSizingFunction::AUTO)
            }
            s if s.ends_with("%") => {
                let val = s.trim_end_matches("%").parse::<f32>()
                    .map_err(|_| JsError::new("Invalid percentage value"))?;
                Ok(MinTrackSizingFunction::from_percent(val))
            }
            s if s.ends_with("px") => {
                let val = s.trim_end_matches("px").parse::<f32>()
                    .map_err(|_| JsError::new("Invalid pixel value"))?;
                Ok(MinTrackSizingFunction::from_length(val))
            }
            s => {
                let val = s.parse::<f32>()
                    .map_err(|_| JsError::new("Invalid track value"))?;
                Ok(MinTrackSizingFunction::from_length(val))
            }
        }
    } else {
        Err(JsError::new("Expected string for min track sizing function"))
    }
}

fn parse_max_track_sizing_function(track: &JsValue) -> Result<MaxTrackSizingFunction, JsError> {
    if let Some(string) = track.as_string() {
        let track_str = string.trim();
        match track_str {
            "auto" => Ok(MaxTrackSizingFunction::AUTO),
            "min-content" => Ok(MaxTrackSizingFunction::MIN_CONTENT),
            "max-content" => Ok(MaxTrackSizingFunction::MAX_CONTENT),
            s if s.ends_with("fr") => {
                let val = s.trim_end_matches("fr").parse::<f32>()
                    .map_err(|_| JsError::new("Invalid fr value"))?;
                Ok(MaxTrackSizingFunction::fr(val))
            }
            s if s.ends_with("%") => {
                let val = s.trim_end_matches("%").parse::<f32>()
                    .map_err(|_| JsError::new("Invalid percentage value"))?;
                Ok(MaxTrackSizingFunction::from_percent(val))
            }
            s if s.ends_with("px") => {
                let val = s.trim_end_matches("px").parse::<f32>()
                    .map_err(|_| JsError::new("Invalid pixel value"))?;
                Ok(MaxTrackSizingFunction::from_length(val))
            }
            s => {
                let val = s.parse::<f32>()
                    .map_err(|_| JsError::new("Invalid track value"))?;
                Ok(MaxTrackSizingFunction::from_length(val))
            }
        }
    } else {
        Err(JsError::new("Expected string for max track sizing function"))
    }
}

#[wasm_bindgen]
#[repr(u8)]
#[derive(Copy, Clone)]
pub enum WasmOverflow {
    Visible,
    Clip,
    Hidden,
    Scroll,
}

impl From<WasmOverflow> for taffy::Overflow {
    fn from(val: WasmOverflow) -> Self {
        match val {
            WasmOverflow::Visible => taffy::Overflow::Visible,
            WasmOverflow::Clip => taffy::Overflow::Clip,
            WasmOverflow::Hidden => taffy::Overflow::Hidden,
            WasmOverflow::Scroll => taffy::Overflow::Scroll,
        }
    }
}
impl From<taffy::Overflow> for WasmOverflow {
    fn from(val: taffy::Overflow) -> Self {
        match val {
            taffy::Overflow::Visible => WasmOverflow::Visible,
            taffy::Overflow::Clip => WasmOverflow::Clip,
            taffy::Overflow::Hidden => WasmOverflow::Hidden,
            taffy::Overflow::Scroll => WasmOverflow::Scroll,
        }
    }
}
