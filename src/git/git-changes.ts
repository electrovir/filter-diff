import {ensureErrorAndPrependMessage, safeMatch, toEnsuredNumber} from '@augment-vir/common';
import {join} from 'path';
import {SimpleGit} from 'simple-git';
import {ReadonlyDeep} from 'type-fest';
import {createGitInterface, getRepoRootPath} from './git-interface';

export type GetChangedFilesInputs = {
    baseRef: string;
    cwd: string;
    specificFiles?: string[] | undefined;
};

export type GitBinaryChange = {
    filePath: string;
    binary: true;
};

export type GitFileChange = {
    additions: number;
    deletions: number;
    filePath: string;
    /** Changed line numbers, with the line numbers being from the current file's line numbers. */
    changedLineNumbers: number[];
    binary: false;
};

export type GitChange = GitFileChange | GitBinaryChange;

const renameRegExp = /\{(.+) => (.+)\}/;

export function fixFilePath(filePath: string): string {
    const [
        ,
        oldName,
        newName,
    ] = safeMatch(filePath, renameRegExp);

    if (!oldName || !newName) {
        return filePath;
    }

    return filePath.replace(renameRegExp, newName);
}

export async function getGitChanges({
    baseRef,
    cwd: cwdInput,
    specificFiles,
}: ReadonlyDeep<GetChangedFilesInputs>): Promise<GitChange[]> {
    // not testing lacking specific files
    /* istanbul ignore next */
    specificFiles = specificFiles ?? [];
    const git = createGitInterface(cwdInput);
    const cwd = await getRepoRootPath(git);
    const changes = await git.diffSummary([
        baseRef,
        ...specificFiles,
    ]);

    const fileChanges = await Promise.all(
        changes.files.map(async (file): Promise<GitChange> => {
            const fixedRename = fixFilePath(file.file);
            const fullFilePath = join(cwd, fixedRename);

            // not testing binary files
            /* istanbul ignore next */
            if (file.binary) {
                return {
                    filePath: fullFilePath,
                    binary: true,
                };
            }
            const changedLineNumbers = await getChangedLineNumbers({
                filePath: fullFilePath,
                baseRef,
                git,
            });

            return {
                additions: file.insertions,
                deletions: file.deletions,
                filePath: fullFilePath,
                changedLineNumbers,
                binary: false,
            };
        }),
    );

    return fileChanges;
}

async function getChangedLineNumbers({
    filePath,
    baseRef,
    git,
}: {
    filePath: string;
    baseRef: string;
    git: SimpleGit;
}): Promise<number[]> {
    const diffOutput = await git.diff([
        '-U0',
        baseRef,
        '--',
        filePath,
    ]);

    const changedLines: number[] = [];

    const diffLines = diffOutput.split('\n');
    diffLines.forEach((diffLine) => {
        if (diffLine.startsWith('@@')) {
            changedLines.push(...extractFinalLineNumbersFromDiffLine(diffLine));
        }
    });

    return changedLines;
}

function extractFinalLineNumbersFromDiffLine(diffLine: string): number[] {
    try {
        const [
            ,
            extractedFirstLineNumber,
            extractedLineCount,
        ] = safeMatch(diffLine, /^@@\s+\-\d+(?:,\d+)?\s+\+(\d+)(?:,(\d+))? @@/);
        const lineNumbers: number[] = [];
        const firstLineNumber = toEnsuredNumber(extractedFirstLineNumber);
        const lineCount = extractedLineCount ? toEnsuredNumber(extractedLineCount) : 1;

        for (let i = firstLineNumber; i < firstLineNumber + lineCount; i++) {
            lineNumbers.push(i);
        }
        return lineNumbers;
    } catch (caught) {
        // not testing errors
        /* istanbul ignore next */
        throw ensureErrorAndPrependMessage(caught, `Failed to parse diff line '${diffLine}':`);
    }
}
