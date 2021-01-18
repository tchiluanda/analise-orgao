const vis = {

    refs: {

        svg: "svg.vis",
        cont: "div.vis-container",
        mode_button: "nav.mode-control",
        option_button: "nav.option-control",
        mode_dependent_controls: "[data-visible-on-mode]",
        comparison_selector: "[name='seletor-comparacao']",
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
        rects_acoes : null,
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
            right: 20,
            bottom: 20

        }

    },

    data : {

        raw : null,

        processed : null
        
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

        variables_names : {

            PLOA : "PLOA",
            dot_atu : "Dotação atualizada do ano anterior",
            desp_paga : "Despesa paga no ano anterior"

        },

        main_variable : "PLOA",

        categorical_vars : ["orgao_decreto", "anexo", "funcao_tipica"],
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

                vis.data.processed[categorical_variable] =
                utils.group_by_sum(
                    objeto = vis.data.raw, 
                    coluna_categoria = categorical_variable, 
                    coluna_valor = numerical_variable, 
                    ordena_decrescente = true
                )
                
            });

        },

        evaluate_dataset : function(modo, var_filtro, valor_filtro, var_detalhamento) {

            console.log(vis.params.variables);

            vis.data.processed = utils.group_by_sum_cols(

                objeto = vis.data.raw
                           .filter(d => d[var_filtro] != valor_filtro), //temp
                           // por exemplo, var_filtro = "orgao_decreto",
                           //valor_filtro = "todos"
                coluna_categoria = var_detalhamento,
                colunas_valor = vis.params.variables,
                ordena_decrescente = true,
                coluna_ordem = vis.params.main_variable

            );

            if (vis.data.processed.length > 16) {

                let bottom_dataset = vis.data.processed.slice(15);

                // var_detalhamento vai ser a variável usada no detalhamento, então vai ser o nome da coluna/variável no dataset sumarizado que foi armazenado em vis.data.processed.

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

                vis.data.processed = vis.data.processed
                  .slice(0,15);

                vis.data.processed.push(elemento_demais);
                // não dá para encadear aqui

            }

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
                //         cat => d3.max(vis.data.processed[cat],
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
                    objeto = vis.data.processed,
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
                    variable => d3.max(vis.data.processed, d => d[variable])
                );

                vis.draw.domains.agregado = [
                    0,
                    Math.max(...maxs)
                ];

            },

            agregado : null, // trocar esse nome

            // categorical variables will be properties

        },

        ranges : {

            x : null,
            y : null,
            y_cat : null,
            //y_anexos : null,
            //y_agregadores : null,
            w : null,
            r : [1,30],

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
                .data(vis.data.processed, d => d[variable])
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

            },

            desenha_linhas_referencia : function(cat_variable, num_variable) {

                vis.sels.svg
                .selectAll("line.ref")
                .data(vis.data.processed, d => d[cat_variable])
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
                    console.log(d, this);
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

                let r = 2;

                vis.sels.rects_acoes = svg
                  .selectAll("rect")
                  .data(vis.data.raw)
                  .join("rect")
                  .classed("acoes", true)
                  .attr("x", vis.dims.h/2)
                  .attr("y", vis.dims.w/2)
                  .attr("height", 1)
                  .attr("width", 1)
                  .attr("rx", 0)
                ;

            }


        },

        card : {

            // outro script, talvez?

        }


    },

    control : {

        current_state : {
            mode : null,
            variavel_detalhamento : null,
            variavel_comparacao : null
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


                        }
    
    
                    }
    
                },
    
                "detalhado" : {
    
                    options : {
    
                        "variacao" : {
    
                            set_scales : [
    
                                { dimension: "x" , 
                                  variable : "varia",
                                  axis     : true },
    
                                { dimension : "y" ,  
                                  variable  : "varia_pct",
                                  axis      : true },
    
                                { dimension : "r" , 
                                  variable  : "atu_total",
                                  axis      : false }
    
                            ],
        
                            render : function() {
    
                                vis.sels.rects_acoes
                                  .transition()
                                  .duration(vis.params.transitions_duration)
                                  .attr("x", d => vis.draw.scales.x(+d.varia) 
                                                - vis.draw.scales.r(+d.atu_total))
                                  .attr("y", d => vis.draw.scales.y(+d.varia_pct) 
                                                - vis.draw.scales.r(+d.atu_total))
                                  .attr("height", d => 2*vis.draw.scales.r(+d.atu_total))
                                  .attr("width", d => 2*vis.draw.scales.r(+d.atu_total))
                                  .attr("rx", d => 2*vis.draw.scales.r(+d.atu_total))
                                ;

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

            //vis.control.draw_state("agregado", "orgao_decreto");

        },

        draw_state : function(mode, option) {

            // mode é se é agregado ou detalhado
            // option é a variável de detalhamento (no caso do agregado)

            vis.f.evaluate_dataset(
                modo = null,
                var_filtro = "orgao_decreto",
                valor_filtro = "Todos",
                var_detalhamento = option
            );

            vis.draw.domains.evaluate_domain_agregado();
            vis.draw.domains.evaluate_domain_categorical();

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

                    vis.control.activates_button(
                        all_buttons = this.children,
                        clicked = e.target
                    );

                    let option = e.target.id;

                    if (this.dataset.option != option) {

                        this.dataset.option = option;

                        let mode = this.dataset.mode;

                        console.log("hi", mode, option);

                        // fazer esse controle nos data-attributes?
                        vis.control.current_state.mode = mode;
                        vis.control.current_state.variavel_detalhamento = option;

                        vis.f.reinicia_seletor_comparacao();

                        vis.control.draw_state(mode, option);

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