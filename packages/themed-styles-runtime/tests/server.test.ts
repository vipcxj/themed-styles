import { startTestServer } from './utils';

jest.setTimeout(3000000);
const sleep = (time: number) => new Promise(resolve => setTimeout(() => resolve(), time));
it('should start a server', async () => {
    const server = startTestServer(__dirname, [{
        path: './entry.ts',
    }], {});
    server.listen(8080);
    await sleep(600 * 1000);
    server.close();
});