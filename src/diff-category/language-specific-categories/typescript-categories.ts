import {readFile} from 'fs/promises';
import {ScriptTarget, SyntaxKind, Node as TsNode, createSourceFile, forEachChild} from 'typescript';
import {shouldDebug} from '../../env';
import {GitFileChange} from '../../git/git-changes';
import {DiffCategory} from '../diff-category';

export async function getCategoriesFromTypescript(
    fileChange: GitFileChange,
): Promise<DiffCategory[]> {
    const fileContents = (await readFile(fileChange.filePath)).toString();

    const fileLinesByLineNumber = [
        // empty string because line numbers are 1 indexed
        '',
        ...fileContents.split('\n'),
    ];

    const sourceFile = createSourceFile(
        fileChange.filePath,
        fileContents,
        ScriptTarget.ES2021,
        true,
    );

    const relevantLineNumbers = fileChange.changedLineNumbers.filter((lineNumber) => {
        return !!fileLinesByLineNumber[lineNumber]?.trim();
    });

    const lineNumberKinds: Record<number, Set<SyntaxKind>> = {};

    function addLineKinds(node: TsNode) {
        const startLine: number =
            sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        const endLine: number = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
        if (shouldDebug) {
            console.info(`parsing ${node.kind} node from ${startLine} to ${endLine}`);
        }
        if (node.kind !== SyntaxKind.SourceFile) {
            relevantLineNumbers.forEach((lineNumber) => {
                if (lineNumber <= endLine && lineNumber >= startLine) {
                    const currentLineKinds = lineNumberKinds[lineNumber] ?? new Set();
                    if (!lineNumberKinds[lineNumber]) {
                        lineNumberKinds[lineNumber] = currentLineKinds;
                    }
                    node.flags;
                    currentLineKinds.add(node.kind);
                }
            });
        }

        forEachChild(node, addLineKinds);
    }

    addLineKinds(sourceFile);

    const categories = new Set<DiffCategory>();
    Object.values(lineNumberKinds).forEach((lineKinds) => {
        if (lineKinds.has(SyntaxKind.ImportDeclaration)) {
            categories.add(DiffCategory.ImportChanges);
        } else {
            categories.add(DiffCategory.BodyAdditions);
        }
    });

    if (shouldDebug) {
        console.info(
            fileChange.filePath,
            '\n\nfileLines\n',
            fileLinesByLineNumber
                .map((fileLine, index) =>
                    [
                        index,
                        fileLine,
                    ].join(':'),
                )
                .join('\n'),
            '\n\nrelevantLines\n',
            relevantLineNumbers
                .map((relevantLineNumber) =>
                    [
                        relevantLineNumber,
                        fileLinesByLineNumber[relevantLineNumber],
                    ].join(':'),
                )
                .join('\n'),
            '\n',
            {
                changedLines: fileChange.changedLineNumbers,
                categories,
                lineNumberKinds,
            },
        );
    }

    return Array.from(categories);
}
