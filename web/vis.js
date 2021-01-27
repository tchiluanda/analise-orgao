const vis = {

    refs: {

        svg: "svg.vis",
        cont: "div.vis-container",
        mode_button: "nav.mode-control",
        option_button: "div.option-control",
        mode_dependent_controls: "[data-visible-on-mode]",
        comparison_selector: "[name='seletor-comparacao']",
        selectors_wrapper: ".selecoes-wrapper",
        selector_orgao_decreto : "#selecao-orgao",
        selector_anexo : "#selecao-tipo",
        exclusoes_wrapper: ".exclusoes-wrapper",
        exclui_divida: "#exclui-divida",
        exclui_rgps: "#exclui-rgps",
        barras: "rect.barras",
        linhas_referencia: "line.ref",
        data: {
            agregado : "./dados/dados.csv",
            detalhado : "./dados/dados_acoes.csv"
        },
        objetos_atuais : "svg *", // para limpar o canvas
        rotulos_atuais : "div.vis-container .rotulos",


        colors : {
            destaque_barra : "--cor-barra-destaque",

            barra_normal : "--cor-barra-normal"
        }

    },

    sels: {

        svg : null,
        cont : null,
        circles_acoes : null,
        axis : {},
        barras : null,
        linhas_referencia : null

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
        bar_height: 10,
        margins: {

            top: 10,
            left: 200,
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
                detalhado : ["var_aumento"]
    
            }

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

        variables_type : {

            PLOA              : "numerical",
            var_abs_mod       : "log",
            var_pct_mod       : "log",
            dot_atu           : "numerical",
            agregado          : "numerical",
            agregador         : "categorical",
            var_tipo          : "categorical"

        },

        dimensions : ["x", 
        //"x_log", 
        "y", 
        //"y_cat", 
        "y_var", "w", "r"],

        dims_vs_visual_dims : {

            // pq algumas dimensões têm escalas diferentes (às vezes o y vai ser ordinal, às vezes numérico... às vezes x vai ser numérico linear, às vezes numérico log etc. essa é uma forma de ter à mão as diversas escalas, mas manter sempre apenas os eixos x e y.)

            // logical dimension : physical dimension

            // incluí uma lógica para considerar a dimensão física como a própria dimensão lógica se ele não achar a correspondência no lookup a este objeto. tipo, "x" vai ser "x" mesmo. só preciso especificar aqui as exceções.

            //"x_log" : "x",
            //"y_cat" : "y",
            "y_var" : "y"

        },

        //dimensions : ["x", "y", "y_cat", "y_anexos", "w", "r"]

        nomes_demais : { // aqui preciso de um registro para cada variável que pode ser usada como critério de detalhamento

            anexo: "Demais anexos",
            agregador: "Demais agregadores",
            orgao_decreto: "Demais órgãos"

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
                    const var_abs = (el.PLOA - el.dot_atu);
                    const aumento = var_pct > 1;

                    el["var_tipo"] = aumento ? "aumento" : "redução";

                    el["var_pct_mod"] = aumento ? var_pct : (1/var_pct);
                    el["var_abs_mod"] = Math.abs(var_abs);

                    // essas variáveis criadas aqui devem ser informadas lá em vis.params.variables_detalhado
                }
                
            });

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

        update_colors : function() {

            const colors = Object.keys(vis.refs.colors);

            colors.forEach(color => {
                vis.params.colors[color] = getComputedStyle(document.documentElement).getPropertyValue(vis.refs.colors[color]).slice(1);
            });

        },

        desabilita_opcao : function(opcao) {

            document.querySelector("button#" + opcao).classList.add("disabled");

        },

        mostraTooltip : function(d) {

            let dados = d3.select(this).datum();

            let x_bubble = +d3.select(this).attr('cx');
            let y_bubble = +d3.select(this).attr('cy');

            console.log(x_bubble, y_bubble);
        
            const $tooltip = d3.select("div#card");
            
            let largura_tooltip_css = +$tooltip.style("width").substring(0, $tooltip.style("width").length-2);
            
            $tooltip.classed("hidden", false);
        
            // popula informacao

            // parametrizar isso em vis.params
      
            const infos_tooltip = ["acao", "tituloacao", "PLOA", "dot_atu", "aumento"];
        
            infos_tooltip.forEach(function(info) {
                let text = "";
                if (vis.params.variables_type[info] == "numerical") text = utils.valor_formatado(dados[info])
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

            d3.select("div#card").classed("hidden", true);

        }


    },

    draw: {

        domains : {

            initialize_categorical : function() {

                function generate(data, variable, categorical = false) {

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
                    vis.draw.domains[variable] = generate(vis.data.raw.agregado, variable, categorical = true);
                });

            },

            evaluate_domain_categorical : function() {

                let current_variable = vis.control.current_state.variavel_detalhamento;

                let subtotais = utils.group_by_sum(
                    objeto = vis.data.processed.agregado,
                    coluna_categoria = current_variable,
                    coluna_valor = vis.params.main_variable,
                    ordena_decrescente = true
                );

                console.log(subtotais);

                vis.draw.domains[current_variable] = utils.unique(
                    obj = subtotais,
                    col = "categoria"
                ).reverse();

            },

            evaluate_domain_agregado : function(){

                // maximos dos dados selecionados atuais

                const maxs = vis.params.variables.numerical.agregado.map(
                    variable => d3.max(vis.data.processed.agregado, d => d[variable])
                );

                vis.draw.domains.agregado = [
                    0,
                    Math.max(...maxs)
                ];

            },

            evaluate_domain_detalhado : function(){

                vis.params.variables.numerical.detalhado.forEach(
                    variavel => {
                        console.log(variavel, "DOMINIOS")
                        vis.draw.domains[variavel] = [
                            vis.params.variables_type[variavel] == "log" ? 1 : 0,
                            d3.max(vis.data.processed.detalhado, d => +d[variavel])
                        ]
                        
                        //d3.extent(vis.data.processed.detalhado, d => d[variavel]);
                    }
                );

                vis.draw.domains[vis.params.main_variable] = [0, d3.max(vis.data.processed.detalhado, d => d[vis.params.main_variable])];
                // a main variable é o PLOA

            },

            agregado : null, // trocar esse nome

            // categorical variables will be properties
            // numerical também

            var_tipo : ["aumento", "redução"]

        },

        ranges : {

            x : null,
            //x_log : null,
            y : null,
            //y_cat : null,
            //y_anexos : null,
            //y_agregadores : null,
            w : null,
            r : [2,40],
            y_var : null,
            // o do modo detalhado, opcao variação

            update : function() {

                vis.draw.ranges.x = [ vis.dims.margins.left, vis.dims.w - vis.dims.margins.right ];

                //vis.draw.ranges.x_log = [ vis.dims.margins.left/2, vis.dims.w - vis.dims.margins.right ];
    
                vis.draw.ranges.y = [ vis.dims.h - vis.dims.margins.bottom, vis.dims.margins.top ];

                vis.draw.ranges.y_var = [vis.dims.h/4, vis.dims.h*3/4];

                vis.draw.ranges.w = [ 0, vis.dims.w - vis.dims.margins.left - vis.dims.margins.right];
    
            },

            calcula_range_var_categorica : function(categorical_var) {

                let qde_categorias = vis.draw.domains[categorical_var].length;

                let comprimento_necessario = vis.dims.bar_height * qde_categorias;

                return([vis.dims.margins.top, vis.dims.margins.top + comprimento_necessario]);

            }

        },

        scales : {

            agregado : {

                x: d3.scaleLinear().clamp(true),
                y: d3.scaleBand(),
                w: d3.scaleLinear().clamp(true),

            },

            detalhado : {

                x : d3.scaleLog(),
                y: d3.scaleLinear().clamp(true),
                y_var: d3.scaleOrdinal(),
                r: d3.scaleSqrt()

            },

            initialize : function() {
                
                vis.params.dimensions.forEach(dimension => {

                    let dimension_range = vis.params.dims_vs_visual_dims[dimension];
                    
                    if (!dimension_range) dimension_range = dimension;
                    // dimension_range vai ser undefined se não estiver na lista de correspondência, caso contrário assume a própria dimensão.

                    vis.params.modes.forEach(mode => {
                        if (vis.draw.scales[mode][dimension]) {
                            vis.draw.scales[mode][dimension]
                              .range(vis.draw.ranges[dimension_range])
                        }
                        console.log("Inicializando scales", dimension, vis.draw.scales[mode][dimension]);
                    });


                });
    
            },

            set_domain : function(mode, dimension, variable) {

                vis.draw.scales[mode][dimension]
                  .domain(vis.draw.domains[variable]);
    
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

                        //vis.draw.axis.update(mode, scale.dimension, scale.variable);

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

                console.log("Updating o axis_scale da dimensao", dimension, dimension_axis);

                vis.draw.axis[dimension_axis].scale(
                    vis.draw.scales[mode][dimension]
                )

            },

            create : function(desloc_x, desloc_y, dimension) {
                
                let svg = vis.sels.svg;

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

            initialize : function() {

                //fazer um forEach aqui... armazenar essas variáveis

                vis.params.modes.forEach(mode => {
                    vis.draw.axis.update_axis_scale(mode, "x");
                    vis.draw.axis.update_axis_scale(mode, "y");
                //vis.draw.axis.update_axis_scale("x_log");
                });
                
                //vis.draw.axis.update_axis_scale("y_cat");
                vis.draw.axis.update_axis_scale("detalhado", "y_var");

                // aqui tb... evitar superposição de eixos tb.
    
                vis.draw.axis.create(
                    desloc_x = 0,
                    desloc_y = vis.draw.scales.y(0),//vis.dims.h - vis.dims.margins,
                    "x");
    
                vis.draw.axis.create(
                    desloc_x = vis.dims.margins.left,
                    desloc_y = 0,
                    "y");

                vis.draw.axis.create(
                    desloc_x = vis.dims.margins.left/2,
                    desloc_y = 0,
                    "y_var");
                
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

            x :  d3.axisBottom(),

            y :  d3.axisLeft(),

            y_var : d3.axisLeft()

        },

        agregado : {

            desenha_barras : function(variable) {

                vis.sels.svg
                .selectAll("rect.barras")
                .data(vis.data.processed.agregado, d => d[variable])
                .join("rect")
                .classed("barras", true)
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

                vis.sels.cont
                .selectAll("p.labels-valores-barras")
                .data(vis.data.processed.agregado, d => d[variable])
                .join("p")
                .classed("labels-valores-barras", true)
                .classed("rotulos", true)
                .style("top", d => (vis.draw.scales["agregado"].y(d[variable]) + vis.dims.margins.top) + "px")
                .style("left", vis.dims.margins.left + "px")
                .style("font-size", vis.dims.bar_height + "px")
                .style("line-height", vis.dims.bar_height + "px")
                .text(d => utils.valor_formatado(d[vis.params.main_variable]))
                .transition()
                .duration(vis.params.transitions_duration)
                .style("left", d => (vis.dims.margins.left + vis.draw.scales["agregado"].w(d[vis.params.main_variable])) + "px")


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

            }

        },

        bubbles : {

            add : function() {

                let svg = vis.sels.svg;

                vis.sels.circles_acoes = svg
                  .selectAll("circle")
                  .data(vis.data.processed.detalhado)
                  .join("circle")
                  .classed("acoes", true)
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
                  .attr("stroke", d => d.acao_nova ? "#4B0082" : "#fada5e")
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

        card : {

            // outro script, talvez?

        }


    },

    control : {

        current_state : {

            mode : null,
            option : null,
            variavel_detalhamento : null,
            variavel_comparacao : null,
            selecao_orgao_decreto : "todos",
            selecao_anexo : "todos",
            exclui_divida : false,
            exclui_rgps : false,
            precisa_atualizar_dataset_detalhado : true,
            simulation_started : false

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
                                    axis      : true 
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
                                    axis      : true },
    
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
                                    axis      : true },
    
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
    
                                { dimension : "y_var" ,  
                                  variable  : "var_tipo",
                                  axis      : true },
    
                                { dimension : "r" , 
                                  variable  : "PLOA",
                                  axis      : false }
    
                            ],
        
                            render : function() {

                                console.log("let's go!")

                                const magnitudeForca = vis.draw.bubbles.parametros_simulation.magnitudeForca;

                                vis.draw.bubbles.simulation
                                  .nodes(vis.data.processed.detalhado.filter(d => !d.acao_nova))
                                  .force('x', d3.forceX().strength(magnitudeForca).x(d => vis.draw.scales["detalhado"].x(+d.var_pct_mod)))
                                  .force('y', d3.forceY().strength(magnitudeForca).y(d => vis.draw.scales["detalhado"].y_var(d.var_tipo)))
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
                                  .attr("opacity", d => d.acao_nova ? 0 : 1)
                                  .attr("fill", d => d.var_tipo == "aumento" ? "dodgerblue" : "tomato");

                                vis.draw.bubbles.simulation.alpha(1).restart();

                            }
    
    
                        },

                        "var-abs" : {
    
                            set_scales : [
    
                                { dimension: "x" , 
                                  variable : "var_abs_mod",
                                  axis     : true },
    
                                { dimension : "y_var" ,  
                                  variable  : "var_tipo",
                                  axis      : true },
    
                                { dimension : "r" , 
                                  variable  : "PLOA",
                                  axis      : false }
    
                            ],
        
                            render : function() {

                                console.log("let's go!")

                                const magnitudeForca = vis.draw.bubbles.parametros_simulation.magnitudeForca;

                                vis.draw.bubbles.simulation
                                  .nodes(vis.data.processed.detalhado.filter(d => !d.acao_nova))
                                  .force('x', d3.forceX().strength(magnitudeForca).x(d => vis.draw.scales["detalhado"].x(+d.var_abs_mod)))
                                  .force('y', d3.forceY().strength(magnitudeForca).y(d => vis.draw.scales["detalhado"].y_var(d.var_tipo)))
                                  .force("charge", null)
                                  .force('colisao', d3.forceCollide().radius(d => vis.draw.scales["detalhado"].r(+d.PLOA)));

                                vis.sels.circles_acoes
                                  .classed("silent", d => d.acao_nova)
                                  .transition()
                                  .duration(vis.params.transitions_duration)
                                  .attr("opacity", d => d.acao_nova ? 0 : 1)
                                  .attr("fill", d => d.var_tipo == "aumento" ? "dodgerblue" : "tomato");

                                vis.draw.bubbles.simulation.alpha(1).restart();

                            }
    
                        },

                        "inicial" : {
    
                            set_scales : [
    
                                { dimension : "r" , 
                                  variable  : "PLOA",
                                  axis      : false }
    
                            ],
        
                            render : function() {

                                const magnitudeForca = vis.draw.bubbles.parametros_simulation.magnitudeForca;

                                if (!vis.control.current_state.simulation_started) {

                                    vis.draw.bubbles.add();
                                    vis.sels.circles_acoes
                                      .transition()
                                      .duration(vis.params.transitions_duration)
                                      .attr("r", d => vis.draw.scales["detalhado"].r(+d.PLOA))
                                      .attr("fill", d => d.acao_nova ? "#4B008250" : "#fada5e50")
    
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
            //vis.draw.axis.initialize();

            // add rects/bubbles
            //vis.draw.bubbles.add();

            // starts monitoring button clicks
            vis.control.monitor_mode_button();
            vis.control.monitor_option_button();
            vis.control.monitora_seletor_comparacao();
            vis.control.monitora_seletores_filtros();
            vis.control.monitora_exclusoes();

            //vis.control.draw_state("agregado", "orgao_decreto");

        },

        draw_state : function(mode, option) {

            // mode é se é agregado ou detalhado
            // option é a variável de detalhamento (no caso do agregado)

            console.log(vis.control.current_state);

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

            if (mode == "detalhado") {vis.control.monitora_tooltips()}

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

                    if (this.dataset.mode != mode) {

                        this.dataset.mode = mode;
                        vis.control.current_state.mode = mode;

                        vis.control.show_mode_dependent_controls(mode);

                        d3.selectAll(vis.refs.objetos_atuais).remove();
                        d3.selectAll(vis.refs.rotulos_atuais).remove();

                        /*

                        if (mode == "detalhado") {

                            vis.control.draw_state(
                                mode = "detalhado", 
                                option = "variacao"
                                );
                        }
    
                        if (mode == "agregado") {
    
                            vis.control.draw_state(
                                mode = "agregado", 
                                option = "agregador"
                                );
    
                        }
                        
                        */
    
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

                    if (button_container.dataset.option != option) {

                        // depois tem que ajeitar isso aqui
                        button_container.dataset.option = option;

                        vis.control.current_state.option = option;

                        let mode = button_container.dataset.mode;

                        console.log("hi", mode, option);

                        // fazer esse controle nos data-attributes?
                        vis.control.current_state.mode = mode;
                        vis.control.current_state.variavel_detalhamento = option;

                        vis.f.reinicia_seletor_comparacao();

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

        monitora_tooltips : function() {

            // usando listener de D3

            vis.sels.circles_acoes
              .on('mouseover', vis.f.mostraTooltip)
              .on('mouseout',  vis.f.escondeTooltip);

        }

    }

}

vis.init();

console.log(vis);