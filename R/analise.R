
# pacotes -----------------------------------------------------------------

library(tidyverse)
library(readxl)



# carrega dados iniciais --------------------------------------------------

ploa_raw <- readxl::read_excel("./dados/dados_originais/SOF_PLOA_2021_STN_ajustada_gepla.xlsx", sheet = "ajustada")

orgaos <- readxl::read_excel("./dados/dados_originais/tabela_orgao_cofin.xlsx", skip = 5) %>%
  select(uo = `uo Código`,
         orgao = `orgao Código`,
         orgao_decreto = `Órgãos Poder Executivo 2020`) %>%
  mutate(
    orgao_decreto_nome = stringr::str_sub(orgao_decreto, 9),
    orgao_decreto = stringr::str_sub(orgao_decreto, 1, 5),
    orgao_decreto_nome = ifelse(
      orgao_decreto_nome == "abinete da Vice-Presidência da República",
      "Gabinete da Vice-Presidência da República",
      orgao_decreto_nome)
    )

agrupadores <- readxl::read_excel("./dados/dados_originais/Novos Agregadores Min. Economia.xlsx") %>%
  select(
    acao = `Rótulos de Linha`,
    #tituloacao = `Nome Ação Governo`,
    agregador = `Agregadores Novos`
  )


# reúne informações na tabela ---------------------------------------------

ploa <- ploa_raw %>%
  left_join(orgaos) %>%
  left_join(agrupadores, by = "acao")

ploa_ME <- ploa %>%
  filter(orgao_decreto == "25000")

acoes_ME_sem_agregadores <- ploa_ME %>%
  filter(is.na(agregador)) %>%
  select(acao, tituloacao) %>%
  unique()

write.csv2(acoes_ME_sem_agregadores, 
           file = "./dados/dados_intermediarios/acoes_ME_sem_agregadores.csv",
           fileEncoding = "UTF-8"
           )


