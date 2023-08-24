import {itCases} from '@augment-vir/chai';
import {createFilteredDiffInputs, filterToDiffFilePaths, getFilteredDiff} from './api';
import {DiffCategory} from './diff-category/diff-category';
import {gitTestFilePath, testFilesDirPath} from './repo-paths.test-helper';
import {initCommitHash} from './test-git-file.test-helper';

describe(createFilteredDiffInputs.name, () => {
    itCases(createFilteredDiffInputs, [
        {
            it: 'maintains input values',
            input: {
                filter: {},
                baseRef: 'test base ref',
                cwd: 'test cwd',
                specificFiles: [
                    'test specific file',
                ],
            },
            expect: {
                filter: {},
                baseRef: 'test base ref',
                cwd: 'test cwd',
                specificFiles: [
                    'test specific file',
                ],
            },
        },
        {
            it: 'provides default values',
            input: {filter: {}},
            expect: {
                filter: {},
                baseRef: 'HEAD',
                cwd: process.cwd(),
                specificFiles: [],
            },
        },
    ]);
});

describe(getFilteredDiff.name, () => {
    itCases(getFilteredDiff, [
        {
            it: 'gets no changes if there were none',
            input: {
                filter: {},
                cwd: testFilesDirPath,
                specificFiles: [gitTestFilePath],
            },
            expect: {
                excluded: [],
                included: [],
            },
        },
        {
            it: 'gets changes that were made',
            input: {
                filter: {},
                baseRef: initCommitHash,
                cwd: testFilesDirPath,
                specificFiles: [gitTestFilePath],
            },
            expect: {
                excluded: [],
                included: [
                    {
                        additions: 1,
                        binary: false,
                        categories: [
                            DiffCategory.Additions,
                            DiffCategory.BodyAdditions,
                            DiffCategory.Deletions,
                        ],
                        changedLineNumbers: [
                            1,
                        ],
                        deletions: 1,
                        filePath: gitTestFilePath,
                    },
                ],
            },
        },
    ]);
});

describe(filterToDiffFilePaths.name, () => {
    itCases(filterToDiffFilePaths, [
        {
            it: 'gets no changed file names if there were none',
            input: {
                filter: {},
                cwd: testFilesDirPath,
                specificFiles: [gitTestFilePath],
            },
            expect: [],
        },
        {
            it: 'gets changed file names',
            input: {
                filter: {},
                baseRef: initCommitHash,
                cwd: testFilesDirPath,
                specificFiles: [gitTestFilePath],
            },
            expect: [gitTestFilePath],
        },
    ]);
});
