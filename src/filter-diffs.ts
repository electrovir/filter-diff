import {areJsonEqual} from '@augment-vir/common';
import {RequireExactlyOne} from 'type-fest';
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

export async function filterDiffs(
    filter: DiffFilter,
    changes: GitChange[],
): Promise<{
    included: GitChangeWithCategories[];
    excluded: GitChangeWithCategories[];
}> {
    const categories = await categorizeChanges(changes);

    const included: GitChangeWithCategories[] = [];
    const excluded: GitChangeWithCategories[] = [];

    changes.forEach((change, changeIndex) => {
        let shouldInclude = true;

        if (change.binary) {
            shouldInclude = false;
        }

        const changeCategories = categories[changeIndex];

        if (!changeCategories) {
            throw new Error(
                `Failed to find change categories for change from file '${change.filePath}' at index '${changeIndex}'`,
            );
        }

        if (filter.exclude) {
            if (filter.exclude.exactly) {
                if (areJsonEqual(filter.exclude.exactly.sort(), changeCategories)) {
                    shouldInclude = false;
                }
            } else if (filter.exclude.contains) {
                if (
                    filter.exclude.contains.some((excludedCategory) =>
                        changeCategories.includes(excludedCategory),
                    )
                ) {
                    shouldInclude = false;
                }
            }
        }

        if (filter.require) {
            if (filter.require.atLeast) {
                if (
                    !filter.require.atLeast.every((requiredCategory) =>
                        changeCategories.includes(requiredCategory),
                    )
                ) {
                    shouldInclude = false;
                }
            } else if (filter.require.exactly) {
                if (!areJsonEqual(filter.require.exactly.sort(), changeCategories.sort())) {
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
