declare module "obsidian" {
  export class Plugin {
    // This minimal declaration includes addCommand. You can expand it as needed.
    addCommand(options: {
      id: string;
      name: string;
      callback?: () => void;
      hotkeys?: { modifiers: string[]; key: string }[];
    }): void;
    // Other methods and properties can be declared here if needed.
  }

  export class Notice {
    constructor(message: string, timeout?: number);
  }
}

