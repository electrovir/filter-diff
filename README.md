# filter-diff

Smart diff filtering based on git features and specific language syntax.

# Install

```bash
npm i filter-diff
```

# Usage

The main api entry point is `filterToIncludedChangeFileNames`:

<!-- example-link: src/api.example.ts -->

```TypeScript
import {DiffCategory, filterToIncludedChangeFileNames} from 'filter-diff';

async function main() {
    console.log(
        await filterToIncludedChangeFileNames({
            filter: {exclude: {contains: [DiffCategory.BodyAdditions]}},
        }),
    );
}

main();
```
