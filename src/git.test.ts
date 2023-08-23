import {assert} from 'chai';
import {writeFile} from 'fs/promises';
import {getChangedFiles} from './git';
import {gitTestFilePath, testFilesDirPath} from './repo-paths';

describe(getChangedFiles.name, () => {
    it('detects a created file', async () => {
        const beforeChangesResult = await getChangedFiles({
            dir: testFilesDirPath,
            baseRef: 'HEAD',
        });
        assert.deepStrictEqual(beforeChangesResult, {
            changed: 0,
            deletions: 0,
            files: [],
            insertions: 0,
        });
        await writeFile(gitTestFilePath, "console.log('yo');");
    });
});
