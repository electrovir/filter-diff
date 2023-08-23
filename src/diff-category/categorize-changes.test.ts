import {assert} from 'chai';
import {writeFile} from 'fs/promises';
import {getChangedFiles} from '../git/git-changes';
import {initCommitHash, testGitFile} from '../test-git-file.test-helper';
import {categorizeChange, categorizeChanges} from './categorize-changes';
import {DiffCategory} from './diff-category';

describe(categorizeChange.name, () => {
    it(
        'distinguishes import line changes',
        testGitFile(async ({testFilePath, testDirPath, originalContents, git}) => {
            const fromInitialCommitCategories = await categorizeChanges(
                await getChangedFiles({
                    baseRef: initCommitHash,
                    cwd: testDirPath,
                    specificFiles: [testFilePath],
                }),
            );

            assert.deepStrictEqual(fromInitialCommitCategories, [
                [
                    DiffCategory.Additions,
                    DiffCategory.BodyAdditions,
                    DiffCategory.Deletions,
                ],
            ]);

            await writeFile(
                testFilePath,
                [
                    `import {
                        thing,
                        thing2,
                    } from '..';\n\n\n\n\n\n`,
                    originalContents,
                ].join('\n'),
            );

            const afterWriteCategories = await categorizeChanges(
                await getChangedFiles({
                    baseRef: 'HEAD',
                    cwd: testDirPath,
                    specificFiles: [testFilePath],
                }),
            );

            assert.deepStrictEqual(afterWriteCategories, [
                [
                    DiffCategory.Additions,
                    DiffCategory.ImportChanges,
                ],
            ]);
        }),
    );
    it(
        'ignores comments',
        testGitFile(async ({testFilePath, testDirPath, originalContents, git}) => {
            await writeFile(
                testFilePath,
                [
                    `import {
                        thing,
                        thing2,
                    } from '..';\n\n\n\n\n// derp\n`,
                    originalContents,
                ].join('\n'),
            );

            const afterWriteCategories = await categorizeChanges(
                await getChangedFiles({
                    baseRef: 'HEAD',
                    cwd: testDirPath,
                    specificFiles: [testFilePath],
                }),
            );

            assert.deepStrictEqual(afterWriteCategories, [
                [
                    DiffCategory.Additions,
                    DiffCategory.ImportChanges,
                ],
            ]);
        }),
    );
});
