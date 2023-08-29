import {itCases} from '@augment-vir/chai';
import {getCategoriesFromTypescript} from './typescript-categories';
describe(getCategoriesFromTypescript.name, () => {
    itCases(getCategoriesFromTypescript, [
        {
            it: 'does not error if file is not found',
            input: {
                additions: 0,
                binary: false,
                changedLineNumbers: [],
                deletions: 0,
                filePath: 'not-found-file.ts',
            },
            expect: [],
        },
    ]);
});
