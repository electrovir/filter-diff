import {assert} from 'chai';
import {shouldDebug} from './env';

describe('shouldDebug', () => {
    it('should be false', () => {
        assert.isFalse(shouldDebug);
    });
});
