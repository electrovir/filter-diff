import {readFile, writeFile} from 'fs/promises';
import {SimpleGit} from 'simple-git';
import {createGitInterface} from './git/git-interface';
import {gitTestFilePath, testFilesDirPath} from './repo-paths';

export function testGitFile<T>(
    callback: (inputs: {
        originalContents: string;
        testFilePath: string;
        testDirPath: string;
        git: SimpleGit;
    }) => T,
) {
    const testFilePath = gitTestFilePath;
    let originalContents = '';
    const gitInterface = createGitInterface(testFilesDirPath);

    return async (): Promise<T> => {
        try {
            if (!originalContents) {
                originalContents = (await readFile(testFilePath)).toString();
            }
            return await callback({
                originalContents,
                testFilePath,
                testDirPath: testFilesDirPath,
                git: gitInterface,
            });
        } finally {
            await writeFile(testFilePath, originalContents);
        }
    };
}

export const initCommitHash = 'ebd5e22a9f55c1f70fb534e08ec71b3cfb158cb8' as const;
