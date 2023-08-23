import {ArrayElement, isTruthy} from '@augment-vir/common';
import {log} from '@augment-vir/node-js';
import {DiffResult, DiffResultTextFile, SimpleGit, SimpleGitOptions, simpleGit} from 'simple-git';

export function createGitInterface(dir: string | undefined) {
    const options: Partial<SimpleGitOptions> = {
        baseDir: dir || process.cwd(),
        trimmed: true,
    };

    const git: SimpleGit = simpleGit(options);
    return git;
}

export type GetChangedFilesInputs = {
    baseRef?: string | undefined;
    dir?: string | undefined;
    specificFiles?: string[] | undefined;
};

export async function getChangedFiles({
    baseRef,
    dir,
    specificFiles,
}: GetChangedFilesInputs = {}): Promise<DiffResult> {
    specificFiles = specificFiles ?? [];
    const git = createGitInterface(dir);
    const changesSinceBase = baseRef
        ? await git.diffSummary([
              baseRef,
              'HEAD',
              ...specificFiles,
          ])
        : undefined;
    const stagedChanges = await git.diffSummary([
        '--cached',
        ...specificFiles,
    ]);
    const unStagedChanges = await git.diffSummary([
        ...specificFiles,
    ]);

    const combined = [
        changesSinceBase,
        stagedChanges,
        unStagedChanges,
    ]
        .filter(isTruthy)
        .reduce((accum, diffResult) => {
            accum.changed += diffResult.changed;
            accum.deletions += diffResult.deletions;
            accum.insertions += diffResult.insertions;
            accum.files.push(...diffResult.files);
            return accum;
        });

    combined.files = combineFileDiffs(combined.files);

    return combined;
}

function combineFileDiffs(files: DiffResult['files']): DiffResult['files'] {
    const diffResultByPath = new Map<string, ArrayElement<DiffResult['files']>>();

    files.forEach((newEntry) => {
        const currentEntry = diffResultByPath.get(newEntry.file);
        if (currentEntry) {
            if (currentEntry.binary && newEntry.binary) {
                // how to combine binary diffs?
            } else if (!currentEntry.binary && !newEntry.binary) {
                const combined: DiffResultTextFile = {
                    changes: currentEntry.changes + newEntry.changes,
                    deletions: currentEntry.deletions + newEntry.deletions,
                    insertions: currentEntry.insertions + newEntry.insertions,
                    binary: false,
                    file: currentEntry.file,
                };
                diffResultByPath.set(newEntry.file, combined);
            } else {
                log.error(`Type mismatch between diffs in file ${newEntry.file}`);
            }
        } else {
            diffResultByPath.set(newEntry.file, newEntry);
        }
    });

    return Array.from(diffResultByPath.values());
}
