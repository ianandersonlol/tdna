#' plot TDNA lines in gene
#'
#' @import ggplot2
#' @import ggrepel
#' @export

plotTDNAlines <- function(gene){

  lines<-getTDNAlines(gene)

  if(length(lines)==0){

    cat("No confirmed homozygous TDNA lines found that have been submitted to the stock center\n")
  } else{

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


    plot<-ggplot(genegff[type == "CDS"])+
      geom_segment(aes(x=start, xend=stop, y=1, yend=1), col="black", size=2)+
      #geom_point(data=locations, aes(x=pos, y="CDS"), fill="red", size=5, shape=25)+
      geom_label_repel(data=locations, aes(x=pos, y=1, label=V1), col="red", nudge_y = 0.5, size=3, min.segment.length = unit(0, 'lines'))+
      theme_classic()+
      ggtitle(paste(gene, ifelse(genegff$strand[1]=="-", "   <--Transcription","   Transcription-->")))+
      theme(axis.line = element_blank(), axis.text.y = element_blank(), axis.title.y = element_blank(), axis.ticks.y = element_blank(), axis.title.x=element_blank())


    print(plot)
  }
}
