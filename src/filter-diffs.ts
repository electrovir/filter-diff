import {DiffCategory} from './diff-category/diff-category';

export type DiffFilterByCategory =
    | {
          exactly: DiffCategory[];
      }
    | {
          atLeast: DiffCategory[];
      };

export type DiffFilter = Partial<{
    exclude: DiffFilterByCategory;
    require: DiffFilterByCategory;
}>;
