import {
    ensureErrorAndPrependMessage,
    isTruthy,
    safeMatch,
    toEnsuredNumber,
} from '@augment-vir/common';
import {relative} from 'path';
import {SimpleGit} from 'simple-git';
import {createGitInterface} from './git-interface';

export type GetChangedFilesInputs = {
    baseRef: string;
    cwd?: string | undefined;
    specificFiles?: string[] | undefined;
};

export type GitFileChanges = {
    additions: number;
    deletions: number;
    filePath: string;
    /** Changed line numbers, with the line numbers being from the current file's line numbers. */
    changedLineNumbers: number[];
};

export async function getChangedFiles({
    baseRef,
    cwd: cwdInput,
    specificFiles,
}: GetChangedFilesInputs): Promise<GitFileChanges[]> {
    specificFiles = specificFiles ?? [];
    const cwd = cwdInput || process.cwd();
    const git = createGitInterface(cwd);
    const changes = await git.diffSummary([
        baseRef,
        ...specificFiles,
    ]);

    const fileChanges = (
        await Promise.all(
            changes.files.map(async (file): Promise<GitFileChanges | undefined> => {
                if (file.binary) {
                    return undefined;
                }
                const changedLineNumbers = await getChangedLineNumbers({
                    filePath: file.file,
                    baseRef,
                    git,
                    cwd,
                });

                return {
                    additions: file.insertions,
                    deletions: file.deletions,
                    filePath: file.file,
                    changedLineNumbers,
                };
            }),
        )
    ).filter(isTruthy);

    return fileChanges;
}

async function getChangedLineNumbers({
    filePath,
    baseRef,
    git,
    cwd,
}: {
    filePath: string;
    baseRef: string;
    git: SimpleGit;
    cwd: string;
}): Promise<number[]> {
    const diffOutput = await git.diff([
        '-U0',
        baseRef,
        '--',
        relative(cwd, filePath),
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
        throw ensureErrorAndPrependMessage(caught, `Failed to parse diff line '${diffLine}':`);
    }
}
