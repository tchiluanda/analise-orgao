const vis = {

    refs: {

        svg: "svg.vis",
        cont: "div.vis-container",
        mode_button: "nav.mode-control",
        option_button: "div.option-control",
        mode_dependent_controls: "[data-visible-on-mode]",

        seletor_cores : "[name='seletor-cores']",
        controles_adicionais_cores : "[data-selecao-adicional-para]",

        comparison_selector: "[name='seletor-comparacao']",
        selectors_wrapper: ".selecoes-wrapper",
        selector_orgao_decreto : "#selecao-orgao",
        selector_anexo : "#selecao-tipo",
        exclusoes_wrapper: ".exclusoes-wrapper",
        exclui_divida: "#exclui-divida",
        exclui_rgps: "#exclui-rgps",
        barras: "rect.barras",
        linhas_referencia: "line.ref",
        card: "div#card",
        card_fechar : "div.card-fechar",

        data: {

            agregado : "./dados/dados.csv",
            detalhado : "./dados/dados_acoes.csv"

        },

        objetos_atuais : {

            agregado : "svg .geoms-agregado", // para limpar o canvas
            detalhado : "svg .geoms-detalhado"

        },

        rotulos_atuais : {
            
            agregado : "div.vis-container .rotulos-agregado",
            detalhado : "div.vis-container .rotulos-detalhado"

        },

        tooltip : "div#tooltip",


        colors : {
            destaque_barra : "--cor-barra-destaque",

            barra_normal : "--cor-barra-normal",

            "aumento" : "--cor-aumento",
            "redução" : "--cor-reducao",
            "mesmo valor" : "--cor-mesmo-valor",
            "nova" : "--cor-novas-acoes",
            "cor fundo": "--light"

        }

    },

    sels: {

        svg : null,
        cont : null,
        circles_acoes : null,
        axis : {},
        barras : null,
        linhas_referencia : null,
        rotulos_detalhados : null,
        rotulos_detalhados_lateral : null

    },

    elems: {

        svg:  null,
        cont: null,
        mode_button: null,
        seletor_comparacao: null

    },

    dims : {

        h: null,
        w: null,
        bar_height: 16,
        margins: {

            top: 20,
            left: 250,
            right: 50,
            bottom: 20

        }

    },

    data : {

        raw : {

            agregado : null,
            detalhado : null

        },

        processed : {

            filtered : null,
            
            agregado : null,

            detalhado : null 
        },

        auxiliar : {

            total_acoes : null,

            qde_acoes : null,

            total_gnd : null,

            qde_acoes_novas : null,

            total_acoes_novas : null
        }
        
        //{

            // geral : {

            //     por_orgao : {}

            // },

            // detalhado : {}

        //}

    },

    params : {

        colors : {},

        transitions_duration: 1000,

        modes : ["agregado", "detalhado"],

        variables : {

            numerical : {

                agregado : ["PLOA", "dot_atu", "desp_paga"],
                detalhado : ["PLOA", "var_pct_mod", "var_abs_mod"]

            },

            categorical : {
            
                agregado : ["orgao_decreto", "anexo", "agregador"],
                detalhado : ["gnd_predominante"] //null 
    
            }

        },

        standard_option : {

            agregado : "orgao_decreto",
            detalhado : "inicial"

        },

        variables_names : {

            PLOA : "PLOA",
            dot_atu : "Dotação atualizada do ano anterior",
            desp_paga : "Despesa paga no ano anterior"

        },

        main_variable : "PLOA",


        // also, those are the variables used for evaluating summaries in the "agregado" mode.
        // não inclui o var_tipo aqui, pq a função atual vai procurar a variável em vis.data.raw... e o var_tipo só aparece quando é calculado o dataset detalhado.

        

        // this will serve to determine axis

        // ainda não está muito bom. talvez fazer um super objeto, com os tipos já embutidos.

        variables_type : {

            PLOA              : "numerical",
            var_abs_mod       : "log",
            var_pct_mod       : "log",
            dot_atu           : "numerical",
            agregado          : "numerical",
            agregador         : "categorical",
            var_tipo          : "categorical",
            orgao_decreto     : "categorical",
            anexo             : "categorical",
            gnd_predominante  : "categorical"

        },

        dimensions : {

            agregado : ["x", "y", "w"],
            detalhado : ["x", "y", "r", "x_gnd"]

        },

        dims_vs_visual_dims : {

            // pq algumas dimensões têm escalas diferentes (às vezes o y vai ser ordinal, às vezes numérico... às vezes x vai ser numérico linear, às vezes numérico log etc. essa é uma forma de ter à mão as diversas escalas, mas manter sempre apenas os eixos x e y.)

            // logical dimension : physical dimension

            // incluí uma lógica para considerar a dimensão física como a própria dimensão lógica se ele não achar a correspondência no lookup a este objeto. tipo, "x" vai ser "x" mesmo. só preciso especificar aqui as exceções.

            //"x_log" : "x",
            //"y_cat" : "y",
            //"y_var" : "y"
            "x_gnd" : "x"

        },

        //dimensions : ["x", "y", "y_cat", "y_anexos", "w", "r"]

        nomes_demais : { // aqui preciso de um registro para cada variável que pode ser usada como critério de detalhamento

            anexo: "Demais anexos",
            agregador: "Demais agregadores",
            orgao_decreto: "Demais órgãos"

        },

        variaveis_cores : {
            // correspondencia entre os valores no html e os nomes das variaveis;

            "cores-fontes" : {

                tesouro : "Fontes Tesouro",
                proprias : "Fontes próprias",
                emissao : "Fontes de Emissão"

            },

            "cores-gnd" : {

                pessoal : "Pessoal",
                custeio : "Custeio",
                investimento : "Investimento",
                divida : "Dívida" 


            }
        }

    },

    init : function() {

        vis.f.generates_refs();
        vis.f.get_size();
        vis.f.set_size();
        vis.f.read_data();

    },

    f : {

        // "administrative tasks"

        generates_refs: function() {

            vis.sels.svg  = d3.select(vis.refs.svg);
            vis.sels.cont = d3.select(vis.refs.cont);

            vis.elems.svg  = document.querySelector(vis.refs.svg);
            vis.elems.cont = document.querySelector(vis.refs.cont);

        },

        get_size: function() {

            let win_w = window.innerWidth;
            let win_h = window.innerHeight;

            let pos_vis_y = vis.elems.svg.getBoundingClientRect().y;

            vis.dims.h = win_h - pos_vis_y; // - vis.dims.margins.top - vis.dims.margins.bottom;
            // subtraio a margem para usar como margem
            vis.dims.w = +vis.sels.svg.style("width").slice(0, -2);

        },

        set_size: function() {

            vis.elems.svg.style.setProperty(
                "height", vis.dims.h + "px");

                /*
            vis.elems.svg.style.setProperty(
                "width", vis.dims.w + "px");*/

            //vis.elems.svg.style.setProperty("background-color", "coral");


        },

        read_data : function() {

            // d3.csv(vis.refs.data).then(
            //     data => vis.control.begin(data)
            // );
            Promise.all([
                d3.csv(vis.refs.data.agregado),
                d3.csv(vis.refs.data.detalhado)
            ]).then(
                files => vis.control.begin(files)
            );

        },

        evaluate_dataset : function(modo, selecao_orgao, selecao_anexo, exclui_divida, exclui_rgps, var_detalhamento) {

            let dados = vis.data.raw.agregado;

            if (selecao_orgao != "todos") {
                dados = dados
                          .filter(d => d.orgao_decreto == selecao_orgao)
            }

            if (selecao_anexo != "todos") {
                dados = dados
                          .filter(d => d.anexo == selecao_anexo)
            }

            if (exclui_divida) {
                dados = dados
                          .filter(d => d.marcador != "divida")
            }

            if (exclui_rgps) {
                dados = dados
                          .filter(d => d.marcador != "rgps")
            }

            vis.data.processed.filtered = dados;

            // dividir aqui conforme o modo

            if (modo == "agregado") {

                this.summarise_dataset_agregado(var_detalhamento);
            
            } else {

                this.summarise_dataset_detalhado();
            }

        },

        summarise_dataset_agregado : function(var_detalhamento) {

            // agregado

            vis.data.processed.agregado = utils.group_by_sum_cols(

                objeto = vis.data.processed.filtered,
                coluna_categoria = var_detalhamento,
                colunas_valor = vis.params.variables.numerical.agregado,
                ordena_decrescente = true,
                coluna_ordem = vis.params.main_variable

            );

            // trata o caso de o dataset ficar com uma lista muito grande

            if (vis.data.processed.agregado.length > 16) {

                let bottom_dataset = vis.data.processed.agregado.slice(15);

                // var_detalhamento vai ser a variável usada no detalhamento, então vai ser o nome da coluna/variável no dataset sumarizado que foi armazenado em vis.data.processed.agregado.

                //bottom_dataset.forEach(el => el[var_detalhamento] = vis.params.nomes_demais[var_detalhamento]);

                const elemento_demais = {
                    [var_detalhamento] : vis.params.nomes_demais[var_detalhamento]
                };

                vis.params.variables.numerical.agregado.forEach(
                    variable => elemento_demais[variable] = 
                    bottom_dataset
                    .map(d => +d[variable])
                    .reduce((acu , atu) => acu + atu)
                );

                vis.data.processed.agregado = vis.data.processed.agregado
                .slice(0,15);

                vis.data.processed.agregado.push(elemento_demais);
                // não dá para encadear aqui

            }


        },

        summarise_dataset_detalhado : function() {

            vis.data.processed.detalhado = vis.data.raw.detalhado;

            vis.data.processed.detalhado.forEach(el => {
                const acao_nova = (+el.dot_atu == 0); //& +el.desp_paga == 0);

                el["acao_nova"] = acao_nova;

                if (!acao_nova) {
                    const var_pct = (el.PLOA / el.dot_atu);
                    let var_abs = (el.PLOA - el.dot_atu);
                    let var_tipo;
                    if (var_pct == 1) {
                        var_tipo = "mesmo valor"; 
                        var_abs = 1;            
                    } else if (var_pct > 1) {
                        var_tipo = "aumento"
                    } else {
                        var_tipo = "redução"
                    }
                     

                    el["var_tipo"] = var_tipo;

                    el["var_pct_mod"] = var_tipo == "redução" ? 1/var_pct : var_pct;
                    el["var_abs_mod"] = Math.abs(var_abs);

                    // essas variáveis criadas aqui devem ser informadas lá em vis.params.variables_detalhado
                } else el["var_tipo"] = "nova";
                
            });

            vis.f.computa_dados_auxiliares();

        },

        computa_dados_auxiliares : function() {

            vis.data.auxiliar.total_acoes = utils.valor_formatado(
                vis.data.processed.detalhado
                  .map(d => +d[vis.params.main_variable])
                  .reduce((acum, atual) => acum + atual)
            );

            vis.data.auxiliar.qde_acoes = vis.data.processed.detalhado.length;

            const acoes_novas = vis.data.processed.detalhado.filter(d => d.acao_nova);

            vis.data.auxiliar.qde_acoes_novas = acoes_novas.length;

            vis.data.auxiliar.total_acoes_novas = utils.valor_formatado(
                acoes_novas
                  .map(d => +d[vis.params.main_variable])
                  .reduce((acum, atual) => acum + atual)
            )

            vis.data.auxiliar.total_gnd = utils.group_by_sum(
                objeto = vis.data.processed.detalhado,
                coluna_categoria = "gnd_predominante",
                coluna_valor = vis.params.main_variable
            );

        },

        populates_filter_selector : function(seletor) { // orgao_decreto ou anexo

            const selector = document.querySelector(vis.refs["selector_" + seletor]);

            const valores_unicos = utils.unique(vis.data.raw.agregado, seletor);

            valores_unicos.forEach(variable => {

                let new_option = document.createElement("option");

                new_option.setAttribute("value", variable);
                new_option.innerText = variable;

                selector.append(new_option);
            });

        },

        populates_comparison_selector : function() {

            // só no modo agregado

            const selector = document.querySelector(vis.refs.comparison_selector);

            const comparison_variables = [...vis.params.variables.numerical.agregado];

            
            // vou tirar a main_variable, PLOA, dessa lista.

            // hmm essa combinação de indexOf e splice poderia virar uma função.

            const pos_main_variable = comparison_variables.indexOf(vis.params.main_variable);

            comparison_variables.splice(pos_main_variable, 1);

            console.log(comparison_variables, "depois");


            comparison_variables.forEach(variable => {

                let new_option = document.createElement("option");

                new_option.setAttribute("value", variable);
                new_option.innerText = vis.params.variables_names[variable];

                selector.append(new_option);
            });

        },

        reinicia_seletor_comparacao : function() {

            vis.elems.seletor_comparacao.value = "nada";
            vis.draw.agregado.remove_linhas_referencia();
        },

        update_positions : {
            // para quando for disparado um resize
        },

        reinicia_seletor_cores : function() {

            vis.elems.seletor_cores.value = "padrao";
            vis.control.show_controles_adicionais_cores("padrao");
            //vis.f.colore_bolhas("padrao");

        },

        update_positions : {
            // para quando for disparado um resize
        },



        update_colors : function() {

            const colors = Object.keys(vis.refs.colors);

            colors.forEach(color => {
                vis.params.colors[color] = getComputedStyle(document.documentElement).getPropertyValue(vis.refs.colors[color]).slice(1);
            });

        },

        desabilita_opcao : function(opcao) {

            document.querySelector("button#" + opcao).classList.add("disabled");

        },

        remove_rotulos_detalhados : function() {

            if (vis.sels.rotulos_detalhados) {

                vis.sels.rotulos_detalhados
                  .transition()
                  .duration(vis.params.transitions_duration/2)
                  .style("opacity", 0)
                  .remove();

            }

        },

        remove_rotulos_detalhados_lateral : function() {

            if (vis.sels.rotulos_detalhados_lateral) {

                vis.sels.rotulos_detalhados_lateral
                  .transition()
                  .duration(vis.params.transitions_duration/2)
                  .style("opacity", 0)
                  .remove();

            }

        },

        mostraTooltip : function(d) {

            let dados = d3.select(this).datum();
            let bubble = d3.select(this);

            const current_color = bubble.attr("fill");

            function invertHex(hex) {
                return (Number(`0x1${hex}`) ^ 0xFFFFFF).toString(16).substr(1).toUpperCase()
            }

            const opposite_color = utils.invertColor(current_color);

            //console.log(current_color, opposite_color);

            let x_bubble = +d3.select(this).attr('cx');
            let y_bubble = +d3.select(this).attr('cy');

            //console.log(x_bubble, y_bubble);
        
            const $tooltip = d3.select(vis.refs.tooltip);
            const $tt = document.querySelector(vis.refs.tooltip);

            $tt.dataset.variacao = dados["var_tipo"];
            
            let largura_tooltip_css = +$tooltip.style("width").substring(0, $tooltip.style("width").length-2);
            
            $tooltip
              .classed("hidden", false)
              .style("background-color", current_color)
              .style("color", opposite_color);
        
            // popula informacao

            // parametrizar isso em vis.params
      
            const infos_tooltip = ["acao", "tituloacao", "PLOA", "dot_atu", "var_tipo", "var_pct_mod", "var_abs_mod"];

            //console.log(dados);
        
            infos_tooltip.forEach(function(info) {
                let text = "";
                if (vis.params.variables_type[info] == "numerical") text = "R$ " + utils.valor_formatado(dados[info])
                else text = dados[info];
                $tooltip.select("#tt-"+info).text(text);
            })
        
            // now that the content is populated, we can capture the tooltip
            // height, so that we can optime the tt position.
        
            const altura_tooltip = $tooltip.node().getBoundingClientRect().height;
            //console.log(tooltip_height);
        
            // calculate positions
        
            const pad = 10;
    
            //console.log(x_tooltip, largura_tooltip_css, pad, dimensoes["principal"].w_numerico);
        
            if (x_bubble + largura_tooltip_css + pad > vis.dims.w) {
                x_bubble = x_bubble - largura_tooltip_css - pad;
            } else {
                x_bubble = x_bubble + pad
            }
        
            if (y_bubble + altura_tooltip + pad > vis.dims.h) {
                y_bubble = y_bubble - altura_tooltip - pad;
            } else {
                y_bubble = y_bubble + pad
            }
        
            $tooltip
              .style('left', x_bubble + 'px')
              .style('top', y_bubble + 'px');

        },

        escondeTooltip : function(d) {

            d3.select(vis.refs.tooltip).classed("hidden", true);

        },

        colore_bolhas : function(tipo, valor_selecionado) {

            const bubbles =
            vis.sels.circles_acoes
                .transition()
                .duration(vis.params.transitions_duration);


            if (tipo == "padrao") {
                bubbles.attr("fill", d => vis.params.colors[d.var_tipo]);
            }

            else {

                vis.draw.scales.update_cores_bolhas(tipo);

                if (tipo == "mod") {

                    bubbles.attr("fill", d => vis.draw.scales.cores_bolhas(d["Direta"]))

                } else {

                    const variavel_criterio_cor = vis.params.variaveis_cores[tipo][valor_selecionado];

                    console.log(tipo, variavel_criterio_cor)
    
                    bubbles.attr("fill", d => vis.draw.scales.cores_bolhas(d[variavel_criterio_cor]));

                }

            }


        }


    },

    draw: {

        domains : {

            initialize_categorical : function() {

                function generate(data, variable, categorical = false) {

                    // por enquanto só categorical do agregado

                    console.log(variable);

                    if (!categorical) {
                        return d3.extent(data, d => +d[variable])
                    }
                    
                    else {
                        return  utils.unique(
                            obj = data, 
                            col = variable
                        )
                    }
        
                }

                // vis.params.variables.forEach(variable => {
                //     vis.draw.domains[variable] = generate(vis.data.raw, variable,
                //         categorical = false);
                // });

                vis.params.variables.categorical.agregado
                  .forEach(variable => {
                    vis.draw.domains.categorical.agregado[variable] = generate(vis.data.raw.agregado, variable, categorical = true);
                });

            },

            evaluate_domain_categorical : function() {

                // por enquanto só as categoricals do agregado

                let current_variable = vis.control.current_state.variavel_detalhamento;

                let subtotais = utils.group_by_sum(
                    objeto = vis.data.processed.agregado,
                    coluna_categoria = current_variable,
                    coluna_valor = vis.params.main_variable,
                    ordena_decrescente = true
                );

                //console.log(subtotais);

                vis.draw.domains.categorical.agregado[current_variable] = utils.unique(
                    obj = subtotais,
                    col = "categoria"
                ).reverse();

            },

            evaluate_domain_agregado : function(){

                // trocar esse nome que está causando confusão com o "agregado" do modo.

                // maximos dos dados selecionados atuais

                const maxs = vis.params.variables.numerical.agregado.map(
                    variable => d3.max(vis.data.processed.agregado, d => d[variable])
                );

                vis.draw.domains.numerical.agregado.agregado = [
                    0,
                    Math.max(...maxs)
                ];

            },

            evaluate_domain_detalhado : function(){

                vis.params.variables.numerical.detalhado.forEach(
                    variavel => {
                        vis.draw.domains.numerical.detalhado[variavel] = [
                            vis.params.variables_type[variavel] == "log" ? 1 : 0,
                            d3.max(vis.data.processed.detalhado, d => +d[variavel])
                        ]

                        console.log("detalhado", variavel, "DOMINIO", vis.draw.domains.numerical.detalhado[variavel]);

                        
                        //d3.extent(vis.data.processed.detalhado, d => d[variavel]);
                    }
                );

                vis.draw.domains[vis.params.main_variable] = [0, d3.max(vis.data.processed.detalhado, d => d[vis.params.main_variable])];
                // a main variable é o PLOA

            },

            numerical : {

                agregado : {
                    agregado : null // horrivel
                },
                detalhado : {}

            },

            categorical: {

                agregado : {},
                detalhado : {

                    var_tipo : ["aumento", "mesmo valor", "redução"],
                    gnd_predominante : ["Pessoal", "Dívida", "Custeio", "Investimento", "Nenhum"]
                    // automatizar isso. vai ter que inicializar só quando clicar no modo agregado.

                }

            }

            // categorical variables will be properties
            // numerical também

            

        },

        ranges : {

            agregado : {

                x : null,
                y : null,
                w : null

            },

            detalhado : {

                x : null, 
                y : null,
                r : [3,40]

            },

            cores_bolhas : {

                "cores-fontes" : d3.schemePurples[4],
                "cores-gnd" : d3.schemeOranges[4],
                "mod" : d3.schemePiYG[3]

            },

            // x : null,
            // //x_log : null,
            // y : null,
            // //y_cat : null,
            // //y_anexos : null,
            // //y_agregadores : null,
            // w : null,
            // r : [2,40],
            // y_var : null,
            // // o do modo detalhado, opcao variação

            update : function() {

                vis.draw.ranges.agregado.x = [ vis.dims.margins.left, vis.dims.w - vis.dims.margins.right ];

                vis.draw.ranges.detalhado.x = [ vis.dims.margins.left, vis.dims.w - vis.dims.margins.right*1.5 ];
    
                vis.draw.ranges.agregado.y = [ vis.dims.h - vis.dims.margins.bottom, vis.dims.margins.top ];

                vis.draw.ranges.detalhado.y = [vis.dims.h/5, vis.dims.h*4.5/5];

                vis.draw.ranges.agregado.w = [ 0, vis.dims.w - vis.dims.margins.left - vis.dims.margins.right];
    
            },

            // calcula_range_var_categorica : function(categorical_var) {

            //     let qde_categorias = vis.draw.domains[categorical_var].length;

            //     let comprimento_necessario = vis.dims.bar_height * qde_categorias;

            //     return([vis.dims.margins.top, vis.dims.margins.top + comprimento_necessario]);

            // }

        },

        scales : {

            agregado : {

                x : d3.scaleLinear().clamp(true),
                y : d3.scaleBand(),
                w : d3.scaleLinear().clamp(true),

            },

            detalhado : {

                x : d3.scaleLog(),
                y : d3.scaleBand(),
                r : d3.scaleSqrt(),
                x_gnd : d3.scaleBand()

            },

            cores_bolhas : d3.scaleQuantile().domain([0,1]),


            update_cores_bolhas : function(tipo) { // fonte, gnd etc.

                vis.draw.scales.cores_bolhas.range(vis.draw.ranges.cores_bolhas[tipo]);

            },

            initialize : function() {

                vis.params.modes.forEach(mode => {

                    vis.params.dimensions[mode].forEach(dimension => {

                        let dimension_range = vis.params.dims_vs_visual_dims[dimension];
                        
                        if (!dimension_range) dimension_range = dimension;
                        // // dimension_range vai ser undefined se não estiver na lista de correspondência, caso contrário assume a própria dimensão.

                        console.log("Inicializando scales", mode, dimension, vis.draw.scales[mode][dimension].range());

                        if (vis.draw.scales[mode][dimension]) {
                            vis.draw.scales[mode][dimension]
                                .range(vis.draw.ranges[mode][dimension_range])
                        }

                    });
    
                });
                
            },

            set_domain : function(mode, dimension, variable) {

                let var_type = vis.params.variables_type[variable];

                var_type = var_type == "log" ? "numerical" : var_type;


                console.log("VAR TYPE", variable, var_type);

                vis.draw.scales[mode][dimension]
                  .domain(vis.draw.domains[var_type][mode][variable]);
    
            },

            set : function(mode, option) {

                vis.control.states
                  .modes[mode]
                  .options[option]
                  .set_scales.forEach(scale => {

                      console.log(mode, scale);

                    vis.draw.scales.set_domain(
                        mode,
                        scale.dimension, 
                        scale.variable)

                    if (scale.axis == true) {

                        vis.draw.axis.update(mode, scale.dimension, scale.variable);

                    }
                  });

                    // ISSUE : testar em algum momento se o domínio permanece igual? vale a pena em termos de performance? poderia ter um "current" em vis.control.states

            }

        },

        axis : {

            // para garantir as transições de eixo, quando passa de uma variável numérica para uma categórica, só vamos usar eixos x e y. Por isso vão aparecer argumentos "dimension" e "dimension_axis": o dimension para acessar a escala correta ("y_cat", por exemplo), e o dimension_axis para acessar o eixo correto ("y", nesse caso do exemplo, e não um "y_cat" que seria uma novo eixo y, o que não é desejável)

            update_axis_scale : function(mode, dimension) {

                let dimension_axis = vis.params.dims_vs_visual_dims[dimension];
                    
                if (!dimension_axis) dimension_axis = dimension;
                // dimension_range vai ser undefined se não estiver na lista de correspondência, caso contrário assume a própria dimensão.

                console.log("Updating o axis_scale da dimensao", dimension, dimension_axis, ", no modo ", mode);

                vis.draw.axis[dimension_axis].scale(
                    vis.draw.scales[mode][dimension]
                )

            },

            create : function(desloc_x, desloc_y, dimension) {
                
                let svg = vis.sels.svg;

                console.log("Dimensão ", dimension);

                vis.sels.axis[dimension] = svg
                  .append("g") 
                  .attr(
                      "transform", 
                      "translate(" 
                      + desloc_x 
                      + "," 
                      + desloc_y
                      + ")")
                  .classed("axis", true)
                  .classed("axis-" + dimension, true)
                  .call(vis.draw.axis[dimension])
                ; 
            },

            update : function(mode, dimension, variable) {

                let dimension_axis = vis.params.dims_vs_visual_dims[dimension];
                    
                if (!dimension_axis) dimension_axis = dimension;
                // dimension_range vai ser undefined se não estiver na lista de correspondência, caso contrário assume a própria dimensão.

                console.log("Vamos dar um update no eixo", dimension_axis, variable);

                vis.draw.axis.tick_format(dimension_axis, variable);

                vis.draw.axis.update_axis_scale(mode, dimension);

                vis.sels.axis[dimension_axis]
                  .transition()
                  .duration(vis.params.transitions_duration)
                  .call(vis.draw.axis[dimension_axis])
                ;

            },

            initialize : function(mode) {

                vis.draw.axis.update_axis_scale(mode, "x");
                //vis.draw.axis.update_axis_scale(mode, "y");

                //vis.draw.axis.update_axis_scale("y_cat");
                //vis.draw.axis.update_axis_scale("detalhado", "y_var");

                // aqui tb... evitar superposição de eixos tb.

                if (!vis.sels.axis.x) {

                    vis.draw.axis.create(
                        desloc_x = 0,
                        desloc_y = vis.dims.margins.top,//vis.draw.scales[mode].y(mode == "agregado" ? 0 : "mesmo valor"),//vis.dims.h - vis.dims.margins,
                        "x");
        
                    // vis.draw.axis.create(
                    //     desloc_x = vis.dims.margins.left,
                    //     desloc_y = 0,
                    //     "y");

                }
    
            },

            reset : function(dimension) {

                if (dimension == "x") {
                    this.x = d3.axisBottom();
                } else {
                    this.y = d3.axisLeft();
                }

            },

            // dar um jeito nos ticks
            tick_format : function(dimension, variable) {

                let type = vis.params.variables_type[variable];

                console.log("Tô agora no update do tick_format", dimension, variable, type)

                switch (type) {

                    case 'numerical' :  
                        this[dimension].tickFormat(d => utils.formataBR(d/1e9));
                        break;

                    case 'percent' :
                        this[dimension].tickFormat(d => d3.format(".1%")(d/100));
                        break;

                    case 'categorical' :
                        this.reset(dimension);
                        break;
                }

            },

            x :  d3.axisTop(),

            y :  d3.axisLeft()

        },

        agregado : {

            desenha_barras : function(variable) {

                vis.sels.svg
                .selectAll("rect.barras")
                .data(vis.data.processed.agregado, d => d[variable])
                .join("rect")
                .classed("barras", true)
                .classed("geoms-agregado", true)
                .attr("x", vis.dims.margins.left)
                .attr("width", 0)
                .attr("height", vis.dims.bar_height)
                .attr("y", d => vis.draw.scales["agregado"].y(d[variable]) + vis.dims.margins.top)
                .transition()
                .duration(vis.params.transitions_duration)
                .attr("width", d => vis.draw.scales["agregado"].w(d[vis.params.main_variable]))
                .attr("fill", vis.params.colors.barra_normal);

                // a main_variable é o PLOA
                // a variable vai ser o critério de detalhamento: orgao, função etc.

                vis.sels.barras = d3.selectAll(vis.refs.barras);

                // rotulos valores

                vis.sels.cont
                .selectAll("p.labels-valores-barras")
                .data(vis.data.processed.agregado, d => d[variable])
                .join("p")
                .classed("labels-valores-barras", true)
                .classed("rotulos-agregado", true)
                .style("top", d => (vis.draw.scales["agregado"].y(d[variable]) + vis.dims.margins.top) + "px")
                .style("left", vis.dims.margins.left + "px")
                //.style("font-size", vis.dims.bar_height + "px")
                .style("line-height", vis.dims.bar_height + "px")
                .text(d => utils.valor_formatado(d[vis.params.main_variable]))
                .transition()
                .duration(vis.params.transitions_duration)
                .style("left", d => (vis.dims.margins.left + vis.draw.scales["agregado"].w(d[vis.params.main_variable])) + "px")


                // rotulos categorias

                vis.sels.cont
                .selectAll("p.labels-categorias")
                .data(vis.data.processed.agregado, d => d[variable])
                .join("p")
                .classed("labels-categorias", true)
                .classed("rotulos-agregado", true)
                .style("top", d => (vis.draw.scales["agregado"].y(d[variable]) + vis.dims.margins.top) + "px")
                .style("left", vis.dims.margins.left + "px")
                //.style("font-size", vis.dims.bar_height + "px")
                .style("line-height", vis.dims.bar_height + "px")
                .style("max-width", vis.dims.margins.left + "px")
                .text(d => d[variable]);


            },

            desenha_linhas_referencia : function(cat_variable, num_variable) {

                vis.sels.svg
                .selectAll("line.ref")
                .data(vis.data.processed.agregado, d => d[cat_variable])
                .join(
                    enter => enter.append("line")
                      .attr("x1", vis.dims.margins.left)
                      .attr("x2", vis.dims.margins.left))
                .classed("ref", true)
                .classed("geoms-agregado", true)
                .attr("y1", d => vis.draw.scales["agregado"].y(d[cat_variable]) + vis.dims.margins.top - vis.dims.bar_height/2)
                .attr("y2", d => vis.draw.scales["agregado"].y(d[cat_variable]) + vis.dims.margins.top + vis.dims.bar_height*1.5)
                .transition()
                .duration(vis.params.transitions_duration)
                .attr("x1", d => vis.dims.margins.left + vis.draw.scales["agregado"].w(d[num_variable]))
                .attr("x2", d => vis.dims.margins.left + vis.draw.scales["agregado"].w(d[num_variable]))
                .attr("stroke", "red");

                vis.sels.linhas_referencia = d3.selectAll(vis.refs.linhas_referencia);

                vis.draw.agregado.colore_barras(num_variable);

            },

            remove_linhas_referencia : function() {

                if (vis.sels.linhas_referencia) {
                    vis.sels.linhas_referencia.remove();
                }

                if (vis.sels.barras) vis.sels.barras.attr("fill", vis.params.colors.barra_normal);

            },

            colore_barras : function(variavel_comparacao) {

                vis.sels.barras.each(function(d,i) {
                    // console.log(d, this);
                    // d vai trazer o dado amarrado ao elemento; this, o próprio elemento.

                    // // em vez de vis.control.current_state.variavel_comparacao, poderia fazer a própria função de desenhar as linhas de referência chamar esta função aqui, passando a variável numérica usada
                    // if (d[vis.control.current_state.variavel_comparacao] > d[vis.params.main_variable]) {


                    d3.select(this)
                        .transition()
                        .duration(vis.params.transitions_duration)
                        .attr("fill", (d[variavel_comparacao] < d[vis.params.main_variable]) ? vis.params.colors.destaque_barra : vis.params.colors.barra_normal);
                });

            },

        },

        bubbles : {

            add : function() {

                let svg = vis.sels.svg;

                vis.sels.circles_acoes = svg
                  .selectAll("circle")
                  .data(vis.data.processed.detalhado)
                  .join("circle")
                  .classed("acoes", true)
                  .classed("geoms-detalhado", true)
                  .attr("cx", function(d) {
                      let random = vis.dims.w * Math.random();
                      d.x = random; // para inicializar a posição na simulação
                      return random;
                    })
                  .attr("cy", function(d) {
                      let random = vis.dims.h * Math.random();
                      d.y = random;
                      return random;
                    })
                  .attr("r", 1)
                  .attr("stroke", vis.params.colors["cor fundo"])
                  .attr("opacity", 1)
                  .text(d => d.acao)
                ;

            },

            parametros_simulation : {

                force_charge : function() {

                    const magnitudeForca = this.magnitudeForca;

                    const carga = function(d) {
                        return -Math.pow(vis.draw.scales["detalhado"].r(+d.PLOA), 2.0) * magnitudeForca;
                    };

                    return d3.forceManyBody().strength(carga);
                },

                magnitudeForca : 0.04

            },

            simulation : null,

            config_simulation : function() {

                const magnitudeForca = this.parametros_simulation.magnitudeForca;

                const atualiza_tick = function() {
                    vis.sels.circles_acoes
                      .attr("cx", d => d.x) // -d.raio pq são retângulos
                      .attr("cy", d => d.y);
                };
                
                vis.draw.bubbles.simulation = d3.forceSimulation()
                    .velocityDecay(0.2)
                    .force('x', d3.forceX().strength(magnitudeForca).x(vis.dims.w/2))
                    .force('y', d3.forceY().strength(magnitudeForca).y(vis.dims.h/2))
                    .force('charge', vis.draw.bubbles.parametros_simulation.force_charge())
                    .alphaMin(0.25)
                    .on('tick', atualiza_tick);
                
                vis.draw.bubbles.simulation.stop()
                vis.draw.bubbles.simulation.nodes(vis.data.processed.detalhado);
                vis.control.current_state.simulation_started = true;

            }

        },

    },

    card : {

        refs_componentes : {

            acao_nova : "#card-acao_nova"

        },

        params : {

            bar_height : 16,
            margin_left : 80,
            margin_right : 40,

            rotulos_geral : {

                "PLOA" : "PLOA 2021",
                "dot_atu" : "Dotação 2020",
                "desp_paga" : "Pago 2020"

            },

            cores : {
                "geral" : "var(--cor-barra-normal)",
                "fontes" : d3.schemePurples[4][3],
                "gnd" : d3.schemeOranges[4][3],
                "mod" : d3.schemePiYG[3][2],
                "orgaos" : "dodgerblue"
            }

        },

        dados_card : null,

        mini_datasets : {

            nomes_colunas : {

                // nome : colunas
                "geral" : ["PLOA", "dot_atu", "desp_paga"],
                "fontes" : ["Fontes Tesouro", "Fontes de Emissão", "Fontes próprias"],
                "gnd" : ["Pessoal", "Custeio", "Investimento", "Dívida"],
                "mod" : ["Direta", "Transferência"],
                "orgaos" : ["orgao_valor_1", "orgao_valor_2", "orgao_valor_3", "orgao_valor_4", "orgao_valor_5", "orgao_valor_6"],
                "historico" : ["2016", "2017", "2018", "2019", "2020", "2021"]

            },

            range_geral : null,

            "geral" : null,
            "fontes" : null,
            "gnd" : null,
            "mod" : null,
            "orgaos" : null

        },

        montaMiniDataset : function(nome_mini_dataset, dados) {

            let mini_dataset = [];

            vis.card.mini_datasets.nomes_colunas[nome_mini_dataset].forEach(coluna => {

                if (nome_mini_dataset == "orgaos") {

                    const orgao_valor = dados[coluna].split("__");

                    if (orgao_valor[0] != "NA") {

                        mini_dataset.push({
                            "rotulo" : orgao_valor[0],
                            "valor" : orgao_valor[1]
                        })

                    }

                } else {

                    mini_dataset.push({
                        "rotulo" : coluna,
                        "valor" : isNaN(+dados[coluna]) ? 0 : +dados[coluna]
                    })


                }

            })
            
            vis.card.mini_datasets[nome_mini_dataset] = mini_dataset;

        },

        montaDadosCard : function(dados) {

            // mini_datasets desejados
            const lista_minis = Object.keys(vis.card.mini_datasets.nomes_colunas);

            lista_minis.forEach(mini_dataset => {vis.card.montaMiniDataset(mini_dataset, dados)})

        },

        montaCard : function() {

            let bubble = d3.select(this);
            let dados = d3.select(this).datum();

            vis.card.dados_card = dados;

            //prepara os datasets para a visualização
            vis.card.montaDadosCard(dados);

            const $card = d3.select(vis.refs.card);
            vis.sels.card = $card;

            $card.classed("hidden", false);
            vis.card.monitora_fechar_card();

            console.log(dados);

            let y_bubble = +bubble.attr('cy');
            let r_bubble = +bubble.attr('r');

            $card.style("top", (y_bubble + r_bubble + 20) + "px" );


            // popula

            //acao nova
            d3.select(vis.card.refs_componentes.acao_nova).classed("hidden", !dados.acao_nova);

            const infos_basicas = ["acao", "tituloacao", "textoacao"];
        
            infos_basicas.forEach(function(info) {
                let text = dados[info];
                $card.select("#card-"+info).text(text);
            })

            // gráficos

            // // geral

            vis.card.montaBarChart("geral", false);
            vis.card.montaBarChart("fontes", true);
            vis.card.montaBarChart("gnd", true);
            vis.card.montaBarChart("mod", true);
            vis.card.montaBarChart("orgaos", false);
            vis.card.montaLineChart("historico");

            


        },

        montaBarChart : function(nome_mini_dataset, valores_relativos = true) {

            const svg = d3.select("#card-vis-" + nome_mini_dataset);
            const cont = d3.select("div.card-vis-" + nome_mini_dataset + " .container-vis-card");
            let qde_categorias = vis.card.mini_datasets.nomes_colunas[nome_mini_dataset].length;
            let espaco_necessario = vis.card.params.bar_height * 1.5 * qde_categorias;
            const largura_svg = vis.card.pegaLarguraSVG_dimensionaAltura(
                nome_mini_dataset, 
                espaco_necessario
            );

            // dados

            const mini_dados = vis.card.mini_datasets[nome_mini_dataset];

            // escala largura

            console.log(mini_dados)

            const valores = mini_dados.map(d => +d.valor);
            
            const domain_valores = [
                0, 
                valores_relativos ? 1 : Math.max(...valores)
            ];

            const range_barras = [0, largura_svg - vis.card.params.margin_left - vis.card.params.margin_right];

            console.log(range_barras, largura_svg);

            const w = d3.scaleLinear().range(range_barras).domain(domain_valores)

            // escala y

            let domain_categorias;

            if (nome_mini_dataset == "orgaos") {

                domain_categorias = mini_dados.map(d => d.rotulo);

            } else {

                domain_categorias = vis.card.mini_datasets.nomes_colunas[nome_mini_dataset];

            }

            const range_categorias = [0, espaco_necessario];

            const y = d3.scaleBand().range(range_categorias).domain(domain_categorias);

            console.log(nome_mini_dataset, range_barras)

            // barras

            svg
              .selectAll("rect")
              .data(mini_dados, d => d.rotulo)
              .join("rect")
              .attr("x", vis.card.params.margin_left)
              .attr("y", d => y(d.rotulo))
              .attr("height", vis.card.params.bar_height)
              .attr("fill", vis.card.params.cores[nome_mini_dataset])
              .transition()
              .duration(vis.params.transitions_duration)
              .attr("width", d => w(d.valor));

            // categorias

            cont
              .selectAll("p.rotulos-categorias-card")
              .data(mini_dados, d => d.rotulo)
              .join("p")
              .classed("rotulos-categorias-card", true)
              .classed("rotulos-card", true)
              .style("left", vis.card.params.margin_left + "px")
              .style("top", d => y(d.rotulo) + "px")
              .style("width", vis.card.params.margin_left + "px")
              //.style("line-height", vis.card.params.bar_height + "px")
              .text(d => nome_mini_dataset == "geral" ?
                         vis.card.params.rotulos_geral[d.rotulo] :
                         d.rotulo);

            // valores

            cont
                .selectAll("p.rotulos-valores-card")
                .data(mini_dados, d => d.rotulo)
                .join("p")
                .classed("rotulos-valores-card", true)
                .classed("rotulos-card", true)
                .style("left", d => vis.card.params.margin_left + w(d.valor) + "px")
                .style("top", d => y(d.rotulo) + "px")
                .style("width", vis.card.params.margin_right + "px")
                .style("line-height", vis.card.params.bar_height + "px")
                .text(function(d) {

                    console.log(d, d.valor);

                    if (d.valor === 0) {
                        return "";
                    } else if (valores_relativos) {
                        return utils.formataPct(d.valor);
                    } else {
                        return utils.valor_formatado(d.valor);
                    }

                });

                    // se for relativo (valores em percentuais), tem que multiplicar pelo PLOA.
                    // não, mostrar em 100%.


        },

        montaLineChart : function(nome_mini_dataset) {

            const svg = d3.select("#card-vis-" + nome_mini_dataset);
            const cont = d3.select("div.card-vis-" + nome_mini_dataset + " .container-vis-card");

            let w = +cont.style("width").slice(0,-2);
            let h = +cont.style("height").slice(0,-2);

            const domain_categorias = vis.card.mini_datasets.nomes_colunas[nome_mini_dataset];

            const mini_dados = vis.card.mini_datasets[nome_mini_dataset];
            const valores = mini_dados.map(d => +d.valor);
            
            const domain_valores = [
                0, Math.max(...valores)
            ];

            const range_x = [20, w-20];
            const range_y = [h-40, 40];

            const y = d3.scaleLinear().range(range_y).domain(domain_valores);
            const x = d3.scaleBand().range(range_x).domain(domain_categorias);

            const line = d3.line()
              .x(d => x(d.rotulo))
              .y(d => y(d.valor));

            svg
              .select("path.sh")
              .datum(mini_dados)
              .attr("d", line)
              .attr("stroke", "lightcoral")
              .attr("stroke-width", "3px")
              .attr("fill", "none");

            svg
              .selectAll("circle.sh")
              .data(mini_dados)
              .join("circle")
              .classed("sh", true)
              .attr("cx", d => x(d.rotulo))
              .attr("cy", d => y(d.valor))
              .attr("r", "4")
              .attr("fill", "lightcoral");

            cont
              .selectAll("p.rotulos-valores-line-card")
              .data(mini_dados, d => d.rotulo)
              .join("p")
              .classed("rotulos-valores-line-card", true)
              .classed("rotulos-card", true)
              .style("bottom", d => (h - y(d.valor)) + "px")
              .style("left", d => x(d.rotulo) + "px")
              .text(function(d) {

                console.log(d, d.valor);

                if (d.valor === 0) {
                    return "";
                } else {
                    return utils.valor_formatado(d.valor);
                }

            });



        },

        pegaLarguraSVG_dimensionaAltura : function(nome_mini_dataset, espaco_necessario) {

            const svg = d3.select("#card-vis-" + nome_mini_dataset);
            const cont = d3.select("div.card-vis-" + nome_mini_dataset + " .container-vis-card");

            //let qde_categorias = vis.card.mini_datasets.nomes_colunas[nome_mini_dataset].length;

            //let espaco_necessario = vis.card.params.bar_height * 1.5 * qde_categorias;

            let w = +cont.style("width").slice(0,-2);

            svg.style("height", espaco_necessario + "px");
            svg.style("width", w + "px");

            return(w)

        },

        monitora_fechar_card : function() {

            const $botao_fechar = d3.select(vis.refs.card_fechar);
            $botao_fechar.on("click", function() {

                vis.sels.card.classed("hidden", true);
                
            });
            
        }

    },

    control : {

        current_state : {

            mode : null,
            primeira_vez : true,
            primeira_vez_agregado : true,
            primeira_vez_detalhado : true,
            option : null,
            variavel_detalhamento : null,
            variavel_comparacao : null,
            selecao_orgao_decreto : "todos",
            selecao_anexo : "todos",
            exclui_divida : false,
            exclui_rgps : false,
            precisa_atualizar_dataset_detalhado : true,
            simulation_started : false,
            criterio_adicional_cores : null

        },

        states : {

            modes: {
    
                "agregado" : {
    
                    options : {
    
                        "orgao_decreto" : {
    
                            set_scales : [

                                { 
                                    dimension : "x" , 
                                    variable  : "agregado",
                                    axis      : true 
                                },
    
                                { 
                                    dimension : "y" ,  
                                    variable  : "orgao_decreto",
                                    axis      : false 
                                },
    
                                { 
                                    dimension : "w" ,
                                    variable  : "agregado", //"atu_total",
                                    axis      : false 
                                }

                            ],
    
                            render : function(option) {

                                console.log(this);

                                vis.draw.agregado.desenha_barras(option);

                            }

                        },

                        "anexo" : {

                            set_scales : [

                                { dimension: "x" , 
                                    variable : "agregado", //"pos_ini_agregador", pq o que importa aqui é a escala 
                                    axis     : true },
    
                                { dimension : "y" ,  
                                    variable  : "anexo",
                                    axis      : false },
    
                                { dimension : "w" ,
                                    variable  : "agregado", //"atu_total",
                                    axis      : false }
        
                                ],
        
                            render : function(option) {

                                console.log(this);

                                vis.draw.agregado.desenha_barras(option);
                                
                            }


                        },

                        "agregador" : {

                            set_scales : [

                                { dimension: "x" , 
                                    variable : "agregado", //"pos_ini_agregador", pq o que importa aqui é a escala 
                                    axis     : true },
    
                                { dimension : "y" ,  
                                    variable  : "agregador",
                                    axis      : false },
    
                                { dimension : "w" ,
                                    variable  : "agregado", //"atu_total",
                                    axis      : false }
        
                                ],
        
                            render : function(option) {

                                console.log(this);

                                vis.draw.agregado.desenha_barras(option);
                                
                            }

                        }
    
                    }
    
                },
    
                "detalhado" : {
    
                    options : {
    
                        "var-pct" : {
    
                            set_scales : [
    
                                { dimension: "x" , 
                                  variable : "var_pct_mod",
                                  axis     : true },
    
                                { dimension : "y" ,  
                                  variable  : "var_tipo",
                                  axis      : false },
    
                                { dimension : "r" , 
                                  variable  : "PLOA",
                                  axis      : false }
    
                            ],
        
                            render : function() {

                                const magnitudeForca = vis.draw.bubbles.parametros_simulation.magnitudeForca;

                                vis.draw.bubbles.simulation
                                  .nodes(vis.data.processed.detalhado.filter(d => !d.acao_nova))
                                  .force('x', d3.forceX().strength(magnitudeForca).x(d => vis.draw.scales["detalhado"].x(+d.var_pct_mod)))
                                  .force('y', d3.forceY().strength(magnitudeForca).y(d => vis.draw.scales["detalhado"].y(d.var_tipo)))
                                  .force("charge", null)
                                  .force('colisao', d3.forceCollide().radius(d => vis.draw.scales["detalhado"].r(+d.PLOA)));

                                // atualizei os nodes para tirar as ações novas, mas os círculos que correspondem a esses nodes continuam existindo. vou fazê-los sumir aqui: (depois tenho que retorná-los se voltar ao estado inicial)

                                //vis.sels.circles_acoes
                                //   .each(function(d) {
                                //       if (d.acao_nova) d3.select(this)
                                //         .transition()
                                //         .duration(vis.params.transitions_duration)
                                //         .attr("opacity", 0);
                                //   })
                                vis.sels.circles_acoes
                                  .classed("silent", d => d.acao_nova)
                                  .transition()
                                  .duration(vis.params.transitions_duration)
                                  .attr("opacity", d => d.acao_nova ? 0 : 1);
                                  //.attr("fill", d => vis.params.colors[d.var_tipo]);

                                vis.draw.bubbles.simulation.alpha(1).restart();

                                // melhorar, parametrizar
                                vis.sels.axis.x.style("opacity", 1);

                                // acrescenta rótulos

                                vis.f.remove_rotulos_detalhados();

                                if (document.querySelectorAll("div.rotulos-detalhado-lateral").length == 0) {

                                    console.log("supostamente ainda não há rótulos");

                                    vis.sels.rotulos_detalhados_lateral = vis.sels.cont
                                    .selectAll("div.rotulos-detalhado-lateral")
                                    .data(vis.draw.domains.categorical.detalhado.var_tipo)
                                    .join("div")
                                    .classed("rotulos-detalhado", true)
                                    .classed("rotulos-detalhado-lateral", true)
                                    .style("top", d => vis.draw.scales["detalhado"].y(d) + "px")
                                    .style("left", (vis.dims.margins.left*2/3) + "px")

                                    vis.sels.rotulos_detalhados_lateral.append("h2").text(d => d);

                                }

                            }
    
    
                        },

                        "var-abs" : {
    
                            set_scales : [
    
                                { dimension: "x" , 
                                  variable : "var_abs_mod",
                                  axis     : true },
    
                                { dimension : "y" ,  
                                  variable  : "var_tipo",
                                  axis      : false },
    
                                { dimension : "r" , 
                                  variable  : "PLOA",
                                  axis      : false }
    
                            ],
        
                            render : function() {

                                const magnitudeForca = vis.draw.bubbles.parametros_simulation.magnitudeForca;

                                vis.draw.bubbles.simulation
                                  .nodes(vis.data.processed.detalhado.filter(d => !d.acao_nova))
                                  .force('x', d3.forceX().strength(magnitudeForca).x(d => vis.draw.scales["detalhado"].x(+d.var_abs_mod)))
                                  .force('y', d3.forceY().strength(magnitudeForca).y(d => vis.draw.scales["detalhado"].y(d.var_tipo)))
                                  .force("charge", null)
                                  .force('colisao', d3.forceCollide().radius(d => vis.draw.scales["detalhado"].r(+d.PLOA)));

                                vis.sels.circles_acoes
                                  .classed("silent", d => d.acao_nova)
                                  .transition()
                                  .duration(vis.params.transitions_duration)
                                  .attr("opacity", d => d.acao_nova ? 0 : 1);
                                  //.attr("fill", d => vis.params.colors[d.var_tipo]);

                                vis.draw.bubbles.simulation.alpha(1).restart();

                                // melhorar, parametrizar
                                vis.sels.axis.x.style("opacity", 1);

                                vis.f.remove_rotulos_detalhados();

                                if (document.querySelectorAll("div.rotulos-detalhado-lateral").length == 0) {

                                    vis.sels.rotulos_detalhados_lateral = vis.sels.cont
                                    .selectAll("div.rotulos-detalhado-lateral")
                                    .data(vis.draw.domains.categorical.detalhado.var_tipo)
                                    .join("div")
                                    .classed("rotulos-detalhado", true)
                                    .classed("rotulos-detalhado-lateral", true)
                                    .style("top", d => vis.draw.scales["detalhado"].y(d) + "px")
                                    .style("left", (vis.dims.margins.left*2/3) + "px");

                                    vis.sels.rotulos_detalhados_lateral.append("h2").text(d => d);


                                }

                            }
    
                        },

                        "gnd" : {
    
                            set_scales : [
    
                                { dimension: "x_gnd" , 
                                  variable : "gnd_predominante",
                                  axis     : false },
    
                                { dimension : "r" , 
                                  variable  : "PLOA",
                                  axis      : false }
    
                            ],
        
                            render : function() {

                                // primeiro remove rotulos pre-existentes
                                vis.f.remove_rotulos_detalhados();
                                vis.f.remove_rotulos_detalhados_lateral();

                                const magnitudeForca = vis.draw.bubbles.parametros_simulation.magnitudeForca;

                                vis.draw.bubbles.simulation
                                .nodes(vis.data.processed.detalhado) // para garantir que todas estarao aqui, se vier do var_pct ou var_abs
                                .force('colisao', null)
                                .force('charge', vis.draw.bubbles.parametros_simulation.force_charge())
                                .force('x', d3.forceX().strength(magnitudeForca).x(d => vis.draw.scales.detalhado.x_gnd(d.gnd_predominante)))
                                .force('y', d3.forceY().strength(magnitudeForca).y(vis.dims.h/2));

                              // fazer todo mundo reaparecer.

                              vis.sels.circles_acoes
                                .classed("silent", false)
                                .transition()
                                .duration(vis.params.transitions_duration)
                                .attr("opacity", 1);

                                vis.draw.bubbles.simulation.alpha(1).restart();

                                // melhorar, parametrizar
                                vis.sels.axis.x.style("opacity", 0);

                                // rotulos

                                // na marra
                                const posicoes = {
                                    "Pessoal" : 186,
                                    "Dívida" : 300,
                                    "Custeio" : 460,
                                    "Investimento" : 643,
                                    "Nenhum" : 760
                                }


                                vis.sels.rotulos_detalhados = vis.sels.cont
                                  .selectAll("p.rotulos-detalhado-gnd")
                                  .data(vis.data.auxiliar.total_gnd)
                                  .join("div")
                                  .classed("rotulos-detalhado", true)
                                  .classed("rotulos-detalhado-gnd", true)
                                  .style("bottom", (vis.dims.margins.bottom * 2) + "px")
                                  .style("left", d => posicoes[d.categoria] + "px");

                                vis.sels.rotulos_detalhados.append("h2").text(d => d.categoria);
                                vis.sels.rotulos_detalhados.append("p").text(d => utils.valor_formatado(d.subtotal));


                            }
    
                        },

                        "inicial" : {
    
                            set_scales : [
    
                                { dimension : "r" , 
                                  variable  : "PLOA",
                                  axis      : false }
    
                            ],
        
                            render : function() {

                                // primeiro remove rotulos pre-existentes
                                vis.f.remove_rotulos_detalhados();
                                vis.f.remove_rotulos_detalhados_lateral();

                                const magnitudeForca = vis.draw.bubbles.parametros_simulation.magnitudeForca;

                                if (!vis.control.current_state.simulation_started) {

                                    vis.draw.bubbles.add();
                                    vis.sels.circles_acoes
                                      .transition()
                                      .duration(vis.params.transitions_duration)
                                      .attr("r", d => vis.draw.scales["detalhado"].r(+d.PLOA))
                                      .attr("fill", d => vis.params.colors[d.var_tipo])
    
                                    vis.draw.bubbles.config_simulation();

                                } else {

                                    vis.draw.bubbles.simulation
                                      .nodes(vis.data.processed.detalhado)
                                      .force('colisao', null)
                                      .force('charge', vis.draw.bubbles.parametros_simulation.force_charge())
                                      .force('x', d3.forceX().strength(magnitudeForca).x(vis.dims.w/2))
                                      .force('y', d3.forceY().strength(magnitudeForca).y(vis.dims.h/2));

                                    // fazer todo mundo reaparecer.

                                    vis.sels.circles_acoes
                                      .classed("silent", false)
                                      .transition()
                                      .duration(vis.params.transitions_duration)
                                      .attr("opacity", 1);

                                }

                                vis.draw.bubbles.simulation.alpha(1).restart();

                                // melhorar, parametrizar
                                vis.sels.axis.x.style("opacity", 0);

                                // acrescenta rótulos
                                vis.sels.rotulos_detalhados = vis.sels.cont
                                  .append("div")
                                  .classed("rotulos-detalhado", true)
                                  .classed("rotulos-detalhado-gnd", true)
                                  .style("top", (vis.dims.margins.top * 1.5) + "px")
                                  .style("left", vis.dims.w/2 + "px");

                                vis.sels.rotulos_detalhados.append("h2").text(vis.data.auxiliar.qde_acoes + " ações no PLOA 2021.");
                                vis.sels.rotulos_detalhados.append("p").text("R$ " + vis.data.auxiliar.total_acoes);

                            }
    
                        },

                        "acao_nova" : {
    
                            set_scales : [
    
                                { dimension : "r" , 
                                  variable  : "PLOA",
                                  axis      : false }
    
                            ],
        
                            render : function() {

                                // primeiro remove rotulos pre-existentes
                                vis.f.remove_rotulos_detalhados();
                                vis.f.remove_rotulos_detalhados_lateral();

                                const magnitudeForca = vis.draw.bubbles.parametros_simulation.magnitudeForca;

                                vis.draw.bubbles.simulation
                                  .nodes(vis.data.processed.detalhado.filter(d => d.acao_nova))
                                  .force('colisao', null)
                                  .force('charge', vis.draw.bubbles.parametros_simulation.force_charge())
                                  .force('x', d3.forceX().strength(magnitudeForca).x(vis.dims.w/2))
                                  .force('y', d3.forceY().strength(magnitudeForca).y(vis.dims.h/2));

                                vis.sels.circles_acoes
                                  .classed("silent", d => d.acao_nova ? false : true)
                                  .transition()
                                  .duration(vis.params.transitions_duration)
                                  .attr("opacity", d => d.acao_nova ? 1 : 0)


                                vis.draw.bubbles.simulation.alpha(1).restart();

                                // melhorar, parametrizar
                                vis.sels.axis.x.style("opacity", 0);

                                // acrescenta rótulos
                                vis.sels.rotulos_detalhados = vis.sels.cont
                                  .append("div")
                                  .classed("rotulos-detalhado", true)
                                  .classed("rotulos-detalhado-gnd", true)
                                  .style("top", (vis.dims.margins.top * 2) + "px")
                                  .style("left", vis.dims.w/2 + "px");

                                vis.sels.rotulos_detalhados.append("h2").text(vis.data.auxiliar.qde_acoes_novas + " novas ações");
                                vis.sels.rotulos_detalhados.append("p").text("R$ " + vis.data.auxiliar.total_acoes_novas);
                                

                            }
    
                        }
    
                    }
    
                }
    
            }
    
    
        },

        begin : function(files) {

            console.log(files[0].columns);
            console.log(files[1].columns);

            // saves data as a property to make it easier to access it elsewhere
            vis.data.raw.agregado = files[0];
            vis.data.raw.detalhado = files[1];


            // // summarise data for categorical variables
            // vis.f.summarise_categorical(
            //     numerical_variable = "atu_total");

            //updates colors
            vis.f.update_colors();

            // populates comparison selector
            vis.f.populates_comparison_selector();
            // populates filters
            vis.f.populates_filter_selector("orgao_decreto");
            vis.f.populates_filter_selector("anexo");


            // evaluates domains for selected variables
            vis.draw.domains.initialize_categorical();

            // updates ranges
            vis.draw.ranges.update();

            // sets scales
            vis.draw.scales.initialize();

            // add x, y axis
            // isso vai para o draw state
            //vis.draw.axis.initialize();

            // add rects/bubbles
            //vis.draw.bubbles.add();

            // starts monitoring button clicks
            vis.control.monitor_mode_button();
            vis.control.monitor_option_button();
            vis.control.monitora_seletor_comparacao();
            vis.control.monitora_seletores_filtros();
            vis.control.monitora_exclusoes();
            vis.control.monitora_seletor_cores();
            vis.control.monitora_controles_adicionais_cores();

            //vis.control.draw_state("agregado", "orgao_decreto");

        },

        draw_state : function(mode, option) {

            // mode é se é agregado ou detalhado
            // option é a variável de detalhamento (no caso do agregado)

            console.log(vis.control.current_state);

            // se começou agora, inicializa o eixo

            if (vis.control.current_state.primeira_vez) {

                vis.draw.axis.initialize(mode);
                vis.control.current_state.primeira_vez = false;

            } 

            // // ajusta flags quando for a primeira vez num novo modo

            // if (vis.control.current_state.primeira_vez_agregado) {

            //     vis.control.current_state.primeira_vez_agregado = false;
            //     vis.control.current_state.primeira_vez_detalhado = true;

            // }

            // if (vis.control.current_state.primeira_vez_detalhado) {

            //     vis.control.current_state.primeira_vez_agregado = true;
            //     vis.control.current_state.primeira_vez_detalhado = false;

            // }



            if (mode == "detalhado" & !vis.control.current_state.precisa_atualizar_dataset_detalhado) {

            } else {

                vis.f.evaluate_dataset(
                    modo = mode,
                    selecao_orgao = vis.control.current_state.selecao_orgao_decreto,
                    selecao_anexo = vis.control.current_state.selecao_anexo,
                    exclui_divida = vis.control.current_state.exclui_divida,
                    exclui_rgps = vis.control.current_state.exclui_rgps,
                    var_detalhamento = option
                );

            }

            if (mode == "agregado") {

                vis.draw.domains.evaluate_domain_agregado();
                vis.draw.domains.evaluate_domain_categorical();

            } else {

                vis.draw.domains.evaluate_domain_detalhado();

            }

            vis.draw.scales.set(
                mode = mode, 
                option = option
            );

            vis.control.states
              .modes[mode]
              .options[option]
              .render(option)
            ;

            if (mode == "detalhado") {

                vis.control.monitora_tooltips();
                vis.control.monitora_card();

            }

        },

        clear_canvas : function(mode) {

            // salvo o opacity atual para recuperar depois (para evitar que uma bolha que estivesse escondida na visão atual apareça quando o usuário voltar para essa visão)

            d3.selectAll(vis.refs.objetos_atuais[mode]).each(function(d) {
                let obj = d3.select(this);
                let current_opacity = obj.attr("opacity");
                //console.log(current_opacity);

                obj
                  .attr("data-opacity", current_opacity)
                  .attr("opacity", 0)
            });

            d3.selectAll(vis.refs.rotulos_atuais[mode]).style("opacity", 0);

        },

        recover_canvas : function(mode) {

            // agora recupero o valor da opacity dele antes de tê-lo feito desaparecer por uma mudança de modo

            let objs = d3.selectAll(vis.refs.objetos_atuais[mode]);
            if (objs) {
                objs.each(function(d) {
                    let obj = d3.select(this);
                    let previous_opacity = obj.attr("data-opacity");
                    
                    obj
                      .attr("opacity", previous_opacity); 
                })
            }

            let rotulos = d3.selectAll(vis.refs.rotulos_atuais[mode]);
            if (rotulos) rotulos.style("opacity", null);

        },

        monitor_mode_button : function() {

            let buttons = document.querySelector(vis.refs.mode_button);

            vis.elems.mode_button = buttons;

            buttons.addEventListener("click", function(e) {

                //console.log(this.children, e.target, this.children[0] == e.target);

                // to avoid de-selecting all buttons and running everything when user clicks outside the buttons

                if (e.target.tagName == "BUTTON") {
                    //ou (e.target.matches("button"))

                    vis.control.activates_button(
                        all_buttons = this.children,
                        clicked = e.target
                    );

                    let mode = e.target.id;

                    if (vis.control.current_state.mode != mode) {

                        // esconde objetos do modo atual
                        vis.control.clear_canvas(vis.control.current_state.mode);

                        // recupera, se existirem, objetos do novo modo
                        vis.control.recover_canvas(mode);

                        // atualiza modo
                        vis.control.current_state.mode = mode;

                        vis.control.show_mode_dependent_controls(mode);

                        

                        // define uma opção padrão na primeira vez que se escolhe um modo

                        // if (vis.control.current_state.primeira_vez_agregado || vis.control.current_state.primeira_vez_detalhado) {

                        //     let option = vis.params.standard_option[mode];

                        //     // aciona o botao da opcao

                        //     option_button = document.querySelector("#" + option);
                        //     other_options = option_button.parentElement;

                        //     vis.control.activates_button(
                        //         all_buttons = other_options,
                        //         clicked = option_button
                        //     );

                        //     //


                        //     // fazer esse controle nos data-attributes?
                        //     vis.control.current_state.mode = mode;
                        //     vis.control.current_state.variavel_detalhamento = option;

                        //     vis.f.reinicia_seletor_comparacao();

                        //     vis.control.draw_state(mode, option);

                        // }

    
                        console.log(mode);

                    } else {console.log("ô, camarada, vc já está nesse modo :)")}

                } else {console.log("Clique num botão, meu filho.")}

            });


        },

        monitor_option_button : function() {

            // otimizar : dá para deixar um monitor só

            let buttons = document.querySelector(vis.refs.option_button);

            vis.elems.option_button = buttons;


            buttons.addEventListener("click", function(e) {

                //console.log(this.children, e.target, this.children[0] == e.target);

                // to avoid de-selecting all buttons and running everything when user clicks outside the buttons

                if (e.target.tagName == "BUTTON") {
                    //ou (e.target.matches("button"))

                    const button_container = e.target.parentElement;
                    console.log(button_container);

                    vis.control.activates_button(
                        all_buttons = button_container.children,
                        clicked = e.target
                    );

                    let option = e.target.id;

                    if (vis.control.current_state.option != option) {

                        // depois tem que ajeitar isso aqui
                        // button_container.dataset.option = option;

                        vis.control.current_state.option = option;

                        let mode = button_container.dataset.mode;

                        console.log("hi", mode, option);

                        // fazer esse controle nos data-attributes?
                        //vis.control.current_state.mode = mode;
                        vis.control.current_state.variavel_detalhamento = option;

                        vis.f.reinicia_seletor_comparacao();
                        //vis.f.reinicia_seletor_cores();

                        vis.control.draw_state(mode, option);

                        if (mode == "detalhado") {vis.control.current_state.precisa_atualizar_dataset_detalhado = false} 
                        // agora só precisa voltar para true depois de algum filtro ser aplicado

                    } else {console.log("ô, camarada, vc já está nesse modo :)")}

                } else {console.log("Clique num botão, meu filho.")}

            });

        },

        monitora_seletor_comparacao : function() {

            const selector = document.querySelector(vis.refs.comparison_selector);

            vis.elems.seletor_comparacao = selector;

            selector.addEventListener("change", function(e) {

                const opcao_selecionada = e.target.value;

                vis.control.current_state.variavel_comparacao = opcao_selecionada;

                if (opcao_selecionada == "nada") {
                    vis.draw.agregado.remove_linhas_referencia();
                } else {
                    vis.draw.agregado.desenha_linhas_referencia(
                        cat_variable = vis.control.current_state.variavel_detalhamento,

                    num_variable = opcao_selecionada
                    );
                }

            })


        },

        monitora_seletores_filtros : function() {

            let seletores = document.querySelector(vis.refs.selectors_wrapper);

            seletores.addEventListener("change", function(e) {

                const seletor = e.target.name; // pra saber se foi no de orgao_decreto ou anexo
                const valor_selecionado = e.target.value//.slice(0,5);

                if (valor_selecionado != vis.control.current_state["selecao_" + seletor]) {

                    vis.control.current_state["selecao_" + seletor] = valor_selecionado;

                    if (vis.control.current_state.option != null) {

                        console.log("desenha");

                        vis.control.draw_state(
                            mode = vis.control.current_state.mode, 
                            option = vis.control.current_state.option
                        );

                        // if (vis.sels.linhas_referencia) {
                        //     vis.draw.agregado.desenha_linhas_referencia(
                        //         cat_variable = vis.control.current_state.variavel_detalhamento,num_variable = vis.control.current_state.option
                        //     )
                        // }

                    }

                }

            });

        },

        monitora_exclusoes : function() {

            let checkboxes = document.querySelector(vis.refs.exclusoes_wrapper);

            checkboxes.addEventListener("change", function(e) {

                const opcao = e.target.name; // pra saber se foi no de divida ou rgps
                const checked = e.target.checked//.slice(0,5);

                console.log("Monitor exclusoes", opcao, checked)

                if (checked != vis.control.current_state["exclui_" + opcao]) {

                    vis.control.current_state["exclui_" + opcao] = checked;

                    if (vis.control.current_state.option != null) {

                        console.log("desenha");

                        vis.control.draw_state(
                            mode = vis.control.current_state.mode, 
                            option = vis.control.current_state.option
                        );

                    }

                }

            });

        },

        monitora_seletor_cores : function() {

            const selector = document.querySelector(vis.refs.seletor_cores);

            vis.elems.seletor_cores = selector;

            selector.addEventListener("change", function(e) {

                const opcao_selecionada = e.target.value;

                vis.control.current_state.criterio_adicional_cores = opcao_selecionada;

                if (["padrao", "mod"].includes(opcao_selecionada)) {

                    vis.f.colore_bolhas(opcao_selecionada);
                    // nos demais casos, vai ser aberto um controle adicional com radio buttons, e o colore_bolhas só vai ser chamada no evento de mudança do radio

                } //else {

                // tirei o else pq ele tem que chamar essa função sempre. se a opcao for "padrao", a funcao show vai fazer com que todos os controles adicionais sejam ocultados.

                console.log("seletor de cores, opcao: ", opcao_selecionada);

                vis.control.show_controles_adicionais_cores(opcao_selecionada);
                
                    
                //}

            })

        },

        activates_button : function(all_buttons, clicked) {

            let all_buttons_arr = Array.from(all_buttons);
            // pq o que vem é um HTML Collection

            all_buttons_arr.forEach(button => {
                button.classList.remove("selected");
            })

            clicked.classList.add("selected");
            
        },

        show_mode_dependent_controls : function(mode) {

            let mode_controls = document.querySelectorAll(vis.refs.mode_dependent_controls);

            mode_controls.forEach(control => control.classList.add("hidden"));

            let active_controls = document.querySelectorAll(
                '[data-visible-on-mode="' +
                mode +
                '"]' );
            
            // mudei para querySelectorAll para selecionar o seletor de comparação também

            active_controls.forEach(control => control.classList.remove("hidden"));

        },

        show_controles_adicionais_cores : function(opcao) {

            let controles_adicionais = document.querySelectorAll(vis.refs.controles_adicionais_cores);

            controles_adicionais.forEach(controle_adicional => controle_adicional.classList.add("hidden"));

            let active_controls = document.querySelectorAll(
                '[data-selecao-adicional-para="' +
                opcao +
                '"]' );
            
            // mudei para querySelectorAll para selecionar o seletor de comparação também

            console.log('[data-selecao-adicional-para="' +
            opcao +
            '"]', active_controls);

            active_controls.forEach(controle_adicional => controle_adicional.classList.remove("hidden"));

        },

        monitora_controles_adicionais_cores : function() {

            let controles_adicionais = document.querySelectorAll(".selecao-adicional-cores")

            controles_adicionais.forEach(radio => radio.addEventListener("change", function(e) {

                const tipo = e.target.name;
                const valor_selecionado = e.target.value;

                console.log(tipo, valor_selecionado);

                //const variavel_criterio_cor = vis.params.variaveis_cores[opcao][valor_selecionado];

                vis.f.colore_bolhas(tipo, valor_selecionado);
                

            }))

            // continuar aqui. definir escala de cores.

        },

        monitora_tooltips : function() {

            // usando listener de D3

            vis.sels.circles_acoes
              .on('mouseover', vis.f.mostraTooltip)
              .on('mouseout',  vis.f.escondeTooltip);

        },

        monitora_card : function() {

            vis.sels.circles_acoes
              .on('click', vis.card.montaCard);

        }

    }

}

vis.init();

console.log(vis);