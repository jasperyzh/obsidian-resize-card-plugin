"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const obsidian_1 = require("obsidian");
const DEFAULT_SETTINGS = {
    cycleSizes: [
        { width: 250, height: 240 },
        { width: 600, height: 800 },
        { width: 400, height: 400 },
    ],
    fixedSize: { width: 600, height: 400 },
};
class ResizeCardPlugin extends obsidian_1.Plugin {
    constructor() {
        super(...arguments);
        // Map to store per-node cycle index
        this.cycleIndices = new Map();
    }
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Resize Card Plugin loaded");
            yield this.loadSettings();
            // Command: Cycle preset sizes with Alt+Shift+R
            this.addCommand({
                id: "cycle-resize-card",
                name: "Cycle Resize Canvas Card",
                callback: () => this.cycleResize(),
                hotkeys: [
                    {
                        modifiers: ["Alt", "Shift"],
                        key: "R",
                    },
                ],
            });
            // Command: Fixed size with Alt+Shift+D
            this.addCommand({
                id: "fixed-resize-card",
                name: "Fixed Resize Canvas Card",
                callback: () => this.fixedResize(),
                hotkeys: [
                    {
                        modifiers: ["Alt", "Shift"],
                        key: "D",
                    },
                ],
            });
            this.addSettingTab(new ResizeCardSettingTab(this.app, this));
        });
    }
    /**
     * Returns the canvas object from the active view.
     */
    getCanvas() {
        const activeLeaf = this.app.workspace.activeLeaf;
        if (!activeLeaf || !activeLeaf.view || !("canvas" in activeLeaf.view)) {
            new obsidian_1.Notice("This command works only in a Canvas view.");
            return null;
        }
        return activeLeaf.view.canvas;
    }
    /**
     * Returns the selected node ID either from the canvas API or via fallback matching.
     */
    getSelectedNodeId(canvas) {
        var _a;
        let selectedNodes = (_a = canvas.selection) === null || _a === void 0 ? void 0 : _a.nodes;
        if (selectedNodes && selectedNodes.size > 0) {
            return Array.from(selectedNodes)[0];
        }
        // Fallback: match focused DOM node based on bounding values.
        const domNode = document.querySelector(".canvas-node.is-focused");
        if (!domNode)
            return null;
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
        // Iterate over canvas.nodes, which is a Map
        let foundNodeId = null;
        if (canvas.nodes instanceof Map) {
            for (const [key, candidate] of canvas.nodes.entries()) {
                const data = candidate.getData();
                if (Math.abs(data.x - tx) < 10 &&
                    Math.abs(data.y - ty) < 10 &&
                    Math.abs(data.width - domWidth) < 10 &&
                    Math.abs(data.height - domHeight) < 10) {
                    foundNodeId = key;
                    break;
                }
            }
        }
        return foundNodeId;
    }
    /**
     * Cycles through preset sizes from settings.
     */
    cycleResize() {
        var _a;
        const canvas = this.getCanvas();
        if (!canvas)
            return;
        let nodeId = this.getSelectedNodeId(canvas);
        if (!nodeId) {
            new obsidian_1.Notice("No node selected or matching node found.");
            return;
        }
        const node = canvas.nodes instanceof Map ? canvas.nodes.get(nodeId) : canvas.nodes[nodeId];
        if (!node) {
            new obsidian_1.Notice("Selected node not found in canvas model.");
            return;
        }
        const data = node.getData();
        const oldWidth = data.width;
        const oldHeight = data.height;
        const centerX = data.x + oldWidth / 2;
        const centerY = data.y + oldHeight / 2;
        // Get current cycle index for this node (default -1)
        let currentIndex = (_a = this.cycleIndices.get(nodeId)) !== null && _a !== void 0 ? _a : -1;
        // Cycle to next index.
        currentIndex = (currentIndex + 1) % this.settings.cycleSizes.length;
        this.cycleIndices.set(nodeId, currentIndex);
        const { width: newWidth, height: newHeight } = this.settings.cycleSizes[currentIndex];
        // Compute new position to keep center fixed.
        const newX = centerX - newWidth / 2;
        const newY = centerY - newHeight / 2;
        node.setData(Object.assign(Object.assign({}, data), { x: newX, y: newY, width: newWidth, height: newHeight }));
        canvas.requestSave();
        canvas.requestUpdateFileOpen();
        new obsidian_1.Notice(`Resized node to ${newWidth} x ${newHeight}`);
        console.log(`Cycle resized node ${nodeId}: new position (${newX}, ${newY}), size ${newWidth} x ${newHeight}`);
    }
    /**
     * Sets the node to a fixed size from settings.
     */
    fixedResize() {
        const canvas = this.getCanvas();
        if (!canvas)
            return;
        let nodeId = this.getSelectedNodeId(canvas);
        if (!nodeId) {
            new obsidian_1.Notice("No node selected or matching node found.");
            return;
        }
        const node = canvas.nodes instanceof Map ? canvas.nodes.get(nodeId) : canvas.nodes[nodeId];
        if (!node) {
            new obsidian_1.Notice("Selected node not found in canvas model.");
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
        node.setData(Object.assign(Object.assign({}, data), { x: newX, y: newY, width: newWidth, height: newHeight }));
        canvas.requestSave();
        canvas.requestUpdateFileOpen();
        new obsidian_1.Notice(`Resized node to ${newWidth} x ${newHeight}`);
        console.log(`Fixed resized node ${nodeId}: new position (${newX}, ${newY}), size ${newWidth} x ${newHeight}`);
    }
    onunload() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Resize Card Plugin unloaded");
            yield this.saveSettings();
        });
    }
    loadSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings = Object.assign({}, DEFAULT_SETTINGS, yield this.loadData());
        });
    }
    saveSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.saveData(this.settings);
        });
    }
}
exports.default = ResizeCardPlugin;
/**
 * Settings tab for the Resize Card Plugin.
 */
class ResizeCardSettingTab extends obsidian_1.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl("h2", { text: "Resize Card Plugin Settings" });
        // Cycle sizes setting: JSON input field.
        new obsidian_1.Setting(containerEl)
            .setName("Cycle Sizes")
            .setDesc("Preset sizes (width x height) to cycle through. Enter as a JSON array, e.g.,\n[ {\"width\":250, \"height\":240}, {\"width\":600, \"height\":800}, {\"width\":400, \"height\":400} ]")
            .addTextArea((text) => text
            .setValue(JSON.stringify(this.plugin.settings.cycleSizes, null, 2))
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            try {
                const parsed = JSON.parse(value);
                // Basic validation: Array of objects with numeric width and height.
                if (Array.isArray(parsed) && parsed.every(item => typeof item.width === "number" && typeof item.height === "number")) {
                    this.plugin.settings.cycleSizes = parsed;
                    yield this.plugin.saveSettings();
                    new obsidian_1.Notice("Cycle sizes updated.");
                }
                else {
                    new obsidian_1.Notice("Invalid format for cycle sizes.");
                }
            }
            catch (err) {
                new obsidian_1.Notice("Error parsing JSON: " + err);
            }
        })));
        // Fixed size setting.
        new obsidian_1.Setting(containerEl)
            .setName("Fixed Size")
            .setDesc("Fixed size for the fixed resize command. Enter as JSON, e.g., {\"width\":600, \"height\":400}")
            .addText((text) => text
            .setValue(JSON.stringify(this.plugin.settings.fixedSize))
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            try {
                const parsed = JSON.parse(value);
                if (typeof parsed.width === "number" && typeof parsed.height === "number") {
                    this.plugin.settings.fixedSize = parsed;
                    yield this.plugin.saveSettings();
                    new obsidian_1.Notice("Fixed size updated.");
                }
                else {
                    new obsidian_1.Notice("Invalid format for fixed size.");
                }
            }
            catch (err) {
                new obsidian_1.Notice("Error parsing JSON: " + err);
            }
        })));
    }
}
