const vis = {

    refs: {

        svg: "svg.vis",
        cont: "div.vis-container",
        data: "./dados/dados.csv"

    },

    sels: {

        svg: null,
        cont: null,
        rects_acoes: null

    },

    elems: {

        svg:  null,
        cont: null

    },

    dims : {

        h: null,
        w: null,
        margins: 20

    },

    data : {},

    params : {

        modes : ["agregado", "detalhado"],

        variables : ["atu_total", "varia", "varia_pct"],

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

        update_positions : {
            // para quando for disparado um resize
        }
    },

    draw: {

        domains : {

            initialize : function() {

                vis.params.variables.forEach(variable => {
                    vis.draw.domains[variable] = vis.draw.domains.get(vis.data, variable);
                });

                // fixando mínimo de domínios relacionados a tamanhos em 0. Talvez criar um marcador?

                //vis.draw.domains["atu_total"][0] = 0;

            },

            get : function(data, variable) {

                return d3.extent(data, d => +d[variable]);
    
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

            set_domain : function(dimension, variable) {

                vis.draw.scales[dimension]
                  .domain(vis.draw.domains[variable]);
    
            },

            x: d3.scaleLinear(),

            y: d3.scaleLinear(),

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

                svg
                  .append("g") 
                  .attr(
                      "transform", 
                      "translate(-" 
                      + desloc_x 
                      + "," 
                      + desloc_y
                      + ")")
                  .classed("axis", true)
                  .call(vis.draw.axis[dimension]); 
            },

            x :  d3.axisTop(),

            y :  d3.axisLeft()

        },

        bubbles : {

            add : function() {

                let svg = vis.sels.svg;

                let r = 2;

                vis.sels.rects_acoes = svg
                  .selectAll("rect")
                  .data(vis.data)
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
            vis.data = data;

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
            vis.draw.axis.update("x");

            vis.draw.axis.create(
                desloc_x = 0,
                desloc_y = vis.dims.margins,
                "x");

        },

        card : {

            // outro script, talvez?

        }


    }

}

vis.init();

console.log(vis);