#' return TDNA lines that are found in gene of interest
#'
#' @param gene A number.
#' @import data.table
#' @export

getTDNAlines <- function(gene) {

  geneconfirmed<-confirmed__exon_hom_sent[`Target Gene`==gene]
  lines<-unique(as.character(geneconfirmed$`T-DNA line`))

  if(length(lines)>0){

 genegff<- gff[grep(paste0("ID=", gene), gff$info)]
 genegff<-genegff[type %in% c("CDS","five_prime_UTR","three_prime_UTR")]
 cds<-genegff[type=="CDS"]
 cdspos<-unlist(apply(cds, 1, function(x) {
   x<-unlist(x)
   x[4]:x[5]
 }
 ))

 matches <- unique(grep(paste(lines,collapse="|"),
                        location$V1))

 locations<-location[matches]
 locations<-locations[, c("V1", "pos"), with=F]
 locations<-unique(locations)
 locations<-locations[pos %in% cdspos]

  return(locations$V1)
  } else return(lines)

}


