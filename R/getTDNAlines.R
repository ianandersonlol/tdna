#' Return T-DNA lines found in a gene
#'
#' @param gene Gene identifier (e.g. "AT1G25320").
#' @param data_env Environment containing the loaded data. Defaults to the
#'   package's internal environment.
#'
#' @return Character vector of T-DNA line identifiers.
#' @import data.table
#' @export
getTDNAlines <- function(gene, data_env = .tdna_env) {
  if (!is.character(gene) || length(gene) != 1) {
    stop("gene must be a single gene identifier")
  }
  required <- c("gff", "confirmed_exon_hom_sent", "location")
  if (!all(required %in% ls(envir = data_env))) {
    stop("TDNA data not loaded. Please run loadTDNAdata() first.")
  }

  geneconfirmed <- data_env$confirmed_exon_hom_sent[`Target Gene` == gene]
  lines <- unique(as.character(geneconfirmed$`T-DNA line`))
  if (length(lines) == 0) {
    return(character(0))
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

  locations$V1
}
