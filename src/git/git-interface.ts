import simpleGit, {SimpleGit, SimpleGitOptions} from 'simple-git';

export async function getRepoRootPath(git: SimpleGit): Promise<string> {
    const output = await git.raw([
        'rev-parse',
        '--show-toplevel',
    ]);
    return output;
}

export function createGitInterface(cwd: string) {
    const options: Partial<SimpleGitOptions> = {
        baseDir: cwd,
        trimmed: true,
    };

    const git: SimpleGit = simpleGit(options);
    return git;
}
