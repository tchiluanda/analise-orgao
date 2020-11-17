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
        margins: {

            top: 10,
            left: 200,
            right: 10,
            bottom: 20

        }

    },

    data : {

        raw : null,
        processed : {}

    },

    params : {

        transitions_duration: 1000,

        modes : ["agregado", "detalhado"],

        variables : ["atu_total", "varia", "varia_pct", "pos_ini_agregador"],

        categorical_vars : ["agregador", "funcao_tipica"],
        // also, those are the variables used for evaluating summaries in the "agregado" mode.

        // this will serve to determine axis

        variables_type : {

            atu_total         : "numerical",
            varia             : "numerical",
            varia_pct         : "percent",
            pos_ini_agregador : "numerical",
            agregado          : "numerical",
            agregador         : "categorical",
            funcao_tipica     : "categorical"

        },

        dimensions : ["x", "y", "y_cat", "w", "r"]

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

            vis.dims.h = win_h - pos_vis_y - vis.dims.margins.top - vis.dims.margins.bottom;
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

                vis.draw.ranges.x = [ vis.dims.margins.left, vis.dims.w - vis.dims.margins.right ];
    
                vis.draw.ranges.y = [ vis.dims.h - vis.dims.margins.bottom, vis.dims.margins.top ];

                vis.draw.ranges.w = [ 0, vis.dims.w - vis.dims.margins.left - vis.dims.margins.right];
    
            },

            x : null,
            y : null,
            w : null,
            r : [1,30]

        },

        scales : {

            initialize : function() {
                
                vis.params.dimensions.forEach(dimension => {

                    let dimension_range = dimension == "y_cat" ? "y" : dimension;

                    vis.draw.scales[dimension]
                    .range(vis.draw.ranges[dimension_range]);
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

                        vis.draw.axis.update(scale.dimension, scale.variable);

                    }
                    });

                    // ISSUE : testar em algum momento se o domínio permanece igual? vale a pena em termos de performance? poderia ter um "current" em vis.control.states

            },

            x: d3.scaleLinear().clamp(true),

            y: d3.scaleLinear().clamp(true),

            y_cat: d3.scaleBand(),

            w: d3.scaleLinear().clamp(true),

            r: d3.scaleSqrt()

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
                        this[dimension].tickFormat(d => utils.formataBR(d/1e6));
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
    
                        "funcao_tipica" : {
    
                            set_scales : {
    
                            },
    
                            render : function() {


    
                            }
    
                        },
    
                        "agregador" : {
    
                            set_scales : [

                              { dimension: "x" , 
                                variable : "agregado", //"pos_ini_agregador",
                                axis     : true },
  
                              { dimension : "y_cat" ,  
                                variable  : "agregador",
                                axis      : true },

                              { dimension : "w" ,
                                variable  : "agregado", //"atu_total",
                                axis      : false }
    
                            ],
    
                            render : function() {

                                vis.sels.rects_acoes
                                  .transition()
                                  .duration(vis.params.transitions_duration)
                                  .attr("x", d => vis.draw.scales.x(+d.pos_ini_agregador) )
                                  .attr("y", d => vis.draw.scales.y_cat(d.agregador) )
                                  .attr("height", 10 )
                                  .attr("width", d => vis.draw.scales.w(+d.atu_total))
                                  .attr("rx", 0)
                                ;
                                
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
 

                console.log(mode);


            });





        }

    }

}

vis.init();

console.log(vis);