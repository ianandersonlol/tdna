context("basic functionality")

test_that("loading data works", {
  expect_silent(loadTDNAdata())
  expect_true(all(c("gff","confirmed_exon_hom_sent","location") %in% ls(envir = tdna::.tdna_env)))
})

test_that("getTDNAlines works", {
  loadTDNAdata()
  lines <- getTDNAlines("AT1G25320")
  expect_type(lines, "character")
})
