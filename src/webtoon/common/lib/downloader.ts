import fs from "fs";
import path from "path";
import http from "http";
import https from "https";

export const downloadByURL = (
    url: string | URL,
    dir: string,
    filename: string | (() => string),
): Promise<{ dest: string }> => {
  const _url: URL = typeof url === 'string' ? new URL(url) : url;
  const _filename: string = typeof filename === 'function' ? filename() : filename;

  const httpRequest = _url.protocol.startsWith('https') ? https : http;
  const dest = path.join(dir, _filename);

  // Writes image files from URL.
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(dest);
    httpRequest.get(url, (incomingMsg) => incomingMsg.pipe(writeStream))
        .on('close', () => resolve({dest}))
        .on('error', (err: Error) => reject({dest, err}));
  });
};
