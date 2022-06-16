import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import {DISABLE_POPUP_BLOCKING, INCOGNITO, NO_DEFAULT_BROWSER_CHECK} from '../common/chrome/chrome-option';
import {getElementByXpath} from "../common/lib/browser";
import {downloadByURL} from "../common/lib/downloader";
import {Episode} from "./type/episode";
import {replaceForbiddenCharactersInFileName} from "../common/lib/converter";
import {OperatingSystem} from "../common/lib/system";

export const download = async (
    comicId: string,
    username: string,
    password: string,
): Promise<void> => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [INCOGNITO, NO_DEFAULT_BROWSER_CHECK, DISABLE_POPUP_BLOCKING],
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://toptoon.com');

    // await page.exposeFunction('stubFunction', (param: string) => param + Math.round(Math.random() * 100));
    // await page.exposeFunction('stubFunction', (xpath: string, document: Document) => document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue);
    // const value = await page.evaluate(async (xpath) => {
    //   // @ts-ignore
    //   return (await window.stubFunction(xpath, document)).toString()//dataset.value;
    // }, '//a[contains(@class, "episode-items")]');

    // console.log('value', value);

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

    await page.exposeFunction('getElementByXpath', getElementByXpath);

    const json = await page.evaluate(() => {
      // const getElementByXpath = (
      //     xpath: string,
      //     contextNode: Node = window.document,
      // ): Node | null => {
      //   const xPathResult = window.document.evaluate(xpath, contextNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      //   return xPathResult.singleNodeValue;
      // };

      const episodeElements: NodeListOf<HTMLAnchorElement> = document.querySelectorAll('a.episode-items[data-comic-id][data-episode-id][data-value][data-act]');

      const episodes = Array.from(episodeElements).map(async it => {
        const episodeTitleElement = await getElementByXpath('.//p[contains(@class, "episode_title")]', it) as HTMLElement | null;
        if (episodeTitleElement === null) throw new Error('Cannot find episode title');
        const detailedEpisodeTitleElement = await getElementByXpath('.//p[contains(@class, "episode_stitle")]', it) as HTMLElement | null;
        if (detailedEpisodeTitleElement === null) throw new Error('Cannot find detailed episode title');

        return {
          comicId, // Comic name
          // @ts-ignore
          comicIdx: Number(window.comicIdx),
          episodeId: Number(it.dataset.episodeId), // Episode order
          episodeIdx: Number(it.dataset.value),
          episodeDisplayName: `${episodeTitleElement.innerText} ${detailedEpisodeTitleElement.innerText}`,
          act: it.dataset.act,
          // e.g. https://toptoon.com/comic/ep_view/neighboring_houses_Seonggeun/1/rent
          url: `https://toptoon.com/comic/ep_view/${comicId}/${it.dataset.episodeId}/${it.dataset.act}`,
          images: [],
        };
      });

      return JSON.stringify(episodes);
    });

    const episodes: Array<Episode> = JSON.parse(json);
    if (episodes.length === 0) return;

    // Creates a directory of comic.
    const comicDir = path.join('/', `T_${comicId}`);
    if (!fs.existsSync(comicDir)) fs.mkdirSync(comicDir);

    for (const episode of episodes) {
      console.log(episode)

      // Considers navigation to be finished when there are no more than 0 network connections for at least 500 ms.
      await page.goto(episode.url.toString(), {waitUntil: 'networkidle0'});

      const images: Array<string> = await page.evaluate(() => {
        const elements: NodeListOf<HTMLImageElement> = document.querySelectorAll('div[class="comic_img c_img"] img[class="document_img"][src]');
        return Array.from(elements, img => img.src);
      });
      episode.images.push(...images);

      if (!Array.isArray(episode.images) || episode.images.length === 0) {
        console.warn(`Cannot find images in this webpage: ${episode.url}`);
        continue;
      }

      console.log(`Found ${episode.images.length} image(s) in this webpage: ${episode.url}`);

      // Creates a directory that contains the images.
      const displayName = replaceForbiddenCharactersInFileName(episode.episodeDisplayName, OperatingSystem.current());
      const episodeDirName = `${String(episode.episodeId).padStart(4, '0')} - ${displayName}`;
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
