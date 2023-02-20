#' plot TDNA lines in gene
#'
#' @import ggplot2
#' @import ggrepel
#' @import(karyoploteR)
#' @export

plotTDNAlines <- function(gene) {

  lines <- getTDNAlines(gene)

  if (length(lines) == 0) {
    cat("No confirmed homozygous TDNA lines found that have been submitted to the stock center\n")
  } else {
    genegff <- gff[grep(paste0("ID=", gene), gff$info)]
    genegff <- genegff[type %in% c("CDS","five_prime_UTR","three_prime_UTR")]
    genegff <- genegff[complete.cases(genegff), ]
    cds <- genegff[type == "CDS"]
    
    if (nrow(cds) == 0) {
      stop("No CDS features found for gene ", gene)
    }
    
    cdspos <- unlist(apply(cds, 1, function(x) {
      x <- unlist(x)
      if (is.na(x[4]) || is.na(x[5])) {
        stop("Invalid start or stop position detected for CDS feature.")
      }
      x[4]:x[5]
    }))
    
    if (length(cdspos) == 0) {
      stop("No valid start or stop positions found for CDS features.")
    }

    matches <- unique(grep(paste(lines, collapse = "|"), location$V1))

    locations <- location[matches, ]
    locations <- locations[, c("V1", "pos"), with=F]
    locations <- unique(locations)
    locations <- locations[pos %in% cdspos]

    plot <- karyoploteR::plotKaryotype(genegff[type == "CDS"], plot.type = 2) +
      karyoploteR::plotSegments(locations$V1, locations$pos, col = "red") +
      karyoploteR::plotLabels(locations$V1, locations$pos, labels = locations$V1, col = "red", bg = NA) +
      karyoploteR::plotText(gene, xlim = NULL, ylim = NULL, pos = "topleft") +
      karyoploteR::addTitle(ifelse(genegff$strand[1] == "-", "<--Transcription", "Transcription-->"))

    print(plot)
  }
}
