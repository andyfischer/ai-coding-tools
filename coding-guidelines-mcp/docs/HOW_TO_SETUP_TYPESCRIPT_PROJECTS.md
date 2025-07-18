---
description: Project setup for a new TypeScript based project.
---

# Guidelines for setting up a Typescript based project #

## Code organization ##

 - All Typescript code is stored in `src/`

## Typescript settings ##

 - Disable 'strict' mode
 - Enable 'noImplicitAny'
 - 'outDir' should be 'dist'
 - Use "module": "commonjs"

## Testing ##

For unit testing, use the Vitest library.

Tests must be stored in `__tests__` with filenames that end in `.test.ts`

## Setting up command line tools ##

Steps when the project is meant to run as a command line tool:

 - There must be a 'main' file at src/main.ts which exports a 'main' function.
 - The src/main.ts file must have this line at the top: `import 'source-map-support/register';` 
 - There must be an executable script at bin/<command name> which looks like:

        #! /usr/bin/env node

        const { main } = require('../dist/main.js');

        main()
        .catch(error => {
            console.error(error);
            process.exitCode = -1;
        });

## Gitignore

The .gitignore file must contain 'dist'
