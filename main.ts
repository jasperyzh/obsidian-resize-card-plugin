import { Plugin, PluginSettingTab, App, Setting, Notice } from "obsidian";

interface ResizeCardSettings {
	cycleSizes: Array<{ width: number; height: number }>;
	fixedSize: { width: number; height: number };
}

const DEFAULT_SETTINGS: ResizeCardSettings = {
	cycleSizes: [
		{ width: 250, height: 240 },
		{ width: 600, height: 800 },
		{ width: 400, height: 400 },
	],
	fixedSize: { width: 600, height: 400 },
};

export default class ResizeCardPlugin extends Plugin {
	settings: ResizeCardSettings;
	// Map to store per-node cycle index
	private cycleIndices: Map<string, number> = new Map();

	async onload() {
		console.log("Resize Card Plugin loaded");
		await this.loadSettings();

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
	}

	/**
	 * Returns the canvas object from the active view.
	 */
	private getCanvas(): any | null {
		const activeLeaf = this.app.workspace.activeLeaf;
		if (!activeLeaf || !activeLeaf.view || !("canvas" in activeLeaf.view)) {
			new Notice("This command works only in a Canvas view.");
			return null;
		}
		return activeLeaf.view.canvas;
	}

	/**
	 * Returns the selected node ID either from the canvas API or via fallback matching.
	 */
	private getSelectedNodeId(canvas: any): string | null {
		let selectedNodes: Set<string> = canvas.selection?.nodes;
		if (selectedNodes && selectedNodes.size > 0) {
			return Array.from(selectedNodes)[0];
		}
		// Fallback: match focused DOM node based on bounding values.
		const domNode = document.querySelector(".canvas-node.is-focused");
		if (!domNode) return null;
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
		let foundNodeId: string | null = null;
		if (canvas.nodes instanceof Map) {
			for (const [key, candidate] of canvas.nodes.entries()) {
				const data = candidate.getData();
				if (
					Math.abs(data.x - tx) < 10 &&
					Math.abs(data.y - ty) < 10 &&
					Math.abs(data.width - domWidth) < 10 &&
					Math.abs(data.height - domHeight) < 10
				) {
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
	private cycleResize() {
		const canvas = this.getCanvas();
		if (!canvas) return;

		let nodeId = this.getSelectedNodeId(canvas);
		if (!nodeId) {
			new Notice("No node selected or matching node found.");
			return;
		}
		const node = canvas.nodes instanceof Map ? canvas.nodes.get(nodeId) : canvas.nodes[nodeId];
		if (!node) {
			new Notice("Selected node not found in canvas model.");
			return;
		}
		const data = node.getData();
		const oldWidth = data.width;
		const oldHeight = data.height;
		const centerX = data.x + oldWidth / 2;
		const centerY = data.y + oldHeight / 2;

		// Get current cycle index for this node (default -1)
		let currentIndex = this.cycleIndices.get(nodeId) ?? -1;
		// Cycle to next index.
		currentIndex = (currentIndex + 1) % this.settings.cycleSizes.length;
		this.cycleIndices.set(nodeId, currentIndex);
		const { width: newWidth, height: newHeight } = this.settings.cycleSizes[currentIndex];

		// Compute new position to keep center fixed.
		const newX = centerX - newWidth / 2;
		const newY = centerY - newHeight / 2;

		node.setData({
			...data,
			x: newX,
			y: newY,
			width: newWidth,
			height: newHeight,
		});

		canvas.requestSave();
		canvas.requestUpdateFileOpen();

		new Notice(`Resized node to ${newWidth} x ${newHeight}`);
		console.log(`Cycle resized node ${nodeId}: new position (${newX}, ${newY}), size ${newWidth} x ${newHeight}`);
	}

	/**
	 * Sets the node to a fixed size from settings.
	 */
	private fixedResize() {
		const canvas = this.getCanvas();
		if (!canvas) return;

		let nodeId = this.getSelectedNodeId(canvas);
		if (!nodeId) {
			new Notice("No node selected or matching node found.");
			return;
		}
		const node = canvas.nodes instanceof Map ? canvas.nodes.get(nodeId) : canvas.nodes[nodeId];
		if (!node) {
			new Notice("Selected node not found in canvas model.");
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
			height: newHeight,
		});

		canvas.requestSave();
		canvas.requestUpdateFileOpen();

		new Notice(`Resized node to ${newWidth} x ${newHeight}`);
		console.log(`Fixed resized node ${nodeId}: new position (${newX}, ${newY}), size ${newWidth} x ${newHeight}`);
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
}

/**
 * Settings tab for the Resize Card Plugin.
 */
class ResizeCardSettingTab extends PluginSettingTab {
	plugin: ResizeCardPlugin;

	constructor(app: App, plugin: ResizeCardPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", { text: "Resize Card Plugin Settings" });

		// Cycle sizes setting: JSON input field.
		new Setting(containerEl)
			.setName("Cycle Sizes")
			.setDesc("Preset sizes (width x height) to cycle through. Enter as a JSON array, e.g.,\n[ {\"width\":250, \"height\":240}, {\"width\":600, \"height\":800}, {\"width\":400, \"height\":400} ]")
			.addTextArea((text) =>
				text
					.setValue(JSON.stringify(this.plugin.settings.cycleSizes, null, 2))
					.onChange(async (value) => {
						try {
							const parsed = JSON.parse(value);
							// Basic validation: Array of objects with numeric width and height.
							if (Array.isArray(parsed) && parsed.every(item => typeof item.width === "number" && typeof item.height === "number")) {
								this.plugin.settings.cycleSizes = parsed;
								await this.plugin.saveSettings();
								new Notice("Cycle sizes updated.");
							} else {
								new Notice("Invalid format for cycle sizes.");
							}
						} catch (err) {
							new Notice("Error parsing JSON: " + err);
						}
					})
			);

		// Fixed size setting.
		new Setting(containerEl)
			.setName("Fixed Size")
			.setDesc("Fixed size for the fixed resize command. Enter as JSON, e.g., {\"width\":600, \"height\":400}")
			.addText((text) =>
				text
					.setValue(JSON.stringify(this.plugin.settings.fixedSize))
					.onChange(async (value) => {
						try {
							const parsed = JSON.parse(value);
							if (typeof parsed.width === "number" && typeof parsed.height === "number") {
								this.plugin.settings.fixedSize = parsed;
								await this.plugin.saveSettings();
								new Notice("Fixed size updated.");
							} else {
								new Notice("Invalid format for fixed size.");
							}
						} catch (err) {
							new Notice("Error parsing JSON: " + err);
						}
					})
			);
	}
}
