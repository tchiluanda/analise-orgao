
# pacotes -----------------------------------------------------------------

library(tidyverse)
library(readxl)



# carrega dados iniciais --------------------------------------------------

ploa_raw <- readxl::read_excel("./dados/dados_originais/SOF_PLOA_2021_STN_ajustada_gepla.xlsx", sheet = "ajustada")

orgaos <- readxl::read_excel("./dados/dados_originais/tabela_orgao_cofin.xlsx", skip = 5) %>%
  select(uo = `uo Código`,
         orgao = `orgao Código`,
         orgaoReal = `Órgãos Poder Executivo 2020`) %>%
  mutate(
    orgaoRealNome = stringr::str_sub(orgaoReal, 9),
    orgaoReal     = stringr::str_sub(orgaoReal, 1, 5),
    orgaoRealNome = ifelse(
      orgaoRealNome == "abinete da Vice-Presidência da República",
      "Gabinete da Vice-Presidência da República",
      orgaoRealNome)
    )

ploa <- ploa_raw %>%
  left_join(orgaos)



