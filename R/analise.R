
# pacotes -----------------------------------------------------------------

library(tidyverse)
library(readxl)
library(networkD3)
library(igraph)
library(collapsibleTree)



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
  rename(valor = `PLOA 2020 Mensagem Modificativa`) %>%
  mutate(tipo_valor = "PLOA") %>%
  left_join(orgaos) %>%
  left_join(agrupadores, by = "acao")



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



# estrutura dados para grafo ----------------------------------------------

ploa_ME_clean <- ploa_ME %>%
  filter(!is.na(agregador))

ploa_ME_clean_agrup_acao <- ploa_ME %>% #_clean %>%
  mutate(acao_completa = paste(acao, tituloacao)) %>%
  group_by(agregador, acao_completa) %>%
  summarise(valor = sum(valor))

write.csv(ploa_ME_clean_agrup_acao, "./dados/dados_intermediarios/agrup_acao.csv")

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
