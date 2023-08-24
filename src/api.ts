import {ReadonlyDeep} from 'type-fest';
import {DiffFilter, FilterDiffOutput, filterDiffs} from './filter-diffs';
import {getGitChanges} from './git/git-changes';

export type GetFilteredDiffInputs = {
    /**
     * The directory to run all operations inside of. Only changed files inside of this directory
     * will be considered, and all file paths retrieved will be relative to this directory. Defaults
     * to process.cwd().
     */
    cwd?: string | undefined;
    /**
     * Only run git diff for specific files. Defaults to undefined, meaning that all files will be
     * considered.
     */
    specificFiles?: string[] | undefined;
    /** The base git reference to compare git diff to. Defaults to HEAD. */
    baseRef?: string | undefined;
    filter: DiffFilter;
};

export type RequiredFilteredDiffInputs = {
    [Prop in keyof Required<GetFilteredDiffInputs>]: NonNullable<
        Required<GetFilteredDiffInputs>[Prop]
    >;
};

export function createFilteredDiffInputs(
    inputs: ReadonlyDeep<GetFilteredDiffInputs>,
): ReadonlyDeep<RequiredFilteredDiffInputs> {
    return {
        baseRef: inputs.baseRef || 'HEAD',
        cwd: inputs.cwd || process.cwd(),
        specificFiles: inputs.specificFiles ?? [],
        filter: inputs.filter,
    };
}

export async function getFilteredDiff(
    rawInputs: ReadonlyDeep<GetFilteredDiffInputs>,
): Promise<FilterDiffOutput> {
    const inputs = createFilteredDiffInputs(rawInputs);
    const changes = await getGitChanges(inputs);

    const filteredChanges = filterDiffs(inputs.filter, changes);

    return filteredChanges;
}

export async function filterToDiffFilePaths(
    inputs: ReadonlyDeep<GetFilteredDiffInputs>,
): Promise<string[]> {
    const filteredDiff = await getFilteredDiff(inputs);

    return filteredDiff.included.map((diff) => diff.filePath);
}
