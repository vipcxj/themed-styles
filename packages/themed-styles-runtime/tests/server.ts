import { startTestServer } from './utils';

const sleep = (time: number) => new Promise(resolve => setTimeout(() => resolve(), time));
async function main() {
    const server = startTestServer(__dirname, [{
        path: './entry.ts',
    }], {});
    server.listen(8080);
    await sleep(600 * 1000);
    server.close();
}

main().then();