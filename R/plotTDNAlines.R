#' Plot T-DNA insertions in a gene
#'
#' @param gene Gene identifier.
#' @param data_env Environment containing the loaded data. Defaults to the
#'   package internal environment.
#'
#' @import ggplot2
#' @import ggrepel
#' @export
plotTDNAlines <- function(gene, data_env = .tdna_env) {
  lines <- getTDNAlines(gene, data_env = data_env)

  if (length(lines) == 0) {
    message("No confirmed homozygous TDNA lines found that have been submitted to the stock center")
    return(invisible(NULL))
  }

  genegff <- data_env$gff[grep(paste0("ID=", gene), data_env$gff$info)]
  genegff <- genegff[type %in% c("CDS", "five_prime_UTR", "three_prime_UTR")]
  cds <- genegff[type == "CDS"]
  cdspos <- unlist(apply(cds, 1, function(x) {
    x <- unlist(x)
    x[4]:x[5]
  }))

  matches <- unique(grep(paste(lines, collapse = "|"), data_env$location$V1))
  locations <- data_env$location[matches]
  locations <- locations[, c("V1", "pos"), with = FALSE]
  locations <- unique(locations)
  locations <- locations[pos %in% cdspos]

  plot <- ggplot(genegff[type == "CDS"]) +
    geom_segment(aes(x = start, xend = stop, y = 1, yend = 1), col = "black", size = 2) +
    geom_label_repel(data = locations, aes(x = pos, y = 1, label = V1), col = "red", nudge_y = 0.5, size = 3, min.segment.length = unit(0, "lines")) +
    theme_classic() +
    ggtitle(paste(gene, ifelse(genegff$strand[1] == "-", "   <--Transcription", "   Transcription-->"))) +
    theme(axis.line = element_blank(), axis.text.y = element_blank(), axis.title.y = element_blank(), axis.ticks.y = element_blank(), axis.title.x = element_blank())

  print(plot)
  invisible(plot)
}
