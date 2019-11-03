import {JSHandle, Page} from 'puppeteer'
type FutureHandle = Promise<JSHandle>
type DirectJSHandle = (...args: any[]) => any;

class Privates {
    public prop: string;
    public context: FutureHandle;
    public next: FutureHandle
}

const privates = new WeakMap<DirectJSHandle, Privates>();

function create(prop: string, next : FutureHandle, context: FutureHandle = Promise.resolve(null)) {
    const fakeFunction : DirectJSHandle = () => undefined;
    privates.set(fakeFunction, {prop, context, next});
    return fakeFunction
}

const handler : ProxyHandler<DirectJSHandle> = {
    get(target : DirectJSHandle, prop: string) {
        const next = privates.get(target).next;
        return new Proxy(create(prop, next.then((handle : JSHandle) => handle.getProperty(prop)), next), handler)
    },

    apply: async (target: DirectJSHandle, thisArg : any, args?: any) => {
        const {next, context, prop} = privates.get(target);
        const handle = await next;
        const parentHandle = await context;

        const isFunction = (a: any) => typeof a === 'function';
        const execContext = handle.executionContext();
        const evaluate: typeof execContext.evaluate = execContext.evaluate.bind(execContext);

        const indexOfCallback = Array.prototype.findIndex.call(args, isFunction);
        if (prop === 'then' && indexOfCallback === 0) {
            return args[0](await parentHandle.jsonValue())
        }

        if (indexOfCallback > -1) {
            return evaluate((fn, _thisArg, _args, _indexOfCallback) => {
                return new Promise(resolve => {
                    _args.splice(_indexOfCallback, _indexOfCallback + 1, resolve);
                    // noinspection JSDeprecatedSymbols
                    fn.apply(_thisArg, _args)
                })
            }, handle, parentHandle, args, indexOfCallback).then(args[indexOfCallback])
        }

        // noinspection JSDeprecatedSymbols
        return evaluate((fn, _thisArg, _args) => fn.apply(_thisArg, _args), handle, parentHandle, args)
    }
};

export function directJSHandle(handle: JSHandle | FutureHandle) : any {
    return new Proxy(create(null, (handle instanceof Promise) ? handle: Promise.resolve(handle)), handler)
}

export function getWindowHandle(page: Page) {
    return directJSHandle(page.evaluateHandle('window'))
}