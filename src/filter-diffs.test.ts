import {itCases} from '@augment-vir/chai';
import {getObjectTypedKeys} from '@augment-vir/common';
import {writeFile} from 'fs/promises';
import {DiffCategory} from './diff-category/diff-category';
import {DiffFilter, filterDiffs} from './filter-diffs';
import {getGitChanges} from './git/git-changes';
import {testGitFile} from './test-git-file.test-helper';

async function filterDiffsTestWrapper({
    newLines,
    filter,
    modifiedLines,
}: {
    modifiedLines?: Record<number, string> | undefined;
    newLines?: string[] | undefined;
    filter: DiffFilter;
}) {
    return await testGitFile(async ({originalContents, testDirPath, testFilePath}) => {
        const originalLines = originalContents.trim().split('\n');

        const combinedLines = originalLines.concat(newLines ?? []);
        if (modifiedLines) {
            getObjectTypedKeys(modifiedLines).forEach((lineIndex) => {
                const lineText = modifiedLines[lineIndex];

                if (lineText != undefined) {
                    combinedLines[lineIndex] = lineText;
                }
            });
        }

        await writeFile(testFilePath, combinedLines.join('\n') + '\n');

        const gitChanges = await getGitChanges({
            baseRef: 'HEAD',
            cwd: testDirPath,
            specificFiles: [testFilePath],
        });

        return filterDiffs(filter, gitChanges);
    })();
}

describe(filterDiffs.name, () => {
    const baseOutput = {
        additions: 1,
        binary: false,
        categories: [
            DiffCategory.Additions,
            DiffCategory.BodyAdditions,
        ],
        changedLineNumbers: [
            2,
        ],
        deletions: 0,
        filePath: 'test-files/git-test-file.ts',
    };

    const standardNewLines = ["console.info('hi');"];

    itCases(filterDiffsTestWrapper, [
        {
            it: 'excludes a failed require exactly filter',
            input: {
                filter: {
                    require: {
                        exactly: [
                            DiffCategory.Additions,
                        ],
                    },
                },
                newLines: standardNewLines,
            },
            expect: {
                excluded: [baseOutput],
                included: [],
            },
        },
        {
            it: 'includes a matched require exactly filter',
            input: {
                filter: {
                    require: {
                        exactly: [
                            DiffCategory.Additions,
                            DiffCategory.BodyAdditions,
                        ],
                    },
                },
                newLines: standardNewLines,
            },
            expect: {
                excluded: [],
                included: [baseOutput],
            },
        },
        {
            it: 'includes a matched require at least filter',
            input: {
                filter: {
                    require: {
                        atLeast: [
                            DiffCategory.BodyAdditions,
                        ],
                    },
                },
                newLines: standardNewLines,
            },
            expect: {
                excluded: [],
                included: [baseOutput],
            },
        },
        {
            it: 'excludes a failed require at least filter',
            input: {
                filter: {
                    require: {
                        atLeast: [
                            DiffCategory.Deletions,
                        ],
                    },
                },
                newLines: standardNewLines,
            },
            expect: {
                excluded: [baseOutput],
                included: [],
            },
        },
        {
            it: 'excludes a matched exclude exactly filter',
            input: {
                filter: {
                    exclude: {
                        exactly: [
                            DiffCategory.Additions,
                            DiffCategory.BodyAdditions,
                        ],
                    },
                },
                newLines: standardNewLines,
            },
            expect: {
                excluded: [baseOutput],
                included: [],
            },
        },
        {
            it: 'includes a failed exclude exactly filter',
            input: {
                filter: {
                    exclude: {
                        exactly: [
                            DiffCategory.Additions,
                        ],
                    },
                },
                newLines: standardNewLines,
            },
            expect: {
                excluded: [],
                included: [baseOutput],
            },
        },
        {
            it: 'excludes a matched exclude includes filter',
            input: {
                filter: {
                    exclude: {
                        contains: [
                            DiffCategory.Additions,
                        ],
                    },
                },
                newLines: standardNewLines,
            },
            expect: {
                excluded: [baseOutput],
                included: [],
            },
        },
        {
            it: 'includes a failed exclude includes filter',
            input: {
                filter: {
                    exclude: {
                        contains: [
                            DiffCategory.ImportChanges,
                        ],
                    },
                },
                newLines: standardNewLines,
            },
            expect: {
                excluded: [],
                included: [baseOutput],
            },
        },
        {
            it: 'excludes body additions',
            input: {
                filter: {
                    exclude: {
                        contains: [
                            DiffCategory.BodyAdditions,
                        ],
                    },
                },
                newLines: standardNewLines,
            },
            expect: {
                excluded: [baseOutput],
                included: [],
            },
        },
        {
            it: 'ignores no changes',
            input: {
                filter: {
                    exclude: {
                        contains: [
                            DiffCategory.BodyAdditions,
                        ],
                    },
                },
            },
            expect: {
                excluded: [],
                included: [],
            },
        },
        {
            it: 'allows import additions',
            input: {
                filter: {
                    exclude: {
                        contains: [
                            DiffCategory.BodyAdditions,
                        ],
                    },
                },
                newLines: ["import {derp} form './derp';"],
            },
            expect: {
                excluded: [],
                included: [
                    {
                        ...baseOutput,
                        categories: [
                            DiffCategory.Additions,
                            DiffCategory.ImportChanges,
                        ],
                    },
                ],
            },
        },
        {
            it: 'does not treat empty lines as body additions',
            input: {
                filter: {
                    exclude: {
                        contains: [
                            DiffCategory.BodyAdditions,
                        ],
                    },
                },
                newLines: [
                    "import {derp} form './derp';",
                    '\n',
                    '\n',
                ],
            },
            expect: {
                excluded: [],
                included: [
                    {
                        ...baseOutput,
                        additions: 5,
                        categories: [
                            DiffCategory.Additions,
                            DiffCategory.ImportChanges,
                        ],
                        changedLineNumbers: [
                            2,
                            3,
                            4,
                            5,
                            6,
                        ],
                    },
                ],
            },
        },
        {
            it: 'ignores deletions',
            input: {
                filter: {
                    exclude: {
                        contains: [
                            DiffCategory.BodyAdditions,
                        ],
                    },
                },
                modifiedLines: {0: "import {derp} form './derp';"},
            },
            expect: {
                excluded: [],
                included: [
                    {
                        ...baseOutput,
                        additions: 1,
                        categories: [
                            DiffCategory.Additions,
                            DiffCategory.Deletions,
                            DiffCategory.ImportChanges,
                        ],
                        changedLineNumbers: [
                            1,
                        ],
                        deletions: 1,
                    },
                ],
            },
        },
    ]);
});
