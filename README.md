# tdna

A toolkit for visualizing and analyzing T-DNA insertion lines in Arabidopsis thaliana genes, available both as an R package and a modern web application.

## Overview

The `tdna` package provides tools to:

1. Quickly identify T-DNA insertion lines available for a specific gene
2. Visualize gene structure with T-DNA insertion sites in a publication-quality format
3. Generate Ensembl/UCSC-style genomic visualizations with detailed gene features

## Installation

```r
# Install required dependencies
required_packages <- c("devtools", "data.table", "R.utils")
new_packages <- required_packages[!required_packages %in% installed.packages()[,"Package"]]
if(length(new_packages)) install.packages(new_packages)

# Install BioConductor dependencies
if (!requireNamespace("BiocManager", quietly = TRUE)) install.packages("BiocManager")
bioc_packages <- c("GenomicRanges", "IRanges", "Gviz")
BiocManager::install(bioc_packages)

# Install tdna from GitHub
devtools::install_github("ianandersonlol/tdna")

# Load the package
library(tdna)
```

## Usage

### Load the data

First, load the necessary T-DNA datasets:

```r
# Standard data loading
loadTDNAdata()

# If experiencing data loading issues, use base R methods
loadTDNAdata(force = TRUE, use_base_r = TRUE)
```

### Find T-DNA insertion lines for a gene

```r
# Get T-DNA lines for a gene with known insertions
lines <- getTDNAlines("AT1G25320")
lines
```

### Visualize T-DNA insertion sites in gene context

```r
# Create a publication-quality visualization of T-DNA insertions within gene structure
plotTDNAlines("AT1G25320")

# Show chromosome context
plotTDNAlines("AT1G25320", show_chromosome_context = TRUE)

# Customize with a standard color scheme
plotTDNAlines("AT1G25320", colorblind_friendly = FALSE)

# If experiencing issues with visualization
plotTDNAlines("AT1G25320", use_base_r = TRUE)
```

### Example of gene without available T-DNA lines

```r
# Check if T-DNA lines exist
getTDNAlines("AT1G20330")

# Visualization also shows when no T-DNA lines are available
plotTDNAlines("AT1G20330")
```

## Visualization Features

The Gviz-based visualization provides:

- Publication-quality gene model visualization similar to genome browsers
- Proper representation of introns, exons, UTRs, and gene structure
- Clear indication of T-DNA insertion sites with line IDs
- Chromosome context and genomic coordinates
- Colorblind-friendly color scheme by default
- Interactive tooltips when viewing in R (hover over features for details)

## Troubleshooting

If you encounter a "lazy-load database is corrupt" error:

```r
# Fix database corruption by reinstalling the package
fixTDNAcorruption()

# After fixing, reload the data and continue
loadTDNAdata()
```

For other issues:

```r
# Use base R methods instead of data.table
loadTDNAdata(force = TRUE, use_base_r = TRUE)
```

## Data Sources

This package includes the following data:

- Arabidopsis thaliana genome annotation (Araport11)
- Confirmed T-DNA insertion lines from the SIGnAL collection
- T-DNA insertion locations mapped to the Arabidopsis genome

## Citation

If you use this package in your research, please cite:

```
Anderson, I.C., Monroe, G.R. (2023). tdna: Tools for Visualizing and Analyzing T-DNA Insertion Lines in Arabidopsis. https://github.com/ianandersonlol/tdna
```

## Web Application

A modern web-based implementation is now available for those who prefer not to use R. The web application provides an interactive genome browser with improved visualization capabilities.

### Features

- Interactive gene visualization using IGV.js genome browser
- User-friendly search interface
- Detailed T-DNA line information with export options
- Responsive design for desktop and mobile access

### Getting Started

See the [web application documentation](web/README.md) for installation and usage instructions.

## License

MIT