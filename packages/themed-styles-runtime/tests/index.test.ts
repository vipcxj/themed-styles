import puppeteer from 'puppeteer';
import WebpackDevServer from 'webpack-dev-server';
import { getWindowHandle } from './puppeteer-direct';
import { startTestServer } from './utils';

let server: WebpackDevServer;

jest.setTimeout(30000);

beforeAll(() => {
    server = startTestServer(__dirname, [{
        path: './entry.ts',
    }], {});
    server.listen(8080);
});

afterAll(() => {
    server.close();
});

describe('base', () => {
    let browser: puppeteer.Browser;
    let page: puppeteer.Page;
    beforeAll(async () => {
        browser = await puppeteer.launch();
        page = await browser.newPage();
        await page.goto('http://localhost:8080');
    });
    afterAll(async () => {
        await browser.close();
    });
    it('div > span', async () => {
        await page.waitForSelector('div > span');
        const values = await page.$$eval('div > span', nodes => nodes.map(node => node && getComputedStyle(node).fontSize));
        expect(values.every(v => v === '24px')).toBeTruthy();
    });
    it('div > button', async () => {
        await page.waitForSelector('div > button');
        const values = await page.$$eval('div > button', nodes => nodes.map(node => node && getComputedStyle(node).color));
        expect(values.every(v => v === 'rgb(210, 105, 30)')).toBeTruthy(); // chocolate
    });
    it('a', async () => {
        await page.waitForSelector('#a');
        const values = await page.$$eval('#a', nodes => nodes.map(node => node && getComputedStyle(node).color));
        expect(values.every(v => v === 'rgb(255, 0, 0)')).toBeTruthy(); // red
    });
    it('ab', async () => {
        await page.waitForSelector('#ab');
        const values = await page.$$eval('#ab', nodes => nodes.map(node => node && getComputedStyle(node).color));
        expect(values.every(v => v === 'rgb(0, 0, 255)')).toBeTruthy(); // blue
    });
});