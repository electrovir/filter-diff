import simpleGit, {SimpleGit, SimpleGitOptions} from 'simple-git';

export function createGitInterface(dir: string | undefined) {
    const options: Partial<SimpleGitOptions> = {
        baseDir: dir || process.cwd(),
        trimmed: true,
    };

    const git: SimpleGit = simpleGit(options);
    return git;
}
