const vis = {

    refs: {

        svg: "svg.vis",
        cont: "div.vis-container",
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
        cont: null

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

        modes : ["agregado", "detalhado"],

        variables : ["atu_total", "varia", "varia_pct", "pos_ini_agregador", "pos_ini_funcao_tipica"],

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

            vis.elems.svg.style.setProperty("background-color", "coral");


        },

        read_data : function(url) {

            d3.csv(vis.refs.data).then(
                data => vis.draw.begin(data)
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

                vis.params.variables.forEach(variable => {
                    vis.draw.domains[variable] = vis.draw.domains.get(vis.data.raw, variable,
                        categorical = false);
                });

                vis.params.categorical_vars.forEach(variable => {
                    vis.draw.domains[variable] = vis.draw.domains.get(vis.data.raw, variable, categorical = true);
                });

                function initialize_agregado() {

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

                initialize_agregado();



            },

            get : function(data, variable, categorical = false) {

                if (!categorical) {
                    return d3.extent(data, d => +d[variable])
                }
                
                else {
                    return  utils.unique(
                        obj = data, 
                        col = variable
                    )
                }
    
            },

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

            x: d3.scaleLinear(),

            y: d3.scaleLinear(),

            y_cat: d3.scaleBand(),

            w: d3.scaleLinear(),

            r: d3.scaleSqrt()

        },

        axis : {

            update : function(dimension) {

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
                  .call(vis.draw.axis[dimension]); 
            },

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
                  .attr("x", d => 
                     vis.draw.scales.x(+d.varia) 
                     - vis.draw.scales.r(+d.atu_total))
                  .attr("y", d => 
                     vis.draw.scales.y(+d.varia_pct) 
                     - vis.draw.scales.r(+d.atu_total))
                  .attr("height", d => 2*vis.draw.scales.r(+d.atu_total))
                  .attr("width", d => 2*vis.draw.scales.r(+d.atu_total))
                  .attr("fill", "var(--pink)");

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
            vis.draw.scales.set_domain("x", "varia");
            vis.draw.scales.set_domain("y", "varia_pct");
            vis.draw.scales.set_domain("r", "atu_total");

            // add rects/bubbles
            vis.draw.bubbles.add();

            // update and add axis
            vis.draw.axis.update("x");
            vis.draw.axis.update("y");

            vis.draw.axis.create(
                desloc_x = 0,
                desloc_y = vis.draw.scales.y(0),//vis.dims.h - vis.dims.margins,
                "x");

            vis.draw.axis.create(
                desloc_x = vis.dims.margins,
                desloc_y = 0,
                "y");

        },

        card : {

            // outro script, talvez?

        }


    }

}

vis.init();

console.log(vis);