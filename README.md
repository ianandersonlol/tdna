# tdna

An R package for visualizing and analyzing T-DNA insertion lines in Arabidopsis thaliana genes.

## Overview

The `tdna` package provides tools to:

1. Quickly identify T-DNA insertion lines available for a specific gene
2. Visualize gene structure with T-DNA insertion sites
3. Interactively explore gene features and T-DNA insertions with detailed information

## Installation

```r
# Install required dependencies
required_packages <- c("devtools", "data.table", "ggplot2", "ggrepel", "plotly", "scales", "R.utils")
new_packages <- required_packages[!required_packages %in% installed.packages()[,"Package"]]
if(length(new_packages)) install.packages(new_packages)

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
# Create an interactive visualization of T-DNA insertions within gene structure
plotTDNAlines("AT1G25320")

# Create a static visualization
plotTDNAlines("AT1G25320", interactive = FALSE)

# Show all genomic features including introns
plotTDNAlines("AT1G25320", show_all_features = TRUE)

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

## Interactive Features

The interactive visualization (powered by plotly) provides:

- Hover tooltips with detailed information about gene features
- Information about T-DNA insertion lines including homozygosity status
- Ability to zoom, pan, and export the visualization
- Clear indication of gene structure with exons, UTRs, and direction

## Troubleshooting

If you encounter issues:

```r
# Fix data loading problems
loadTDNAdata(force = TRUE, use_base_r = TRUE)

# Create static visualization if plotly fails
plotTDNAlines("AT1G25320", interactive = FALSE)

# For memory issues with large genes
plotTDNAlines("AT1G25320", show_introns = FALSE)
```

## Data Sources

This package includes the following data:

- Arabidopsis thaliana genome annotation (Araport11)
- Confirmed T-DNA insertion lines from the SIGnAL collection
- T-DNA insertion locations mapped to the Arabidopsis genome

## Citation

If you use this package in your research, please cite:

```
Grey -- What should we put for the citation? this github?
```

## License

MIT