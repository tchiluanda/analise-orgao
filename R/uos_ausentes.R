library(tidyverse)
library(readxl)

lista_uos_cofin <- readxl::read_excel("./dados/dados_originais/tabela_orgao_cofin.xlsx", skip = 5) 
  
  

lista_uos_ploa <- readxl::read_excel("./dados/dados_originais/SOF_PLOA_2021_STN_ajustada_gepla.xlsx", sheet = "ajustada") %>%
  group_by(uo, nomeuo) %>%
  summarise(valor = sum(`PLOA 2020 Mensagem Modificativa`)) %>%
  ungroup()

uos_cofin <- lista_uos_cofin %>%
  select(uo_cofin_cod = `uo Código`,
         uo_cofin_nome = `uo Nome`) %>%
  distinct()

uos_ploa <- lista_uos_ploa %>%
  select(uo_ploa_cod = uo,
         uo_ploa_nome = nomeuo) %>%
  distinct()

tab_uo_cofin <- uos_cofin %>%
  select(uo = uo_cofin_cod) %>%
  mutate(origem = "cofin")

tab_uo_ploa <- uos_ploa %>%
  select(uo = uo_ploa_cod) %>%
  mutate(origem = "ploa")

tab_uo <- bind_rows(tab_uo_cofin, tab_uo_ploa) %>%
  mutate(valor = TRUE) %>%
  spread(origem, valor, fill = FALSE) %>%
  mutate(problema = !cofin & ploa) %>% 
  filter(problema) %>%
  left_join(lista_uos_ploa, by = c("uo" = "uo")) %>%
  filter(!(str_sub(uo, 1, 2) %in% c("01", "02", "03", "10", "11", "12", "13", "14", "15", "16", "17", "29", "34", "59"))) %>%
  filter(!is.na(uo))

write.csv2(tab_uo, file = "./dados/dados_intermediarios/uos_ploa_fora_tabela.csv")

tab_uo %>% select(uo, cofin, ploa, nomeuo, valor)
tab_uo$uo
