#' plot TDNA lines in gene
#'
#' @import ggplot2
#' @import ggrepel
#' @import(ggbio)
#' @export

plotTDNAlines_ggbio <- function(gene) {
  
  lines <- getTDNAlines(gene)
  
  if (length(lines) == 0) {
    cat("No confirmed homozygous TDNA lines found that have been submitted to the stock center\n")
  } else {
    genegff <- gff[grep(paste0("ID=", gene), gff$info)]
    genegff <- genegff[type %in% c("CDS", "five_prime_UTR", "three_prime_UTR")]
    cds <- genegff[type == "CDS"]
    cdspos <- unlist(lapply(cds, function(x) x$range()))
    
    matches <- unique(grep(paste(lines, collapse = "|"), location$V1))
    
    locations <- location[matches]
    locations <- locations[, c("V1", "pos"), with=F]
    locations <- unique(locations)
    locations <- locations[pos %in% cdspos]
    
    plot <- autoplot(genegff) +
      geom_segment(aes(x = start, xend = end, y = 1, yend = 1), col = "black", size = 2) +
      geom_label_repel(data = locations, aes(x = pos, y = 1, label = V1), col = "red", nudge_y = 0.5, size = 3) +
      scale_x_continuous(limits = range(cdspos), expand = c(0, 0)) +
      ggtitle(paste(gene, ifelse(genegff$strand[1] == "-", "   <--Transcription", "   Transcription-->")))
    
    print(plot)
  }
}
