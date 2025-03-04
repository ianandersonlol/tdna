#' Plot T-DNA insertion lines in a gene with high-quality genomic visualization
#'
#' Creates a publication-quality visualization of T-DNA insertion locations within
#' a gene structure. The visualization shows exons, introns, UTRs, and marks
#' T-DNA insertion points clearly. The style is similar to genome browsers
#' like Ensembl with a clean, professional appearance.
#'
#' @param gene A character string specifying the Arabidopsis gene ID (e.g. "AT1G25320")
#' @param show_axis Logical indicating whether to display the genomic axis. Default is TRUE.
#' @param show_chromosome_context Logical indicating whether to show chromosome context. Default is TRUE.
#' @param colorblind_friendly Logical indicating whether to use a colorblind-friendly palette. Default is TRUE.
#' @param use_base_r Logical indicating whether to use base R functions if encountering issues. Default is FALSE.
#' @return A Gviz track plot object
#' @examples
#' # Load the data first
#' loadTDNAdata()
#' 
#' # Plot gene with T-DNA insertions
#' plotTDNAlines("AT1G25320")
#' 
#' # Plot a gene without known insertions
#' plotTDNAlines("AT1G20330")
#' # If experiencing issues, try with base R:
#' plotTDNAlines("AT1G25320", use_base_r = TRUE)
#' @import data.table
#' @importFrom GenomicRanges GRanges 
#' @importFrom IRanges IRanges
#' @importFrom grDevices colorRampPalette
#' @importFrom utils install.packages
#' @export
#' @note This function relies on global variables loaded by loadTDNAdata()
#' @importFrom utils globalVariables
# Global variables
utils::globalVariables(c("gff", "location", "pos"))
plotTDNAlines <- function(gene, show_axis = TRUE, show_chromosome_context = TRUE,
                         colorblind_friendly = TRUE, use_base_r = FALSE) {
  # Verify data is loaded
  verify_tdna_data()
  
  # Handle potential data access issues
  tryCatch({
    if (exists("gff", envir = .GlobalEnv)) {
      # Test if we can access the object
      temp <- gff[1,1]
    }
  }, error = function(e) {
    if (grepl("corrupt", e$message)) {
      message("Detected corrupt database, attempting reload...")
      loadTDNAdata(force = TRUE, use_base_r = TRUE)
    }
  })
  
  # Ensure required packages are installed
  required_pkgs <- c("Gviz", "GenomicRanges", "IRanges")
  for (pkg in required_pkgs) {
    if (!requireNamespace(pkg, quietly = TRUE)) {
      if (!requireNamespace("BiocManager", quietly = TRUE)) {
        install.packages("BiocManager")
      }
      BiocManager::install(pkg)
    }
  }
  
  # Convert gene ID to uppercase
  gene <- toupper(gene)
  
  # Get T-DNA lines
  tdna_lines <- tryCatch({
    getTDNAlines(gene)
  }, error = function(e) {
    message("Error retrieving T-DNA lines: ", e$message)
    character(0)
  })
  
  # Get gene features from GFF
  gene_records <- gff[grep(paste0("ID=", gene, ";"), gff$info), ]
  
  if (nrow(gene_records) == 0) {
    message(paste("No gene features found for", gene))
    return(NULL)
  }
  
  message("Creating visualization for ", gene, "...")
  
  # Extract gene information
  # Handle different column naming conventions
  if (!"chr" %in% names(gene_records) && "V1" %in% names(gene_records)) {
    # Using standard GFF column ordering
    gene_chr <- unique(gene_records$V1)[1]
    gene_start <- min(gene_records$V4)
    gene_end <- max(gene_records$V5)
    gene_strand <- unique(gene_records$V7)[1]
  } else {
    # Using named columns
    gene_chr <- unique(gene_records$chr)[1]
    gene_start <- min(gene_records$start)
    gene_end <- max(gene_records$stop)
    gene_strand <- unique(gene_records$strand)[1]
  }
  gene_width <- gene_end - gene_start
  
  # Define padding around gene
  padding <- gene_width * 0.1
  plot_start <- max(1, gene_start - padding)
  plot_end <- gene_end + padding
  
  # Define genomic coordinates for plotting
  chr_name <- gsub("Chr", "", gene_chr)
  
  # Extract exons, UTRs, etc.
  # Check if we're using standard column names or V1, V2, V3, etc.
  if (!"type" %in% names(gene_records) && "V3" %in% names(gene_records)) {
    # Using V3 for type column (standard GFF column ordering)
    exons <- gene_records[gene_records$V3 == "CDS", ]
    five_utr <- gene_records[gene_records$V3 == "five_prime_UTR", ]
    three_utr <- gene_records[gene_records$V3 == "three_prime_UTR", ]
  } else {
    # Using original column naming
    exons <- gene_records[gene_records$type == "CDS", ]
    five_utr <- gene_records[gene_records$type == "five_prime_UTR", ]
    three_utr <- gene_records[gene_records$type == "three_prime_UTR", ]
  }
  
  # Create Gviz tracks
  if (!requireNamespace("Gviz", quietly = TRUE)) {
    stop("Gviz package is required but not available")
  }
  
  # Set color scheme
  if (colorblind_friendly) {
    # Colorblind-friendly palette (Blue, Orange, Teal)
    colors <- c(
      exon = "#2166AC",       # Dark blue
      utr = "#92C5DE",        # Light blue
      intron = "#D1E5F0",     # Very light blue
      insertion = "#D7191C",  # Red for insertions
      chromosome = "#ABDDA4"  # Pale green
    )
  } else {
    # Standard colors
    colors <- c(
      exon = "darkblue",
      utr = "lightblue",
      intron = "grey80",
      insertion = "red",
      chromosome = "darkgreen"
    )
  }
  
  # Create a GRanges object for the whole gene
  gene_range <- GenomicRanges::GRanges(
    seqnames = chr_name,
    ranges = IRanges::IRanges(start = gene_start, end = gene_end),
    strand = gene_strand
  )
  
  # Create exon GRanges
  if (nrow(exons) > 0) {
    # Handle different column naming
    if (!"start" %in% names(exons) && "V4" %in% names(exons)) {
      # Using V4 and V5 for start and stop (standard GFF format)
      exon_ranges <- GenomicRanges::GRanges(
        seqnames = chr_name,
        ranges = IRanges::IRanges(start = exons$V4, end = exons$V5),
        strand = gene_strand
      )
    } else {
      # Using named columns
      exon_ranges <- GenomicRanges::GRanges(
        seqnames = chr_name,
        ranges = IRanges::IRanges(start = exons$start, end = exons$stop),
        strand = gene_strand
      )
    }
  } else {
    exon_ranges <- GenomicRanges::GRanges()
  }
  
  # Create UTR GRanges
  utr_ranges <- GenomicRanges::GRanges()
  
  # Handle five_prime_UTR
  if (nrow(five_utr) > 0) {
    # Handle different column naming
    if (!"start" %in% names(five_utr) && "V4" %in% names(five_utr)) {
      # Using V4 and V5 for start and stop (standard GFF format)
      five_utr_ranges <- GenomicRanges::GRanges(
        seqnames = chr_name,
        ranges = IRanges::IRanges(start = five_utr$V4, end = five_utr$V5),
        strand = gene_strand,
        feature = "5' UTR"
      )
    } else {
      # Using named columns
      five_utr_ranges <- GenomicRanges::GRanges(
        seqnames = chr_name,
        ranges = IRanges::IRanges(start = five_utr$start, end = five_utr$stop),
        strand = gene_strand,
        feature = "5' UTR"
      )
    }
    utr_ranges <- c(utr_ranges, five_utr_ranges)
  }
  
  # Handle three_prime_UTR
  if (nrow(three_utr) > 0) {
    # Handle different column naming
    if (!"start" %in% names(three_utr) && "V4" %in% names(three_utr)) {
      # Using V4 and V5 for start and stop (standard GFF format)
      three_utr_ranges <- GenomicRanges::GRanges(
        seqnames = chr_name,
        ranges = IRanges::IRanges(start = three_utr$V4, end = three_utr$V5),
        strand = gene_strand,
        feature = "3' UTR"
      )
    } else {
      # Using named columns
      three_utr_ranges <- GenomicRanges::GRanges(
        seqnames = chr_name,
        ranges = IRanges::IRanges(start = three_utr$start, end = three_utr$stop),
        strand = gene_strand,
        feature = "3' UTR"
      )
    }
    utr_ranges <- c(utr_ranges, three_utr_ranges)
  }
  
  # Create T-DNA insertion GRanges, if any
  insertion_ranges <- GenomicRanges::GRanges()
  if (length(tdna_lines) > 0) {
    # Get insertion positions
    regex_pattern <- paste0("\\b(", paste(tdna_lines, collapse = "|"), ")\\b")
    matches <- grep(regex_pattern, location$V1)
    
    if (length(matches) > 0) {
      locations <- location[matches]
      locations <- locations[, c("V1", "pos"), with = FALSE]
      locations <- unique(locations)
      
      # Filter for positions in the gene range
      locations <- locations[pos >= gene_start & pos <= gene_end]
      
      # Build GRanges for each insertion
      if (nrow(locations) > 0) {
        insertion_ranges <- GenomicRanges::GRanges(
          seqnames = chr_name,
          ranges = IRanges::IRanges(start = locations$pos, width = 1),
          strand = gene_strand,
          id = locations$V1
        )
      }
    }
  }
  
  # Create Gviz tracks
  # Genome axis track
  gat <- NULL
  if (show_axis) {
    gat <- Gviz::GenomeAxisTrack(
      range = gene_range,
      showTitle = FALSE,
      labelPos = "below"
    )
  }
  
  # Chromosome context track
  ict <- NULL
  if (show_chromosome_context) {
    tryCatch({
      ict <- Gviz::IdeogramTrack(
        genome = "tair10",
        chromosome = chr_name,
        showTitle = FALSE
      )
    }, error = function(e) {
      message("Could not create chromosome context. Using simplified version.")
      ict <- NULL
    })
  }
  
  # Gene region track
  grt <- Gviz::GeneRegionTrack(
    range = c(exon_ranges, utr_ranges),
    genome = "tair10",
    chromosome = chr_name,
    name = gene,
    transcriptAnnotation = "symbol",
    background.title = "transparent",
    col = NA,
    fill = c(rep(colors["exon"], length(exon_ranges)), 
             rep(colors["utr"], length(utr_ranges))),
    shape = c(rep("box", length(exon_ranges)), 
              rep("arrow", length(utr_ranges))),
    showTitle = TRUE
  )
  
  # Annotation track for gene
  gene_atrack <- Gviz::AnnotationTrack(
    range = gene_range,
    genome = "tair10",
    chromosome = chr_name,
    name = "Gene",
    fill = "transparent",
    col = "black",
    shape = "box",
    showTitle = FALSE
  )
  
  # T-DNA insertion track
  if (length(insertion_ranges) > 0) {
    highlight_track <- Gviz::AnnotationTrack(
      range = insertion_ranges,
      genome = "tair10",
      chromosome = chr_name,
      name = "T-DNA Insertions",
      fill = colors["insertion"],
      col = colors["insertion"],
      shape = "box",
      showId = TRUE,
      id = insertion_ranges$id,
      fontcolor.item = "black",
      background.title = colors["insertion"],
      col.title = "white",
      cex.title = 0.8,
      showTitle = TRUE
    )
    
    # Create plot with all tracks
    track_list <- list()
    
    if (!is.null(ict)) {
      track_list <- c(track_list, list(ict))
    }
    
    if (!is.null(gat)) {
      track_list <- c(track_list, list(gat))
    }
    
    track_list <- c(track_list, list(gene_atrack, grt, highlight_track))
    
    plot_title <- paste0(gene, " with T-DNA insertions")
    Gviz::plotTracks(
      track_list,
      from = plot_start,
      to = plot_end,
      showTitle = TRUE,
      main = plot_title,
      cex.main = 1.2,
      background.title = "white"
    )
  } else {
    # Create plot without insertion track
    track_list <- list()
    
    if (!is.null(ict)) {
      track_list <- c(track_list, list(ict))
    }
    
    if (!is.null(gat)) {
      track_list <- c(track_list, list(gat))
    }
    
    track_list <- c(track_list, list(gene_atrack, grt))
    
    plot_title <- paste0(gene, " (No T-DNA insertions found)")
    Gviz::plotTracks(
      track_list,
      from = plot_start,
      to = plot_end,
      showTitle = TRUE,
      main = plot_title,
      cex.main = 1.2,
      background.title = "white"
    )
  }
  
  # Return invisibly
  invisible(list(
    gene = gene,
    chromosome = chr_name,
    start = gene_start,
    end = gene_end,
    strand = gene_strand,
    insertions = if (length(insertion_ranges) > 0) data.frame(
      line = insertion_ranges$id,
      position = as.numeric(GenomicRanges::start(insertion_ranges))
    ) else NULL
  ))
}

#' Legacy version of the plotting function 
#'
#' @param gene A character string specifying the Arabidopsis gene ID
#' @param show_introns Whether to show introns
#' @param show_all_features Whether to show all features
#' @param interactive Whether to create an interactive plot
#' @keywords internal
plotTDNAlines_old <- function(gene, show_introns = TRUE, show_all_features = FALSE, interactive = TRUE) {
  .Deprecated("plotTDNAlines")
  plotTDNAlines(gene)
}