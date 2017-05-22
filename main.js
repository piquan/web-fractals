var stats;
var scene;
var camera;
var renderer;
var plane;
var material;
var vsSrc;
var fsSrc;

$(function() {
    var maybeStart = function() {
        if (vsSrc && fsSrc) {
            setup();
            setupMouseHandlers();
            render();
        }
    };
    $.ajax({url: "vs.glsl", dataType: "text"})
        .done(function(r) {
            vsSrc = r;
            maybeStart();
        });
    $.ajax({url: "fs.glsl", dataType: "text"})
        .done(function(r) {
            fsSrc = r;
            maybeStart();
        });
});

function setup() {
    scene = new THREE.Scene();
    //camera = new THREE.PerspectiveCamera(
    //    45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera = new THREE.OrthographicCamera(
        -1, 1, 1, -1, 0.1, 1000);

    try {
        renderer = new THREE.WebGLRenderer({antialias:false});
    } catch (e) {
        alert("WebGL is not supported in this browser.  I'll send you to a website with more information.");
        window.location = "https://get.webgl.org/";
        return;
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        var size = Math.min(window.innerWidth, window.innerHeight);
        renderer.setSize(size, size);
    }
    window.addEventListener('resize', onWindowResize, false);
    onWindowResize();

    var marker_geo = new THREE.CircleGeometry(0.02);
    var marker_mat = new THREE.MeshBasicMaterial({
        color: 0xff0000
    });
    marker = new THREE.Mesh(marker_geo, marker_mat);
    scene.add(marker);
    marker.position.z = 1;

    var geometry = new THREE.PlaneBufferGeometry(2, 2);
    var juliaC = new THREE.Vector2(0.0, 0.0);
    material = new THREE.ShaderMaterial({
        uniforms: { julia_c: juliaC },
        //attributes: attributes,
        vertexShader: vsSrc,
        fragmentShader: fsSrc
    });

    plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    camera.position.z = 2;

    stats = new Stats();
    stats.showPanel(0);         // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);
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

function render(now) {
    stats.begin();
    var x, y;
    if (mouseX === null) {
        now /= 1000.0;
        //var rSqrt = Math.cos(now * 0.23);
        //var r = rSqrt * rSqrt;
        //x = r * Math.cos(now);
        //y = r * Math.sin(now);
        x = Math.cos(now);
        y = Math.sin(now / 2.3);
        requestAnimationFrame(render);
    } else {
        x = mouseX;
        y = mouseY;
    }

    material.uniforms.julia_c.value = new THREE.Vector2(x, y);
    marker.position.x = x;
    marker.position.y = y;

    renderer.render(scene, camera);
    stats.end();
}
