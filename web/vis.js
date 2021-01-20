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
        data: "./dados/dados.csv",

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

        raw : null,

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

        modes : ["anexo", "agregador", "acao"],

        variables : ["PLOA", "dot_atu", "desp_paga"], // mudar esse nome aqui depois

        variables_detalhado : ["var_pct", "var_abs"],

        variables_names : {

            PLOA : "PLOA",
            dot_atu : "Dotação atualizada do ano anterior",
            desp_paga : "Despesa paga no ano anterior"

        },

        main_variable : "PLOA",

        categorical_vars : ["orgao_decreto", "anexo", "agregador", "funcao_tipica"],
        // also, those are the variables used for evaluating summaries in the "agregado" mode.

        // this will serve to determine axis

        variables_type : {

            PLOA              : "numerical",
            varia             : "numerical",
            varia_pct         : "percent",
            dot_atu           : "numerical",
            agregado          : "numerical",
            agregador         : "categorical",
            funcao_tipica     : "categorical"

        },

        dimensions : ["x", "y", "y_cat", "w", "r"],

        //dimensions : ["x", "y", "y_cat", "y_anexos", "w", "r"]

        nomes_demais : { // aqui preciso de um registro para cada variável que pode ser usada como critério de detalhamento

            anexo: "Demais anexos",
            agregador: "Demais agregadores",
            funcao_tipica: "Demais funções",
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

        read_data : function(url) {

            d3.csv(vis.refs.data).then(
                data => vis.control.begin(data)
            );

        },

        summarise_categorical : function(numerical_variable) {

            vis.params.categorical_vars.forEach(categorical_variable => {

                vis.data.processed.agregado[categorical_variable] =
                utils.group_by_sum(
                    objeto = vis.data.raw, 
                    coluna_categoria = categorical_variable, 
                    coluna_valor = numerical_variable, 
                    ordena_decrescente = true
                )
                
            });

        },

        evaluate_dataset : function(modo, selecao_orgao, selecao_anexo, exclui_divida, exclui_rgps, var_detalhamento) {

            let dados = vis.data.raw;

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

            console.log("Estou aqui", var_detalhamento);

            vis.data.processed.agregado = utils.group_by_sum_cols(

                objeto = vis.data.processed.filtered,
                coluna_categoria = var_detalhamento,
                colunas_valor = vis.params.variables,
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

                vis.params.variables.forEach(
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

            vis.data.processed.detalhado = utils.group_by_sum_cols(

                objeto = vis.data.processed.filtered.filter(d => d[vis.params.main_variable] > 0),
                coluna_categoria = "acao",
                colunas_valor = vis.params.variables,
                ordena_decrescente = false,
                coluna_ordem = null

            );

            vis.data.processed.detalhado.forEach(el => {
                const acao_nova = (+el.dot_atu == 0 & +el.desp_paga == 0);

                el["acao_nova"] = acao_nova;

                if (!acao_nova) {
                    el["var_pct"] = (el.PLOA / el.dot_atu) - 1;
                    el["var_abs"] = el.PLOA -el.dot_atu;
                }
                
            });

        },

        populates_filter_selector : function(seletor) { // orgao_decreto ou anexo

            const selector = document.querySelector(vis.refs["selector_" + seletor]);

            const valores_unicos = utils.unique(vis.data.raw, seletor);

            valores_unicos.forEach(variable => {

                let new_option = document.createElement("option");

                new_option.setAttribute("value", variable);
                new_option.innerText = variable;

                selector.append(new_option);
            });

        },

        populates_comparison_selector : function() {

            const selector = document.querySelector(vis.refs.comparison_selector);

            const comparison_variables = [...vis.params.variables];

            
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
        }
    },

    draw: {

        domains : {

            initialize_categorical : function() {

                function generate(data, variable, categorical = false) {

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

                vis.params.categorical_vars.forEach(variable => {
                    vis.draw.domains[variable] = generate(vis.data.raw, variable, categorical = true);
                });

                // function initialize_domain_agregado() {

                //     const maxs = vis.params.categorical_vars.map(
                //         cat => d3.max(vis.data.processed.agregado[cat],
                //             d => +d.subtotal)
                //     )
    
                //     vis.draw.domains["agregado"] = [
                //         0, 
                //         d3.max(maxs, d => d)
                //     ];
                //     // Math.max(...maxs)
                //     // ES6
                // }

                // initialize_domain_agregado();

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

                const maxs = vis.params.variables.map(
                    variable => d3.max(vis.data.processed.agregado, d => d[variable])
                );

                vis.draw.domains.agregado = [
                    0,
                    Math.max(...maxs)
                ];

            },

            evaluate_domain_detalhado : function(){

                vis.params.variables_detalhado.forEach(
                    variavel => {
                        vis.draw.domains[variavel] = d3.extent(vis.data.processed.detalhado, d => d[variavel]);
                    }
                );

                vis.draw.domains[vis.params.main_variable] = [0, d3.max(vis.data.processed.detalhado, d => d[vis.params.main_variable])];
                // a main variable é o PLOA

            },

            agregado : null, // trocar esse nome

            // categorical variables will be properties
            // numerical também

        },

        ranges : {

            x : null,
            y : null,
            y_cat : null,
            //y_anexos : null,
            //y_agregadores : null,
            w : null,
            r : [2,40],

            update : function() {

                vis.draw.ranges.x = [ vis.dims.margins.left, vis.dims.w - vis.dims.margins.right ];
    
                vis.draw.ranges.y = [ vis.dims.h - vis.dims.margins.bottom, vis.dims.margins.top ];

                vis.draw.ranges.w = [ 0, vis.dims.w - vis.dims.margins.left - vis.dims.margins.right];
    
            },

            calcula_range_var_categorica : function(categorical_var) {

                let qde_categorias = vis.draw.domains[categorical_var].length;

                let comprimento_necessario = vis.dims.bar_height * qde_categorias;

                return([vis.dims.margins.top, vis.dims.margins.top + comprimento_necessario]);

            }

        },

        scales : {

            x: d3.scaleLinear().clamp(true),
            y: d3.scaleLinear().clamp(true),
            y_cat: d3.scaleBand(),
            w: d3.scaleLinear().clamp(true),
            r: d3.scaleSqrt(),

            initialize : function() {
                
                vis.params.dimensions.forEach(dimension => {

                    let dimension_range = dimension == "y_cat" ? "y" : dimension;

                    vis.draw.scales[dimension]
                    .range(vis.draw.ranges[dimension_range]);
                });
    
            },

            set_domain : function(dimension, variable) {

                vis.draw.scales[dimension]
                  .domain(vis.draw.domains[variable]);
    
            },

            set : function(mode, option) {

                vis.control.states
                  .modes[mode]
                  .options[option]
                  .set_scales.forEach(scale => {
                    vis.draw.scales.set_domain(
                        scale.dimension, 
                        scale.variable)

                    if (scale.axis == true) {

                        vis.draw.axis.update(scale.dimension, scale.variable);

                    }
                    });

                    // ISSUE : testar em algum momento se o domínio permanece igual? vale a pena em termos de performance? poderia ter um "current" em vis.control.states

            }

        },

        axis : {

            // para garantir as transições de eixo, quando passa de uma variável numérica para uma categórica, só vamos usar eixos x e y. Por isso vão aparecer argumentos "dimension" e "dimension_axis": o dimension para acessar a escala correta ("y_cat", por exemplo), e o dimension_axis para acessar o eixo correto ("y", nesse caso do exemplo, e não um "y_cat" que seria uma novo eixo y, o que não é desejável)

            update_axis_scale : function(dimension) {

                let dimension_axis = dimension == "y_cat" ? "y" : dimension;

                console.log("Updating o axis_scale da dimensao", dimension, dimension_axis)

                vis.draw.axis[dimension_axis].scale(
                    vis.draw.scales[dimension]
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

            update : function(dimension, variable) {

                let dimension_axis = dimension == "y_cat" ? "y" : dimension;

                console.log("Vamos dar um update no eixo", dimension_axis, variable);

                vis.draw.axis.tick_format(dimension_axis, variable);

                vis.draw.axis.update_axis_scale(dimension);

                vis.sels.axis[dimension_axis]
                  .transition()
                  .duration(vis.params.transitions_duration)
                  .call(vis.draw.axis[dimension_axis])
                ;

            },

            initialize : function() {

                vis.draw.axis.update_axis_scale("x");
                vis.draw.axis.update_axis_scale("y");
                vis.draw.axis.update_axis_scale("y_cat");
    
                vis.draw.axis.create(
                    desloc_x = 0,
                    desloc_y = vis.draw.scales.y(0),//vis.dims.h - vis.dims.margins,
                    "x");
    
                vis.draw.axis.create(
                    desloc_x = vis.dims.margins.left,
                    desloc_y = 0,
                    "y");
                
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

            y :  d3.axisLeft()

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
                .attr("y", d => vis.draw.scales.y_cat(d[variable]) + vis.dims.margins.top)
                .transition()
                .duration(vis.params.transitions_duration)
                .attr("width", d => vis.draw.scales.w(d[vis.params.main_variable]))
                .attr("fill", vis.params.colors.barra_normal);

                // a main_variable é o PLOA
                // a variable vai ser o critério de detalhamento: orgao, função etc.

                vis.sels.barras = d3.selectAll(vis.refs.barras);

                vis.sels.cont
                .selectAll("p.labels-valores-barras")
                .data(vis.data.processed.agregado, d => d[variable])
                .join("p")
                .classed("labels-valores-barras", true)
                .style("top", d => (vis.draw.scales.y_cat(d[variable]) + vis.dims.margins.top) + "px")
                .style("left", vis.dims.margins.left + "px")
                .style("font-size", vis.dims.bar_height + "px")
                .style("line-height", vis.dims.bar_height + "px")
                .text(d => utils.valor_formatado(d[vis.params.main_variable]))
                .transition()
                .duration(vis.params.transitions_duration)
                .style("left", d => (vis.dims.margins.left + vis.draw.scales.w(d[vis.params.main_variable])) + "px")


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
                .attr("y1", d => vis.draw.scales.y_cat(d[cat_variable]) + vis.dims.margins.top - vis.dims.bar_height/2)
                .attr("y2", d => vis.draw.scales.y_cat(d[cat_variable]) + vis.dims.margins.top + vis.dims.bar_height*1.5)
                .transition()
                .duration(vis.params.transitions_duration)
                .attr("x1", d => vis.dims.margins.left + vis.draw.scales.w(d[num_variable]))
                .attr("x2", d => vis.dims.margins.left + vis.draw.scales.w(d[num_variable]))
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
                        return -Math.pow(vis.draw.scales.r(+d.PLOA), 2.0) * magnitudeForca;
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
                                    dimension : "y_cat" ,  
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


                                // vis.sels.rects_acoes
                                //     .transition()
                                //     .duration(vis.params.transitions_duration)
                                //     .attr("x", d => vis.draw.scales.x(+d.pos_ini_funcao_tipica) )
                                //     .attr("y", d => vis.draw.scales.y_cat(d.funcao_tipica) )
                                //     .attr("height", vis.dims.bar_height )
                                //     .attr("width", d => vis.draw.scales.w(+d.atu_total))
                                //     .attr("rx", 0)
                                ;

                            }

                        },

                        "funcao_tipica" : {

                            set_scales : [

                                { dimension: "x" , 
                                    variable : "agregado", //"pos_ini_agregador", pq o que importa aqui é a escala 
                                    axis     : true },
    
                                { dimension : "y_cat" ,  
                                    variable  : "funcao_tipica",
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

                        "anexo" : {

                            set_scales : [

                                { dimension: "x" , 
                                    variable : "agregado", //"pos_ini_agregador", pq o que importa aqui é a escala 
                                    axis     : true },
    
                                { dimension : "y_cat" ,  
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
    
                                { dimension : "y_cat" ,  
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
    
                        "variacao" : {
    
                            set_scales : [
    
                                { dimension: "x" , 
                                  variable : "var_abs",
                                  axis     : true },
    
                                { dimension : "y" ,  
                                  variable  : "var_pct",
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
                                  .force('x', d3.forceX().strength(magnitudeForca).x(d => vis.draw.scales.x(+d.var_abs)))
                                  .force('y', d3.forceY().strength(magnitudeForca).y(d => vis.draw.scales.y(+d.var_pct)))
                                  .force("charge", null)
                                  .force('colisao', d3.forceCollide().radius(d => vis.draw.scales.r(+d.PLOA)));

                                // atualizei os nodes para tirar as ações novas, mas os círculos que correspondem a esses nodes continuam existindo. vou fazê-los sumir aqui: (depois tenho que retorná-los se voltar ao estado inicial)

                                vis.sels.circles_acoes
                                  .each(function(d) {
                                      if (d.acao_nova) d3.select(this)
                                        .transition()
                                        .duration(vis.params.transitions_duration)
                                        .attr("opacity", 0);
                                  })

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
                                      .attr("r", d => vis.draw.scales.r(+d.PLOA))
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

        begin : function(data) {

            console.log(data.columns);

            // saves data as a property to make it easier to access it elsewhere
            vis.data.raw = data;

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
            vis.draw.axis.initialize();

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

    }

}

vis.init();

console.log(vis);