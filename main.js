"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ResizeCardPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");

// src/grid-arrange.js
function gridArrange(canvas, nodeIds, fixedSize, gap = 20) {
  if (!nodeIds || nodeIds.length === 0) return;
  let minX = Infinity, minY = Infinity;
  nodeIds.forEach((nodeId) => {
    const node = canvas.nodes instanceof Map ? canvas.nodes.get(nodeId) : canvas.nodes[nodeId];
    if (node) {
      const data = node.getData();
      if (data.x < minX) minX = data.x;
      if (data.y < minY) minY = data.y;
    }
  });
  if (minX === Infinity) minX = 0;
  if (minY === Infinity) minY = 0;
  const count = nodeIds.length;
  const columns = Math.ceil(Math.sqrt(count));
  nodeIds.forEach((nodeId, index) => {
    const node = canvas.nodes instanceof Map ? canvas.nodes.get(nodeId) : canvas.nodes[nodeId];
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
      height: fixedSize.height
    });
  });
  canvas.requestSave();
  canvas.requestUpdateFileOpen();
}
__name(gridArrange, "gridArrange");

// src/main.ts
var DEFAULT_SETTINGS = {
  cycleSizes: [
    { width: 250, height: 240 },
    { width: 600, height: 800 },
    { width: 400, height: 400 }
  ],
  fixedSize: { width: 600, height: 400 }
};
var ResizeCardPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    // Map to store per-node cycle index
    this.cycleIndices = /* @__PURE__ */ new Map();
  }
  static {
    __name(this, "ResizeCardPlugin");
  }
  async onload() {
    console.log("Resize Card Plugin loaded");
    await this.loadSettings();
    this.addCommand({
      id: "grid-arrange-canvas-card",
      name: "Grid Arrange Canvas Cards",
      callback: /* @__PURE__ */ __name(() => {
        const canvas = this.getCanvas();
        if (!canvas) return;
        const nodeIds = this.getSelectedNodeId(canvas);
        if (nodeIds.length === 0) {
          new import_obsidian.Notice("No node selected or matching node found.");
          return;
        }
        gridArrange(canvas, nodeIds, this.settings.fixedSize);
        new import_obsidian.Notice("Arranged nodes in a grid layout.");
      }, "callback"),
      hotkeys: [
        {
          modifiers: ["Alt", "Shift"],
          key: "S"
        }
      ]
    });
    this.addCommand({
      id: "cycle-resize-card",
      name: "Cycle Resize Canvas Card",
      callback: /* @__PURE__ */ __name(() => this.cycleResize(), "callback"),
      hotkeys: [
        {
          modifiers: ["Alt", "Shift"],
          key: "R"
        }
      ]
    });
    this.addCommand({
      id: "fixed-resize-card",
      name: "Fixed Resize Canvas Card",
      callback: /* @__PURE__ */ __name(() => this.fixedResize(), "callback"),
      hotkeys: [
        {
          modifiers: ["Alt", "Shift"],
          key: "D"
        }
      ]
    });
    this.addSettingTab(new ResizeCardSettingTab(this.app, this));
  }
  /**
   * Returns the canvas object from the active view.
   */
  getCanvas() {
    const activeLeaf = this.app.workspace.activeLeaf;
    if (!activeLeaf || !activeLeaf.view || !("canvas" in activeLeaf.view)) {
      new import_obsidian.Notice("This command works only in a Canvas view.");
      return null;
    }
    return activeLeaf.view.canvas;
  }
  /**
   * Returns the selected node ID either from the canvas API or via fallback matching.
   */
  getSelectedNodeId(canvas) {
    let selectedNodes = canvas.selection instanceof Set ? canvas.selection : canvas.selection?.nodes;
    if (selectedNodes && selectedNodes.size > 0) {
      return Array.from(selectedNodes).map(
        (node) => typeof node === "string" ? node : node.id
      );
    }
    const domNode = document.querySelector(".canvas-node.is-focused");
    if (!domNode) return [];
    const style = getComputedStyle(domNode);
    let tx = 0, ty = 0;
    const transform = style.transform;
    if (transform && transform !== "none") {
      const matrixValues = transform.match(/matrix\(([^)]+)\)/);
      if (matrixValues) {
        const values = matrixValues[1].split(",").map((v) => parseFloat(v.trim()));
        tx = values[4];
        ty = values[5];
      }
    }
    const domWidth = domNode.offsetWidth;
    const domHeight = domNode.offsetHeight;
    let foundNodeId = null;
    if (canvas.nodes instanceof Map) {
      for (const [key, candidate] of canvas.nodes.entries()) {
        const data = candidate.getData();
        if (Math.abs(data.x - tx) < 10 && Math.abs(data.y - ty) < 10 && Math.abs(data.width - domWidth) < 10 && Math.abs(data.height - domHeight) < 10) {
          foundNodeId = key;
          break;
        }
      }
    }
    return foundNodeId ? [foundNodeId] : [];
  }
  /**
   * Cycles through preset sizes from settings for each selected node.
   */
  cycleResize() {
    const canvas = this.getCanvas();
    console.log(canvas);
    if (!canvas) return;
    let nodeIds = this.getSelectedNodeId(canvas);
    console.log("Selected node IDs:", nodeIds);
    if (nodeIds.length === 0) {
      new import_obsidian.Notice("No node selected or matching node found.");
      return;
    }
    nodeIds.forEach((nodeId) => {
      const node = canvas.nodes instanceof Map ? canvas.nodes.get(nodeId) : canvas.nodes[nodeId];
      if (!node) {
        new import_obsidian.Notice(`Selected node ${nodeId} not found in canvas model.`);
        return;
      }
      const data = node.getData();
      const oldWidth = data.width;
      const oldHeight = data.height;
      const centerX = data.x + oldWidth / 2;
      const centerY = data.y + oldHeight / 2;
      let currentIndex = this.cycleIndices.get(nodeId) ?? -1;
      currentIndex = (currentIndex + 1) % this.settings.cycleSizes.length;
      this.cycleIndices.set(nodeId, currentIndex);
      const { width: newWidth, height: newHeight } = this.settings.cycleSizes[currentIndex];
      const newX = centerX - newWidth / 2;
      const newY = centerY - newHeight / 2;
      node.setData({
        ...data,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      });
      canvas.requestSave();
      canvas.requestUpdateFileOpen();
      new import_obsidian.Notice(`Resized node ${nodeId} to ${newWidth} x ${newHeight}`);
      console.log(
        `Cycle resized node ${nodeId}: new position (${newX}, ${newY}), size ${newWidth} x ${newHeight}`
      );
    });
  }
  /**
   * Sets each selected node to a fixed size from settings.
   */
  fixedResize() {
    const canvas = this.getCanvas();
    if (!canvas) return;
    let nodeIds = this.getSelectedNodeId(canvas);
    if (nodeIds.length === 0) {
      new import_obsidian.Notice("No node selected or matching node found.");
      return;
    }
    nodeIds.forEach((nodeId) => {
      const node = canvas.nodes instanceof Map ? canvas.nodes.get(nodeId) : canvas.nodes[nodeId];
      if (!node) {
        new import_obsidian.Notice(`Selected node ${nodeId} not found in canvas model.`);
        return;
      }
      const data = node.getData();
      const oldWidth = data.width;
      const oldHeight = data.height;
      const centerX = data.x + oldWidth / 2;
      const centerY = data.y + oldHeight / 2;
      const newWidth = this.settings.fixedSize.width;
      const newHeight = this.settings.fixedSize.height;
      const newX = centerX - newWidth / 2;
      const newY = centerY - newHeight / 2;
      node.setData({
        ...data,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      });
      canvas.requestSave();
      canvas.requestUpdateFileOpen();
      new import_obsidian.Notice(`Resized node ${nodeId} to ${newWidth} x ${newHeight}`);
      console.log(
        `Fixed resized node ${nodeId}: new position (${newX}, ${newY}), size ${newWidth} x ${newHeight}`
      );
    });
  }
  async onunload() {
    console.log("Resize Card Plugin unloaded");
    await this.saveSettings();
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
var ResizeCardSettingTab = class extends import_obsidian.PluginSettingTab {
  static {
    __name(this, "ResizeCardSettingTab");
  }
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Resize Card Plugin Settings" });
    new import_obsidian.Setting(containerEl).setName("Cycle Sizes").setDesc(
      'Preset sizes (width x height) to cycle through. Enter as a JSON array, e.g.,\n[ {"width":250, "height":240}, {"width":600, "height":800}, {"width":400, "height":400} ]'
    ).addTextArea(
      (text) => text.setValue(JSON.stringify(this.plugin.settings.cycleSizes, null, 2)).onChange(async (value) => {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed) && parsed.every(
            (item) => typeof item.width === "number" && typeof item.height === "number"
          )) {
            this.plugin.settings.cycleSizes = parsed;
            await this.plugin.saveSettings();
            new import_obsidian.Notice("Cycle sizes updated.");
          } else {
            new import_obsidian.Notice("Invalid format for cycle sizes.");
          }
        } catch (err) {
          new import_obsidian.Notice("Error parsing JSON: " + err);
        }
      })
    );
    new import_obsidian.Setting(containerEl).setName("Fixed Size").setDesc(
      'Fixed size for the fixed resize command. Enter as JSON, e.g., {"width":600, "height":400}'
    ).addText(
      (text) => text.setValue(JSON.stringify(this.plugin.settings.fixedSize)).onChange(async (value) => {
        try {
          const parsed = JSON.parse(value);
          if (typeof parsed.width === "number" && typeof parsed.height === "number") {
            this.plugin.settings.fixedSize = parsed;
            await this.plugin.saveSettings();
            new import_obsidian.Notice("Fixed size updated.");
          } else {
            new import_obsidian.Notice("Invalid format for fixed size.");
          }
        } catch (err) {
          new import_obsidian.Notice("Error parsing JSON: " + err);
        }
      })
    );
  }
};
