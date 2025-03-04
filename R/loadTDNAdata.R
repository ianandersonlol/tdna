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
#' # If experiencing issues with data loading:
#' loadTDNAdata(force = TRUE, use_base_r = TRUE)
#' @import data.table
#' @export
loadTDNAdata <- function(force = FALSE, use_base_r = FALSE) {
  # Handle lazy loading corruption
  tryCatch({
    if (exists("gff", envir = .GlobalEnv)) {
      # Test if we can access the object
      temp <- gff[1,1]
    }
    if (exists("confirmed", envir = .GlobalEnv)) {
      temp <- confirmed[1,1]
    }
    if (exists("location", envir = .GlobalEnv)) {
      temp <- location[1,1]
    }
  }, error = function(e) {
    # If there's an error accessing existing objects, force reload
    if (grepl("corrupt", e$message)) {
      message("Detected corrupt database, forcing reload")
      force <- TRUE
      
      # Clean up corrupted objects
      if (exists("gff", envir = .GlobalEnv)) rm(gff, envir = .GlobalEnv)
      if (exists("confirmed", envir = .GlobalEnv)) rm(confirmed, envir = .GlobalEnv)
      if (exists("confirmed__exon_hom_sent", envir = .GlobalEnv)) rm(confirmed__exon_hom_sent, envir = .GlobalEnv)
      if (exists("location", envir = .GlobalEnv)) rm(location, envir = .GlobalEnv)
      if (exists("sequence_data", envir = .GlobalEnv)) rm(sequence_data, envir = .GlobalEnv)
    }
  })
  
  if (!force && exists("gff", envir = .GlobalEnv) && 
      exists("confirmed", envir = .GlobalEnv) && 
      exists("location", envir = .GlobalEnv)) {
    message("Data already loaded. Use force=TRUE to reload.")
    return(invisible(TRUE))
  }
  
  if (!use_base_r && !requireNamespace("data.table", quietly = TRUE)) {
    warning("data.table not found. Falling back to base R.")
    use_base_r <- TRUE
  }
  
  if (!requireNamespace("R.utils", quietly = TRUE)) {
    message("Installing R.utils package...")
    install.packages("R.utils", repos = "https://cran.rstudio.com/")
  }
  
  message("Loading T-DNA datasets. This may take a moment...")
  
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
  
  valid <- TRUE
  tryCatch({
    if (!"data.frame" %in% class(gff) || nrow(gff) < 10) valid <- FALSE
    if (!"data.frame" %in% class(confirmed) || nrow(confirmed) < 10) valid <- FALSE
    if (!"data.frame" %in% class(location) || nrow(location) < 10) valid <- FALSE
  }, error = function(e) {
    valid <- FALSE
  })
  
  if (!valid) {
    loadTDNAdata(force = TRUE, use_base_r = TRUE)
  }
  
  invisible(TRUE)
}