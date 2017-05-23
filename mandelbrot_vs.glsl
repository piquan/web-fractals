uniform vec2 julia_c;
varying vec4 color;

void main() {
    gl_PointSize = 5.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    float v = iterate(julia_c, julia_c);
    color = itToColor(v);

    //if (v == 1.0) {
    //    color = vec4(0.0, 1.0, 0.0, 1.0);
    //    color = vec4(0.0, 0.0, 0.0, 1.0);
    //} else {
    //    float value = pow(1.0 - v, 2.0);
    //    color = vec4(0.0, 1.0 - value, value, 1.0);
    //    color = vec4(value, 0.0, 0.0, 1.0);
    //}
}
