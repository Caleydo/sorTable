/// <reference types="jasmine" />
import { hello } from '../src/index';
describe('index', function () {
    it('hello', function () {
        expect(hello()).toEqual('Hello World');
        expect(hello({})).toEqual('Hello World');
        expect(hello({ name: 'Test' })).toEqual('Hello Test');
    });
});
//# sourceMappingURL=index.test.js.map