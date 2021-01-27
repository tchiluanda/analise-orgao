
# pacotes -----------------------------------------------------------------

library(tidyverse)
library(readxl)
#library(networkD3)
#library(igraph)
#library(collapsibleTree)



# carrega dados iniciais --------------------------------------------------

ploa_raw <- readxl::read_excel("./dados/dados_originais/SOF_PLOA_2021_STN_ajustada_gepla.xlsx", sheet = "ajustada")

arquivos <- c(
  # "./dados/dados_originais/dot_2020_ate26000.xlsx",
  # "./dados/dados_originais/dot_2020_so26000.xlsx",
  # "./dados/dados_originais/dot_2020_maior26000.xlsx",
  "./dados/dados_originais/pago_2020_menor_igual26000.xlsx",
  "./dados/dados_originais/pago_2020_26001_36000.xlsx",
  "./dados/dados_originais/pago_2020_36001_53000.xlsx",
  "./dados/dados_originais/pago_2020_maior53000.xlsx"
)

dados_adicionais_raw <- 
  purrr::map(.x = arquivos, .f = readxl::read_excel, skip = 8) %>%
  bind_rows()

dados_adicionais_raw %>% filter(tipo_valor == "DOTACAO ATUALIZADA") %>% select(valor) %>% sum()

colnames(dados_adicionais_raw) <- c(
  "exercicio", 
  "orgao", "nomeorgao", 
  "esfera", "descricaoesfera", 
  "uo", "nomeuo", 
  "funcao", "descricaofuncao", 
  "subfuncao", "descricaosubfuncao", 
  "programa", "tituloprograma", 
  "acao", "tituloacao", 
  "localizador", "descricaolocalizador", 
  "iduso", "descricaoiduso", 
  "gnd", "gnd_descricao",
  "mod", "mod_descricao",
  #"elemento", "elemento_descricao",
  "fonte", 
  "resultadoprimario", "descricaoresultadoprimario", 
  "resultadoprimariolei", "descricaoresultadoprimariolei", 
  "credito", "credito_descricao",
  "ied", 
  "tipo_valor_cod", "tipo_valor",
  "valor")

tab_funcao <- readxl::read_excel("./dados/dados_originais/tabela_funcao.xlsx") %>%
  select(subfuncao = cod_subfuncao,
         funcao_tipica = Funcao) %>%
  distinct()

orgaos <- readxl::read_excel("./dados/dados_originais/tabela_orgao_cofin_2021.xlsx", skip = 5) %>%
  select(uo = `uo Código`,
         orgao = `orgao Código`,
         orgao_decreto = `Órgãos Poder Executivo 2021`) %>%
  mutate(
    orgao_decreto_nome = stringr::str_sub(orgao_decreto, 9),
    orgao_decreto = stringr::str_sub(orgao_decreto, 1, 5),
    orgao_decreto_nome = ifelse(
      orgao_decreto_nome == "abinete da Vice-Presidência da República",
      "Gabinete da Vice-Presidência da República",
      orgao_decreto_nome)
    ) %>%
  distinct() %>%
  group_by(uo, orgao) %>%
  summarise(orgao_decreto = last(orgao_decreto),
            orgao_decreto_nome = last(orgao_decreto_nome))

orgaos %>% count(uo, orgao) %>% arrange(desc(n)) %>% filter(n>1) 
# uos em mais de um órgão (saco)

agrupadores <- readxl::read_excel("./dados/dados_originais/Novos Agregadores Min. Economia.xlsx") %>%
  select(
    acao = `Rótulos de Linha`,
    #tituloacao = `Nome Ação Governo`,
    agregador = `Agregadores Novos`
  ) %>% 
  distinct()


# prepara tabelas com informacoes principais ------------------------------

ploa <- ploa_raw %>%
  filter(!is.na(exercicio)) %>%
  rename(valor = `PLOA 2020 Mensagem Modificativa`) %>%
  mutate(tipo_valor = "PLOA",
         gnd = str_sub(naturezadespesa,2,2),
         mod = str_sub(naturezadespesa,3,4),
         fonte = str_sub(fonte, 2, 3))

dados_adicionais <- dados_adicionais_raw %>%
  mutate(fonte = str_sub(fonte, 3, 4))

dados_combinados_raw <-
  bind_rows(
    ploa,
    dados_adicionais
  )

# reúne informações na tabela ---------------------------------------------

tabela_uo_ploa <- ploa %>% select(uo, nomeuo) %>% distinct()
tabela_orgao_ploa <- ploa %>% select(orgao, nomeorgao) %>% distinct()

dados_combinados <-
  dados_combinados_raw %>%
  group_by(exercicio,
           tipo_valor,
           uo,
           orgao,
           fonte,
           programa,
           acao,
           funcao,
           subfuncao,
           gnd,
           mod,
           resultadoprimario,
           credito,
           ied) %>%
  summarise(valor = sum(valor)) %>%
  ungroup() %>%
  left_join(tabela_uo_ploa) %>%
  left_join(tabela_orgao_ploa)
    
#exercicio_ref <- 2021

base <- dados_combinados %>%
  left_join(orgaos) %>%
  left_join(agrupadores, by = "acao") %>%
  left_join(tab_funcao) %>%
  mutate(
    orgao_decreto = ifelse(is.na(orgao_decreto), orgao, orgao_decreto),
    orgao_decreto_nome = ifelse(is.na(orgao_decreto_nome), nomeorgao, orgao_decreto_nome)
  ) #%>%
  #filter(orgao_decreto == "25000")

dados_combinados %>% filter(tipo_valor == "PLOA") %>% select(valor) %>% sum(.)
base %>% filter(tipo_valor == "PLOA") %>% select(valor) %>% sum(.)

dados_combinados %>% filter(tipo_valor == "DOTACAO ATUALIZADA") %>% select(valor) %>% sum(.)
base %>% filter(tipo_valor == "DOTACAO ATUALIZADA") %>% select(valor) %>% sum(.)

# Incorpora informação dos anexos -----------------------------------------

## marcadores ##

acoes_PUC <- c("0090", "009V", "00HH", "00HT", "00HZ", "00I9", "00IT", "00J0", "00J8", "00JA", "00M9", "00MA", "00MG", "00MH", "00MI", "00MJ", "00MK", "00ML", "00MU", "00PA", "09JC", "09JD", "0A45", "0A87", "0A88", "0A90", "0E45", "0E50", "0EB6", "0EC3", "0EC4")

acoes_defesa <- c("123B", "123G", "123H", "123I", "14LW", "14T0", "14T4", "14T5", "14T7", "14XJ", "2919")

acoes_controle_fluxo <- c("0095", "00M1", "00P1", "00RC", "0359", "0515", "0969", "2004", "2010", "2011", "2012", "20AB", "20AD", "20AE", "20A1", "20AL", "20XV", "20YE", "212B", "212O", "214O", "219A", "21BZ", "2865", "2887", "2913", "2E79", "4368", "4370", "4705", "8442", "8446", "8573", "8577", "8585", "8744")

uos_ressalvadas <- c("20225", "36201", "74910", "93381", "22202", "47204", "93181", "93436", "24901", "47205", "93201", "25300", "61201", "93202", "25301")

uos_funpen <- c("30907", "30911", "82901", "82902")

fontes_proprias <- c("70", "82", "50", "63", "80", "81", "93", "96")

fonte_21 <- c("21")

fontes_excetuadas <- c(fontes_proprias, fonte_21, "16")

custeio_investimento <- c("3", "4", "5")

eof_discricionaria <- c("2", "3")

eof_emendas_impositivas <- c("6", "7")

eof_emendas_comissao <- c("8")

eof_emendas_relator <- c("9")

eof_obrigatorias <- c("1")

cred_extraordinario <- c("G", "Z")

cred_nao_extraordinario <- c("A", "C", "X", "Y")

## cria base com marcadores ##

base_marcadores <- base %>%
  mutate(
    LeJu = str_sub(orgao_decreto, 1, 2) %in% c("01", "02", "03", "29", "34", "59"),
    acoes_PUC = acao %in% acoes_PUC,
    acoes_defesa = acao %in% acoes_defesa,
    acoes_controle_fluxo = acao %in% acoes_controle_fluxo,
    uos_ressalvadas = uo %in% uos_ressalvadas,
    uos_funpen = uo %in% uos_funpen,
    fontes_proprias = fonte %in% fontes_proprias,
    fonte_21 = fonte %in% fonte_21,
    fontes_excetuadas = fonte %in% fontes_excetuadas,
    custeio_investimento = gnd %in% custeio_investimento,
    eof_discricionaria = resultadoprimario %in% eof_discricionaria,
    eof_emendas_impositivas = resultadoprimario %in% eof_emendas_impositivas,
    eof_emendas_comissao = resultadoprimario %in% eof_emendas_comissao,
    eof_emendas_relator = resultadoprimario %in% eof_emendas_relator,
    eof_obrigatorias = resultadoprimario %in% eof_obrigatorias,
    credito_extraordinario = credito %in% cred_extraordinario,
    cred_nao_extraordinario = credito %in% cred_nao_extraordinario,
    
    ressalvadas_1 = 
      orgao_decreto == "24000" &
      !(uo %in% c(" 24901", "74910", "93436")) &
      funcao == "19" &
      custeio_investimento &
      #eof_discricionaria &
      (!credito_extraordinario),

    ressalvadas_2 =
      acoes_defesa &
      custeio_investimento &
      #eof_discricionaria &
      (!credito_extraordinario),

    ressalvadas_3 =
      fonte == "83" &
      custeio_investimento &
      #eof_discricionaria &
      (!credito_extraordinario),

    ressalvadas_4 =
      !(uo %in% c("22202", "93183")) &
      programa == "2203" &
      custeio_investimento &
      #eof_discricionaria &
      (!credito_extraordinario),

    ressalvadas_5 =
      uos_ressalvadas &
      programa == "2203" &
      custeio_investimento &
      #eof_discricionaria &
      (!credito_extraordinario),
    
    ressalvadas_qq =
      ressalvadas_1 |
      ressalvadas_2 |
      ressalvadas_3 |
      ressalvadas_4 |
      ressalvadas_5
  )

## cria base com marcadores dos anexos

base_anexos <- base_marcadores %>%
  mutate(
    
    # demais discricionárias
    
    anexo_II = 
      (!acoes_PUC) &
      (!fontes_excetuadas) &
      custeio_investimento &
      eof_discricionaria &
      (!credito_extraordinario) &
      (!ressalvadas_qq),
    
    anexo_III =
      (!acoes_PUC) &
      (!fontes_excetuadas) &
      custeio_investimento &
      eof_discricionaria &
      (!credito_extraordinario) &
      ressalvadas_qq,
    
    anexo_IV = 
      (!acoes_PUC) &
      fontes_proprias &
      custeio_investimento &
      eof_discricionaria &
      (!credito_extraordinario) &
      (!ressalvadas_qq),
    
    anexo_V =
      (!acoes_PUC) &
      fontes_proprias &
      custeio_investimento &
      eof_discricionaria &
      (!credito_extraordinario) &
      ressalvadas_qq,
    
    anexo_VI = 
      acoes_PUC &
      custeio_investimento &
      eof_discricionaria &
      (!credito_extraordinario),
    
    anexo_VIa =
      fonte_21 &
      custeio_investimento &
      eof_discricionaria &
      (!credito_extraordinario),
    
    # emendas discricionárias
    
    anexo_VII = 
      custeio_investimento &
      eof_emendas_impositivas &
      (!credito_extraordinario),
    
    anexo_VIII =
      custeio_investimento &
      eof_emendas_comissao &
      (!credito_extraordinario) &
      (!ressalvadas_qq),
    
    anexo_IX =
      custeio_investimento &
      eof_emendas_comissao &
      (!credito_extraordinario) &
      ressalvadas_qq,
    
    anexo_X = 
      custeio_investimento &
      eof_emendas_relator &
      (!fontes_excetuadas) &
      (!credito_extraordinario) &
      (!ressalvadas_qq),
    
    anexo_XI =
      custeio_investimento &
      eof_emendas_relator &
      (!fontes_excetuadas) &
      (!credito_extraordinario) &
      ressalvadas_qq,
    
    anexo_XII =
      custeio_investimento &
      eof_emendas_relator &
      fontes_proprias &
      (!credito_extraordinario) &
      (!ressalvadas_qq),
    
    anexo_XIIa =
      custeio_investimento &
      eof_emendas_relator &
      fontes_proprias &
      (!credito_extraordinario) &
      ressalvadas_qq,
    
    # obrigatorias com controle de fluxo
    
    anexo_XIII = 
      (
        (!LeJu) &
        acoes_controle_fluxo &
        (!fontes_excetuadas) &
        (!credito_extraordinario) &
        eof_obrigatorias
      ) | (
        uos_funpen &
        (!fontes_excetuadas) &
        custeio_investimento &
        (!credito_extraordinario) &
        eof_obrigatorias
      ),
    
    anexo_XIV =
      (
        (!LeJu) &
        acoes_controle_fluxo &
        fontes_excetuadas &
        (!credito_extraordinario) &
        eof_obrigatorias
      ) | (
        uos_funpen &
        fontes_excetuadas &
        custeio_investimento &
        (!credito_extraordinario) &
        eof_obrigatorias
      ),
    
    anexo_nenhum = !(
      anexo_II | anexo_III | anexo_IV | anexo_V | anexo_VI | anexo_VIa | anexo_VII | anexo_VIII | anexo_IX | anexo_X | anexo_XI | anexo_XII | anexo_XIIa | anexo_XIII | anexo_XIV
    )
    
  )

tab_anexos <- data.frame(
  Anexo = base_anexos %>% select(starts_with("anexo_")) %>% colnames(),
  anexo = c("Anexo II", "Anexo III", "Anexo IV", "Anexo V", "Anexo VI", "Anexo VI-A", "Anexo VII", "Anexo VIII", "Anexo IX", "Anexo X", "Anexo XI", "Anexo XII", "Anexo XII-A", "Anexo XIII", "Anexo XIV", "Obrigatórias")
  )

base_anexos_verifica <- base_anexos %>%
  mutate(celula = row_number()) %>%
  gather(starts_with("anexo_"), key = "Anexo", value = "pertence") %>%
  filter(pertence) %>%
  left_join(tab_anexos)

# verifica se cada celula de despesa só está marcada em um único anexo
base_anexos_verifica %>% 
  filter(pertence) %>%
  group_by(celula) %>% 
  count(pertence) %>% 
  arrange(desc(n)) %>%
  filter(n>1)

# verifica se cada acao está vinculada apenas em um único anexo (nao precisa estar)
base_anexos_verifica %>% 
  filter(pertence) %>%
  select(acao, anexo) %>%
  distinct() %>%
  count(acao) %>%
  arrange(desc(n)) %>%
  filter(n>1)
  # group_by(acao) %>%
  # count(anexo) %>%
  # arrange(desc(n)) %>%
  # filter(n>1)



# sumariza a base ---------------------------------------------------------

tipos_de_valor <- data.frame(
  tipo_valor = base_anexos_verifica %>% select(tipo_valor) %>% unique() %>% unlist(),
  variavel = c("desp_paga", "dot_atu", "PLOA") #c("desp_emp", "desp_liq", "desp_paga", "dot_atu", "RAP_inscritos", "RAP_pagos", "PLOA")
)

base_anexos_sumarizada <- base_anexos_verifica %>%
  group_by(
    orgao_decreto, orgao_decreto_nome, 
    anexo, 
    agregador, 
    uo, nomeuo,
    acao,
    fonte, 
    gnd, 
    mod, 
    funcao_tipica,
    tipo_valor) %>%
  summarise(valor = sum(valor)) %>%
  ungroup() %>%
  left_join(tipos_de_valor) %>%
  select(-tipo_valor) %>%
  mutate(gnd = case_when(
    gnd == "1" ~ "Pessoal",
    gnd == "3" ~ "Custeio",
    gnd %in% c("4", "5") ~ "Investimento",
    TRUE ~ "Dívida")) %>%
  mutate(mod = case_when(
    str_sub(mod,1,1) == "9" ~ "Direta",
    TRUE ~ "Transferencia")) %>%
  mutate(fonte = case_when(
    fonte %in% fontes_proprias ~ "Fontes próprias",
    fonte %in% c("43","44") ~ "Fontes de Emissão",
    TRUE ~ "Fontes Tesouro"
  ))

base_anexos_sumarizada %>% filter(variavel == "PLOA") %>% group_by(fonte) %>% summarise(sum(valor))
base_anexos_sumarizada %>% group_by(variavel) %>% summarise(sum(valor))

# base_anexos_todos_orgaos <- base_anexos_sumarizada %>%
#   group_by_at(vars(-orgao_decreto, -orgao_decreto_nome, -valor)) %>%
#   summarise(valor = sum(valor)) %>%
#   mutate(orgao_decreto = "Todos", orgao_decreto_nome = "Todos")

# base_completa <- bind_rows(
#   base_anexos_sumarizada,
#   base_anexos_todos_orgaos
# )

# testes vis

ggplot(base_anexos_sumarizada %>% filter(variavel %in% c("PLOA","dot_atu"))) +
  geom_col(aes(y = valor, x = reorder(orgao_decreto, valor), fill = variavel), position = position_dodge()) +
  coord_flip()

ggplot(base_anexos_sumarizada %>% filter(variavel == "PLOA")) +
  geom_col(aes(y = valor, x = anexo)) +
  coord_flip()

base_anexos_sumarizada %>% 
  filter(variavel == "desp_paga") %>%
  group_by(anexo) %>%
  summarise(sum(valor))

# Para ter ideia do máximo de fontes por ação
base_anexos_sumarizada %>% select(acao, fonte) %>% distinct() %>% count(acao) %>% arrange(desc(n))

# para ter ideia da quantidade acoes por anexo e por agrupador
base_anexos_sumarizada %>% select(acao, anexo) %>% distinct() %>% count(acao) %>% arrange(desc(n))
base_anexos_sumarizada %>% select(agregador, acao) %>% distinct() %>% count(acao) %>% arrange(desc(n))

# subtotais por orgao
ggplot(base_anexos_sumarizada %>% filter(variavel == "dot_atu")) + geom_col(aes(x = orgao_decreto, y = valor)) + coord_flip()

# computa dados para os cards das ações -----------------------------------

variavel_principal <- "PLOA" # eventualmente pode se algo mais sofisticado aqui, tipo um id que podemos criar para identificar um tipo de valor de um determinado exercício

perfil_gnd <- base_completa %>%
  filter(variavel == variavel_principal) %>%
  group_by(orgao_decreto, acao) %>%
  mutate(total_acao = sum(valor)) %>%
  group_by(orgao_decreto, acao, gnd) %>%
  mutate(total_gnd = sum(valor)) %>%
  group_by(orgao_decreto, acao, gnd) %>%
  summarise(percent_gnd = first(total_gnd / total_acao)) %>%
  ungroup() %>%
  #unite("classificador", c(id_info,grupo), remove = TRUE) %>%
  spread(gnd, percent_gnd)
  
perfil_mod <- base_anexos_sumarizada %>%
  filter(variavel == variavel_principal) %>%
  group_by(orgao_decreto, acao) %>%
  mutate(total_acao = sum(valor)) %>%
  group_by(orgao_decreto, acao, mod) %>%
  mutate(total_mod = sum(valor)) %>%
  group_by(orgao_decreto, acao, mod) %>%
  summarise(percent_mod = first(total_mod / total_acao)) %>%
  ungroup() %>%
  #unite("classificador", c(id_info,grupo), remove = TRUE) %>%
  spread(mod, percent_mod)

principais_orgaos <- base_anexos_sumarizada %>%
  group_by(orgao_decreto, acao, uo, nomeuo) %>%
  summarise(valor = sum(valor)) %>%
  arrange(desc(valor)) %>%
  group_by(orgao_decreto, acao) %>%
  mutate(ranking = paste0("uo_valor_", ifelse(row_number()>5, 6, row_number())),
         uo = ifelse(row_number()>5, "Demais", paste(uo,"-",nomeuo))) %>%
  group_by(orgao_decreto, acao, uo, ranking) %>%
  summarize(valor = sum(valor)) %>%
  ungroup() %>%
  arrange(ranking) %>%
  unite("uo_valor", c(uo, valor), sep = "_", remove = TRUE) %>%
  spread(ranking, uo_valor)
    

# prep final da base ------------------------------------------------------

titulo_acao <- ploa %>%
  select(acao, tituloacao) %>%
  distinct()

base_pre <- base_anexos_sumarizada %>% #base_variacoes %>%
  mutate(
    orgao_decreto_cod = orgao_decreto,
    orgao_decreto = paste(orgao_decreto_cod, orgao_decreto_nome, sep = " - "),
    uo = paste(uo, nomeuo, sep = " - "),
    marcador = case_when(
      uo == "75101" ~ "divida",
      uo == "25917" ~ "rgps",
      TRUE ~ "demais")) %>%
  group_by(orgao_decreto, anexo, agregador, fonte, marcador, acao, uo, gnd, mod, variavel) %>%
  summarise(valor = sum(valor)) %>%
  ungroup()


# PAra ter ideia do maximo de marcadores (divida, RGPS) por acao
base_pre %>% select(acao, marcador) %>% distinct() %>% count(acao)

acrescenta_todos <- function(variavel) {
  base_pre %>%
    mutate(!!sym(variavel) = "Todos") %>%
    #mutate({{variavel}} = "Todos") %>%
    group_by(orgao_decreto, anexo, agregador, fonte, marcador, acao, uo, gnd, mod, variavel) %>%
    summarise(valor = sum(valor)) %>%
    ungroup()
}

# tira uo, gnd e mod, que serao (re)acrescentados depois
# computa os "Todos" para cada variavel de interesse
base_pre_todos_orgaos <- base_pre %>%
  group_by(anexo, agregador, fonte, marcador, acao, variavel) %>%
  summarise(valor = sum(valor)) %>%
  ungroup() %>%
  mutate(orgao_decreto = "Todos", .before = anexo)

base_pre_todos_anexos <- base_pre %>%
  group_by(orgao_decreto, agregador, fonte, marcador, acao, variavel) %>%
  summarise(valor = sum(valor)) %>%
  ungroup() %>%
  mutate(anexo = "Todos", .before = agregador)

base_pre_todos_agregadores <- base_pre %>%
  group_by(orgao_decreto, anexo, fonte, marcador, acao, variavel) %>%
  summarise(valor = sum(valor)) %>%
  ungroup() %>%
  mutate(agregador = "Todos", .before = fonte)

base_pre_todas_fontes <- base_pre %>%
  group_by(orgao_decreto, anexo, agregador, marcador, acao, variavel) %>%
  summarise(valor = sum(valor)) %>%
  ungroup() %>%
  mutate(fonte = "Todos", .before = marcador)

base_pre_todos_marcadores <- base_pre %>%
  group_by(orgao_decreto, anexo, agregador, fonte, acao, variavel) %>%
  summarise(valor = sum(valor)) %>%
  ungroup() %>%
  mutate(marcador = "Todos", .before = acao)

# arrumar um jeito eficiente

# computa todos para cada combinação de duas variáveis de interesse

# calcula variacoes -------------------------------------------------------

# calcular isso no JS? pq vai depender da visão...
# base_variacoes <- base_anexos_sumarizada %>%
#   group_by(orgao_decreto, orgao_decreto_nome, agregador, anexo,
#            #anexo, ### sem anexo, por enquanto, pq senão teremos ações fragmentadas 
#            acao, funcao_tipica, variavel) %>%
#   summarise(valor = sum(valor)) %>%
#   ungroup() %>%
#   spread(variavel, valor) %>%
#   filter(!is.na(PLOA)) %>% # (1)
#   mutate(
#     var_abs = PLOA - dot_atu,
#     var_pct = (PLOA / dot_atu - 1)*100,
#     acao_nova = dot_atu == 0 | is.na(dot_atu)
#   )
 
 # (1) tira ações que não estão no PLOA



# base_variacoes <- base_anexos_sumarizada %>%
#   group_by(agregador, anexo, acao, tipo_valor) %>%
#   summarise(total = sum(valor)) %>%
#   ungroup() %>%
#   mutate(id_info = paste(id_info, "total", sep = "_")) %>%
#   spread(id_info, total) %>%
#   mutate(acao_nova = is.na(ref_total),
#          acao_extinta = is.na(atu_total)) %>%
#   filter(!acao_extinta) %>%
#   mutate(varia = atu_total - ref_total,
#          varia_pct = (atu_total / ref_total - 1) * 100)

# base_pre_stack <- base_anexos_sumarizada #base_variacoes %>%
#   left_join(perfil_gnd) %>%
#   left_join(perfil_mod) %>%
#   left_join(principais_orgaos) %>%
#   left_join(titulo_acao)

# variaveis_de_interesse <- c("agregador")
# 
# base_stack <- base_pre_stack
# 
# for (var in variaveis_de_interesse) {
#   quo_var <- sym(var) # transforma "var", que é string, num símbolo
#   
#   base_stack <- base_stack %>%
#     group_by(!! quo_var) %>%
#     mutate(!! paste0("pos_ini_", var) := cumsum(PLOA) - PLOA) %>%
#     ungroup()
# }


# exporta -----------------------------------------------------------------

titulo_acao <- ploa %>%
  select(acao, tituloacao) %>%
  distinct()

base_export <- base_anexos_sumarizada %>% #base_variacoes %>%
  mutate(
    orgao_decreto_cod = orgao_decreto,
    orgao_decreto = paste(orgao_decreto, orgao_decreto_nome, sep = " - "),  
    marcador = case_when(
    uo == "75101" ~ "divida",
    uo == "25917" ~ "rgps",
    TRUE ~ "demais")) %>%
  group_by(orgao_decreto, orgao_decreto_nome, agregador, anexo, marcador,#acao
           fonte, variavel) %>%
  summarise(valor = sum(valor)) %>%
  ungroup() %>%
  spread(variavel, valor) %>%
  filter(!is.na(PLOA)) %>% # (1)
  # left_join(perfil_gnd) %>%
  # left_join(perfil_mod) %>%
  # left_join(principais_orgaos) %>%
  #left_join(titulo_acao) %>%
  mutate(dot_atu = ifelse(is.na(dot_atu), 0, dot_atu),
         desp_paga = ifelse(is.na(desp_paga), 0, desp_paga))#,
         #acao = paste(acao, tituloacao, sep = " - "))
  #select(-tituloacao)

  # (1) tira ações que não estão no PLOA
  
write.csv(base_export, file = "./dados/dados.csv", fileEncoding = "utf-8")



#  base acoes preliminar --------------------------------------------------


base_acoes <- base_anexos_sumarizada %>%
  mutate(uo = paste(uo, nomeuo, sep = " - "),
         orgao_decreto = paste(orgao_decreto, orgao_decreto_nome, sep = " - ")) %>%
  group_by(acao, orgao_decreto, uo, fonte, gnd, mod, variavel) %>%
  summarise(valor = sum(valor)) %>%
  ungroup()

perfil_gnd <- base_acoes %>%
  filter(variavel == variavel_principal) %>%
  group_by(acao) %>%
  mutate(total_acao = sum(valor)) %>%
  group_by(acao, gnd) %>%
  mutate(total_gnd = sum(valor)) %>%
  group_by(acao, gnd) %>%
  summarise(percent_gnd = first(total_gnd / total_acao)) %>%
  ungroup() %>%
  #unite("classificador", c(id_info,grupo), remove = TRUE) %>%
  spread(gnd, percent_gnd)

perfil_mod <- base_acoes %>%
  filter(variavel == variavel_principal) %>%
  group_by(acao) %>%
  mutate(total_acao = sum(valor)) %>%
  group_by(acao, mod) %>%
  mutate(total_mod = sum(valor)) %>%
  group_by(acao, mod) %>%
  summarise(percent_mod = first(total_mod / total_acao)) %>%
  ungroup() %>%
  #unite("classificador", c(id_info,grupo), remove = TRUE) %>%
  spread(mod, percent_mod)

principais_orgaos <- base_acoes %>%
  filter(variavel == variavel_principal) %>%
  group_by(acao, orgao_decreto) %>%
  summarise(valor = sum(valor)) %>%
  arrange(desc(valor)) %>%
  mutate(ranking = paste0("orgao_valor_", ifelse(row_number()>5, 6, row_number())),
         orgao_decreto = ifelse(row_number()>5, "Demais", orgao_decreto)) %>%
  group_by(acao, orgao_decreto, ranking) %>%
  summarize(valor = sum(valor)) %>%
  ungroup() %>%
  arrange(acao, ranking) %>%
  unite("orgao_valor", c(orgao_decreto, valor), sep = "__", remove = TRUE) %>%
  spread(ranking, orgao_valor)

perfil_fonte <- base_acoes %>%
  filter(variavel == variavel_principal) %>%
  group_by(acao) %>%
  mutate(total_acao = sum(valor)) %>%
  group_by(acao, fonte) %>%
  mutate(total_fonte = sum(valor)) %>%
  group_by(acao, fonte) %>%
  summarise(percent_fonte = first(total_fonte / total_acao)) %>%
  ungroup() %>%
  #unite("classificador", c(id_info,grupo), remove = TRUE) %>%
  spread(fonte, percent_fonte)
  
# junta tudo numa super tabela de acoes

base_acoes_export <- base_acoes %>%
  group_by(acao, variavel) %>%
  summarise(valor = sum(valor)) %>%
  spread(variavel, valor) %>%
  filter(!is.na(PLOA)) %>%
  ungroup() %>%
  left_join(perfil_gnd) %>%
  left_join(perfil_mod) %>%
  left_join(perfil_fonte) %>%
  left_join(principais_orgaos) %>%
  mutate(dot_atu = ifelse(is.na(dot_atu), 0, dot_atu),
         desp_paga = ifelse(is.na(desp_paga), 0, desp_paga)) 

write.csv(base_acoes_export, file = "./dados/dados_acoes.csv", fileEncoding = "utf-8")

# tab_fonte <- ploa %>%
#   select(fonte, descricaofonte) %>%
#   distinct() %>%
#   mutate(fonte = str_sub(fonte, 1, 3))

base_export_longa <- base_anexos_sumarizada %>% #base_variacoes %>%
  mutate(
    orgao_decreto_cod = orgao_decreto,
    orgao_decreto = paste(orgao_decreto_cod, orgao_decreto_nome, sep = " - "),  
    marcador = case_when(
      uo == "75101" ~ "divida",
      uo == "25917" ~ "rgps",
      TRUE ~ "demais")) %>%
  group_by(orgao_decreto, orgao_decreto_nome, agregador, anexo, marcador,
           acao, uo, nomeuo, fonte, gnd, mod, variavel) %>%
  summarise(valor = sum(valor)) %>%
  spread(variavel, valor, fill = 0) %>%
  filter(!is.na(PLOA)) %>% # (1)
  left_join(titulo_acao) %>%
  mutate(dot_atu = ifelse(is.na(dot_atu), 0, dot_atu),
         desp_paga = ifelse(is.na(desp_paga), 0, desp_paga)) 

sum(base_export_longa$PLOA)
sum(base_export_longa$dot_atu)
sum(base_export_longa$desp_paga)

base_export_longa %>% ungroup() %>% select(acao, funcao_tipica) %>% distinct() %>% count(acao) %>% filter(n > 1)
org <- base_export_longa %>% ungroup() %>% select(orgao_decreto, orgao_decreto_nome) %>% distinct()

write.csv(base_export_longa, file = "./dados/dados.csv", fileEncoding = "utf-8")

novas <- base_export %>% filter(PLOA > 0, dot_atu == 0) %>%
  group_by(acao) %>%
  summarise(sum(PLOA))

var <- base_export %>% filter(PLOA > 0, dot_atu > 0) %>%
  group_by(acao) %>%
  summarise_at(vars(PLOA, dot_atu), ~sum(.)) %>%
  ungroup() %>%
  mutate(var_pct = PLOA/dot_atu - 1) %>%
  mutate(aumento = ifelse(var_pct>0, "aumento", "diminuicao"),
         var_pct_mod = abs(var_pct),
         var_alt = ifelse(aumento == "aumento", PLOA/dot_atu, dot_atu/PLOA),
         var_abs = ifelse(aumento == "aumento", PLOA-dot_atu, dot_atu-PLOA) )

var %>% count(aumento)

ggplot(var) + 
  geom_jitter(aes(x = var_alt, #var_abs, 
                  y = aumento, color = aumento)) + 
  scale_x_log10()
  #xlim(0,1e10)

ggplot(base_export, aes(x = orgao_decreto)) +
  geom_col(aes(y = dot_atu), fill = "purple") +
  geom_col(aes(y = PLOA), fill = "goldenrod") +
  coord_flip()

base_export %>% 
  group_by(orgao_decreto) %>%
  summarise_at(vars(PLOA, dot_atu), .funs = ~sum(.)) %>%
  arrange(desc(PLOA))


teste <- base_export %>%
  group_by(orgao_decreto, orgao_decreto_nome, agregador, marcador) %>%
  summarise(PLOA = sum(PLOA))

# exploracao --------------------------------------------------------------

base_export$aumento %>% summary()
ggplot(base_export, aes(varia)) + geom_histogram()
ggplot(base_export, aes(varia)) + geom_boxplot()+ scale_x_log10()
ggplot(base_export, aes(varia)) + geom_jitter(aes(y = 1)) + xlim(c(-1e9, NA))
ggplot(base_export, aes(varia)) + geom_jitter(aes(y = 1)) + scale_x_log10()

ggplot(base_export, aes(x = varia, y = varia_pct, size = atu_total)) + geom_point()

sumario_agregador <- base_export %>%
  group_by(agregador) %>%
  summarise(total = sum(atu_total)) %>%
  arrange(desc(total))



ggplot(sumario_agregador, aes(y = reorder(agregador, total), x = total)) + geom_col()

edddrfdddqwtxxcdrtyuipxvzxcvbxggplot(base_export, aes(varia_pct)) + geom_histogram()
ggplot(base_export, aes(varia_pct)) + geom_jitter(aes(y = 1))


# exploracao por funcao tipica --------------------------------------------

ploa_funcao_tipica <- ploa %>%
  mutate(Orgao = paste(orgao, nomeorgao, sep = " - ")) %>%
  group_by(Orgao, funcao_tipica) %>%
  summarise(valor = sum(valor))

# nas <- ploa %>% filter(is.na(funcao_tipica))

ggplot(ploa_funcao_tipica %>% filter(str_sub(Orgao,1,1) == "2")) +
  geom_col(aes(x = valor, y = reorder(funcao_tipica, valor),
               fill = funcao_tipica)) +
  facet_wrap(~Orgao, scales = "free")

ggplot(ploa_funcao_tipica %>% filter(str_sub(Orgao,1,1) %in% c("2","3"),
                                     funcao_tipica != "09 - Previdência Social")) +
  geom_col(aes(x = valor, y = reorder(funcao_tipica, valor),
               fill = funcao_tipica)) +
  facet_wrap(~Orgao, scales = "free") +
  theme(legend.position = "none")

# acoes sem agregadores ---------------------------------------------------


ploa_ME <- base %>%
  filter(orgao_decreto == "25000", tipo_valor == "PLOA")

acoes_ME_sem_agregadores <- ploa_ME %>%
  filter(is.na(agregador)) %>%
  group_by(acao, tituloacao) %>%
  summarise(valor = sum(valor))

write.csv2(acoes_ME_sem_agregadores, 
           file = "./dados/dados_intermediarios/acoes_ME_sem_agregadores.csv",
           fileEncoding = "UTF-8"
           )


# dados alto nível para visualização --------------------------------------


ploa_ME_clean <- ploa_ME %>%
  filter(!is.na(agregador))

ploa_ME_clean_agrup_acao <- ploa_ME %>% #_clean %>%
  mutate(acao_completa = paste(acao, tituloacao)) %>%
  group_by(agregador, acao_completa) %>%
  summarise(valor = sum(valor))

# por funcao tipica

ploa_ME_clean_agrup_funcao <- ploa_ME %>% #_clean %>%
  mutate(agregador = ifelse(is.na(agregador), "Sem agregador", agregador)) %>%
  group_by(agregador, funcao_tipica) %>%
  #filter(agregador != "Benefícios Previdenciários") %>%
  summarise(valor = sum(valor))

write.csv(ploa_ME_clean_agrup_funcao, "./dados/dados_intermediarios/agrup_funcao_completa.csv")

ploa_ME_clean_funcoes <- ploa_ME %>% #_clean %>%
  group_by(descricaofuncao, funcao_tipica) %>%
  filter(funcao_tipica != "09 - Previdência Social") %>%
  summarise(valor = sum(valor))

write.csv(ploa_ME_clean_funcoes, "./dados/dados_intermediarios/funcoes.csv")


# estrutura dados para grafo ----------------------------------------------


nodes <- data.frame(
  nomes = c(
    unique(ploa_ME_clean_agrup_acao$agregador),
    unique(ploa_ME_clean_agrup_acao$acao_completa)
  ),
  tipo = c(
    rep("agregador", length(unique(ploa_ME_clean_agrup_acao$agregador))),
    rep("acao"     , length(unique(ploa_ME_clean_agrup_acao$acao_completa)))
  )) %>%
  mutate(
    id = row_number() -1
    ) %>%
  select(id, nomes, tipo)

links <- ploa_ME_clean_agrup_acao %>%
  ungroup() %>%
  left_join(nodes %>% select(-tipo), by = c("agregador" = "nomes")) %>%
  rename(target = id) %>%
  left_join(nodes %>% select(-tipo), by = c("acao_completa" = "nomes")) %>%
  rename(source = id) %>%
  select(source, target, value = valor)
  
forceNetwork(
  Links = links,
  Nodes = nodes,
  Source = "source",
  Target = "target",
  Value = 1,
  NodeID = "nomes",
  Group = "tipo",
  opacity = 0.8)

data_graph <- ploa_ME_clean_agrup_acao %>%
  mutate(acao_completa = str_sub(acao_completa, 1, 4)) %>%
  select(agregador, acao_completa, valor)

collapsibleTree::collapsibleTreeSummary(
  data_graph, 
  hierarchy = c("agregador", "acao_completa"), 
  root = "PLOA",
  width = 800,
  height = 800,
  attribute = "valor")


teste <- igraph::graph_from_data_frame(links, vertices = nodes)

tsa <- igraph_to_networkD3(teste)

radialNetwork(List = teste, fontSize = 10, opacity = 0.9)

URL <- paste0(
  "https://raw.githubusercontent.com/christophergandrud/networkD3/",
  "master/JSONdata/flare.json")

## Convert to list format
Flare <- jsonlite::fromJSON(URL, simplifyDataFrame = FALSE)

Flare$children = Flare$children[1:3]

diagonalNetwork(List = Flare, fontSize = 10, opacity = 0.9)


library(d3r)
library(sunburstR)

tree <- d3_nest(ploa_ME_clean_agrup_acao, value_cols = "valor")

sb1 <- sunburst(tree, width="100%", height=400)


teste_json <- jsonlite::fromJSON(tree, simplifyDataFrame = FALSE)
jsonlite::write_json(teste_json, "teste.json")

# agora com a estrutura hierárquica funcionou...
networkD3::diagonalNetwork(List = teste_json, fontSize = 10, opacity = 0.9)
networkD3::radialNetwork(List = teste_json, fontSize = 0, opacity = 0.9)
sunburst(teste_json, width="100%", height=400)
sunburst(
  tree,
  legend = FALSE,
  width = "100%",
  height = 400
)

# sem benefícios
ploa_hierarquia <- ploa_ME_clean_agrup_acao %>% 
  filter(agregador != "Benefícios Previdenciários") %>%
  rename(value = valor) %>%
  d3_nest(value_cols = "value")

jsonlite::write_json(
  jsonlite::fromJSON(ploa_hierarquia, simplifyDataFrame = FALSE), 
  "ploa.json")


# comparação entre os agrupadores

scatter <- ploa_ME_clean_agrup_acao %>% 
  filter(agregador != "Benefícios Previdenciários") %>%
  group_by(agregador) %>%
  summarise(soma = sum(valor),
            qde  = n())

ggplot(scatter, aes(x = soma, y = qde, color = qde == 1)) + 
  geom_point() +
  scale_x_log10() +
  labs(title = "Quantidade de ações e valor total no PLOA de cada agrupador")

catter %>% count(qde)
