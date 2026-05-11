---
name: PDF Text Extraction
description: Extract text from a PDF file using Node.js (pdfjs-dist legacy build). Use when the user provides a PDF or references one by path.
---

# PDF Text Extraction

## When to Use
- The user attaches or references a `.pdf` file
- You need to read PDF content that `view_file` cannot handle (unsupported mime type)

## Prerequisites
- Node.js available on PATH

## Steps

### 1. Install the pinned legacy package

```bash
npm install pdfjs-dist@3.11.174 --no-save
```

> [!IMPORTANT]
> Pin to **3.11.174**. Later versions may be ESM-only and break under `require()`.

### 2. Run the extraction script

Create a temporary script (e.g., `/tmp/extract_pdf.js`) with this content:

```js
const fs = require('fs');
const path = require('path');

async function main() {
  const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
  const pdfPath = process.argv[2]; // pass PDF path as CLI arg
  const outPath = process.argv[3] || path.join(path.dirname(pdfPath), 'pdf_output.txt');

  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjsLib.getDocument({ data }).promise;

  let fullText = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str).join(' ');
    fullText += `--- Page ${i} ---\n${text}\n\n`;
  }

  fs.writeFileSync(outPath, fullText, 'utf8');
  console.log(`Done — ${fullText.length} chars, ${doc.numPages} pages → ${outPath}`);
}

main().catch(err => console.error(err));
```

Run it:

```bash
node /tmp/extract_pdf.js "C:\path\to\file.pdf"
```

### 3. Read the output

Use `view_file` on the generated `pdf_output.txt` (or the custom output path).

## Gotchas

| Trap | Detail |
|---|---|
| `pdf-parse` | Default import is broken (`not a function`); deep import hits `ERR_PACKAGE_PATH_NOT_EXPORTED`. **Do not use.** |
| ESM versions of pdfjs-dist | Versions after 3.x may require `import` syntax. The `/legacy/build/pdf.js` path is the CJS-safe entry point. |
| TT warnings | You may see `Warning: TT: undefined function` — these are harmless font-hinting warnings and can be ignored. |
