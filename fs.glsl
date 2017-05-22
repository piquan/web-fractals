// three.js gives us:
//     uniform mat4 viewMatrix;
//     uniform vec3 cameraPosition;

uniform vec2 julia_c;
varying vec2 uvfrag;

const int escape = 200;

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec2 c = julia_c;
    vec2 z = uvfrag * 2.0 - 1.0;
    //c = z;                      // Plot the Mandelbrot set instead
    int i = 0;
    for (int j = 0; j < escape; j++) {
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        vec2 diff = z - c;
        float dist2 = diff.x * diff.x + diff.y * diff.y; // |diff|^2
        if (dist2 > 10.0)
            break;
        i++;
    }

    if (i == escape) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        float hue = 1.0 - float(i) / float(escape);
        hue = pow(hue, 5.0);
        gl_FragColor = vec4(hsv2rgb(vec3(0.5 + hue, 1.0, 1.0)), 1.0);
    }
}
