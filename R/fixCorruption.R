#' Fix package corruption issues
#'
#' This function helps fix the "lazy-load database is corrupt" error
#' by reinstalling the package from source.
#'
#' @param repo The GitHub repository to reinstall from. Default is "ianandersonlol/tdna".
#' @return TRUE if successful
#' @export
#'
#' @examples
#' \dontrun{
#' fixTDNAcorruption()
#' }
fixTDNAcorruption <- function(repo = "ianandersonlol/tdna") {
  if (!requireNamespace("devtools", quietly = TRUE)) {
    message("Installing devtools package...")
    install.packages("devtools")
  }
  
  # Try to unload the package
  tryCatch({
    detach("package:tdna", unload = TRUE)
  }, error = function(e) {
    # Package wasn't loaded, that's fine
  })
  
  # Remove the package
  message("Removing corrupt package installation...")
  remove.packages("tdna")
  
  # Reinstall from source
  message("Reinstalling tdna package from source...")
  devtools::install_github(repo, force = TRUE)
  
  # Load the package
  message("Loading newly installed package...")
  library(tdna)
  
  message("Package reinstalled. Please run loadTDNAdata() to load the data.")
  invisible(TRUE)
}