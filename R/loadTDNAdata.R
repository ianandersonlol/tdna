#' Load T-DNA insertion data for Arabidopsis thaliana
#'
#' This function loads the necessary datasets for T-DNA insertion analysis:
#' 1. Gene annotations from Araport11 (GFF format)
#' 2. Confirmed T-DNA insertions
#' 3. T-DNA insertion locations
#'
#' The loaded data is stored in environment variables for use by other functions.
#' 
#' @return Invisibly returns TRUE if data was loaded successfully
#' @examples
#' loadTDNAdata()
#' @import data.table
#' @export
loadTDNAdata <- function() {
  # Check for required packages
  if (!requireNamespace("R.utils", quietly = TRUE)) {
    stop("The R.utils package is required to read gzipped files. Please install it with: install.packages('R.utils')")
  }
  
  # Load gene annotations
  gff_file <- system.file("extdata", "Araport11_GFF3_genes_transposons.201606.gff.gz", package = "tdna")
  if (!file.exists(gff_file)) {
    stop("GFF annotation file not found. Please reinstall the package.")
  }
  
  gff <<- fread(gff_file)
  colnames(gff) <<- c("chr", "source", "type", "start", "stop", "blank", "strand", "blank2", "info")
  
  # Load confirmed T-DNA insertions
  confirmed_file <- system.file("extdata", "sum_SALK_confirmed.txt.gz", package = "tdna")
  if (!file.exists(confirmed_file)) {
    stop("Confirmed T-DNA file not found. Please reinstall the package.")
  }
  
  confirmed <<- fread(confirmed_file)
  
  # Filter for homozygous exon insertions that were sent to stock center
  confirmed__exon_hom_sent <<- confirmed[`Hit region` == "Exon" & 
                                         HM %in% c("HMc", "HMn") & 
                                         ABRC != "NotSent"]
  confirmed__exon_hom_sent$`Target Gene` <<- toupper(confirmed__exon_hom_sent$`Target Gene`)
  
  # Load T-DNA insertion locations
  location_file <- system.file("extdata", "T-DNAall.Genes.Araport11.txt.gz", package = "tdna")
  if (!file.exists(location_file)) {
    stop("T-DNA location file not found. Please reinstall the package.")
  }
  
  location <<- fread(location_file, header = FALSE)
  
  # Extract position information
  location$pos <<- as.numeric(sapply(
    location$V5, 
    function(x) {
      tryCatch({
        unlist(strsplit(unlist(strsplit(as.character(x), " vs "))[1], "-"))[1]
      }, error = function(e) {
        NA
      })
    }
  ))
  
  # Also load sequence data if available for additional visualization
  seq_file <- system.file("extdata", "T-DNASeq.Genes.Araport11.txt.gz", package = "tdna")
  if (file.exists(seq_file)) {
    sequence_data <<- fread(seq_file, header = FALSE)
  }
  
  message("T-DNA datasets loaded successfully")
  invisible(TRUE)
}
