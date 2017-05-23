// three.js gives us:
//     uniform mat4 viewMatrix;
//     uniform vec3 cameraPosition;

uniform vec2 julia_c;
varying vec2 uvfrag;

void main() {
    float v = iterate(julia_c, uvfrag * 2.0 - 1.0);
    gl_FragColor = itToColor(v);

    //if (v == 1.0) {
    //    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    //} else {
    //    float value = pow(1.0 - v, 2.0);
    //    gl_FragColor = vec4(value, 0.0, 0.0, 1.0);
    //}
}
