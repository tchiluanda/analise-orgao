library(tidyverse)
library(readxl)
library(extrafont)
loadfonts()


# theme -------------------------------------------------------------------

cor_ploa2021 <- "#325E34"
cor_ploa2020 <- "#C9DC28"
vetor_cor <- c("ploa2021" = cor_ploa2021, "dot2020" = cor_ploa2020, "TRUE" = "#DC143C", "FALSE" = "steelblue")

tema<- function(){
  theme_minimal() +
    theme(
      text = element_text(family = "Source Sans Pro", colour = "grey20"),
      axis.text = element_text(size = 8, family = "Source Sans Pro", colour = "grey20"),
      axis.ticks.x = element_line(),
      title = element_text(face = "bold"),
      plot.subtitle = element_text(face = "plain"),
      plot.caption = element_text(face = "italic"),
      panel.grid.major.y = element_blank(), 
      panel.grid.minor = element_blank(),
      legend.text = element_text(size = 8),
      legend.title = element_text(size = 8),
      legend.position = 'none')
}

readxl::excel_sheets("./other/analise/ploa_analise.xlsx")

ploa_raw <- readxl::read_excel("./other/analise/ploa_analise.xlsx", sheet = "exportar") %>% select(- `Fonte Recursos`)

# peguei do painel do siop, pedindo para exportar do excel a partir da página inicial
lista_acoes <- readxl::read_excel("./other/analise/ploa_analise.xlsx", sheet = "lista_acao") %>%
  group_by(acao) %>%
  summarise(acao_longa = first(acao_longa))

names(ploa_raw) <- c("classificador", "fontes", "orgao", "gnd", "funcao", "subfuncao", "programa", "acao", "elemento", "ploa2021", "ploa2020", "dot2020")

corte <- 1e9

ploa <- ploa_raw %>%
  mutate_if(is.numeric, replace_na, replace = 0) %>%
  select(-ploa2020) %>%
  mutate(variacao = ploa2021 - dot2020) %>% #ploa2020
  rename(acao_nome = acao) %>%
  mutate(acao = str_sub(acao_nome, 1, 4)) %>%
  left_join(lista_acoes) %>%
  mutate(acao_longa = ifelse(is.na(acao_longa), acao_nome, acao_longa))

ploa %>% filter(is.na(acao_longa))


# helpers -----------------------------------------------------------------

gera_dataset <- function(data) {
  
  {{data}} %>%
    group_by(funcao, acao_longa) %>%
    summarise_if(is.numeric, .funs = ~sum(.)) %>%
    filter(abs(variacao) > corte) %>%
    arrange(desc(variacao)) %>%
    gather(ploa2021, dot2020, key = "ano", value = "valor") #ploa2020
  
}

plota <- function(data, distancia = 1e9) {
  
  ggplot({{data}}, aes(y = acao_longa, x = valor)) +
    geom_col(aes(fill = ano), position = position_dodge(width = .6), width = .5) +
    geom_text(aes(label = format(round(valor/1e9,0), big.mark = ".", decimal.mark=",", scientific = FALSE), color = ano, x = valor + distancia), family = "Source Sans Pro", size = 3, fontface = "bold", position = position_dodge(width = .6), vjust = "center", hjust = "left") +
    geom_text(
      aes(
        label = paste0(
          ifelse(variacao>0,"+",""),
          format(round(variacao/1e9,0), big.mark = ".", decimal.mark=",", scientific = FALSE)), 
        color = variacao > 0, x = 0), 
      family = "Source Sans Pro", 
      size = 2, 
      fontface = "bold", 
      vjust = "center", 
      hjust = "right", 
      nudge_x = -distancia) +
    scale_y_discrete(labels = function(x) str_wrap(x, width = 50)) +
    scale_x_continuous(labels = function(x) {format(x/1e9, big.mark = ".", decimal.mark=",", scientific = FALSE)}) +
    scale_fill_manual(values = vetor_cor) +
    scale_color_manual(values = vetor_cor) +
    labs(x = NULL, y = NULL, fill = NULL) +
    tema()
  
}

# Inversões ---------------------------------------------------------------

inv <- ploa %>%
  filter(str_sub(gnd, 1, 1) == "5") %>%
  gera_dataset()

plota(inv) #+ facet_wrap(~funcao, scales = "free")
ggsave("./other/analise/inv.png", plot = last_plot(), width = 7, height = 5)

# Pessoal -----------------------------------------------------------------

pes <- ploa %>%
  filter(str_sub(gnd, 1, 1) == "1") %>%
  gera_dataset()

plota(pes) #+ facet_wrap(~funcao, scales = "free")
ggsave("./other/analise/pes.png", plot = last_plot(), width = 6, height = 4)



# Investimentos -----------------------------------------------------------

invest <- ploa %>%
  filter(str_sub(gnd, 1, 1) == "4") %>%
  gera_dataset()

plota(invest, distancia = 1e8) #+ facet_wrap(~funcao)
ggsave("./other/analise/invest.png", plot = last_plot(), width = 7, height = 4)



# transferencias ----------------------------------------------------------

transf <- ploa %>%
  filter(classificador == "Transferências Constituicionais") %>%
  gera_dataset()

plota(transf)

ggsave("./other/analise/transf.png", plot = last_plot(), width = 9, height = 6)


# Demais saude e assistencia -------------------------------

demais_saude_assistencia <- ploa %>%
  filter(classificador == "Demais custeio", funcao %in% c("08 - Assistência Social", "09 - Saúde")) %>%
  gera_dataset()

plota(demais_saude_assistencia, distancia = 2e9) #+ facet_wrap(~funcao, scales = 'free')
ggsave("./other/analise/demais_saude_assistencia.png", plot = last_plot(), width = 7, height = 4)


# demais outras funcoes ---------------------------------------------------

demais_outras_funcoes <- ploa %>%
  filter(classificador == "Demais custeio", !(funcao %in% c("08 - Assistência Social", "09 - Saúde"))) %>%
  gera_dataset() %>%
  ungroup() %>%
  group_by(acao_longa, ano) %>%
  summarise(valor = sum(valor),
            variacao = sum(variacao)) %>%
  filter(abs(variacao) > corte)

plota(demais_outras_funcoes)

ggsave("./other/analise/demais_outras_funcoes.png", plot = last_plot(), width = 7, height = 5.5)


# beneficios --------------------------------------------------------------

rgps <- ploa %>%
  filter(classificador == "Benefícios do RGPS") %>%
  gera_dataset() 

plota(rgps, distancia = 5e9)

ggsave("./other/analise/rgps.png", plot = last_plot(), width = 7, height = 4)


# divida ------------------------------------------------------------------

divida <- ploa %>%
  filter(classificador == "Dívida") %>%
  gera_dataset() 

plota(divida, distancia = 1e10)

ggsave("./other/analise/divida.png", plot = last_plot(), width = 8.6, height = 3.8)

# Planilhona --------------------------------------------------------------

planilha <- ploa %>%
  group_by(orgao, acao_longa) %>%
  summarise_if(is.numeric, .funs = ~sum(.)) %>%
  filter(abs(variacao) > corte) 
