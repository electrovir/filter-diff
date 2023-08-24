import {join, resolve} from 'path';

export const repoRootDirPath = resolve(__dirname, '..');
export const testFilesDirPath = join(repoRootDirPath, 'test-files');
export const gitTestFilePath = join(testFilesDirPath, 'git-test-file.ts');
