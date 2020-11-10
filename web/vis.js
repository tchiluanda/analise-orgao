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

    params : {


    },

    init : function() {

        vis.f.generates_refs();
        vis.f.get_size();
        vis.f.set_size();

    },

    f : {

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

        scales : {

            domain : null

        }


    }

}

vis.init();

console.log(vis);