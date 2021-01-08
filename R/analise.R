
# pacotes -----------------------------------------------------------------

library(tidyverse)
library(readxl)
#library(networkD3)
#library(igraph)
#library(collapsibleTree)



# carrega dados iniciais --------------------------------------------------

ploa_raw <- readxl::read_excel("./dados/dados_originais/SOF_PLOA_2021_STN_ajustada_gepla.xlsx", sheet = "ajustada")

dados_adicionais_raw <- readxl::read_excel("./dados/dados_originais/d2019_ploa.xlsx", skip = 8)

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
  "elemento", "elemento_descricao",
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
  rename(valor = `PLOA 2020 Mensagem Modificativa`) %>%
  mutate(tipo_valor = "PLOA",
         gnd = str_sub(naturezadespesa,2,2),
         mod = str_sub(naturezadespesa,3,4))

dados_adicionais <- dados_adicionais_raw %>%
  mutate(tipo_valor = "PLOA",
         fonte = str_sub(fonte, 3, 4))

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
           acao,
           tituloacao,
           subfuncao,
           gnd,
           mod,
           resultadoprimario,
           credito,
           ied) %>%
  summarise(valor = sum(valor)) %>%
  ungroup()
    

exercicio_ref <- 2021

base <- dados_combinados %>%
  left_join(orgaos) %>%
  left_join(agrupadores, by = "acao") %>%
  left_join(tab_funcao) %>%
  mutate(
    orgao_decreto = ifelse(is.na(orgao_decreto), orgao, orgao_decreto),
    orgao_decreto_nome = ifelse(is.na(orgao_decreto_nome), nomeorgao, orgao_decreto_nome),
    id_info = case_when(
      tipo_valor == "PLOA" & exercicio == "2019" ~ "ref",
      tipo_valor == "PLOA" & exercicio == "2021" ~ "atu"
    )
  )


# Incorpora informação dos anexos -----------------------------------------

acoes_PUC <- c("0090", "009V", "00HH", "00HT", "00HZ", "0019", "001T", "00J0", "00J8", "00JA", "00M9", "00MA", "00MG", "00MH", "00MI", "00MJ", "00MK", "00ML", "00MU", "00PA", "09JC", "09JD", "0A45", "0A45", "0A87", "0A88", "0A90", "0E45", "0E50", "0EB6", "0EC3", "0EC4")


acoes_defesa <- c("123B", "123G", "123H", "123I", "14LW", "14T0", "14T4", "14T5", "14T7", "14XJ", "2919")

uos_ressalvadas <- c("20225", "36201", "74910", "93381", "22202", "47204", "93181", "93436", "24901", "47205", "93201", "25300", "61201", "93202", "25301")

fontes_excetuadas <- c("16", "21", "70", "82", "50", "63", "80", "81", "93", "96")

base_anexos <- base %>%
  mutate(
    ressalvadas = case_when(
      orgao_decreto == "24000" &
        !(uo %in% c(" 24901", "74910", "93436")) &
        
      
      
      
      
    )
  )


# computar informacoes necessarias para a vis, por orgao e acao

perfil_gnd <- base %>%
  filter(orgao_decreto == "25000") %>%
  mutate(grupo = case_when(
    gnd == "1" ~ "Pessoal",
    gnd == "3" ~ "Custeio",
    gnd %in% c("4", "5") ~ "Investimento",
    TRUE ~ "Dívida")) %>%
  group_by(id_info, acao) %>%
  mutate(total_acao = sum(valor)) %>%
  group_by(id_info, acao, grupo) %>%
  mutate(total_gnd = sum(valor)) %>%
  group_by(id_info, acao, grupo) %>%
  summarise(percent_gnd = first(total_gnd / total_acao)) %>%
  ungroup() %>%
  unite("classificador", c(id_info,grupo), remove = TRUE) %>%
  spread(classificador, percent_gnd)
  
perfil_mod <- base %>%
  filter(orgao_decreto == "25000") %>%
  mutate(modalidade = case_when(
    str_sub(mod,1,1) == "9" ~ "Direta",
    TRUE ~ "Transferencia")) %>%
  group_by(id_info, acao) %>%
  mutate(total_acao = sum(valor)) %>%
  group_by(id_info, acao, modalidade) %>%
  mutate(total_mod = sum(valor)) %>%
  group_by(id_info, acao, modalidade) %>%
  summarise(percent_mod = first(total_mod / total_acao)) %>%
  ungroup() %>%
  unite("classificador", c(id_info, modalidade), remove = TRUE) %>%
  spread(classificador, percent_mod)

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
