import {extname, join} from 'path';
import {GitChange, GitFileChange} from '../git/git-changes';
import {DiffCategory} from './diff-category';
import {getCategoriesFromTypescript} from './language-specific-categories/typescript-categories';

export async function categorizeChanges(
    fileChanges: ReadonlyArray<GitChange>,
    cwd: string,
): Promise<DiffCategory[][]> {
    return await Promise.all(fileChanges.map((change) => categorizeChange(change, cwd)));
}

export async function categorizeChange(
    fileChange: GitChange,
    cwd: string,
): Promise<DiffCategory[]> {
    // not testing binary files
    /* istanbul ignore next */
    if (fileChange.binary) {
        return [DiffCategory.Binary];
    }

    const categories = new Set<DiffCategory>();

    if (fileChange.deletions) {
        categories.add(DiffCategory.Deletions);
    }
    // in tests this is always true
    /* istanbul ignore next */
    if (fileChange.additions) {
        categories.add(DiffCategory.Additions);
    }

    (await getLanguageSpecificCategories(fileChange, Array.from(categories), cwd)).forEach(
        (category) => categories.add(category),
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
    cwd: string,
): Promise<DiffCategory[]> {
    const fullFilePath = join(cwd, fileChange.filePath);
    const extension = extname(fullFilePath);
    const getterByExtension = categoryLoaderByExtension[extension];
    // not testing any non-TS files
    /* istanbul ignore next */
    if (getterByExtension) {
        return await getterByExtension({...fileChange, filePath: fullFilePath});
    } else if (currentCategories.includes(DiffCategory.Additions)) {
        /** Default to body additions if we don't know what kind of additions were made. */
        return [DiffCategory.BodyAdditions];
    }

    // not testing any non-TS files
    /* istanbul ignore next */
    return [];
}
