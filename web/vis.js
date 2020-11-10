const vis = {

    refs: {

        svg: "svg.vis",
        cont: "div.vis-container",
        data: "./dados/dados.csv"

    },

    sels: {

        svg: d3.select(vis.refs.svg),
        cont: d3.select(vis.refs.cont)

    },

    elems: {

        svg:  document.querySelector(vis.refs.svg),
        cont: document.querySelector(vis.refs.cont)

    },

    dims : {

        h: null,
        w: null

    },

    params : {


    },

    init : function() {

        vis.f.get_size();

    },

    f : {

        get_size: function() {

            vis.dims.w = +vis.sels.svg.style("width").slice(0, -2);
            vis.dims.h = +vis.sels.svg.style("height").slice(0, -2);

        },

        scales : {

            domain : null

        }


    }

}

vis.init();
console.log(vis);