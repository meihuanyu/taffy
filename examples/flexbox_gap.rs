use taffy::prelude::*;

// Creates three 20px x 20px children, evenly spaced 10px apart from each other
// Thus the container is 80px x 20px.

fn main() -> Result<(), taffy::TaffyError> {
    let mut taffy: TaffyTree<()> = TaffyTree::new();

    let child0 = taffy.new_leaf_with_context(
        Style {
            size: Size { height: Dimension::AUTO, width: length(20.0) },
            display: Display::Block,
            ..Default::default()
        },
        (),
    )?;

    let root = taffy.new_with_children(
        Style {
            size: Size { width: length(50.0), height: length(60.0) },
            display: Display::Flex,
            ..Default::default()
        },
        &[child0],
    )?;

    // Compute layout and print result
    taffy.compute_layout_with_measure(root, Size::MAX_CONTENT, |_, _, _, _, _| Size { width: 10.0, height: 10.0 });
    taffy.print_tree(root);

    Ok(())
}
