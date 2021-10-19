# tdna

# usage

# install and load
```
library(devtools)
install_github("greymonroe/tdna")
library(tdna)
#load the TDNA raw data
loadTDNAdata()
```

# example of gene with a KO line
```
getTDNAlines("AT1G25320")
plotTDNAlines("AT1G25320")
```

# example of gene without line
```
getTDNAlines("AT1G20330")
plotTDNAlines("AT1G20330")
```
