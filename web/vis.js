const vis = {

    refs: {

        svg: "svg.vis",
        cont: "div.vis-container",
        data: "./dados/dados.csv"

    },

    sels: {

        svg: null,
        cont: null

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

        get_domain : function(data, variable) {

            return d3.extent(data, d => +d[variable]);

        }
    },

    draw: {

        domains : {},

        ranges : {},

        begin : function(data) {

            console.log(data.columns);
            vis.data = data;

            vis.params.variables.forEach(variable => {
                vis.draw.domains[variable] = vis.f.get_domain(data, variable);
            });

        },

        agregado : {

            scales : {

                x: d3.scaleLinear(),
    
                y: d3.scaleLinear(),

                w: d3.scaleLinear()

        },

        detalhado : {},

        card : {}

        }


    }

}

vis.init();

console.log(vis);