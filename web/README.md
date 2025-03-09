# T-DNA Viewer: Interactive Arabidopsis Genome Browser

An interactive web application for visualizing and analyzing T-DNA insertion lines in Arabidopsis thaliana genes. This modern platform provides researchers with intuitive tools to explore gene structures and identify T-DNA insertions for functional genomics studies.

![T-DNA Viewer Screenshot](https://via.placeholder.com/800x450?text=T-DNA+Viewer)

> **Note:** For instructions on using the original R package version, see the [main README](../README.md)

## Features

- **Powerful Gene Search**: Find Arabidopsis genes instantly by ID or keyword
- **Interactive Genome Browser**: Examine gene structure with precise T-DNA insertion visualization
- **Comprehensive T-DNA Data**: Access detailed information on available insertion lines
- **Export Capabilities**: Download T-DNA line data in CSV format for further analysis
- **Accessibility Options**: Toggle between standard and colorblind-friendly color schemes
- **Responsive Design**: Access from any device with a modern web browser

## Example Usage

1. **Search for a gene** by typing an Arabidopsis gene ID (e.g., AT1G25320) or keyword
2. **Explore the gene structure** using the interactive genome browser
3. **View T-DNA insertions** positioned within the gene model
4. **Export T-DNA line information** for ordering from stock centers

## Getting Started

### Prerequisites

- Node.js (v14+)
- PostgreSQL (v12+)
- NPM or Yarn

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/ianandersonlol/tdna-web.git
cd tdna-web
```

2. **Set up the database**

```bash
# Create PostgreSQL database
createdb tdna_db
```

3. **Configure environment variables**

```bash
cp server/.env.example server/.env
# Edit the .env file with your database credentials
```

4. **Install dependencies and import data**

```bash
# Install dependencies for all components
npm run setup

# Import gene and T-DNA data
npm run import-data
```

5. **Start the application**

```bash
# Start both backend and frontend servers
npm start
```

The application will be available at http://localhost:3000.

## Technical Overview

### Modern Web Stack

- **Frontend**: React with TypeScript, Material-UI, and IGV.js
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Sequelize ORM
- **API**: RESTful endpoints for gene, T-DNA, and visualization data

### Data Sources

- Arabidopsis thaliana genome annotation (Araport11)
- Confirmed T-DNA insertion lines from the SIGnAL collection
- T-DNA insertion positions mapped to the Arabidopsis genome

## Deployment

The application can be deployed to any environment supporting Node.js and PostgreSQL:

```bash
# Build production-ready frontend
cd client
npm run build

# Start production server
cd ../server
NODE_ENV=production npm start
```

## Contributing

Contributions are welcome! Please feel free to:

- Report bugs and suggest features through issues
- Submit pull requests with improvements
- Help with documentation or testing

## License

MIT

---

*T-DNA Viewer is built to support plant genomics research. If you use this tool in your research, please cite:*

```
Anderson, I.C. (2025). T-DNA Viewer: Interactive web platform for visualizing T-DNA insertion lines in Arabidopsis thaliana. https://github.com/ianandersonlol/tdna-web
```
