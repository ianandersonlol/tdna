#' Load T-DNA insertion data for Arabidopsis thaliana
#'
#' This function loads the necessary datasets for T-DNA insertion analysis:
#' 1. Gene annotations from Araport11 (GFF format)
#' 2. Confirmed T-DNA insertions
#' 3. T-DNA insertion locations
#'
#' @param force Logical. If TRUE, forces reload of data even if already loaded. Default is FALSE.
#' @param use_base_r Logical. If TRUE, uses base R functions instead of data.table. Default is FALSE.
#' @return Invisibly returns TRUE if data was loaded successfully
#' @examples
#' loadTDNAdata()
#' @import data.table
#' @importFrom utils install.packages read.delim remove.packages
#' @export
#' @importFrom utils globalVariables
# Global variables
utils::globalVariables(c("confirmed", "gff", "location"))
loadTDNAdata <- function(force = FALSE, use_base_r = FALSE) {
  # Handle existing data
  if (!force && exists("gff", envir = .GlobalEnv) && 
      exists("confirmed", envir = .GlobalEnv) && 
      exists("location", envir = .GlobalEnv)) {
    message("Data already loaded. Use force=TRUE to reload.")
    return(invisible(TRUE))
  }
  
  # Check for required packages
  if (!use_base_r && !requireNamespace("data.table", quietly = TRUE)) {
    warning("data.table not found. Falling back to base R.")
    use_base_r <- TRUE
  }
  
  if (!requireNamespace("R.utils", quietly = TRUE)) {
    message("Installing R.utils package...")
    install.packages("R.utils", repos = "https://cran.rstudio.com/")
  }
  
  # Check Bioconductor packages
  if (!requireNamespace("BiocManager", quietly = TRUE)) {
    message("Installing BiocManager for Bioconductor packages...")
    install.packages("BiocManager", repos = "https://cran.rstudio.com/")
  }
  
  required_bioc <- c("GenomicRanges", "IRanges", "GenomicFeatures", "rtracklayer", "Gviz")
  missing_bioc <- required_bioc[!sapply(required_bioc, requireNamespace, quietly = TRUE)]
  
  if (length(missing_bioc) > 0) {
    message("Installing required Bioconductor packages: ", paste(missing_bioc, collapse = ", "))
    BiocManager::install(missing_bioc)
  }
  
  message("Loading T-DNA datasets. This may take a moment...")
  
  # Helper function to read files safely
  safe_read <- function(file_path, header = TRUE, is_gff = FALSE) {
    if (!file.exists(file_path)) {
      stop("File not found: ", file_path)
    }
    
    if (!use_base_r) {
      tryCatch({
        return(data.table::fread(file_path, header = header))
      }, error = function(e) {
        message("Falling back to base R...")
        use_base_r <<- TRUE
      })
    }
    
    if (use_base_r) {
      temp_file <- tempfile()
      tryCatch({
        R.utils::gunzip(file_path, destname = temp_file, remove = FALSE)
        
        if (is_gff) {
          result <- read.delim(temp_file, header = FALSE, 
                               col.names = c("chr", "source", "type", "start", "stop", 
                                            "blank", "strand", "blank2", "info"))
        } else {
          result <- read.delim(temp_file, header = header)
        }
        
        if (requireNamespace("data.table", quietly = TRUE)) {
          result <- data.table::as.data.table(result)
        }
        
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
    gff_data <- safe_read(gff_file, header = FALSE, is_gff = TRUE)
    
    # Assign to global environment
    assign("gff", gff_data, envir = .GlobalEnv)
    
    if (!use_base_r) {
      colnames(gff) <- c("chr", "source", "type", "start", "stop", "blank", "strand", "blank2", "info")
    }
  }, error = function(e) {
    stop("Failed to load gene annotations: ", e$message)
  })
  
  # Load confirmed T-DNA insertions
  tryCatch({
    message("Loading confirmed T-DNA insertions...")
    confirmed_file <- system.file("extdata", "sum_SALK_confirmed.txt.gz", package = "tdna")
    confirmed_data <- safe_read(confirmed_file)
    
    # Assign to global environment
    assign("confirmed", confirmed_data, envir = .GlobalEnv)
    
    # Filter for homozygous exon insertions that were sent to stock center
    confirmed_exon <- confirmed[confirmed$`Hit region` == "Exon" & 
                               confirmed$HM %in% c("HMc", "HMn") & 
                               confirmed$ABRC != "NotSent", ]
    
    confirmed_exon$`Target Gene` <- toupper(confirmed_exon$`Target Gene`)
    
    # Assign to global environment
    assign("confirmed__exon_hom_sent", confirmed_exon, envir = .GlobalEnv)
  }, error = function(e) {
    stop("Failed to load T-DNA insertions: ", e$message)
  })
  
  # Load T-DNA insertion locations
  tryCatch({
    message("Loading T-DNA insertion locations...")
    location_file <- system.file("extdata", "T-DNAall.Genes.Araport11.txt.gz", package = "tdna")
    location_data <- safe_read(location_file, header = FALSE)
    
    # Assign to global environment
    assign("location", location_data, envir = .GlobalEnv)
    
    # Extract position information
    location$pos <- as.numeric(sapply(
      location$V5, 
      function(x) {
        tryCatch({
          unlist(strsplit(unlist(strsplit(as.character(x), " vs "))[1], "-"))[1]
        }, error = function(e) {
          NA
        })
      }
    ))
  }, error = function(e) {
    stop("Failed to load T-DNA locations: ", e$message)
  })
  
  # Also load sequence data if available
  tryCatch({
    seq_file <- system.file("extdata", "T-DNASeq.Genes.Araport11.txt.gz", package = "tdna")
    if (file.exists(seq_file)) {
      message("Loading T-DNA sequence data...")
      seq_data <- safe_read(seq_file, header = FALSE)
      assign("sequence_data", seq_data, envir = .GlobalEnv)
    }
  }, error = function(e) {
    warning("Failed to load T-DNA sequence data")
  })
  
  # Create a GRanges object for gene features (for visualization)
  tryCatch({
    if (requireNamespace("GenomicRanges", quietly = TRUE) && 
        requireNamespace("IRanges", quietly = TRUE)) {
      message("Creating genomic ranges for visualization...")
      
      # Create genomic ranges for genes
      gene_features <- lapply(unique(gff$type), function(feature_type) {
        features <- gff[gff$type == feature_type, ]
        if(nrow(features) > 0) {
          gr <- GenomicRanges::GRanges(
            seqnames = features$chr,
            ranges = IRanges::IRanges(start = features$start, end = features$stop),
            strand = features$strand,
            type = feature_type,
            info = features$info
          )
          return(gr)
        } else {
          return(NULL)
        }
      })
      gene_features <- do.call(c, gene_features[!sapply(gene_features, is.null)])
      assign("gene_features_gr", gene_features, envir = .GlobalEnv)
    }
  }, error = function(e) {
    warning("Could not create genomic ranges: ", e$message)
  })
  
  message("T-DNA datasets loaded successfully")
  invisible(TRUE)
}

#' Check if T-DNA data is valid and reload if necessary
#' @keywords internal
verify_tdna_data <- function() {
  required <- c("gff", "confirmed", "confirmed__exon_hom_sent", "location")
  missing <- !sapply(required, exists, envir = .GlobalEnv)
  
  if (any(missing)) {
    loadTDNAdata(force = TRUE)
    return(invisible(TRUE))
  }
  
  # Test objects for corruption
  corrupt <- FALSE
  tryCatch({
    if (exists("gff", envir = .GlobalEnv)) temp <- gff[1,1]
    if (exists("confirmed", envir = .GlobalEnv)) temp <- confirmed[1,1]
    if (exists("location", envir = .GlobalEnv)) temp <- location[1,1]
  }, error = function(e) {
    corrupt <- TRUE
  })
  
  if (corrupt) {
    message("Found corrupted data. Reloading...")
    loadTDNAdata(force = TRUE, use_base_r = TRUE)
  }
  
  invisible(TRUE)
}

#' Fix package corruption issues
#'
#' This function reinstalls the package to fix corruption issues.
#'
#' @param repo Repository path for reinstallation. Default: "ianandersonlol/tdna".
#' @return TRUE if successful
#' @export
fixTDNAcorruption <- function(repo = "ianandersonlol/tdna") {
  if (!requireNamespace("devtools", quietly = TRUE)) {
    message("Installing devtools package...")
    install.packages("devtools")
  }
  
  # Try to unload the package
  tryCatch({
    detach("package:tdna", unload = TRUE)
  }, error = function(e) {
    # Package wasn't loaded, that's fine
  })
  
  # Remove the package
  message("Removing corrupt package installation...")
  remove.packages("tdna")
  
  # Reinstall from source
  message("Reinstalling tdna package from source...")
  devtools::install_github(repo, force = TRUE)
  
  # Load the package
  message("Loading newly installed package...")
  library(tdna)
  
  message("Package reinstalled. Please run loadTDNAdata() to load the data.")
  invisible(TRUE)
}