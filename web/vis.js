const vis = {

    refs: {

        svg: "svg.vis",
        cont: "div.vis-container",
        mode_button: "nav.mission-control",
        data: "./dados/dados.csv"

    },

    sels: {

        svg : null,
        cont : null,
        rects_acoes : null,
        axis : {}

    },

    elems: {

        svg:  null,
        cont: null,
        mode_button: null

    },

    dims : {

        h: null,
        w: null,
        margins: 50

    },

    data : {

        raw : null,
        processed : {}

    },

    params : {

        transitions_duration: 1000,

        modes : ["agregado", "detalhado"],

        variables : ["atu_total", "varia", "varia_pct"],

        categorical_vars : ["agregador", "funcao_tipica"],
        // also, those are the variables used for evaluating summaries in the "agregado" mode

        dimensions : ["x", "y", "w", "r"]

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

            vis.dims.h = win_h - pos_vis_y - vis.dims.margins;
            // subtraio a margem para usar como margem
            vis.dims.w = +vis.sels.svg.style("width").slice(0, -2);

        },

        set_size: function() {

            vis.elems.svg.style.setProperty(
                "height", vis.dims.h + "px");

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

        update_positions : {
            // para quando for disparado um resize
        }
    },

    draw: {

        domains : {

            initialize : function() {

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

                vis.params.variables.forEach(variable => {
                    vis.draw.domains[variable] = generate(vis.data.raw, variable,
                        categorical = false);
                });

                vis.params.categorical_vars.forEach(variable => {
                    vis.draw.domains[variable] = generate(vis.data.raw, variable, categorical = true);
                });

                function initialize_domain_agregado() {

                    const maxs = vis.params.categorical_vars.map(
                        cat => d3.max(vis.data.processed[cat],
                            d => +d.subtotal)
                    )
    
                    vis.draw.domains["agregado"] = [
                        0, 
                        d3.max(maxs, d => d)
                    ];
                    // Math.max(...maxs)
                    // ES6
                }

                initialize_domain_agregado();

                function normalize_domain_categoricals() {

                    let lengths = vis.params.categorical_vars.map(variable => vis.draw.domains[variable].length);

                    let max_length = Math.max(...lengths)

                    vis.params.categorical_vars.forEach(variable => {

                        const length_difference = max_length - vis.draw.domains[variable].length;

                        if (length_difference > 0) {

                            const current_domain = vis.draw.domains[variable];

                            const dummy_domain = Array(length_difference);

                            vis.draw.domains[variable] = [
                                ...current_domain,
                                ...dummy_domain
                            ];

                        }

                    });

                }

                normalize_domain_categoricals();



            }

            // variables will be properties

        },

        ranges : {

            update : function() {

                vis.draw.ranges.x = [ vis.dims.margins, vis.dims.w - vis.dims.margins ];
    
                vis.draw.ranges.y = [ vis.dims.h - vis.dims.margins, vis.dims.margins ];

                vis.draw.ranges.w = [ 0, vis.dims.w - 2*vis.dims.margins ];
    
            },

            x : null,
            y : null,
            w : null,
            r : [1,30]

        },

        scales : {

            initialize : function() {
                
                vis.params.dimensions.forEach(dimension => {
                    vis.draw.scales[dimension]
                    .range(vis.draw.ranges[dimension])
                    .clamp(true);
                });
    
            },

            set_domain : function(dimension, option) {

                vis.draw.scales[dimension]
                  .domain(vis.draw.domains[option]);
    
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

                        vis.draw.axis.update(scale.dimension);

                        vis.draw.axis.update_axis_scale(scale.dimension);

                    }
                    });

                    // ISSUE : testar em algum momento se o domínio permanece igual? vale a pena em termos de performance? poderia ter um "current" em vis.control.states

            },

            x: d3.scaleLinear(),

            y: d3.scaleLinear(),

            y_cat: d3.scaleBand(),

            w: d3.scaleLinear(),

            r: d3.scaleSqrt()

        },

        axis : {

            update_axis_scale : function(dimension) {

                vis.draw.axis[dimension].scale(
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

            update : function(dimension) {

                vis.sels.axis[dimension]
                  .transition()
                  .duration(vis.params.transitions_duration)
                  .call(vis.draw.axis[dimension])
                ;

            },

            initialize : function() {

                vis.draw.axis.update_axis_scale("x");
                vis.draw.axis.update_axis_scale("y");
    
                vis.draw.axis.create(
                    desloc_x = 0,
                    desloc_y = vis.draw.scales.y(0),//vis.dims.h - vis.dims.margins,
                    "x");
    
                vis.draw.axis.create(
                    desloc_x = vis.dims.margins,
                    desloc_y = 0,
                    "y");
                
            },

            // dar um jeito nos ticks

            x :  d3.axisBottom().tickFormat(d => utils.formataBR(d/1e6)),

            y :  d3.axisLeft().tickFormat(d => d3.format(".1%")(d/100))

        },

        agregado : {



        },

        bubbles : {

            add : function() {

                let svg = vis.sels.svg;

                let r = 2;

                vis.sels.rects_acoes = svg
                  .selectAll("rect")
                  .data(vis.data.raw)
                  .join("rect")
                  .attr("x", vis.dims.h/2)
                  .attr("y", vis.dims.w/2)
                  .attr("height", 1)
                  .attr("width", 1)
                  .attr("rx", 0)
                  .attr("stroke", "coral")
                  .attr("fill", "var(--pink)");

            }


        },

        card : {

            // outro script, talvez?

        }


    },

    control : {

        states : {

            modes: {
    
                "agregado" : {
    
                    options : {
    
                        "agregador" : {
    
                            set_scales : {
    
                            },
    
                            render : function() {
    
                            }
    
                        },
    
                        "funcao_tipica" : {
    
                            set_scales : {
    
                            },
    
                            render : function() {
                                
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

            // summarise data for categorical variables
            vis.f.summarise_categorical(
                numerical_variable = "atu_total");

            // evaluates domains for selected variables
            vis.draw.domains.initialize();

            // updates ranges
            vis.draw.ranges.update();

            // sets scales
            vis.draw.scales.initialize();

            // add x, y axis
            vis.draw.axis.initialize();

            // add rects/bubbles
            vis.draw.bubbles.add();

            // starts monitoring button clicks
            vis.control.monitor_mode_button();

        },

        draw_state : function(mode, option) {

            vis.draw.scales.set(
                mode = mode, 
                option = option
            );

            vis.control.states
              .modes[mode]
              .options[option]
              .render()
            ;

        },

        monitor_mode_button : function() {

            let buttons = document.querySelector(vis.refs.mode_button);

            vis.elems.mode_button = buttons;

            buttons.addEventListener("click", function(e) {

                let mode = e.target.id;

                // esses já dependem da seleção
                vis.control.draw_state(
                    mode = "detalhado", 
                    option = "variacao"
                    );

                console.log(mode);


            });





        }

    }

}

vis.init();

console.log(vis);