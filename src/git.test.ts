import {assert} from 'chai';
import {readFile, writeFile} from 'fs/promises';
import {relative} from 'path';
import {SimpleGit} from 'simple-git';
import {createGitInterface, getChangedFiles} from './git';
import {gitTestFilePath, repoRootDirPath, testFilesDirPath} from './repo-paths';

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
                dir: testDirPath,
                baseRef: 'ebd5e22a9f55c1f70fb534e08ec71b3cfb158cb8',
                specificFiles: [testFilePath],
            });
            assert.deepStrictEqual(
                beforeChangesBaseResult,
                {
                    changed: 1,
                    deletions: 1,
                    files: [
                        {
                            binary: false,
                            changes: 2,
                            deletions: 1,
                            file: relative(repoRootDirPath, testFilePath),
                            insertions: 1,
                        },
                    ],
                    insertions: 1,
                },
                'diff since first commit is wrong',
            );
            const beforeChangesHeadResult = await getChangedFiles({
                dir: testDirPath,
                baseRef: 'HEAD',
                specificFiles: [testFilePath],
            });
            assert.deepStrictEqual(
                beforeChangesHeadResult,
                {
                    changed: 0,
                    deletions: 0,
                    files: [],
                    insertions: 0,
                },
                'diff before changes is wrong',
            );
            await writeFile(testFilePath, "console.log('yo');");
            const afterChangesResult = await getChangedFiles({
                dir: testDirPath,
                baseRef: 'HEAD',
                specificFiles: [testFilePath],
            });
            assert.deepStrictEqual(
                afterChangesResult,
                {
                    changed: 1,
                    deletions: 1,
                    files: [
                        {
                            binary: false,
                            changes: 2,
                            deletions: 1,
                            file: relative(repoRootDirPath, testFilePath),
                            insertions: 1,
                        },
                    ],
                    insertions: 1,
                },
                'diff after changes is wrong',
            );
            await git.add(testFilePath);
            try {
                const afterStagedResult = await getChangedFiles({
                    dir: testDirPath,
                    baseRef: 'HEAD',
                    specificFiles: [testFilePath],
                });
                assert.deepStrictEqual(
                    afterStagedResult,
                    {
                        changed: 1,
                        deletions: 1,
                        files: [
                            {
                                binary: false,
                                changes: 2,
                                deletions: 1,
                                file: relative(repoRootDirPath, testFilePath),
                                insertions: 1,
                            },
                        ],
                        insertions: 1,
                    },
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
