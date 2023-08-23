import {areJsonEqual} from '@augment-vir/common';
import {RequireExactlyOne} from 'type-fest';
import {categorizeChanges} from './diff-category/categorize-changes';
import {DiffCategory} from './diff-category/diff-category';
import {GitChange} from './git/git-changes';

export type DiffFilter = Partial<{
    exclude: RequireExactlyOne<{exactly: DiffCategory[]; includes: DiffCategory[]}>;
    require: RequireExactlyOne<{exactly: DiffCategory[]; atLeast: DiffCategory[]}>;
}>;

export async function filterDiffs(filter: DiffFilter, changes: GitChange[]): Promise<GitChange[]> {
    const categories = await categorizeChanges(changes);

    const filteredChanges = changes.filter((change, changeIndex) => {
        if (change.binary) {
            return false;
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
                    return false;
                }
            } else if (filter.exclude.includes) {
                if (
                    filter.exclude.includes.some((excludedCategory) =>
                        changeCategories.includes(excludedCategory),
                    )
                ) {
                    return false;
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
                    return false;
                }
            } else if (filter.require.exactly) {
                if (!areJsonEqual(filter.require.exactly.sort(), changeCategories.sort())) {
                    return false;
                }
            }
        }

        return true;
    });

    return filteredChanges;
}
