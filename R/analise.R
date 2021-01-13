
# pacotes -----------------------------------------------------------------

library(tidyverse)
library(readxl)
#library(networkD3)
#library(igraph)
#library(collapsibleTree)



# carrega dados iniciais --------------------------------------------------

ploa_raw <- readxl::read_excel("./dados/dados_originais/SOF_PLOA_2021_STN_ajustada_gepla.xlsx", sheet = "ajustada")

dados_adicionais_raw <- readxl::read_excel("./dados/dados_originais/d2019_ME.xlsx", skip = 8)

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
         funcao_tipica = Funcao)

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

dados_combinados <-
  dados_combinados_raw %>%
  group_by(exercicio,
           tipo_valor,
           uo,
           orgao,
           nomeorgao,
           fonte,
           programa,
           acao,
           tituloacao,
           funcao,
           subfuncao,
           gnd,
           mod,
           resultadoprimario,
           credito,
           ied) %>%
  summarise(valor = sum(valor)) %>%
  ungroup()
    
#exercicio_ref <- 2021

base <- dados_combinados %>%
  left_join(orgaos) %>%
  left_join(agrupadores, by = "acao") %>%
  left_join(tab_funcao) %>%
  mutate(
    orgao_decreto = ifelse(is.na(orgao_decreto), orgao, orgao_decreto),
    orgao_decreto_nome = ifelse(is.na(orgao_decreto_nome), nomeorgao, orgao_decreto_nome)
  ) %>%
  filter(orgao_decreto == "25000")


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

# verifica se cada acao está vinculada apenas em um único anexo
base_anexos_verifica %>% 
  filter(pertence) %>%
  select(acao, anexo) %>%
  distinct() %>%
  group_by(acao) %>%
  count(anexo) %>%
  arrange(desc(n)) %>%
  filter(n>1)



# sumariza a base ---------------------------------------------------------

tipos_de_valor <- data.frame(
  tipo_valor = base_anexos_verifica %>% select(tipo_valor) %>% unique() %>% unlist(),
  variavel = c("desp_emp", "desp_liq", "desp_paga", "dot_atu", "RAP_inscritos", "RAP_pagos", "PLOA")
)

base_anexos_sumarizada <- base_anexos_verifica %>%
  group_by(
    orgao_decreto, orgao_decreto_nome, 
    anexo, 
    agregador, 
    acao, tituloacao, 
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
    TRUE ~ "Transferencia"))

# testes vis

ggplot(base_anexos_sumarizada %>% filter(variavel == "PLOA")) +
  geom_col(aes(y = valor, x = reorder(agregador, valor))) +
  coord_flip()

ggplot(base_anexos_sumarizada %>% filter(variavel == "PLOA")) +
  geom_col(aes(y = valor, x = anexo)) +
  coord_flip()

base_anexos_sumarizada %>% 
  filter(variavel == "desp_emp") %>%
  group_by(anexo) %>%
  summarise(sum(valor))

# Para ter ideia do máximo de fontes por ação
base_anexos_sumarizada %>% select(acao, fonte) %>% distinct() %>% count(acao) %>% arrange(desc(n))

# para ter ideia da quantidade acoes por anexo e por agrupador
base_anexos_sumarizada %>% select(anexo, acao) %>% distinct() %>% count(anexo) %>% arrange(desc(n))
base_anexos_sumarizada %>% select(agregador, acao) %>% distinct() %>% count(agregador) %>% arrange(desc(n))

# computa dados para os cards das ações -----------------------------------

variavel_principal <- "PLOA" # eventualmente pode se algo mais sofisticado aqui, tipo um id que podemos criar para identificar um tipo de valor de um determinado exercício

perfil_gnd <- base_anexos_sumarizada %>%
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
  
perfil_mod <- base_anexos_sumarizada %>%
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

principais_fontes <- base_anexos_sumarizada %>%
  

base_acao <- base %>%
  filter(orgao_decreto == "25000") %>%
  group_by(agregador, funcao_tipica, acao, id_info) %>%
  summarise(total = sum(valor)) %>%
  ungroup() %>%
  mutate(id_info = paste(id_info, "total", sep = "_")) %>%
  spread(id_info, total) %>%
  mutate(acao_nova = is.na(ref_total),
         acao_extinta = is.na(atu_total)) %>%
  filter(!acao_extinta) %>%
  mutate(varia = atu_total - ref_total,
         varia_pct = (atu_total / ref_total - 1) * 100)

base_pre_stack <- base_acao %>%
  left_join(perfil_gnd) %>%
  left_join(perfil_mod)





variaveis_de_interesse <- c("agregador", "funcao_tipica")

base_stack <- base_pre_stack

for (var in variaveis_de_interesse) {
  quo_var <- sym(var) # transforma "var", que é string, num símbolo
  
  base_stack <- base_stack %>%
    group_by(!! quo_var) %>%
    mutate(!! paste0("pos_ini_", var) := cumsum(atu_total) - atu_total) %>%
    ungroup()
}

base_export <- base_stack

write.csv(base_export, file = "./dados/dados.csv", fileEncoding = "utf-8")

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

# limita escopo ao ME -----------------------------------------------------

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
