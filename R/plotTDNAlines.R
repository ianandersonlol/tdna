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
    return(NULL)
  }
  
  genegff <- gff[gff$info %like% paste0("ID=", gene) & type %in% c("CDS", "five_prime_UTR", "three_prime_UTR"), ]
  cdspos <- as.integer(unlist(lapply(genegff[type == "CDS", ], function(x) x[4]:x[5])))
  
  locations <- location[location$V1 %in% lines, c("V1", "pos")]
  locations <- locations[locations$pos %in% cdspos, ]
  
  # create the karyotype plot
  kp <- plotKaryotype(genome = "TAIR10")
  
  # add the gene annotation as a track on the karyotype plot
  kp <- plotAnnotation(kp, 
                        gene = gene, 
                        color = "red", 
                        height = 0.3, 
                        labels.cex = 0.8)
  
  # add the TDNA line locations as a track on the karyotype plot
  kp <- plotSegments(kp, 
                      segments = locations, 
                      color = "blue", 
                      height = 0.4)
  
  # add cytoband labels
  kp <- addCytobandLabels(kp)
  
  # display the plot
  print(kp)
}
