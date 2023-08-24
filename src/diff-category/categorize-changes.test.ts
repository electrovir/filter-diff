import {assert} from 'chai';
import {writeFile} from 'fs/promises';
import {getGitChanges} from '../git/git-changes';
import {initCommitHash, testGitFile} from '../test-git-file.test-helper';
import {categorizeChange, categorizeChanges} from './categorize-changes';
import {DiffCategory} from './diff-category';

describe(categorizeChange.name, () => {
    it(
        'distinguishes import line changes',
        testGitFile(async ({testFilePath, testDirPath, originalContents}) => {
            const fromInitialCommitCategories = await categorizeChanges(
                await getGitChanges({
                    baseRef: initCommitHash,
                    cwd: testDirPath,
                    specificFiles: [testFilePath],
                }),
                testDirPath,
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
                await getGitChanges({
                    baseRef: 'HEAD',
                    cwd: testDirPath,
                    specificFiles: [testFilePath],
                }),
                testDirPath,
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
                await getGitChanges({
                    baseRef: 'HEAD',
                    cwd: testDirPath,
                    specificFiles: [testFilePath],
                }),
                testDirPath,
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
