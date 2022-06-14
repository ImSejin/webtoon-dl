const fs = require('fs');
const path = require('path');

// arguments[0]: node.exe
// arguments[1]: .clean.js
const arguments = process.argv;
if (arguments.length < 3) {
  console.warn('\n  No file or directory to clean. Input path(s) to do.' +
      '  e.g. node .clean.js dummy/\n');
  return;
}

const deleteRecursively = (dir) => {
  const result = {directory: 0, file: 0};
  if (!fs.existsSync(dir)) return result;

  fs.readdirSync(dir).forEach((file) => {
    const currentPath = path.join(dir, file);

    if (fs.lstatSync(currentPath).isDirectory()) {
      // Call recursively.
      const _result = deleteRecursively(currentPath);
      result.directory += _result.directory;
      result.file += _result.file;

    } else {
      // Deletes file.
      fs.unlinkSync(currentPath);
      console.log(`Deleted: ${currentPath}`);
      result.file += 1;
    }
  });

  fs.rmdirSync(dir);
  console.log(`Deleted: ${dir}`);
  result.directory += 1;

  return result;
};

const results = arguments.slice(2).reduce((acc, cur) => {
  const result = deleteRecursively(cur);
  acc.directory += result.directory;
  acc.file += result.file;

  return acc;
}, {directory: 0, file: 0});

const cleanedDirCount = Number(results.directory).toLocaleString();
const cleanedFileCount = Number(results.file).toLocaleString();

console.log('\n----------------------------------------');
console.log(`Deleted: ${cleanedDirCount} director${results.directory > 1 ? 'ies' : 'y'}, ${cleanedFileCount} file${results.file > 1 ? 's' : ''}`);
console.log('----------------------------------------\n');
