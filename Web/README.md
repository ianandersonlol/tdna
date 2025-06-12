# tdna Web

This directory contains a Next.js based web interface for the `tdna` R package. The app allows searching for T-DNA insertion lines and visualising them with JBrowse 2.

## Development

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

The app expects the R package data files found in `../inst/extdata` and uses them directly via the server API.
