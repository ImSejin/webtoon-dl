import os from "os";

export class OperatingSystem {
  private readonly _separator: string;
  private readonly _pathSeparator: string;
  private readonly _name: string;
  private readonly _forbiddenCharacters: readonly string[];

  constructor(separator: string, pathSeparator: string, name: string, forbiddenCharacters: string[]) {
    this._separator = separator;
    this._pathSeparator = pathSeparator;
    this._name = name;
    this._forbiddenCharacters = Object.freeze(forbiddenCharacters);
  }

  get separator(): string {
    return this._separator;
  }

  get pathSeparator(): string {
    return this._pathSeparator;
  }

  get name(): string {
    return this._name;
  }

  get forbiddenCharacters(): readonly string[] {
    return this._forbiddenCharacters;
  }

  static current(): OperatingSystem {
    const osName = os.type();
    return Object.values(OS).filter(it => it.name === osName)[0];
  }
}

export const OS = {
  WINDOWS: new OperatingSystem('\\', ';', 'Windows_NT', [
    // Printable ASCII characters
    '"', // double quote
    '*', // asterisk
    '/', // forward slash
    ':', // colon - sometimes works, but is actually NTFS Alternate Data Streams
    '<', // less than
    '>', // greater than
    '?', // question mark
    '\\', // backslash
    '|', // vertical bar or pipe
    // Reserved file names
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
  ]),
  LINUX: new OperatingSystem('/', ':', 'Linux', [
    // Printable ASCII characters
    '/', // forward slash
  ]),
  MAC: new OperatingSystem('/', ':', 'Darwin', [
    // Printable ASCII characters
    '/', // forward slash
  ]),
  UNKNOWN: new OperatingSystem('', '', '', []),
} as const;

// export type OS = typeof OS[keyof typeof OS];
