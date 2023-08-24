# filter-diff

Smart diff filtering based on git features and specific language syntax.

# Install

```bash
npm i filter-diff
```

# Usage

The main api entry point is `filterToDiffFilePaths`:

<!-- example-link: src/readme-examples/api.example.ts -->

```TypeScript
import {DiffCategory, filterToDiffFilePaths} from 'filter-diff';

async function main() {
    console.log(
        await filterToDiffFilePaths({
            filter: {exclude: {contains: [DiffCategory.BodyAdditions]}},
        }),
    );
}

main();
```
