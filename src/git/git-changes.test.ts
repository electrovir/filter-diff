import {assert} from 'chai';
import {writeFile} from 'fs/promises';
import {initCommitHash, testGitFile} from '../test-git-file.test-helper';
import {getGitChanges} from './git-changes';

describe(getGitChanges.name, () => {
    it(
        'detects a created file',
        testGitFile(async ({git, testDirPath, testFilePath}) => {
            const beforeChangesBaseResult = await getGitChanges({
                cwd: testDirPath,
                baseRef: initCommitHash,
                specificFiles: [testFilePath],
            });
            assert.deepStrictEqual(
                beforeChangesBaseResult,
                [
                    {
                        additions: 1,
                        changedLineNumbers: [1],
                        deletions: 1,
                        filePath: testFilePath,
                        binary: false,
                    },
                ],
                'diff since first commit is wrong',
            );
            const beforeChangesHeadResult = await getGitChanges({
                cwd: testDirPath,
                baseRef: 'HEAD',
                specificFiles: [testFilePath],
            });
            assert.deepStrictEqual(beforeChangesHeadResult, [], 'diff before changes is wrong');
            await writeFile(testFilePath, "console.info('yo');");
            const afterChangesResult = await getGitChanges({
                cwd: testDirPath,
                baseRef: 'HEAD',
                specificFiles: [testFilePath],
            });
            assert.deepStrictEqual(
                afterChangesResult,
                [
                    {
                        additions: 1,
                        changedLineNumbers: [1],
                        deletions: 1,
                        filePath: testFilePath,
                        binary: false,
                    },
                ],
                'diff after changes is wrong',
            );
            await git.add(testFilePath);
            try {
                const afterStagedResult = await getGitChanges({
                    cwd: testDirPath,
                    baseRef: 'HEAD',
                    specificFiles: [testFilePath],
                });
                assert.deepStrictEqual(
                    afterStagedResult,
                    [
                        {
                            additions: 1,
                            changedLineNumbers: [1],
                            deletions: 1,
                            filePath: testFilePath,
                            binary: false,
                        },
                    ],
                    'diff after staging is wrong',
                );
            } finally {
                await git.reset([
                    '--',
                    testFilePath,
                ]);
            }
        }),
    );
});
