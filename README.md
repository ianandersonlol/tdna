# tdna

An R package for visualizing and analyzing T-DNA insertion lines in Arabidopsis thaliana genes.

## Overview

The `tdna` package provides tools to:

1. Quickly identify T-DNA insertion lines available for a specific gene
2. Visualize gene structure with T-DNA insertion sites in a publication-quality format
3. Generate Ensembl/UCSC-style genomic visualizations with detailed gene features

## Installation

```r
# Install from GitHub
if (!requireNamespace("devtools", quietly = TRUE))
  install.packages("devtools")
devtools::install_github("ianandersonlol/tdna")

library(tdna)
```

## Usage

### Load the data

First, load the necessary T-DNA datasets:

```r
loadTDNAdata()
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
```

### Example of gene without available T-DNA lines

```r
# Check if T-DNA lines exist
getTDNAlines("AT1G20330")

# Visualization also shows when no T-DNA lines are available
plotTDNAlines("AT1G20330")
```

## Visualization Features

The new Gviz-based visualization provides:

- Publication-quality gene model visualization similar to genome browsers
- Proper representation of introns, exons, UTRs, and gene structure
- Clear indication of T-DNA insertion sites with line IDs
- Chromosome context and genomic coordinates
- Colorblind-friendly color scheme by default
- Interactive tooltips when viewing in R (hover over features for details)

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

## License

MIT