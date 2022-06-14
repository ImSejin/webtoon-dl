// arguments[0]: node.exe
// arguments[1]: downloader.ts

import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import pkg from '../../package.json';
import {download as downloadToptoon} from "./toptoon/downloader";
import {AdditionalConfiguration} from "./common/type/additional-configuration";

yargs.version(pkg.version);

yargs(hideBin(process.argv)).command({
  command: 'download',
  describe: 'Download the webtoon',
  builder: {
    platform: {
      alias: 'p',
      describe: 'Webtoon platform',
      demandOption: true,
      type: 'string',
    },
    name: {
      alias: 'n',
      describe: 'Webtoon comic name',
      demandOption: true,
      type: 'string',
    },
    range: {
      alias: 'r',
      describe: 'Episode range',
      demandOption: false,
      type: 'string',
      default: '',
    },
    configPath: {
      alias: 'c',
      describe: 'Additional configuration json path',
      demandOption: false,
      type: 'string',
      default: '',
    },
    debug: {
      alias: 'd',
      describe: 'Run debug mode',
      demandOption: false,
      type: 'boolean',
      default: false,
    },
  },
  async handler(args) {
    const {username, password}: AdditionalConfiguration = args.configPath
        ? await import(args.configPath as string)
        : {username: null, password: null};

    switch (args.platform) {
      case 'toptoon':
        await downloadToptoon(args.name as string, username, password);
        break;
      case 'kakao':
        break;
      default:
        break;
    }
  },
});

yargs.parse();

// console.warn('\n  No file or directory to clean. Input path(s) to do.' +
//     '  e.g. node main.js toptoon/\n');
