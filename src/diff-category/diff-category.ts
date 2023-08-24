export enum DiffCategory {
    /** Changes to a script's imports. (Currently only supports TypeScript.) */
    ImportChanges = 'import-changes',
    /** Additions to the body of a script, as opposed to its imports. */
    BodyAdditions = 'body-additions',

    /** Deleted lines. */
    Deletions = 'deletions',
    /** Added lines. */
    Additions = 'additions',

    /** Binary file. */
    Binary = 'binary',
}
