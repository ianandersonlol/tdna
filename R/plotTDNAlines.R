#' Plot T-DNA insertion lines in a gene with interactive visualization
#'
#' Creates an interactive visualization of T-DNA insertion locations within
#' a gene structure. The plot shows coding sequences (CDS), UTRs, and marks
#' T-DNA insertion points with information available on hover.
#'
#' @param gene A character string specifying the Arabidopsis gene ID (e.g. "AT1G25320")
#' @param show_introns Logical indicating whether to display introns. Default is TRUE
#' @param show_all_features Logical indicating whether to display all genomic features. Default is FALSE
#' @param interactive Logical indicating whether to create an interactive plot (using plotly). Default is TRUE
#' @return A plotly or ggplot object (depending on interactive parameter)
#' @examples
#' # Load the data
#' loadTDNAdata()
#' # Plot T-DNA lines for a gene with known insertions
#' plotTDNAlines("AT1G25320")
#' # Plot T-DNA lines for a gene without known insertions
#' plotTDNAlines("AT1G20330")
#' @import data.table
#' @import ggplot2
#' @import ggrepel
#' @importFrom plotly ggplotly layout config
#' @export
plotTDNAlines <- function(gene, show_introns = TRUE, show_all_features = FALSE, interactive = TRUE) {
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
  
  # Get T-DNA lines
  lines <- getTDNAlines(gene)
  
  # Use data.table efficiently
  genegff <- gff[grep(paste0("ID=", gene), gff$info)]
  
  # Exit if no gene features found
  if (nrow(genegff) == 0) {
    message(paste("No gene features found for", gene))
    return(NULL)
  }
  
  # Define regions to include
  feature_types <- if(show_all_features) {
    unique(genegff$type)
  } else if(show_introns) {
    c("CDS", "five_prime_UTR", "three_prime_UTR", "intron")
  } else {
    c("CDS", "five_prime_UTR", "three_prime_UTR")
  }
  
  # Filter for regions of interest
  genegff <- genegff[type %in% feature_types]
  
  # Extract CDS for coordinate reference
  cds <- genegff[type == "CDS"]
  
  # Exit if no CDS found
  if (nrow(cds) == 0) {
    message(paste("No coding sequences found for", gene))
    return(NULL)
  }
  
  # Get T-DNA insertion locations
  if (length(lines) > 0) {
    # Pattern matching with efficient regex
    regex_pattern <- paste0("\\b(", paste(lines, collapse = "|"), ")\\b")
    matches <- grep(regex_pattern, location$V1)
    
    # Extract and filter locations
    locations <- location[matches]
    locations <- locations[, c("V1", "pos"), with = FALSE]
    locations <- unique(locations)
    
    # Get CDS positions
    cdspos <- unlist(
      lapply(1:nrow(cds), function(i) {
        cds[i, start]:cds[i, stop]
      })
    )
    
    # Filter for positions in CDS
    locations <- locations[pos %in% cdspos]
  } else {
    locations <- data.table(V1 = character(0), pos = numeric(0))
  }
  
  # Get gene strand for direction
  strand <- unique(genegff$strand)[1]
  
  # Color palette for gene features
  feature_colors <- c(
    "CDS" = "#2166AC",             # Blue for coding sequences
    "five_prime_UTR" = "#92C5DE",  # Light blue for 5' UTR
    "three_prime_UTR" = "#4393C3", # Medium blue for 3' UTR
    "intron" = "#D1E5F0",          # Very light blue for introns
    "promoter" = "#B2ABD2",        # Purple for promoters
    "other" = "#F7F7F7"            # Light gray for other features
  )
  
  # Plot gene model with ggplot2
  gene_min <- min(genegff$start)
  gene_max <- max(genegff$stop)
  gene_range <- gene_max - gene_min
  
  # Set up the plot
  p <- ggplot() +
    # Base gene line
    geom_segment(aes(x = gene_min - gene_range * 0.05, 
                     xend = gene_max + gene_range * 0.05,
                     y = 1, yend = 1), 
                 color = "gray50", size = 0.5) +
    # Genomic features
    geom_rect(data = genegff, 
              aes(xmin = start, xmax = stop, 
                  ymin = ifelse(type == "CDS", 0.75, 0.9),
                  ymax = ifelse(type == "CDS", 1.25, 1.1),
                  fill = type,
                  text = paste0("Type: ", type,
                                "<br>Start: ", start,
                                "<br>End: ", stop)
              )) +
    # Scale to fit gene with padding
    scale_x_continuous(limits = c(gene_min - gene_range * 0.05, 
                                  gene_max + gene_range * 0.05),
                       labels = scales::comma) +
    # Colors for gene features
    scale_fill_manual(values = feature_colors) +
    # Transcription direction arrow
    {
      if (strand == "+") {
        geom_segment(aes(x = gene_max + gene_range * 0.02, 
                         xend = gene_max + gene_range * 0.04,
                         y = 1, yend = 1), 
                     arrow = arrow(length = unit(0.2, "cm")),
                     color = "black")
      } else if (strand == "-") {
        geom_segment(aes(x = gene_min - gene_range * 0.02, 
                         xend = gene_min - gene_range * 0.04,
                         y = 1, yend = 1), 
                     arrow = arrow(length = unit(0.2, "cm")),
                     color = "black")
      } else {
        NULL
      }
    } +
    # Labels and theme
    labs(title = paste0(gene, " gene structure and T-DNA insertions"),
         x = "Genomic position", 
         y = "", 
         fill = "Feature") +
    theme_minimal() +
    theme(axis.text.y = element_blank(),
          axis.ticks.y = element_blank(),
          panel.grid.major.y = element_blank(),
          panel.grid.minor.y = element_blank(),
          legend.position = "bottom",
          plot.title = element_text(face = "bold"),
          legend.title = element_text(size = 8),
          legend.text = element_text(size = 8))
  
  # Add T-DNA insertion markers if any exist
  if (nrow(locations) > 0) {
    # Get T-DNA insertion info for hover text
    tdna_hover <- lapply(locations$V1, function(line_id) {
      line_info <- confirmed[`T-DNA line` == line_id]
      if (nrow(line_info) > 0) {
        paste0("Line: ", line_id,
               "<br>Target: ", line_info$`Target Gene`[1],
               "<br>Hit region: ", line_info$`Hit region`[1],
               "<br>Homozygosity: ", line_info$HM[1])
      } else {
        paste0("Line: ", line_id)
      }
    })
    
    locations$hover <- unlist(tdna_hover)
    
    # Add T-DNA markers to plot
    p <- p + 
      geom_segment(data = locations,
                  aes(x = pos, xend = pos,
                      y = 0.6, yend = 1.4,
                      color = "T-DNA insertion",
                      text = hover),
                  size = 1, linetype = "dashed") +
      scale_color_manual(values = c("T-DNA insertion" = "#D7191C")) +
      geom_label_repel(data = locations,
                       aes(x = pos, y = 1.5, 
                           label = V1,
                           text = hover),
                       nudge_y = 0.2,
                       color = "#D7191C",
                       size = 3)
  }
  
  # Create either interactive or static plot
  if (interactive) {
    # Convert to interactive plotly
    plotly_plot <- plotly::ggplotly(p, tooltip = "text")
    
    # Add layout customizations
    plotly_plot <- plotly_plot %>%
      plotly::layout(
        hovermode = "closest",
        hoverdistance = 5,
        legend = list(orientation = "h", y = -0.2),
        margin = list(t = 50, r = 50, b = 50, l = 50)
      ) %>%
      plotly::config(displayModeBar = TRUE)
    
    return(plotly_plot)
  } else {
    # Return static ggplot
    return(p)
  }
}

#' Legacy version of the plotting function using ggbio
#'
#' @param gene A character string specifying the Arabidopsis gene ID
#' @import ggplot2
#' @import ggrepel
#' @keywords internal
plotTDNAlines_ggbio <- function(gene) {
  .Deprecated("plotTDNAlines")
  plotTDNAlines(gene, interactive = FALSE)
}