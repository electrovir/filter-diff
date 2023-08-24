import {DiffCategory, filterToIncludedChangeFileNames} from '.';

async function main() {
    console.log(
        await filterToIncludedChangeFileNames({
            filter: {exclude: {contains: [DiffCategory.BodyAdditions]}},
        }),
    );
}

main();
