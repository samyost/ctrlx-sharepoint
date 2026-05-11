---
description: How to scaffold a new JSON Formatter Builder script
---
# Scaffold Formatter Workflow

Use this workflow to quickly set up the boilerplate for a new JSON Formatter TypeScript builder.

1. Create a new `.ts` file in `Formatters/src/` following the naming convention `[ListName]_[ColumnName].ts` or `[ListName]_[ViewName].ts`.
2. Insert the standard boilerplate and imports:
    ```typescript
    import { theme } from '../lib/theme';
    import * as components from '../lib/components';
    import { compile } from '../lib/helpers';
    import { SPElement } from '../lib/types';

    const root: SPElement = {
      elmType: 'div',
      style: {
        // ...
      },
      children: [
        // ...
      ]
    };

    // Replace parameter with the correct file name (no path or extension)
    compile(root, 'Your_Target_File');
    ```
3. Update the `compile()` function name argument at the bottom of the file to match the desired output filename.
