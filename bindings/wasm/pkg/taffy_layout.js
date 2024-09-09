let wasm;

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

let heap_next = heap.length;

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function getObject(idx) { return heap[idx]; }

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = (typeof TextEncoder !== 'undefined' ? new TextEncoder('utf-8') : { encode: () => { throw Error('TextEncoder not available') } } );

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
    return instance.ptr;
}

let stack_pointer = 128;

function addBorrowedObject(obj) {
    if (stack_pointer == 1) throw new Error('out of js stack');
    heap[--stack_pointer] = obj;
    return stack_pointer;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_exn_store(addHeapObject(e));
    }
}
/**
* The positioning strategy for this item.
*
* This controls both how the origin is determined for the [`Style::position`] field,
* and whether or not the item will be controlled by flexbox's layout algorithm.
*
* WARNING: this enum follows the behavior of [CSS's `position` property](https://developer.mozilla.org/en-US/docs/Web/CSS/position),
* which can be unintuitive.
*
* [`Position::Relative`] is the default value, in contrast to the default behavior in CSS.
*/
export const Position = Object.freeze({
/**
* The offset is computed relative to the final position given by the layout algorithm.
* Offsets do not affect the position of any other items; they are effectively a correction factor applied at the end.
*/
Relative:0,"0":"Relative",
/**
* The offset is computed relative to this item's closest positioned ancestor, if any.
* Otherwise, it is placed relative to the origin.
* No space is created for the item in the page layout, and its size will not be altered.
*
* WARNING: to opt-out of layouting entirely, you must use [`Display::None`] instead on your [`Style`] object.
*/
Absolute:1,"1":"Absolute", });
/**
*/
export const StyleUnit = Object.freeze({ Px:0,"0":"Px",Percent:1,"1":"Percent",Auto:2,"2":"Auto",MinContent:3,"3":"MinContent",MaxContent:4,"4":"MaxContent",FitContentPx:5,"5":"FitContentPx",FitContentPercent:6,"6":"FitContentPercent",Fr:7,"7":"Fr", });
/**
* Controls whether flex items are forced onto one line or can wrap onto multiple lines.
*
* Defaults to [`FlexWrap::NoWrap`]
*
* [Specification](https://www.w3.org/TR/css-flexbox-1/#flex-wrap-property)
*/
export const FlexWrap = Object.freeze({
/**
* Items will not wrap and stay on a single line
*/
NoWrap:0,"0":"NoWrap",
/**
* Items will wrap according to this item's [`FlexDirection`]
*/
Wrap:1,"1":"Wrap",
/**
* Items will wrap in the opposite direction to this item's [`FlexDirection`]
*/
WrapReverse:2,"2":"WrapReverse", });
/**
* Controls whether grid items are placed row-wise or column-wise. And whether the sparse or dense packing algorithm is used.
*
* The "dense" packing algorithm attempts to fill in holes earlier in the grid, if smaller items come up later. This may cause items to appear out-of-order, when doing so would fill in holes left by larger items.
*
* Defaults to [`GridAutoFlow::Row`]
*
* [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-auto-flow)
*/
export const GridAutoFlow = Object.freeze({
/**
* Items are placed by filling each row in turn, adding new rows as necessary
*/
Row:0,"0":"Row",
/**
* Items are placed by filling each column in turn, adding new columns as necessary.
*/
Column:1,"1":"Column",
/**
* Combines `Row` with the dense packing algorithm.
*/
RowDense:2,"2":"RowDense",
/**
* Combines `Column` with the dense packing algorithm.
*/
ColumnDense:3,"3":"ColumnDense", });
/**
* Sets the distribution of space between and around content items
* For Flexbox it controls alignment in the cross axis
* For Grid it controls alignment in the block axis
*
* [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/align-content)
*/
export const AlignContent = Object.freeze({
/**
* Items are packed toward the start of the axis
*/
Start:0,"0":"Start",
/**
* Items are packed toward the end of the axis
*/
End:1,"1":"End",
/**
* Items are packed towards the flex-relative start of the axis.
*
* For flex containers with flex_direction RowReverse or ColumnReverse this is equivalent
* to End. In all other cases it is equivalent to Start.
*/
FlexStart:2,"2":"FlexStart",
/**
* Items are packed towards the flex-relative end of the axis.
*
* For flex containers with flex_direction RowReverse or ColumnReverse this is equivalent
* to Start. In all other cases it is equivalent to End.
*/
FlexEnd:3,"3":"FlexEnd",
/**
* Items are centered around the middle of the axis
*/
Center:4,"4":"Center",
/**
* Items are stretched to fill the container
*/
Stretch:5,"5":"Stretch",
/**
* The first and last items are aligned flush with the edges of the container (no gap)
* The gap between items is distributed evenly.
*/
SpaceBetween:6,"6":"SpaceBetween",
/**
* The gap between the first and last items is exactly THE SAME as the gap between items.
* The gaps are distributed evenly
*/
SpaceEvenly:7,"7":"SpaceEvenly",
/**
* The gap between the first and last items is exactly HALF the gap between items.
* The gaps are distributed evenly in proportion to these ratios.
*/
SpaceAround:8,"8":"SpaceAround", });
/**
* Used to control how child nodes are aligned.
* For Flexbox it controls alignment in the cross axis
* For Grid it controls alignment in the block axis
*
* [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/align-items)
*/
export const AlignItems = Object.freeze({
/**
* Items are packed toward the start of the axis
*/
Start:0,"0":"Start",
/**
* Items are packed toward the end of the axis
*/
End:1,"1":"End",
/**
* Items are packed towards the flex-relative start of the axis.
*
* For flex containers with flex_direction RowReverse or ColumnReverse this is equivalent
* to End. In all other cases it is equivalent to Start.
*/
FlexStart:2,"2":"FlexStart",
/**
* Items are packed towards the flex-relative end of the axis.
*
* For flex containers with flex_direction RowReverse or ColumnReverse this is equivalent
* to Start. In all other cases it is equivalent to End.
*/
FlexEnd:3,"3":"FlexEnd",
/**
* Items are packed along the center of the cross axis
*/
Center:4,"4":"Center",
/**
* Items are aligned such as their baselines align
*/
Baseline:5,"5":"Baseline",
/**
* Stretch to fill the container
*/
Stretch:6,"6":"Stretch", });
/**
* How children overflowing their container should affect layout
*
* In CSS the primary effect of this property is to control whether contents of a parent container that overflow that container should
* be displayed anyway, be clipped, or trigger the container to become a scroll container. However it also has secondary effects on layout,
* the main ones being:
*
*   - The automatic minimum size Flexbox/CSS Grid items with non-`Visible` overflow is `0` rather than being content based
*   - `Overflow::Scroll` nodes have space in the layout reserved for a scrollbar (width controlled by the `scrollbar_width` property)
*
* In Taffy, we only implement the layout related secondary effects as we are not concerned with drawing/painting. The amount of space reserved for
* a scrollbar is controlled by the `scrollbar_width` property. If this is `0` then `Scroll` behaves identically to `Hidden`.
*
* <https://developer.mozilla.org/en-US/docs/Web/CSS/overflow>
*/
export const Overflow = Object.freeze({
/**
* The automatic minimum size of this node as a flexbox/grid item should be based on the size of its content.
* Content that overflows this node *should* contribute to the scroll region of its parent.
*/
Visible:0,"0":"Visible",
/**
* The automatic minimum size of this node as a flexbox/grid item should be based on the size of its content.
* Content that overflows this node should *not* contribute to the scroll region of its parent.
*/
Clip:1,"1":"Clip",
/**
* The automatic minimum size of this node as a flexbox/grid item should be `0`.
* Content that overflows this node should *not* contribute to the scroll region of its parent.
*/
Hidden:2,"2":"Hidden",
/**
* The automatic minimum size of this node as a flexbox/grid item should be `0`. Additionally, space should be reserved
* for a scrollbar. The amount of space reserved is controlled by the `scrollbar_width` property.
* Content that overflows this node should *not* contribute to the scroll region of its parent.
*/
Scroll:3,"3":"Scroll", });
/**
* The direction of the flexbox layout main axis.
*
* There are always two perpendicular layout axes: main (or primary) and cross (or secondary).
* Adding items will cause them to be positioned adjacent to each other along the main axis.
* By varying this value throughout your tree, you can create complex axis-aligned layouts.
*
* Items are always aligned relative to the cross axis, and justified relative to the main axis.
*
* The default behavior is [`FlexDirection::Row`].
*
* [Specification](https://www.w3.org/TR/css-flexbox-1/#flex-direction-property)
*/
export const FlexDirection = Object.freeze({
/**
* Defines +x as the main axis
*
* Items will be added from left to right in a row.
*/
Row:0,"0":"Row",
/**
* Defines +y as the main axis
*
* Items will be added from top to bottom in a column.
*/
Column:1,"1":"Column",
/**
* Defines -x as the main axis
*
* Items will be added from right to left in a row.
*/
RowReverse:2,"2":"RowReverse",
/**
* Defines -y as the main axis
*
* Items will be added from bottom to top in a column.
*/
ColumnReverse:3,"3":"ColumnReverse", });
/**
* Sets the layout used for the children of this node
*
* The default values depends on on which feature flags are enabled. The order of precedence is: Flex, Grid, Block, None.
*/
export const Display = Object.freeze({
/**
* The children will follow the block layout algorithm
*/
Block:0,"0":"Block",
/**
* The children will follow the flexbox layout algorithm
*/
Flex:1,"1":"Flex",
/**
* The children will follow the CSS Grid layout algorithm
*/
Grid:2,"2":"Grid",
/**
* The element and it's children will not be laid out and will behave as if they
* did not exist.
*/
None:3,"3":"None", });

const LayoutFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_layout_free(ptr >>> 0, 1));
/**
*/
export class Layout {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Layout.prototype);
        obj.__wbg_ptr = ptr;
        LayoutFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LayoutFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_layout_free(ptr, 0);
    }
    /**
    * @returns {number}
    */
    get width() {
        const ret = wasm.__wbg_get_layout_width(this.__wbg_ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    get height() {
        const ret = wasm.__wbg_get_layout_height(this.__wbg_ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    get x() {
        const ret = wasm.__wbg_get_layout_x(this.__wbg_ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    get y() {
        const ret = wasm.__wbg_get_layout_y(this.__wbg_ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    get childCount() {
        const ret = wasm.__wbg_get_layout_childCount(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * @param {number} at
    * @returns {Layout}
    */
    child(at) {
        const ret = wasm.layout_child(this.__wbg_ptr, at);
        return Layout.__wrap(ret);
    }
}

const NodeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_node_free(ptr >>> 0, 1));
/**
*/
export class Node {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NodeFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_node_free(ptr, 0);
    }
    /**
    * @param {TaffyTree} tree
    */
    constructor(tree) {
        _assertClass(tree, TaffyTree);
        const ret = wasm.node_new(tree.__wbg_ptr);
        this.__wbg_ptr = ret >>> 0;
        NodeFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
    * @param {any} measure
    */
    setMeasure(measure) {
        try {
            wasm.node_setMeasure(this.__wbg_ptr, addBorrowedObject(measure));
        } finally {
            heap[stack_pointer++] = undefined;
        }
    }
    /**
    * @param {Node} child
    */
    addChild(child) {
        _assertClass(child, Node);
        wasm.node_addChild(this.__wbg_ptr, child.__wbg_ptr);
    }
    /**
    * @param {Node} child
    */
    removeChild(child) {
        _assertClass(child, Node);
        wasm.node_removeChild(this.__wbg_ptr, child.__wbg_ptr);
    }
    /**
    * @param {number} index
    * @param {Node} child
    */
    replaceChildAtIndex(index, child) {
        _assertClass(child, Node);
        wasm.node_replaceChildAtIndex(this.__wbg_ptr, index, child.__wbg_ptr);
    }
    /**
    * @param {number} index
    */
    removeChildAtIndex(index) {
        wasm.node_removeChildAtIndex(this.__wbg_ptr, index);
    }
    /**
    */
    markDirty() {
        wasm.node_markDirty(this.__wbg_ptr);
    }
    /**
    * @returns {boolean}
    */
    isDirty() {
        const ret = wasm.node_isDirty(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * @returns {number}
    */
    childCount() {
        const ret = wasm.node_childCount(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * @param {any} size
    * @returns {Layout}
    */
    computeLayout(size) {
        try {
            const ret = wasm.node_computeLayout(this.__wbg_ptr, addBorrowedObject(size));
            return Layout.__wrap(ret);
        } finally {
            heap[stack_pointer++] = undefined;
        }
    }
    /**
    * @returns {Display}
    */
    getDisplay() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_getDisplay(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return r0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Display} value
    */
    setDisplay(value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setDisplay(retptr, this.__wbg_ptr, value);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @returns {Position}
    */
    getPosition() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_getPosition(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return r0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Position} value
    */
    setPosition(value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setPosition(retptr, this.__wbg_ptr, value);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @returns {Overflow}
    */
    getOverflowX() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_getOverflowX(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return r0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Overflow} value
    */
    setOverflowX(value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setOverflowX(retptr, this.__wbg_ptr, value);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @returns {Overflow}
    */
    getOverflowY() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_getOverflowY(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return r0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Overflow} value
    */
    setOverflowY(value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setOverflowY(retptr, this.__wbg_ptr, value);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Overflow} value
    */
    setOverflow(value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setOverflow(retptr, this.__wbg_ptr, value);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    */
    setScrollbarWidth(value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setScrollbarWidth(retptr, this.__wbg_ptr, value);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setInsetTop(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setInsetTop(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setInsetBottom(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setInsetBottom(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setInsetLeft(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setInsetLeft(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setInsetRight(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setInsetRight(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setInsetHorizontal(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setInsetHorizontal(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setInsetVertical(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setInsetVertical(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setInsetAll(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setInsetAll(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setWidth(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setWidth(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setHeight(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setHeight(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setMinWidth(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setMinWidth(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setMinHeight(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setMinHeight(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setMaxWidth(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setMaxWidth(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setMaxHeight(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setMaxHeight(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number | undefined} [value]
    */
    setAspectRatio(value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setAspectRatio(retptr, this.__wbg_ptr, !isLikeNone(value), isLikeNone(value) ? 0 : value);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setPaddingTop(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setPaddingTop(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setPaddingBottom(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setPaddingBottom(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setPaddingLeft(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setPaddingLeft(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setPaddingRight(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setPaddingRight(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setPaddingHorizontal(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setPaddingHorizontal(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setPaddingVertical(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setPaddingVertical(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setPaddingAll(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setPaddingAll(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setMarginTop(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setMarginTop(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setMarginBottom(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setMarginBottom(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setMarginLeft(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setMarginLeft(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setMarginRight(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setMarginRight(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setMarginHorizontal(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setMarginHorizontal(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setMarginVertical(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setMarginVertical(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setMarginAll(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setMarginAll(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setBorderWidthTop(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setBorderWidthTop(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setBorderWidthBottom(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setBorderWidthBottom(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setBorderWidthLeft(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setBorderWidthLeft(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setBorderWidthRight(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setBorderWidthRight(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setBorderWidthHorizontal(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setBorderWidthHorizontal(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setBorderWidthVertical(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setBorderWidthVertical(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setBorderWidthAll(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setBorderWidthAll(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setRowGap(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setRowGap(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setColumnGap(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setColumnGap(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setGap(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setGap(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {AlignContent | undefined} [value]
    */
    setAlignContent(value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setAlignContent(retptr, this.__wbg_ptr, isLikeNone(value) ? 9 : value);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {AlignContent | undefined} [value]
    */
    setJustifyContent(value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setJustifyContent(retptr, this.__wbg_ptr, isLikeNone(value) ? 9 : value);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {AlignItems | undefined} [value]
    */
    setAlignItems(value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setAlignItems(retptr, this.__wbg_ptr, isLikeNone(value) ? 7 : value);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {AlignItems | undefined} [value]
    */
    setJustifyItems(value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setJustifyItems(retptr, this.__wbg_ptr, isLikeNone(value) ? 7 : value);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {AlignItems | undefined} [value]
    */
    setAlignSelf(value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setAlignSelf(retptr, this.__wbg_ptr, isLikeNone(value) ? 7 : value);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {AlignItems | undefined} [value]
    */
    setJustifySelf(value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setJustifySelf(retptr, this.__wbg_ptr, isLikeNone(value) ? 7 : value);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {FlexDirection} value
    */
    setFlexDirection(value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setFlexDirection(retptr, this.__wbg_ptr, value);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {FlexWrap} value
    */
    setFlexWrap(value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setFlexWrap(retptr, this.__wbg_ptr, value);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    */
    setFlexGrow(value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setFlexGrow(retptr, this.__wbg_ptr, value);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    */
    setFlexShrink(value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setFlexShrink(retptr, this.__wbg_ptr, value);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} value
    * @param {StyleUnit} unit
    */
    setFlexBasis(value, unit) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setFlexBasis(retptr, this.__wbg_ptr, value, unit);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {GridAutoFlow} value
    */
    setGridAutoFlow(value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.node_setGridAutoFlow(retptr, this.__wbg_ptr, value);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}

const TaffyTreeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_taffytree_free(ptr >>> 0, 1));
/**
*/
export class TaffyTree {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TaffyTreeFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_taffytree_free(ptr, 0);
    }
    /**
    */
    constructor() {
        const ret = wasm.taffytree_new();
        this.__wbg_ptr = ret >>> 0;
        TaffyTreeFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbindgen_error_new = function(arg0, arg1) {
        const ret = new Error(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_number_get = function(arg0, arg1) {
        const obj = getObject(arg1);
        const ret = typeof(obj) === 'number' ? obj : undefined;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbindgen_number_new = function(arg0) {
        const ret = arg0;
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        const ret = getStringFromWasm0(arg0, arg1);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_string_get = function(arg0, arg1) {
        const obj = getObject(arg1);
        const ret = typeof(obj) === 'string' ? obj : undefined;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
        const ret = getObject(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_newwithlength_b5660ad84eb3e8a9 = function(arg0) {
        const ret = new Array(arg0 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_set_673dda6c73d19609 = function(arg0, arg1, arg2) {
        getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
    };
    imports.wbg.__wbg_apply_353f4c9ca391d52b = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).apply(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_get_224d16597dbbfd96 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.get(getObject(arg0), getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };

    return imports;
}

function __wbg_init_memory(imports, memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;



    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined' && Object.getPrototypeOf(module) === Object.prototype)
    ({module} = module)
    else
    console.warn('using deprecated parameters for `initSync()`; pass a single object instead')

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined' && Object.getPrototypeOf(module_or_path) === Object.prototype)
    ({module_or_path} = module_or_path)
    else
    console.warn('using deprecated parameters for the initialization function; pass a single object instead')

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('taffy_layout_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
