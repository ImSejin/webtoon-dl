import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import {DISABLE_POPUP_BLOCKING, INCOGNITO, NO_DEFAULT_BROWSER_CHECK} from '../common/chrome/chrome-option';
import {downloadByURL} from "../common/lib/downloader";
import {Episode} from "./type/Episode";

export const downloadToptoon = async (comicId: string, username: string, password: string) => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [INCOGNITO, NO_DEFAULT_BROWSER_CHECK, DISABLE_POPUP_BLOCKING],
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://toptoon.com');

    // @ts-ignore
    // Login through toptoon platform.
    await page.evaluate(() => window.Login.login({'no-token': 'yes'}));
    await page.waitForSelector('#alert_layer .login-form-box');
    await page.evaluate(({username, password, comicId}) => {
      const idInput: HTMLInputElement | null = document.querySelector('#alert_layer .login-form-box input[type="text"][name="userId"]');
      if (idInput) idInput.value = username;
      const pwInput: HTMLInputElement | null = document.querySelector('#alert_layer .login-form-box input[type="password"][name="userPw"]');
      if (pwInput) pwInput.value = password;

      const loginButton: HTMLButtonElement | null = document.querySelector('#alert_layer .login-form-box+button.confirm-button');
      if (loginButton) loginButton.click();
    }, {username, password});

    // Waits until login process is finished.
    await page.waitForSelector('.menu_slider.slide-menu', {hidden: true, timeout: 10000});

    await page.goto(`https://toptoon.com/comic/ep_list/${comicId}`);
    await page.waitForSelector('a.episode-items[data-comic-id][data-episode-id][data-value][data-act]', {timeout: 10000});

    // https://toptoon.com/comic/ep_view/neighboring_houses_Seonggeun/1/rent
    const json = await page.evaluate(() => {
      const episodeElements: NodeListOf<HTMLAnchorElement> = document.querySelectorAll('a.episode-items[data-comic-id][data-episode-id][data-value][data-act]');

      return JSON.stringify(Array.from(episodeElements).map(it => ({
        comicId, // Comic name
        // @ts-ignore
        comicIdx: Number(window.comicIdx),
        episodeId: Number(it.dataset.episodeId), // Episode order
        episodeIdx: Number(it.dataset.value),
        act: it.dataset.act, // rent|?
        url: `https://toptoon.com/comic/ep_view/${comicId}/${it.dataset.episodeId}/${it.dataset.act}`,
        // images: [],
      })));
    });

    const episodes: Array<Episode> = JSON.parse(json);
    if (episodes.length === 0) return;

    // Creates a directory of comic.
    const comicDir = path.join('/', `T_${comicId}`);
    if (!fs.existsSync(comicDir)) fs.mkdirSync(comicDir);

    for (const episode of episodes) {
      // Considers navigation to be finished when there are no more than 0 network connections for at least 500 ms.
      await page.goto(episode.url.toString(), {waitUntil: 'networkidle0'});

      episode.images = await page.evaluate(() => {
        const elements: NodeListOf<HTMLImageElement> = document.querySelectorAll('div[class="comic_img c_img"] img[class="document_img"][src]');
        return Array.from(elements, img => img.src);
      });

      if (!Array.isArray(episode.images) || episode.images.length === 0) {
        console.warn(`Cannot find images in this webpage: ${episode.url}`);
        continue;
      }

      console.log(`Found ${episode.images.length} image(s) in this webpage: ${episode.url}`);

      // Creates a directory that contains the images.
      const episodeDirName = String(episode.episodeId).padStart(4, '0');
      const episodeDir = path.join(comicDir, episodeDirName);
      if (!fs.existsSync(episodeDir)) fs.mkdirSync(episodeDir);

      // Downloads images.
      episode.images.forEach((url, i, arr) => {
        const filename = `${String(i + 1).padStart(3, '0')}.webp`;
        downloadByURL(url, episodeDir, filename)
            .then(({dest}) => console.log(`Downloaded (${i + 1}/${arr.length}): ${dest}`))
            .catch(({dest, err}) => console.error(`Failed to download (${i + 1}/${arr.length}): ${dest}`, err));
      });
    }

  } finally {
    await browser.close();
  }
};
