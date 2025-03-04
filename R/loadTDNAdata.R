#' Load T-DNA insertion data for Arabidopsis thaliana
#'
#' This function loads the necessary datasets for T-DNA insertion analysis:
#' 1. Gene annotations from Araport11 (GFF format)
#' 2. Confirmed T-DNA insertions
#' 3. T-DNA insertion locations
#'
#' The loaded data is stored in environment variables for use by other functions.
#' 
#' @param force Logical. If TRUE, forces reload of data even if already loaded. Default is FALSE.
#' @param use_base_r Logical. If TRUE, uses base R functions for reading files instead of data.table. Default is FALSE.
#' @return Invisibly returns TRUE if data was loaded successfully
#' @examples
#' loadTDNAdata()
#' # If experiencing issues with data loading:
#' loadTDNAdata(force = TRUE, use_base_r = TRUE)
#' @import data.table
#' @export
loadTDNAdata <- function(force = FALSE, use_base_r = FALSE) {
  # Check if data is already loaded and force is not set
  if (!force && exists("gff", envir = .GlobalEnv) && 
      exists("confirmed", envir = .GlobalEnv) && 
      exists("location", envir = .GlobalEnv)) {
    message("Data already loaded. Use force=TRUE to reload.")
    return(invisible(TRUE))
  }
  
  # Check for required packages when using data.table
  if (!use_base_r && !requireNamespace("data.table", quietly = TRUE)) {
    warning("The data.table package is required for optimal performance. Falling back to base R.")
    use_base_r <- TRUE
  }
  
  # Check for required packages when using gzipped files
  if (!requireNamespace("R.utils", quietly = TRUE)) {
    message("The R.utils package is required to read gzipped files directly.")
    message("Installing R.utils package...")
    tryCatch({
      install.packages("R.utils", repos = "https://cran.rstudio.com/")
      message("R.utils installed successfully.")
    }, error = function(e) {
      stop("Failed to install R.utils. Please install it manually with: install.packages('R.utils')")
    })
  }
  
  # Safe reading function that handles errors
  safe_read <- function(file_path, header = TRUE, is_gff = FALSE) {
    if (!file.exists(file_path)) {
      stop("File not found: ", file_path, ". Please reinstall the package.")
    }
    
    # Try using data.table first if not use_base_r
    if (!use_base_r) {
      tryCatch({
        result <- data.table::fread(file_path, header = header)
        return(result)
      }, error = function(e) {
        message("Error reading with data.table: ", e$message)
        message("Falling back to base R for file reading...")
        use_base_r <<- TRUE
      })
    }
    
    # If use_base_r or data.table failed, use base R
    if (use_base_r) {
      # First uncompress the file to a temporary location
      temp_file <- tempfile()
      tryCatch({
        R.utils::gunzip(file_path, destname = temp_file, remove = FALSE, overwrite = TRUE)
        
        # Read the uncompressed file
        if (is_gff) {
          # GFF has specific format requiring special handling
          result <- read.delim(temp_file, header = FALSE, stringsAsFactors = FALSE,
                              col.names = c("chr", "source", "type", "start", "stop", 
                                          "blank", "strand", "blank2", "info"))
        } else {
          result <- read.delim(temp_file, header = header, stringsAsFactors = FALSE)
        }
        
        # Convert to data.table if available for consistency
        if (requireNamespace("data.table", quietly = TRUE)) {
          result <- data.table::as.data.table(result)
        }
        
        # Clean up
        unlink(temp_file)
        return(result)
        
      }, error = function(e) {
        if (file.exists(temp_file)) unlink(temp_file)
        stop("Error reading file: ", e$message)
      })
    }
  }
  
  # Load gene annotations
  tryCatch({
    message("Loading gene annotations...")
    gff_file <- system.file("extdata", "Araport11_GFF3_genes_transposons.201606.gff.gz", package = "tdna")
    gff <<- safe_read(gff_file, header = FALSE, is_gff = TRUE)
    
    if (!use_base_r) {
      colnames(gff) <<- c("chr", "source", "type", "start", "stop", "blank", "strand", "blank2", "info")
    }
    
    message("Gene annotations loaded successfully.")
  }, error = function(e) {
    stop("Failed to load gene annotations: ", e$message)
  })
  
  # Load confirmed T-DNA insertions
  tryCatch({
    message("Loading confirmed T-DNA insertions...")
    confirmed_file <- system.file("extdata", "sum_SALK_confirmed.txt.gz", package = "tdna")
    confirmed <<- safe_read(confirmed_file)
    
    # Filter for homozygous exon insertions that were sent to stock center
    confirmed__exon_hom_sent <<- confirmed[confirmed$`Hit region` == "Exon" & 
                                           confirmed$HM %in% c("HMc", "HMn") & 
                                           confirmed$ABRC != "NotSent", ]
    
    confirmed__exon_hom_sent$`Target Gene` <<- toupper(confirmed__exon_hom_sent$`Target Gene`)
    message("Confirmed T-DNA insertions loaded successfully.")
  }, error = function(e) {
    stop("Failed to load confirmed T-DNA insertions: ", e$message)
  })
  
  # Load T-DNA insertion locations
  tryCatch({
    message("Loading T-DNA insertion locations...")
    location_file <- system.file("extdata", "T-DNAall.Genes.Araport11.txt.gz", package = "tdna")
    location <<- safe_read(location_file, header = FALSE)
    
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
    message("T-DNA insertion locations loaded successfully.")
  }, error = function(e) {
    stop("Failed to load T-DNA insertion locations: ", e$message)
  })
  
  # Also load sequence data if available for additional visualization
  tryCatch({
    seq_file <- system.file("extdata", "T-DNASeq.Genes.Araport11.txt.gz", package = "tdna")
    if (file.exists(seq_file)) {
      message("Loading T-DNA sequence data...")
      sequence_data <<- safe_read(seq_file, header = FALSE)
      message("T-DNA sequence data loaded successfully.")
    }
  }, error = function(e) {
    warning("Failed to load T-DNA sequence data: ", e$message)
  })
  
  message("All T-DNA datasets loaded successfully")
  invisible(TRUE)
}

#' Check if T-DNA data is properly loaded and reload if necessary
#'
#' This helper function verifies that all required data is loaded 
#' and in a valid state, reloading if necessary.
#'
#' @return Invisibly returns TRUE if data is valid
#' @keywords internal
verify_tdna_data <- function() {
  # Define required objects
  required <- c("gff", "confirmed", "confirmed__exon_hom_sent", "location")
  
  # Check if all required objects exist
  missing <- !sapply(required, exists, envir = .GlobalEnv)
  
  if (any(missing)) {
    message("Some required data is missing. Reloading...")
    loadTDNAdata(force = TRUE)
    return(invisible(TRUE))
  }
  
  # Check if data objects are valid
  valid <- TRUE
  
  tryCatch({
    # Basic validation of data structures
    if (!"data.frame" %in% class(gff) || nrow(gff) < 10) valid <- FALSE
    if (!"data.frame" %in% class(confirmed) || nrow(confirmed) < 10) valid <- FALSE
    if (!"data.frame" %in% class(location) || nrow(location) < 10) valid <- FALSE
  }, error = function(e) {
    valid <- FALSE
  })
  
  if (!valid) {
    message("Data appears to be corrupt. Reloading with base R...")
    loadTDNAdata(force = TRUE, use_base_r = TRUE)
  }
  
  invisible(TRUE)
}