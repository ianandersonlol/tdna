#' load data for TDNA stuff
#'
#' @import data.table
#' @export


loadTDNAdata<-function()
{

  gff<<-fread(system.file("extdata", "Araport11_GFF3_genes_transposons.201606.gff.gz", package = "tdna"))
  colnames(gff)<-c("chr","source","feature","start","stop","blank","strand","blank2","info")
  confirmed<<-fread(system.file("extdata", "sum_SALK_confirmed.txt.gz", package = "tdna"))
  confirmed__exon_hom_sent<<-confirmed[Hit.region=="Exon" & HM %in% c("HMc","HMn") & ABRC != "NotSent"]
  confirmed__exon_hom_sent$Target.Gene<<-toupper(confirmed__exon_hom_sent$Target.Gene)
  location<<-fread(system.file("extdata", "T-DNAall.Genes.Araport11.txt.gz", package = "tdna"))
  location$pos<<-as.numeric(sapply(location$V5, function(x) unlist(strsplit(unlist(strsplit(as.character(x), " vs "))[1], "-"))[1]))

}
