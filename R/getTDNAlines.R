#' Return T-DNA lines found in a gene of interest
#'
#' This function identifies T-DNA insertion lines that disrupt a given gene,
#' focusing on confirmed homozygous insertions in coding sequences.
#'
#' @param gene A character string specifying the Arabidopsis gene ID (e.g. "AT1G25320")
#' @param region Character vector specifying which regions to include. Default is c("CDS", "five_prime_UTR", "three_prime_UTR")
#' @return A character vector of T-DNA line identifiers
#' @examples
#' # Load the data
#' loadTDNAdata()
#' # Get T-DNA lines for a gene with known insertions
#' getTDNAlines("AT1G25320")
#' # Get T-DNA lines for a gene without known insertions
#' getTDNAlines("AT1G20330")
#' @import data.table
#' @export
getTDNAlines <- function(gene, region = c("CDS", "five_prime_UTR", "three_prime_UTR")) {
  # Check if data is loaded
  if (!exists("confirmed__exon_hom_sent", envir = .GlobalEnv)) {
    stop("T-DNA data not loaded. Please run loadTDNAdata() first.")
  }
  
  # Validate input
  if (!is.character(gene) || length(gene) != 1) {
    stop("Gene ID must be a single character string (e.g. \"AT1G25320\")")
  }
  
  # Convert gene ID to uppercase for consistency
  gene <- toupper(gene)
  
  # Find confirmed T-DNA insertions for this gene
  geneconfirmed <- confirmed__exon_hom_sent[`Target Gene` == gene]
  lines <- unique(as.character(geneconfirmed$`T-DNA line`))
  
  # Return empty vector if no lines found
  if (length(lines) == 0) {
    return(character(0))
  }
  
  # Get gene features from GFF
  genegff <- gff[grep(paste0("ID=", gene), gff$info)]
  
  # Filter for regions of interest
  genegff <- genegff[type %in% region]
  
  # No gene features found
  if (nrow(genegff) == 0) {
    warning(paste("No gene features found for", gene))
    return(character(0))
  }
  
  # Extract CDS positions
  cds <- genegff[type == "CDS"]
  
  # Handle case with no CDS regions
  if (nrow(cds) == 0) {
    warning(paste("No CDS features found for", gene))
    return(character(0))
  }
  
  # Generate positions more efficiently
  cdspos <- unlist(
    lapply(1:nrow(cds), function(i) {
      cds[i, start]:cds[i, stop]
    })
  )
  
  # Find matches in location data
  # Pattern matching with efficient regex
  regex_pattern <- paste0("\\b(", paste(lines, collapse = "|"), ")\\b")
  matches <- grep(regex_pattern, location$V1)
  
  # If no matches in location data
  if (length(matches) == 0) {
    return(character(0))
  }
  
  # Extract and filter locations
  locations <- location[matches]
  locations <- locations[, c("V1", "pos"), with = FALSE]
  locations <- unique(locations)
  
  # Filter for positions that overlap with CDS
  locations <- locations[pos %in% cdspos]
  
  # Return T-DNA line identifiers
  return(locations$V1)
}

