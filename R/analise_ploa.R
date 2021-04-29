library(tidyverse)
library(readxl)
library(extrafont)
loadfonts()


# theme -------------------------------------------------------------------

cor_ploa2021 <- "steelblue" #"#325E34"
cor_ploa2020 <- "lightsteelblue" #C9DC28"
vetor_cor <- c("ploa2021" = cor_ploa2021, "ploa2020" = cor_ploa2020, "TRUE" = "firebrick", "FALSE" = "forestgreen")

tema<- function(){
  theme_minimal() +
    theme(
      text = element_text(family = "Inter", colour = "grey20"),
      axis.text = element_text(size = 8, family = "Inter", colour = "grey20"),
      axis.ticks.x = element_line(),
      title = element_text(face = "bold"),
      plot.subtitle = element_text(face = "plain"),
      plot.caption = element_text(face = "italic"),
      panel.grid.major.y = element_blank(), 
      panel.grid.minor = element_blank(),
      legend.text = element_text(size = 8),
      legend.title = element_text(size = 8),
      legend.position = 'none',
      plot.margin = margin(0, 1, 0, 0, unit = "cm"))
}

#readxl::excel_sheets("./other/analise/ploa_analise.xlsx")

ploa_raw <- readxl::read_excel("./other/analise/ploa_analise.xlsx", sheet = "exportar_sem_emendas_ce") #%>% select(- `Fonte Recursos`)

# peguei do painel do siop, pedindo para exportar do excel a partir da página inicial
lista_acoes <- readxl::read_excel("./other/analise/ploa_analise.xlsx", sheet = "lista_acao") %>%
  group_by(acao) %>%
  summarise(acao_longa = first(acao_longa))

names(ploa_raw) <- c("classificador", "fontes", "orgao", "gnd", "funcao", "subfuncao", "programa", "acao", "elemento", "ploa2021", "ploa2020", "dot2020")

dput(ploa$classificador %>% unique())

classificadores <- c(
  "1 - PESSOAL E ENCARGOS SOCIAIS" = "Pessoal", 
  "Benefícios do RGPS" = "Benefícios do RGPS",
  "Transferências Constituicionais" = "Transferências Constituicionais",
  "Demais custeio" = "Demais custeio",
  "4 - INVESTIMENTOS" = "Investimentos",
  "5 - INVERSOES FINANCEIRAS" = "Inversões Financeiras",
  "Dívida" = "Dívida",
  "9 - RESERVA DE CONTINGENCIA" = "Reserva de Contingência")

classificadores_levels <- c(
  "1 - PESSOAL E ENCARGOS SOCIAIS", 
  "Benefícios do RGPS",
  "Transferências Constituicionais",
  "Demais custeio",
  "4 - INVESTIMENTOS",
  "5 - INVERSOES FINANCEIRAS",
  "Dívida",
  "9 - RESERVA DE CONTINGENCIA")



corte <- 1e9

ploa <- ploa_raw %>%
  mutate_if(is.numeric, replace_na, replace = 0) %>%
  mutate(classificador = factor(classificador, level = rev(classificadores_levels), labels = rev(classificadores))) %>%
  select(-dot2020) %>%
  mutate(variacao = ploa2021 - ploa2020) %>% #dot2020
  rename(acao_nome = acao) %>%
  mutate(acao = str_sub(acao_nome, 1, 4)) %>%
  left_join(lista_acoes) %>%
  mutate(acao_longa = ifelse(is.na(acao_longa), acao_nome, acao_longa))

ploa %>% filter(is.na(acao_longa))

# visao geral -------------------------------------------------------------

visao_geral <- ploa %>%
  group_by() %>%
  summarise_if(is.numeric, .funs = ~sum(.)) %>%
  arrange(desc(ploa2021)) %>%
  gather(ploa2021, ploa2020, key = "ano", value = "valor")

ggplot(visao_geral, aes(y = ano, x = valor)) +
  geom_col(aes(fill = ano), position = position_dodge(width = .6), width = .5) +
  geom_text(aes(label = format(round(valor/1e9,0), big.mark = ".", decimal.mark=",", scientific = FALSE), color = ano, x = valor + 1e11), family = "Inter", size = 3, fontface = "bold", position = position_dodge(width = .6), vjust = "center", hjust = "left") +
  scale_y_discrete(labels = c("ploa2021" = "PLOA 2021", "ploa2020" = "PLOA 2020")) +
  scale_x_continuous(labels = function(x) {format(x/1e9, big.mark = ".", decimal.mark=",", scientific = FALSE)}) +
  coord_cartesian(clip = "off") +
  scale_fill_manual(values = vetor_cor) +
  scale_color_manual(values = vetor_cor) +
  labs(x = NULL, y = NULL, fill = NULL) +
  tema()

ggsave("./other/analise/doc/visao_geral.png", plot = last_plot(), width = 5, height = 2.7)

# visao geral classificadores ---------------------------------------------

visao_classificador_divida_demais <- ploa %>%
  mutate(classificador = ifelse(classificador == "Dívida", "Dívida", "Demais")) %>%
  group_by(classificador) %>%
  summarise_if(is.numeric, .funs = ~sum(.)) %>%
  arrange(desc(ploa2021)) %>%
  gather(ploa2021, ploa2020, key = "ano", value = "valor")

visao_classificador <- ploa %>%
  filter(classificador != "Dívida") %>%
  group_by(classificador) %>%
  summarise_if(is.numeric, .funs = ~sum(.)) %>%
  arrange(desc(ploa2021)) %>%
  gather(ploa2021, ploa2020, key = "ano", value = "valor")

ggplot(visao_classificador_divida_demais, aes(y = classificador, x = valor)) +
  geom_col(aes(fill = ano), position = position_dodge(width = .6), width = .5) +
  geom_text(aes(label = format(round(valor/1e9,0), big.mark = ".", decimal.mark=",", scientific = FALSE), color = ano, x = valor + 1e9), family = "Inter", size = 3, fontface = "bold", position = position_dodge(width = .6), vjust = "center", hjust = "left") +
  geom_text(
    aes(
      label = paste0(
        ifelse(variacao>0,"+",""),
        format(round(variacao/1e9,0), big.mark = ".", decimal.mark=",", scientific = FALSE)), 
      color = variacao > 0, x = 0), 
    family = "Inter", 
    size = 2.5, 
    fontface = "bold", 
    vjust = "center", 
    hjust = "right", 
    nudge_x = -1e9) +
  scale_y_discrete(labels = function(x) str_wrap(x, width = 50)) +
  scale_x_continuous(labels = function(x) {format(x/1e9, big.mark = ".", decimal.mark=",", scientific = FALSE)}) +
  scale_fill_manual(values = vetor_cor) +
  scale_color_manual(values = vetor_cor) +
  coord_cartesian(clip = "off") +
  labs(x = NULL, y = NULL, fill = NULL) +
  tema()

ggsave("./other/analise/doc/visao_geral_divida_demais.png", plot = last_plot(), width = 5, height = 3)

ggplot(visao_classificador, aes(y = classificador, x = valor)) +
  geom_col(aes(fill = ano), position = position_dodge(width = .6), width = .5) +
  geom_text(aes(label = format(round(valor/1e9,0), big.mark = ".", decimal.mark=",", scientific = FALSE), color = ano, x = valor + 1e9), family = "Inter", size = 3, fontface = "bold", position = position_dodge(width = .6), vjust = "center", hjust = "left") +
  geom_text(
    aes(
      label = paste0(
        ifelse(variacao>0,"+",""),
        format(round(variacao/1e9,0), big.mark = ".", decimal.mark=",", scientific = FALSE)), 
      color = variacao > 0, x = 0), 
    family = "Inter", 
    size = 2.5, 
    fontface = "bold", 
    vjust = "center", 
    hjust = "right", 
    nudge_x = -1e9) +
  scale_y_discrete(labels = function(x) str_wrap(x, width = 50)) +
  scale_x_continuous(labels = function(x) {format(x/1e9, big.mark = ".", decimal.mark=",", scientific = FALSE)}) +
  scale_fill_manual(values = vetor_cor) +
  scale_color_manual(values = vetor_cor) +
  coord_cartesian(clip = "off") +
  labs(x = NULL, y = NULL, fill = NULL) +
  tema()

ggsave("./other/analise/doc/visao_geral_classificadores.png", plot = last_plot(), width = 5, height = 4)


# classificadores com emissão ---------------------------------------------

visao_classificador_emissao <- ploa %>%
  filter(classificador != "Dívida", fontes == "Fontes de emissão") %>%
  group_by(classificador) %>%
  summarise_if(is.numeric, .funs = ~sum(.)) %>%
  arrange(desc(ploa2021)) %>%
  gather(ploa2021, ploa2020, key = "ano", value = "valor_emissao") %>%
  arrange(classificador)

visao_classificador_emissao$total <- visao_classificador %>% arrange(classificador) %>% .$valor

visao_classificador_emissao <- visao_classificador_emissao %>%
  mutate(pct = valor_emissao / total)

  
# tinha feito uma gambiarra para colocar a barra bem estreita com width = .2 e um size grande (3), para o contorno da barra parecer a própria barra. para os valores zerados das barras menores, usei uma escala de size.

ggplot(visao_classificador, aes(y = classificador, x = valor)) +
  geom_col(aes(fill = ano), position = position_dodge(width = .6), width = .5,) +
  
  geom_col(data = visao_classificador_emissao, aes(y = classificador, x = valor_emissao, color = ano), position = position_dodge(width = .6), width = .5, fill = "goldenrod", size = .1) +
  
  geom_text(data = visao_classificador_emissao, aes(label = scales::percent(pct), color = ano, x = total + 1e9), family = "Inter", size = 3, fontface = "bold", position = position_dodge(width = .6), vjust = "center", hjust = "left") +
  
  # geom_label(data = visao_classificador_emissao, aes(y = classificador, x = valor_emissao + 1e9, label = scales::percent(pct), fill = ano), family = "Inter", size = 2, fontface = "bold", position = position_dodge(width = .6), vjust = "center", hjust = "left", color = "white") +

  scale_y_discrete(labels = function(x) str_wrap(x, width = 50)) +
  scale_x_continuous(labels = function(x) {format(x/1e9, big.mark = ".", decimal.mark=",", scientific = FALSE)}) +
  scale_size_manual(values = c("com_barra" = 3, "sem_barra" = 0)) +
  scale_fill_manual(values = vetor_cor) +
  scale_color_manual(values = c("ploa2021" = "darkgoldenrod", "ploa2020" = "darkgoldenrod")) +
  coord_cartesian(clip = "off") +
  labs(x = NULL, y = NULL, fill = NULL) +
  tema()

ggsave("./other/analise/doc/visao_geral_classificadores_emissao.png", plot = last_plot(), width = 5, height = 4)


# total_emissao -----------------------------------------------------------

ploa_emissao <- ploa %>%
  filter(classificador != "Dívida", fontes == "Fontes de emissão") %>% 
  group_by() %>% 
  summarise_if(is.numeric, sum) %>% 
  gather(ploa2021, ploa2020, key = "ano", value = "valor")

ggplot(ploa_emissao, aes(y = ano, x = valor)) +
  geom_col(aes(fill = ano), position = position_dodge(width = .6), width = .5) +
  geom_text(aes(label = format(round(valor/1e9,0), big.mark = ".", decimal.mark=",", scientific = FALSE), color = ano, x = valor + 1e11), family = "Inter", size = 3, fontface = "bold", position = position_dodge(width = .6), vjust = "center", hjust = "left") +
  scale_y_discrete(labels = c("ploa2021" = "PLOA 2021", "ploa2020" = "PLOA 2020")) +
  scale_x_continuous(labels = function(x) {format(x/1e9, big.mark = ".", decimal.mark=",", scientific = FALSE)}) +
  coord_cartesian(clip = "off") +
  scale_fill_manual(values = vetor_cor) +
  scale_color_manual(values = vetor_cor) +
  labs(x = NULL, y = NULL, fill = NULL) +
  tema()

ggsave("./other/analise/doc/visao_geral_emissao.png", plot = last_plot(), width = 5, height = 2)


# helpers -----------------------------------------------------------------

gera_dataset <- function(data) {
  
  {{data}} %>%
    group_by(funcao, acao_longa) %>%
    summarise_if(is.numeric, .funs = ~sum(.)) %>%
    filter(abs(variacao) > corte) %>%
    arrange(desc(variacao)) %>%
    gather(ploa2021, ploa2020, key = "ano", value = "valor") #ploa2020
  
}

plota <- function(data, distancia = 1e9) {
  
  ggplot({{data}}, aes(y = reorder(acao_longa, variacao), x = valor)) +
    geom_col(aes(fill = ano), position = position_dodge(width = .6), width = .5) +
    geom_text(aes(label = format(round(valor/1e9,0), big.mark = ".", decimal.mark=",", scientific = FALSE), color = ano, x = valor + distancia), family = "Inter", size = 3, fontface = "bold", position = position_dodge(width = .6), vjust = "center", hjust = "left") +
    geom_text(
      aes(
        label = paste0(
          ifelse(variacao>0,"+",""),
          format(round(variacao/1e9,0), big.mark = ".", decimal.mark=",", scientific = FALSE)), 
        color = variacao > 0, x = 0), 
      family = "Inter", 
      size = 2, 
      fontface = "bold", 
      vjust = "center", 
      hjust = "right", 
      nudge_x = -distancia) +
    scale_y_discrete(labels = function(x) str_wrap(x, width = 50)) +
    scale_x_continuous(labels = function(x) {format(x/1e9, big.mark = ".", decimal.mark=",", scientific = FALSE)}) +
    scale_fill_manual(values = vetor_cor) +
    scale_color_manual(values = vetor_cor) +
    coord_cartesian(clip = "off") +
    labs(x = NULL, y = NULL, fill = NULL) +
    tema()
  
}

# Inversões ---------------------------------------------------------------

inv <- ploa %>%
  filter(str_sub(gnd, 1, 1) == "5") %>%
  gera_dataset()

plota(inv) #+ facet_wrap(~funcao, scales = "free")
ggsave("./other/analise/doc/inv.png", plot = last_plot(), width = 7, height = 5)

# Pessoal -----------------------------------------------------------------

pes <- ploa %>%
  filter(str_sub(gnd, 1, 1) == "1") %>%
  gera_dataset()

plota(pes) #+ facet_wrap(~funcao, scales = "free")
ggsave("./other/analise/doc/pes.png", plot = last_plot(), width = 6, height = 4)



# Investimentos -----------------------------------------------------------

invest <- ploa %>%
  filter(str_sub(gnd, 1, 1) == "4") %>%
  gera_dataset(corte = 500e6)

plota(invest, distancia = 1e8) #+ facet_wrap(~funcao)
ggsave("./other/analise/doc/invest.png", plot = last_plot(), width = 7, height = 4)



# transferencias ----------------------------------------------------------

transf <- ploa %>%
  filter(classificador == "Transferências Constituicionais") %>%
  gera_dataset()

plota(transf)

ggsave("./other/analise/doc/transf.png", plot = last_plot(), width = 6.5, height = 5)


# Demais saude e assistencia -------------------------------

demais_saude_assistencia <- ploa %>%
  filter(classificador == "Demais custeio", funcao %in% c("08 - Assistência Social", "09 - Saúde")) %>%
  gera_dataset()

plota(demais_saude_assistencia, distancia = 2e9) 
#+ facet_wrap(~funcao, scales = 'free')



ggsave("./other/analise/doc/demais_saude_assistencia.png", plot = last_plot(), width = 7, height = 4)


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

ggsave("./other/analise/doc/demais_outras_funcoes.png", plot = last_plot(), width = 7, height = 4.5)


# beneficios --------------------------------------------------------------

rgps <- ploa %>%
  filter(classificador == "Benefícios do RGPS") %>%
  gera_dataset() 

plota(rgps, distancia = 5e9)

ggsave("./other/analise/doc/rgps.png", plot = last_plot(), width = 6, height = 4)


# divida ------------------------------------------------------------------

divida <- ploa %>%
  filter(classificador == "Dívida") %>%
  gera_dataset() 

plota(divida, distancia = 1e10)

ggsave("./other/analise/doc/divida.png", plot = last_plot(), width = 8.6, height = 3.8)


# por orgao ---------------------------------------------------------------

ploa %>% filter(classificador %in% c("Dívida", "Transferências Constitucionais", "Benefícios do RGPS")) %>% group_by(orgao) %>% summarise_if(is.numeric, sum) %>% arrange(desc(ploa2021))

por_orgao <- ploa %>%
  filter(!(classificador %in% c("Dívida", "Transferências Constituicionais", "Benefícios do RGPS"))) %>%
  filter(as.numeric(str_sub(orgao, 1, 5)) > 20000) %>%
  filter(!(as.numeric(str_sub(orgao, 1, 5)) %in% c(29000, 34000, 59000))) %>%
  group_by(orgao) %>% summarise_if(is.numeric, sum) %>% arrange(variacao) %>% 
  ungroup() %>%
  mutate(orgao = fct_reorder(orgao, ploa2021),
         faixa = cut(ploa2021, breaks = c(0, 10e9, 100e9, Inf), labels = c("Até 10bi", "10 a 100bi", "Mais de 100bi"))) %>%
  gather(ploa2021, ploa2020, key = "ano", value = "valor")


ggplot(por_orgao %>% filter(faixa == "10 a 100bi"), aes(y = orgao, x = valor)) +
  geom_col(aes(fill = ano), position = position_dodge(width = .6), width = .5) +
  geom_text(aes(label = format(round(valor/1e9,0), big.mark = ".", decimal.mark=",", scientific = FALSE), color = ano, x = valor + 1e9), family = "Inter", size = 3, fontface = "bold", position = position_dodge(width = .6), vjust = "center", hjust = "left") +
  geom_text(
    aes(
      label = paste0(
        ifelse(variacao>0,"+",""),
        format(round(variacao/1e9,0), big.mark = ".", decimal.mark=",", scientific = FALSE)), 
      color = variacao > 0, x = 0), 
    family = "Inter", 
    size = 2.5, 
    fontface = "bold", 
    vjust = "center", 
    hjust = "right", 
    nudge_x = -1e9) +
  scale_y_discrete(labels = function(x) str_wrap(x, width = 50)) +
  scale_x_continuous(labels = function(x) {format(x/1e9, big.mark = ".", decimal.mark=",", scientific = FALSE)}) +
  scale_fill_manual(values = vetor_cor) +
  scale_color_manual(values = vetor_cor) +
  coord_cartesian(clip = "off") +
  labs(x = NULL, y = NULL, fill = NULL) +
  tema() #+ facet_wrap(~faixa, scales = 'free', ncol = 1)

ggsave("./other/analise/doc/orgaos_ate100.png", plot = last_plot(), width = 6, height = 4)


ggplot(por_orgao %>% filter(faixa == "Mais de 100bi"), aes(y = orgao, x = valor)) +
  geom_col(aes(fill = ano), position = position_dodge(width = .6), width = .5) +
  geom_text(aes(label = format(round(valor/1e9,0), big.mark = ".", decimal.mark=",", scientific = FALSE), color = ano, x = valor + 1e9), family = "Inter", size = 3, fontface = "bold", position = position_dodge(width = .6), vjust = "center", hjust = "left") +
  geom_text(
    aes(
      label = paste0(
        ifelse(variacao>0,"+",""),
        format(round(variacao/1e9,0), big.mark = ".", decimal.mark=",", scientific = FALSE)), 
      color = variacao > 0, x = 0), 
    family = "Inter", 
    size = 2.5, 
    fontface = "bold", 
    vjust = "center", 
    hjust = "right", 
    nudge_x = -1e9) +
  scale_y_discrete(labels = function(x) str_wrap(x, width = 50)) +
  scale_x_continuous(labels = function(x) {format(x/1e9, big.mark = ".", decimal.mark=",", scientific = FALSE)}) +
  scale_fill_manual(values = vetor_cor) +
  scale_color_manual(values = vetor_cor) +
  coord_cartesian(clip = "off") +
  labs(x = NULL, y = NULL, fill = NULL) +
  tema() #+ facet_wrap(~faixa, scales = 'free', ncol = 1)

ggsave("./other/analise/doc/orgaos_mais100.png", plot = last_plot(), width = 6, height = 4)



por_orgao_ME <- ploa %>%
  filter(!(classificador %in% c("Dívida", "Transferências Constituicionais", "Benefícios do RGPS"))) %>%
  filter(as.numeric(str_sub(orgao, 1, 5)) > 20000) %>%
  filter(as.numeric(str_sub(orgao, 1, 5)) == 25000) %>%
  group_by(orgao, acao_longa) %>% summarise_if(is.numeric, sum) %>% arrange(desc(variacao))
  
  

# Planilhona --------------------------------------------------------------

planilha <- ploa %>%
  group_by(orgao, acao_longa) %>%
  summarise_if(is.numeric, .funs = ~sum(.)) %>%
  filter(abs(variacao) > corte) 


# Novas ações -------------------------------------------------------------

lista_novas <- ploa %>%
  group_by(acao_longa) %>%
  summarise_if(is.numeric, .funs = ~sum(.)) %>%
  filter(ploa2020 == 0 & ploa2021 > 0) %>%
  select(acao_longa) %>% .$acao_longa

novas <- ploa %>%
  filter(acao_longa %in% lista_novas) %>%
  group_by(orgao, acao_longa) %>%
  summarise_if(is.numeric, .funs = ~sum(.))

write.csv2(novas, file = "novas_acoes.csv")

novas %>% ungroup() %>% select(orgao) %>% unique()


# variacoes ---------------------------------------------------------------

variacoes <- ploa %>%
  group_by(orgao, acao_longa) %>%
  summarise_if(is.numeric, .funs = ~sum(.)) %>%
  ungroup() %>%
  filter(ploa2020 > 0 & ploa2021 > 0) %>%
  mutate(variacao2021_2020 = ploa2021/ploa2020 - 1) %>%
  mutate(variacao2020_2021 = ploa2020/ploa2021 - 1) %>%
  filter(variacao2020_2021 > .75 | variacao2021_2020 > .75) %>%
  mutate(tipo_variacao = ifelse(variacao2021_2020 > 0, "Aumentos", "Reduções"),
         valor = ifelse(variacao2021_2020 > 0, variacao2021_2020, variacao2020_2021),
         valor = valor)

variacoes_export <- variacoes %>%
  select(orgao, acao_longa, tipo_variacao, ploa2021, ploa2020, variacao, valor)

write.csv2(variacoes_export, file = "variacoes.csv")
