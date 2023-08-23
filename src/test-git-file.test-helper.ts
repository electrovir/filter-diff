import {readFile, writeFile} from 'fs/promises';
import {SimpleGit} from 'simple-git';
import {createGitInterface} from './git/git-interface';
import {gitTestFilePath, testFilesDirPath} from './repo-paths';

export function testGitFile(
    callback: (inputs: {
        originalContents: string;
        testFilePath: string;
        testDirPath: string;
        git: SimpleGit;
    }) => Promise<void>,
) {
    const testFilePath = gitTestFilePath;
    let originalContents = '';
    const gitInterface = createGitInterface(testFilesDirPath);

    return async () => {
        try {
            if (!originalContents) {
                originalContents = (await readFile(testFilePath)).toString();
            }
            await callback({
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
