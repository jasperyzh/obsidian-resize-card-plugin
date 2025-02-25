# Resize Card: Obsidian Plugin

Resize Card Plugin is an Obsidian Canvas plugin that lets you quickly resize canvas nodes using hotkeys. Cycle through a list of preset sizes or apply a fixed size with a single command. Additionally, the plugin provides a settings tab so you can customize the preset sizes to suit your workflow.

## Features

- **Cycle Sizes:**  
  Use <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd> to cycle through preset sizes for the currently selected canvas node. The default cycle (in order) is:  
  - 250px × 240px  
  - 600px × 800px  
  - 400px × 400px  

- **Fixed Size:**  
  Use <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> to set the selected node to a fixed size. The default fixed size is:  
  - 600px × 400px

- **Customizable Settings:**  
  Easily adjust the preset cycle sizes and fixed size through the plugin’s settings tab.

- **Persistent Updates:**  
  The plugin updates the underlying canvas node data using the internal API (via `node.setData()`), ensuring that changes persist when the canvas is re-rendered.

## Installation

1. **Clone this repository** into your vault's plugins directory:
   ```bash
   cd path/to/your/vault/.obsidian/plugins
   git clone https://github.com/yourusername/resize-card-plugin.git
   ```
2. Open Obsidian and go to **Settings > Community Plugins**.
3. Enable **Safe Mode** if it's not already enabled, then click **Reload Plugins**.
4. Find and enable the **Resize Card Plugin**.

## Usage

- **Cycle Through Preset Sizes:**  
  Select a node in your Canvas view and press <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd> to cycle through the preset sizes.

- **Apply Fixed Size:**  
  With a node selected, press <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> to resize it to the fixed dimensions.

## Plugin Settings

To customize the preset sizes:

1. Go to **Settings > Community Plugins > Resize Card Plugin Settings**.
2. Edit the **Cycle Sizes** field. The default value is:
   ```json
   [
     { "width": 250, "height": 240 },
     { "width": 600, "height": 800 },
     { "width": 400, "height": 400 }
   ]
   ```
3. Edit the **Fixed Size** field. The default value is:
   ```json
   { "width": 600, "height": 400 }
   ```
4. Save your changes. The plugin will use these values the next time you invoke the commands.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine.
- A code editor (e.g., Visual Studio Code).

### Build Instructions

1. Clone the repository into your vault’s plugins folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development build (with hot-reloading):
   ```bash
   npm run dev
   ```
4. Reload your plugin from Obsidian (or restart Obsidian) to see your changes.

### File Structure

- **main.ts:** The main plugin code.
- **manifest.json:** Plugin metadata.
- **README.md:** This file.
- **package.json:** Node package configuration.
- **tsconfig.json:** TypeScript compiler configuration.

## Contributing

Contributions are welcome! Feel free to open issues or pull requests if you have suggestions or bug fixes.

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
