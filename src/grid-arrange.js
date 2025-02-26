/**
 * Arranges the given nodes in a grid layout.
 * @param {any} canvas - The canvas object from the active view.
 * @param {string[]} nodeIds - Array of selected node IDs.
 * @param {{width: number, height: number}} fixedSize - The size to use for each node.
 * @param {number} [gap=20] - Optional gap (in pixels) between nodes.
 */
export function gridArrange(canvas, nodeIds, fixedSize, gap = 20) {
  if (!nodeIds || nodeIds.length === 0) return;

  // Compute a bounding box of the currently selected nodes.
  let minX = Infinity,
    minY = Infinity;
  nodeIds.forEach((nodeId) => {
    const node =
      canvas.nodes instanceof Map
        ? canvas.nodes.get(nodeId)
        : canvas.nodes[nodeId];
    if (node) {
      const data = node.getData();
      if (data.x < minX) minX = data.x;
      if (data.y < minY) minY = data.y;
    }
  });
  if (minX === Infinity) minX = 0;
  if (minY === Infinity) minY = 0;

  // Calculate number of columns (here we use the ceiling of the square root of the number of nodes)
  const count = nodeIds.length;
  const columns = Math.ceil(Math.sqrt(count));

  // Arrange each node in a grid: row and column based on its index.
  nodeIds.forEach((nodeId, index) => {
    const node =
      canvas.nodes instanceof Map
        ? canvas.nodes.get(nodeId)
        : canvas.nodes[nodeId];
    if (!node) return;
    const row = Math.floor(index / columns);
    const col = index % columns;
    const newX = minX + col * (fixedSize.width + gap);
    const newY = minY + row * (fixedSize.height + gap);
    const data = node.getData();

    node.setData({
      ...data,
      x: newX,
      y: newY,
      width: fixedSize.width,
      height: fixedSize.height,
    });
  });

  canvas.requestSave();
  canvas.requestUpdateFileOpen();
}
