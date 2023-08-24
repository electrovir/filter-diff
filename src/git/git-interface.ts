import simpleGit, {SimpleGit, SimpleGitOptions} from 'simple-git';

export function createGitInterface(cwd: string | undefined) {
    const options: Partial<SimpleGitOptions> = {
        baseDir:
            // not testing lacking cwd
            /* istanbul ignore next */
            cwd || process.cwd(),
        trimmed: true,
    };

    const git: SimpleGit = simpleGit(options);
    return git;
}
