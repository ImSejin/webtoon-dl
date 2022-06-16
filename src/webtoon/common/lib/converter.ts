import {OperatingSystem, OS} from "./system";

export const replaceForbiddenCharactersInFileName = (fileName: string, os: OperatingSystem): string => {
  if (fileName.length === 0) return fileName;

  const convertToFullWidth = (halfWidth: string) => String.fromCodePoint((halfWidth.codePointAt(0) as number) + 0xfee0);

  switch (os) {
    case OS.WINDOWS:
      const reserved = os.forbiddenCharacters.filter(it => it.length > 1 && it === fileName);
      if (reserved.length > 0) {
        throw new Error(`File name is reserved keyword in Windows: ${reserved}`);
      }

      const replaced = fileName.replaceAll('\\', '￦').replaceAll('|', '｜');
      return os.forbiddenCharacters.filter(it => it.length === 1)
          .reduce((acc, cur) => acc.replaceAll(cur, convertToFullWidth(cur)), replaced);
    case OS.LINUX:
      return os.forbiddenCharacters.filter(it => it.length === 1)
          .reduce((acc, cur) => acc.replaceAll(cur, convertToFullWidth(cur)), fileName);
    case OS.MAC:
      return os.forbiddenCharacters.filter(it => it.length === 1)
          .reduce((acc, cur) => acc.replaceAll(cur, convertToFullWidth(cur)), fileName);
    default:
      return fileName;
  }
};
