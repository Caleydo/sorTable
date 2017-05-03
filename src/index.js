import { mixin } from 'phovea_core/src';
export function hello(options) {
    //merge with default options
    options = mixin({
        name: 'World'
    }, options);
    return "Hello " + options.name;
}
//# sourceMappingURL=index.js.map