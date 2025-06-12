# tdna

`tdna` provides a small set of helper functions for working with the
public Arabidopsis T-DNA insertion databases. The package ships with a
subset of the annotation tables so that you can quickly look up and
visualise confirmed insertions in genes of interest.

## Installation

```r
library(devtools)
install_github("greymonroe/tdna", dependencies = TRUE)
library(tdna)
```

## Loading the data

The packaged annotation tables are not loaded automatically. Run
`loadTDNAdata()` once per session to read them into an internal
environment:

```r
loadTDNAdata()
```

## Querying insertions

Use `getTDNAlines()` to obtain the identifiers of confirmed homozygous
T-DNA lines that fall within the coding sequence of a gene.

```r
getTDNAlines("AT1G25320")
```

If no insertions are known the function returns an empty character
vector.

## Plotting

`plotTDNAlines()` creates a basic diagram of the gene's coding sequence
and labels any confirmed insertions:

```r
plotTDNAlines("AT1G25320")
```
