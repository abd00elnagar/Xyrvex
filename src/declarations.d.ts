declare module 'electrobun/view' {
    export class Electroview {
        constructor(config: { rpc: any });
        static defineRPC: <T>(...args: any[]) => any;
    }
}
declare module 'electrobun/bun' {
    export const defineElectrobunRPC: <T>(...args: any[]) => any;
    export const BrowserWindow: any;
    export const Updater: any;
    export const Utils: any;
    export const Electrobun: any;
    export default any;
}
declare module 'electrobun/shared' {
    export interface ElectrobunRPC<T, U> {
        [key: string]: any;
    }
}
declare module 'three';
