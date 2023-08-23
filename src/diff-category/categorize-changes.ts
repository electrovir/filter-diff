import {ArrayElement} from '@augment-vir/common';
import {extname} from 'path';
import {DiffResult, DiffResultTextFile} from 'simple-git';
import {DiffCategory} from './diff-category';
import {getCategoriesFromTypescript} from './language-specific-categories/typescript';

export async function categorizeFileDiff(
    fileDiff: ArrayElement<DiffResult['files']>,
): Promise<Set<DiffCategory>> {
    if (fileDiff.binary) {
        return new Set([DiffCategory.Binary]);
    }

    const categories = new Set<DiffCategory>();

    if (fileDiff.deletions) {
        categories.add(DiffCategory.Deletions);
    }
    if (fileDiff.insertions) {
        categories.add(DiffCategory.Additions);
    }

    (await getLanguageSpecificCategories(fileDiff, Array.from(categories))).forEach((category) =>
        categories.add(category),
    );

    return categories;
}

const categoryLoaderByExtension: Record<
    string,
    (fileDiff: DiffResultTextFile) => Promise<DiffCategory[]>
> = {
    '.ts': getCategoriesFromTypescript,
};

async function getLanguageSpecificCategories(
    fileDiff: DiffResultTextFile,
    currentCategories: DiffCategory[],
): Promise<DiffCategory[]> {
    const extension = extname(fileDiff.file);
    const getterByExtension = categoryLoaderByExtension[extension];
    if (getterByExtension) {
        return await getterByExtension(fileDiff);
    } else if (currentCategories.includes(DiffCategory.Additions)) {
        /** Default to body additions if we don't know what kind of additions were made. */
        return [DiffCategory.BodyAdditions];
    }

    return [];
}
