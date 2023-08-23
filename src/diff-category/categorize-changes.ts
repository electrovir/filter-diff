import {extname} from 'path';
import {GitChange, GitFileChange} from '../git/git-changes';
import {DiffCategory} from './diff-category';
import {getCategoriesFromTypescript} from './language-specific-categories/typescript-categories';

export async function categorizeChanges(
    fileChanges: ReadonlyArray<GitChange>,
): Promise<DiffCategory[][]> {
    return await Promise.all(fileChanges.map(categorizeChange));
}

export async function categorizeChange(fileChange: GitChange): Promise<DiffCategory[]> {
    if (fileChange.binary) {
        return [DiffCategory.Binary];
    }

    const categories = new Set<DiffCategory>();

    if (fileChange.deletions) {
        categories.add(DiffCategory.Deletions);
    }
    if (fileChange.additions) {
        categories.add(DiffCategory.Additions);
    }

    (await getLanguageSpecificCategories(fileChange, Array.from(categories))).forEach((category) =>
        categories.add(category),
    );

    return Array.from(categories).sort();
}

const categoryLoaderByExtension: Record<
    string,
    (fileChange: GitFileChange) => Promise<DiffCategory[]>
> = {
    '.ts': getCategoriesFromTypescript,
};

async function getLanguageSpecificCategories(
    fileChange: GitFileChange,
    currentCategories: DiffCategory[],
): Promise<DiffCategory[]> {
    const extension = extname(fileChange.filePath);
    const getterByExtension = categoryLoaderByExtension[extension];
    if (getterByExtension) {
        return await getterByExtension(fileChange);
    } else if (currentCategories.includes(DiffCategory.Additions)) {
        /** Default to body additions if we don't know what kind of additions were made. */
        return [DiffCategory.BodyAdditions];
    }

    return [];
}
