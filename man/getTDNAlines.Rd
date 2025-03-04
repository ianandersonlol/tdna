% Generated by roxygen2: do not edit by hand
% Please edit documentation in R/getTDNAlines.R
\name{getTDNAlines}
\alias{getTDNAlines}
\title{Return T-DNA lines found in a gene of interest}
\usage{
getTDNAlines(gene, region = c("CDS", "five_prime_UTR", "three_prime_UTR"))
}
\arguments{
\item{gene}{A character string specifying the Arabidopsis gene ID (e.g. "AT1G25320")}

\item{region}{Character vector specifying which regions to include. Default is c("CDS", "five_prime_UTR", "three_prime_UTR")}
}
\value{
A character vector of T-DNA line identifiers
}
\description{
This function identifies T-DNA insertion lines that disrupt a given gene,
focusing on confirmed homozygous insertions in coding sequences.
}
\examples{
# Load the data
loadTDNAdata()
# Get T-DNA lines for a gene with known insertions
getTDNAlines("AT1G25320")
# Get T-DNA lines for a gene without known insertions
getTDNAlines("AT1G20330")
}
