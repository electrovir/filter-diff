import {DiffCategory, filterToDiffFilePaths} from '..';

async function main() {
    console.log(
        await filterToDiffFilePaths({
            filter: {exclude: {contains: [DiffCategory.BodyAdditions]}},
        }),
    );
}

main();
