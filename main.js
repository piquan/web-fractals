'use strict';

var phi = (1 + Math.sqrt(5)) / 2.0;

var stats;
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
            render();
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
    renderer.setClearColor(new THREE.Color('magenta'), 0.0);
    renderer.clearTarget(
        mandelbrot.target, true, true, true);

    mandelbrot.point = {};
    mandelbrot.point.geo = new THREE.CircleGeometry(0.01);
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
    main.mandelbrotPlane = {};
    main.mandelbrotPlane.geo = new THREE.PlaneBufferGeometry(2, 2);
    main.mandelbrotPlane.mat = new THREE.MeshBasicMaterial({
        map: mandelbrot.target.texture
    });
    // This blending equation is necessary if we're using linear
    // filtering, which we do in some of these experiments.
    // Otherwise, the (0,0,0,0) pixels near the parts we haven't
    // rendered blend with useful data in the parts we have, and we've
    // got trouble.  For this to work, we need premultiplied alpha,
    // but we do have that.
    main.mandelbrotPlane.mat.blending = THREE.CustomBlending;
    main.mandelbrotPlane.mat.blendEquation = THREE.AddEquation;
    main.mandelbrotPlane.mat.blendSrc = THREE.OneFactor;
    main.mandelbrotPlane.mat.blendDst = THREE.OneMinusSrcAlphaFactor;
    main.mandelbrotPlane.mat.transparent = true;
    main.mandelbrotPlane.obj = new THREE.Mesh(main.mandelbrotPlane.geo,
                                              main.mandelbrotPlane.mat);
    main.mandelbrotPlane.obj.position.z = 0.5;
    main.scene.add(main.mandelbrotPlane.obj);

    main.marker = {};
    main.marker.geo = new THREE.CircleGeometry(0.01);
    main.marker.mat = new THREE.MeshBasicMaterial({color: 0xff0000});
    main.marker.obj = new THREE.Mesh(main.marker.geo, main.marker.mat);
    main.marker.obj.position.z = 1.0;
    main.scene.add(main.marker.obj);

    if (window.Stats) {
        stats = new Stats();
        stats.showPanel(0);         // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild(stats.dom);
    }
}

var mouseX = null;
var mouseY = null;

function handleMouseMove(e) {
    var size = Math.min(window.innerWidth, window.innerHeight);
    mouseX = 1.0 * e.clientX / size * 2.0 - 1.0;
    mouseY = 1.0 - 1.0 * e.clientY / size * 2.0;
    requestAnimationFrame(render);
}
function setupMouseHandlers() {
    $(document).mousemove(handleMouseMove);
    $(document).mouseenter(handleMouseMove);
    $(document).mouseleave(function(e) {
        mouseX = null;
        mouseY = null;
        requestAnimationFrame(render);
    });
}

var previous_x = null;
var previous_y = null;

function render(now) {
    if (stats) stats.begin();

    var x, y;
    if (mouseX === null || mouseX > 1.0) {
        now /= 1000.0;
        //var rSqrt = Math.cos(now * 0.23);
        //var r = rSqrt * rSqrt;
        //x = r * Math.cos(now);
        //y = r * Math.sin(now);
        x = Math.cos(now);
        y = Math.sin(now / phi);
        requestAnimationFrame(render);
    } else {
        x = mouseX;
        y = mouseY;
    }

    main.juliaPlane.mat.uniforms.julia_c.value = new THREE.Vector2(x, y);
    main.marker.obj.position.x = x;
    main.marker.obj.position.y = y;
    //if (previous_x !== null) {
    //    mandelbrot.point.geo.vertices[0].x = x;
    //    mandelbrot.point.geo.vertices[0].y = y;
    //    mandelbrot.point.geo.vertices[1].x = previous_x;
    //    mandelbrot.point.geo.vertices[1].y = previous_y;
    //    mandelbrot.point.geo.verticesNeedUpdate = true;
    //    mandelbrot.point.geo.computeLineDistances();
    //}
    //previous_x = x;
    //previous_y = y;
    mandelbrot.point.obj.position.x = x;
    mandelbrot.point.obj.position.y = y;

    renderer.render(mandelbrot.scene, camera, mandelbrot.target, false);
    renderer.render(main.scene, camera, null, true);
    if (stats) stats.end();
}
