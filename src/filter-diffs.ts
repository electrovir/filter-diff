import {areJsonEqual, mapObjectValues} from '@augment-vir/common';
import {ReadonlyDeep, RequireExactlyOne} from 'type-fest';
import {categorizeChanges} from './diff-category/categorize-changes';
import {DiffCategory} from './diff-category/diff-category';
import {GitChange} from './git/git-changes';

export type DiffFilter = Partial<{
    exclude: RequireExactlyOne<{
        /**
         * Any changes that match this list of categories exactly is excluded. Order does not
         * matter.
         */
        exactly: DiffCategory[];
        /**
         * Any changes that contain any of the categories in this list are excluded. Order does not
         * matter.
         */
        contains: DiffCategory[];
    }>;
    require: RequireExactlyOne<{
        /** All changes must have exactly these categories. Order does not matter. */
        exactly: DiffCategory[];
        /** All changes must have at least these listed categories. Order does not matter. */
        atLeast: DiffCategory[];
    }>;
}>;

export type GitChangeWithCategories = GitChange & {categories: DiffCategory[]};

export type FilterDiffOutput = {
    included: GitChangeWithCategories[];
    excluded: GitChangeWithCategories[];
};

export async function filterDiffs(
    filterInput: ReadonlyDeep<DiffFilter>,
    changes: ReadonlyArray<Readonly<GitChange>>,
    cwd: string,
): Promise<FilterDiffOutput> {
    const categories = await categorizeChanges(changes, cwd);

    const included: GitChangeWithCategories[] = [];
    const excluded: GitChangeWithCategories[] = [];

    const sortedFilters = mapObjectValues(filterInput, (key, value) => {
        // this is for type safety
        /* istanbul ignore next */
        if (!value) {
            return undefined;
        }
        return mapObjectValues(value, (innerKey, innerValue) => {
            // this is for type safety
            /* istanbul ignore next */
            if (!innerValue) {
                return undefined;
            }
            return [...innerValue].sort();
        });
    }) as DiffFilter;

    changes.forEach((change, changeIndex) => {
        let shouldInclude = true;

        // not testing binary files
        /* istanbul ignore next */
        if (change.binary) {
            shouldInclude = false;
        }

        const changeCategories = categories[changeIndex];

        // this is for type safety
        /* istanbul ignore next */
        if (!changeCategories) {
            throw new Error(
                `Failed to find change categories for change from file '${change.filePath}' at index '${changeIndex}'`,
            );
        }

        if (sortedFilters.exclude) {
            if (sortedFilters.exclude.exactly) {
                if (areJsonEqual([...sortedFilters.exclude.exactly].sort(), changeCategories)) {
                    shouldInclude = false;
                }
            } else {
                if (
                    sortedFilters.exclude.contains.some((excludedCategory) =>
                        changeCategories.includes(excludedCategory),
                    )
                ) {
                    shouldInclude = false;
                }
            }
        }

        if (sortedFilters.require) {
            if (sortedFilters.require.atLeast) {
                if (
                    !sortedFilters.require.atLeast.every((requiredCategory) =>
                        changeCategories.includes(requiredCategory),
                    )
                ) {
                    shouldInclude = false;
                }
            } else {
                if (!areJsonEqual(sortedFilters.require.exactly.sort(), changeCategories.sort())) {
                    shouldInclude = false;
                }
            }
        }

        const changeWithCategories = {...change, categories: changeCategories};

        if (shouldInclude) {
            included.push(changeWithCategories);
        } else {
            excluded.push(changeWithCategories);
        }
    });

    return {included, excluded};
}
