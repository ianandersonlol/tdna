# TDNA Project Reference

## R Package Commands
- Install R package: `devtools::install_github("ianandersonlol/tdna")`
- Load data: `loadTDNAdata()`
- Fix corruption: `fixTDNAcorruption()`
- Run tests: `R CMD check --no-manual .`

## Web Application Commands
- Setup and install dependencies: `npm run setup` (from web directory)
- Start full stack (server + client): `cd web && npm start`
- Start backend server: `cd web/server && npm run dev` (development) or `cd web/server && npm start` (production)
- Start frontend app: `cd web/client && npm start`
- Run client tests: `cd web/client && npm test -- --watch`
- Build for production: `cd web/client && npm run build`

## Code Style
- R: Roxygen2 documentation for all exported functions
- JavaScript/TypeScript: camelCase variables, PascalCase for components
- Error handling: Use try/catch with specific error messages
- Imports: Group imports by type (React, Material-UI, custom)
- TypeScript: Strong typing for all parameters and return values
- React components: Functional components with hooks
- API routes: RESTful patterns with proper error handling

## Database Structure
- PostgreSQL with Sequelize ORM
- Tables: Genes, GeneFeatures, TDNALines, TDNAPositions

## Git Practices
- NEVER mention Claude, Claude Code, AI, or any AI assistants in commit messages
- Write concise commit messages focused on the changes made
- Follow conventional commit format: type(scope): message