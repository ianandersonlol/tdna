# tdna Web

This directory contains a Next.js based web interface for the `tdna` R package. The app allows searching for T-DNA insertion lines and visualising them with JBrowse 2.

## Development

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

The app expects the R package data files found in `../inst/extdata` and uses them directly via the server API.

## Deployment

The repository contains a `Dockerfile` so the web application can be deployed on
[Railway](https://railway.app/) or any container platform.  Railway will detect
the `Dockerfile` and build the image automatically.

To test the container locally run:

```bash
docker build -t tdna-web .
docker run -p 3000:3000 tdna-web
```

The application will start on port `3000`.
