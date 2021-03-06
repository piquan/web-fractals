'use strict';

var phi = (1 + Math.sqrt(5)) / 2.0;

var toggleKeys = {" ": "pause", "p": "paint", "a": "auto",
                  "m": "mouse", "s": "stats", "M": "mandelbrot"};
var defaultOptions = {
    stats: false,
    paint: false,
    auto: true,
    mouse: true,
    pause: false,
    mandelbrot: false
};
var options = defaultOptions;

var framePending = false;
function update() {
    if (!framePending) {
        requestAnimationFrame(render);
        framePending = true;
    }
}

var stats = null;
var renderer;
var camera;
var main;
var mandelbrot;
var shaderSrc = {
    shader_lib: null,
    julia_vs: null,
    julia_fs: null,
    mandelbrot_vs: null,
    mandelbrot_fs: null
};

$(function() {
    var filecount = 0;
    var maybeStart = function() {
        filecount--;
        if (filecount == 0) {
            setup();
            setupMouseHandlers();
            update();
        }
    };
    for (var key in shaderSrc) {
        filecount++;
        (function(shaderName) {
            $.ajax({url: shaderName + ".glsl", dataType: "text"})
                .done(function(r) {
                    shaderSrc[shaderName] = r;
                    maybeStart();
                });
        })(key);
    }
});

function setup() {
    try {
        renderer = new THREE.WebGLRenderer({ antialias:false, alpha:true });
    } catch (e) {
        alert("WebGL is not supported in this browser.  I'll send you to a website with more information.");
        window.location = "https://get.webgl.org/";
        return;
    }
    var size = Math.min(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    renderer.setSize(size, size);
    document.body.appendChild(renderer.domElement);

    function onWindowResize() {
        var size = Math.min(window.innerWidth, window.innerHeight);
        renderer.setSize(size, size);
    }
    window.addEventListener('resize', onWindowResize, false);
    onWindowResize();

    camera = new THREE.OrthographicCamera(
        -1, 1, 1, -1, 0.1, 1000);
    camera.position.z = 2;

    mandelbrot = {};
    mandelbrot.scene = new THREE.Scene();

    mandelbrot.target = new THREE.WebGLRenderTarget(
        1024, 1024,
        { minFilter: THREE.NearestFilter,
          magFilter: THREE.NearestFilter });
    renderer.setClearColor(new THREE.Color('black'), 0.0);
    renderer.clearTarget(
        mandelbrot.target, true, true, true);

    mandelbrot.point = {};
    mandelbrot.point.geo = new THREE.Geometry();
    mandelbrot.point.mat = new THREE.ShaderMaterial({
        vertexShader: shaderSrc.shader_lib + shaderSrc.mandelbrot_vs,
        fragmentShader: shaderSrc.shader_lib + shaderSrc.mandelbrot_fs
    });
    mandelbrot.point.obj = new THREE.Mesh(mandelbrot.point.geo,
                                          mandelbrot.point.mat);
    mandelbrot.scene.add(mandelbrot.point.obj);
    mandelbrot.point.obj.position.z = 1;

    main = {};
    main.scene = new THREE.Scene();

    main.juliaPlane = {};
    main.juliaPlane.geo = new THREE.PlaneBufferGeometry(2, 2);
    main.juliaPlane.mat = new THREE.ShaderMaterial({
        uniforms: { julia_c: new THREE.Vector2(0.0, 0.0) },
        vertexShader: shaderSrc.shader_lib + shaderSrc.julia_vs,
        fragmentShader: shaderSrc.shader_lib + shaderSrc.julia_fs
    });
    main.juliaPlane.obj = new THREE.Mesh(main.juliaPlane.geo,
                                         main.juliaPlane.mat);
    main.juliaPlane.obj.position.z = 0.0;
    main.scene.add(main.juliaPlane.obj);

    //var testCard = new THREE.TextureLoader().load("test_card.png");
    main.mandelbrotPaintPlane = {};
    main.mandelbrotPaintPlane.geo = new THREE.PlaneBufferGeometry(2, 2);
    main.mandelbrotPaintPlane.mat = new THREE.MeshBasicMaterial({
        map: mandelbrot.target.texture
    });
    // This blending equation is necessary if we're using linear
    // filtering, which we do in some of these experiments.
    // Otherwise, the (0,0,0,0) pixels near the parts we haven't
    // rendered blend with useful data in the parts we have, and we've
    // got trouble.  For this to work, we need premultiplied alpha,
    // but we do have that.
    main.mandelbrotPaintPlane.mat.blending = THREE.CustomBlending;
    main.mandelbrotPaintPlane.mat.blendEquation = THREE.AddEquation;
    main.mandelbrotPaintPlane.mat.blendSrc = THREE.OneFactor;
    main.mandelbrotPaintPlane.mat.blendDst = THREE.OneMinusSrcAlphaFactor;
    main.mandelbrotPaintPlane.mat.transparent = true;
    main.mandelbrotPaintPlane.obj = new THREE.Mesh(
        main.mandelbrotPaintPlane.geo, main.mandelbrotPaintPlane.mat);
    main.mandelbrotPaintPlane.obj.position.z = 0.5;
    //main.scene.add(main.mandelbrotPaintPlane.obj);

    main.mandelbrotFullPlane = {};
    main.mandelbrotFullPlane.geo = new THREE.PlaneBufferGeometry(2, 2);
    main.mandelbrotFullPlane.mat = mandelbrot.point.mat;
    main.mandelbrotFullPlane.obj = new THREE.Mesh(main.mandelbrotFullPlane.geo,
                                                  main.mandelbrotFullPlane.mat);
    main.mandelbrotFullPlane.obj.position.z = 0.8;
    //mandelbrot.scene.add(main.mandelbrotFullPlane.obj);

    main.marker = {};
    main.marker.geo = new THREE.CircleGeometry(0.01);
    main.marker.mat = new THREE.MeshBasicMaterial({color: 0xff0000});
    main.marker.obj = new THREE.Mesh(main.marker.geo, main.marker.mat);
    main.marker.obj.position.z = 1.0;
    main.scene.add(main.marker.obj);

    $(window).on("keypress", handleKeyPress);
    $(window).on("hashchange", handleOptions);
    handleOptions();
}

function handleOptions() {
    var oldOptions = options;

    options = Object.assign({}, defaultOptions,
                            new URI(window.location).fragment(true));

    if (options.stats != oldOptions.stats) {
        if (options.stats) {
            stats = new Stats();
            stats.showPanel(0);         // 0: fps, 1: ms, 2: mb, 3+: custom
            document.body.appendChild(stats.dom);
        } else {
            $(stats.dom).remove();
            stats = null;
        }
    }

    if (options.paint != oldOptions.paint) {
        if (options.paint) {
            main.scene.add(main.mandelbrotPaintPlane.obj);
        } else {
            main.scene.remove(main.mandelbrotPaintPlane.obj);
        }
    }

    if (options.mandelbrot != oldOptions.mandelbrot) {
        if (options.mandelbrot) {
            main.scene.add(main.mandelbrotFullPlane.obj);
        } else {
            main.scene.remove(main.mandelbrotFullPlane.obj);
        }
    }

    if (!options.pause)
        update();
}

function handleKeyPress(e) {
    var loc = new URI(window.location);

    for (var key in toggleKeys) {
        if (e.key == key) {
            var opt = toggleKeys[key];
            loc.removeFragment(opt);
            if (options[opt]) {
                loc.addFragment(opt, "");
            } else {
                loc.addFragment(opt, "1");
            }
        }
    }

    if (e.key == "C") {
        renderer.setClearColor(new THREE.Color('black'), 0.0);
        renderer.clearTarget(
            mandelbrot.target, true, true, true);
        update();
    }

    window.location = loc;
}

var mouseX = null;
var mouseY = null;

var previous_x = null;
var previous_y = null;

function handleMouseMove(e) {
    var size = Math.min(window.innerWidth, window.innerHeight);
    if (mouseX === null) {
        previous_x = null;
        previous_y = null;
    }
    mouseX = 1.0 * e.clientX / size * 2.0 - 1.0;
    mouseY = 1.0 - 1.0 * e.clientY / size * 2.0;
    if (!options.pause)
        update();
}
function setupMouseHandlers() {
    $(document).mousemove(handleMouseMove);
    $(document).mouseenter(handleMouseMove);
    $(document).mouseleave(function(e) {
        mouseX = null;
        mouseY = null;
        previous_x = null;
        previous_y = null;
        if (!options.pause)
            update();
    });
}

function render(now) {
    framePending = false;

    if (stats) stats.begin();

    var x, y;
    if (options.auto && (!options.mouse || mouseX === null || mouseX > 1.0)) {
        if (!options.pause)
            update();
        now /= 1000.0;
        //var rSqrt = Math.cos(now * 0.23);
        //var r = rSqrt * rSqrt;
        //x = r * Math.cos(now);
        //y = r * Math.sin(now);
        //x = Math.cos(now * phi);
        //y = Math.sin(now / phi);
        x = Math.cos(now * phi);
        y = Math.sin(now);
    } else if (options.mouse) {
        x = mouseX;
        y = mouseY;
    } else {
        x = previous_x;
        y = previous_y;
    }

    main.juliaPlane.mat.uniforms.julia_c.value = new THREE.Vector2(x, y);
    main.marker.obj.position.x = x;
    main.marker.obj.position.y = y;

    if (options.paint &&
        (previous_x !== null && !(x == previous_x && y == previous_y))) {
        var shape = new THREE.Shape();
        if ((previous_x < x) == (previous_y < y)) {
            shape.moveTo(previous_x - 0.005, previous_y + 0.005);
            shape.lineTo(x - 0.005, y + 0.005);
            shape.lineTo(x + 0.005, y - 0.005);
            shape.lineTo(previous_x + 0.005, previous_y - 0.005);
        } else {
            shape.moveTo(previous_x - 0.005, previous_y - 0.005);
            shape.lineTo(x - 0.005, y - 0.005);
            shape.lineTo(x + 0.005, y + 0.005);
            shape.lineTo(previous_x + 0.005, previous_y + 0.005);
        }
        mandelbrot.point.geo = new THREE.ShapeGeometry(shape);
        mandelbrot.point.obj.geometry = mandelbrot.point.geo;
    }
    previous_x = x;
    previous_y = y;

    if (options.paint)
        renderer.render(mandelbrot.scene, camera, mandelbrot.target, false);
    renderer.render(main.scene, camera, null, true);
    if (stats) stats.end();

    if (!options.pause && options.auto && (!options.mouse || mouseX === null || mouseX > 1.0))
        update();
}
