#' Load bundled T-DNA annotation tables
#'
#' This reads the bundled data files and stores them in an internal
#' environment for use by other functions.
#'
#' @return Invisibly returns a list with the loaded tables.
#' @import data.table
#' @export
loadTDNAdata <- function() {
  gff <- fread(system.file("extdata", "Araport11_GFF3_genes_transposons.201606.gff.gz", package = "tdna"))
  colnames(gff) <- c("chr", "source", "type", "start", "stop", "blank", "strand", "blank2", "info")

  confirmed <- fread(system.file("extdata", "sum_SALK_confirmed.txt.gz", package = "tdna"))
  confirmed_exon_hom_sent <- confirmed[`Hit region` == "Exon" & HM %in% c("HMc", "HMn") & ABRC != "NotSent"]
  confirmed_exon_hom_sent$`Target Gene` <- toupper(confirmed_exon_hom_sent$`Target Gene`)

  location <- fread(system.file("extdata", "T-DNAall.Genes.Araport11.txt.gz", package = "tdna"), header = FALSE)
  location$pos <- as.numeric(sapply(location$V5, function(x) unlist(strsplit(unlist(strsplit(as.character(x), " vs "))[1], "-"))[1]))

  assign("gff", gff, envir = .tdna_env)
  assign("confirmed_exon_hom_sent", confirmed_exon_hom_sent, envir = .tdna_env)
  assign("location", location, envir = .tdna_env)

  invisible(list(gff = gff,
                 confirmed = confirmed_exon_hom_sent,
                 location = location))
}
