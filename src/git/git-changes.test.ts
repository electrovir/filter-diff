import {assert} from 'chai';
import {readFile, writeFile} from 'fs/promises';
import {SimpleGit} from 'simple-git';
import {gitTestFilePath, testFilesDirPath} from '../repo-paths';
import {getChangedFiles} from './git-changes';
import {createGitInterface} from './git-interface';

function testGitFile(
    callback: (inputs: {
        originalContents: string;
        testFilePath: string;
        testDirPath: string;
        git: SimpleGit;
    }) => Promise<void>,
) {
    const testFilePath = gitTestFilePath;
    let originalContents = '';
    const gitInterface = createGitInterface(testFilesDirPath);

    return async () => {
        try {
            if (!originalContents) {
                originalContents = (await readFile(testFilePath)).toString();
            }
            await callback({
                originalContents,
                testFilePath,
                testDirPath: testFilesDirPath,
                git: gitInterface,
            });
        } finally {
            await writeFile(testFilePath, originalContents);
        }
    };
}

describe(getChangedFiles.name, () => {
    it(
        'detects a created file',
        testGitFile(async ({testFilePath, testDirPath, git}) => {
            const beforeChangesBaseResult = await getChangedFiles({
                cwd: testDirPath,
                baseRef: 'ebd5e22a9f55c1f70fb534e08ec71b3cfb158cb8',
                specificFiles: [testFilePath],
            });
            assert.deepStrictEqual(
                beforeChangesBaseResult,
                [
                    {
                        additions: 1,
                        changedLineNumbers: [1],
                        deletions: 1,
                        filePath: 'test-files/git-test-file.ts',
                    },
                ],
                'diff since first commit is wrong',
            );
            const beforeChangesHeadResult = await getChangedFiles({
                cwd: testDirPath,
                baseRef: 'HEAD',
                specificFiles: [testFilePath],
            });
            assert.deepStrictEqual(beforeChangesHeadResult, [], 'diff before changes is wrong');
            await writeFile(testFilePath, "console.log('yo');");
            const afterChangesResult = await getChangedFiles({
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
                        filePath: 'test-files/git-test-file.ts',
                    },
                ],
                'diff after changes is wrong',
            );
            await git.add(testFilePath);
            try {
                const afterStagedResult = await getChangedFiles({
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
                            filePath: 'test-files/git-test-file.ts',
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
