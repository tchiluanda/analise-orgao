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

        variables : ["atu_total", "varia", "varia_pct"]

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

            },

            get : function(data, variable) {

                return d3.extent(data, d => +d[variable]);
    
            },

        },

        ranges : {

            update : function() {

                vis.draw.ranges.x = [ vis.dims.margins, vis.dims.w - vis.dims.margins ];
    
                vis.draw.ranges.y = [ vis.dims.margins, vis.dims.h - vis.dims.margins ]
    
            },

            x : null,
            y : null,
            w : null

        },

        scales : {

            initialize : function(mode, dimension) {

                vis.draw.scales[mode][dimension]
                  .range(vis.draw.ranges[dimension])
    
            },

            agregado : {

                x: d3.scaleLinear(),

                y: d3.scaleLinear(),

                w: d3.scaleLinear()

            },

            detalhado : {

                x: d3.scaleLinear(),
        
                y: d3.scaleLinear(),

                r: d3.scaleSqrt()

            }

        },

        bubbles : {

            add : function() {

                let svg = vis.sels.svg;

                svg.selectAll("rect")

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

            

        },

        card : {

            // outro script, talvez?

        }


    }

}

vis.init();

console.log(vis);