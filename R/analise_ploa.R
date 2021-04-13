library(tidyverse)
library(readxl)
library(extrafont)
loadfonts()


# theme -------------------------------------------------------------------

cor_ploa2021 <- "#325E34"
cor_ploa2020 <- "#C9DC28"
vetor_cor <- c("ploa2021" = cor_ploa2021, "ploa2020" = cor_ploa2020)

tema<- function(){
  theme_minimal() +
    theme(
      text = element_text(family = "Source Sans Pro", colour = "grey20"),
      axis.text = element_text(family = "Source Sans Pro", colour = "grey20"),
      axis.ticks.x = element_line(),
      title = element_text(face = "bold"),
      plot.subtitle = element_text(face = "plain"),
      plot.caption = element_text(face = "italic"),
      panel.grid.major.y = element_blank(), 
      panel.grid.minor = element_blank(),
      legend.text = element_text(size = 8),
      legend.title = element_text(size = 8),
      legend.position = 'bottom')
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
  mutate(variacao = ploa2021 - ploa2020) %>%
  rename(acao_nome = acao) %>%
  mutate(acao = str_sub(acao_nome, 1, 4)) %>%
  left_join(lista_acoes) %>%
  mutate(acao_longa = ifelse(is.na(acao_longa), acao_nome, acao_longa))

ploa %>% filter(is.na(acao_longa))

# Inversões ---------------------------------------------------------------

inversoes <- ploa %>%
  filter(str_sub(gnd, 1, 1) == "5") %>%
  group_by(funcao, acao_longa) %>%
  summarise_if(is.numeric, .funs = ~sum(.)) %>%
  filter(abs(variacao) > corte) %>%
  arrange(desc(variacao)) %>%
  gather(ploa2021, ploa2020, key = "ano", value = "valor")

ggplot(inversoes, aes(y = acao_longa)) +
  geom_col(aes(x = valor, fill = ano), position = position_dodge(width = .6), width = .5) +
  scale_y_discrete(labels = function(x) str_wrap(x, width = 40)) +
  scale_x_continuous(labels = function(x) {format(x/1e9, big.mark = ".", decimal.mark=",", scientific = FALSE)}) +
  scale_fill_manual(values = vetor_cor) +
  labs(x = NULL, y = NULL, fill = NULL) +
  tema()

