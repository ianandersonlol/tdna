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
#' @importFrom stats start
#' @export
#' @note This function relies on global variables loaded by loadTDNAdata()
#' 
#' @importFrom utils globalVariables
# Global variables
utils::globalVariables(c("confirmed__exon_hom_sent", "Target Gene", "gff", "type", "V3", "location", "pos"))
getTDNAlines <- function(gene, region = c("CDS", "five_prime_UTR", "three_prime_UTR")) {
  verify_tdna_data()
  
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
  if ("info" %in% names(gff)) {
    # Using named columns
    genegff <- gff[grep(paste0("ID=", gene), gff$info, ignore.case = TRUE), ]
  } else if ("V9" %in% names(gff)) {
    # Using V9 for info column (standard GFF format)
    genegff <- gff[grep(paste0("ID=", gene), gff$V9, ignore.case = TRUE), ]
  } else {
    # If neither format is found
    warning("GFF data format not recognized")
    return(character(0))
  }
  
  # Ensure type column is available (it may be named differently in some data.frame types)
  if (!"type" %in% names(genegff) && "V3" %in% names(genegff)) {
    # If 'type' column doesn't exist but we have V3 (standard GFF column ordering)
    genegff <- genegff[genegff$V3 %in% region]
  } else {
    # Proceed with original column naming
    genegff <- genegff[genegff$type %in% region]
  }
  
  # No gene features found
  if (nrow(genegff) == 0) {
    warning(paste("No gene features found for", gene))
    return(character(0))
  }
  
  # Extract CDS positions
  if (!"type" %in% names(genegff) && "V3" %in% names(genegff)) {
    # Using V3 column for type
    cds <- genegff[genegff$V3 == "CDS"]
  } else {
    # Using original column naming
    cds <- genegff[genegff$type == "CDS"]
  }
  
  # Handle case with no CDS regions
  if (nrow(cds) == 0) {
    warning(paste("No CDS features found for", gene))
    return(character(0))
  }
  
  # Create a safer way to get positions
  safe_get_pos <- function(start_col, end_col, row_idx) {
    tryCatch({
      start_val <- as.integer(cds[row_idx, start_col])
      end_val <- as.integer(cds[row_idx, end_col])
      
      # Check for NA or non-numeric values
      if (is.na(start_val) || is.na(end_val) || 
          !is.numeric(start_val) || !is.numeric(end_val)) {
        return(integer(0))
      }
      
      # Generate sequence
      start_val:end_val
    }, error = function(e) {
      # If any error occurs, return empty vector
      integer(0)
    })
  }
  
  # Generate positions more efficiently
  all_positions <- list()
  for (i in 1:nrow(cds)) {
    pos <- integer(0)
    
    # Try different column naming conventions
    if ("V4" %in% names(cds) && "V5" %in% names(cds)) {
      pos <- safe_get_pos("V4", "V5", i)
    } else if ("start" %in% names(cds) && "stop" %in% names(cds)) {
      pos <- safe_get_pos("start", "stop", i)
    }
    
    if (length(pos) > 0) {
      all_positions[[i]] <- pos
    }
  }
  
  # Combine all positions
  cdspos <- unlist(all_positions)
  
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