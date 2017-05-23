const int escape = 100;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec4
itToColor(float it)
{
    if (it == 1.0) {
        return vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        float hue = pow(1.0 - it, 5.0) + 0.5;
        return vec4(hsv2rgb(vec3(hue, 1.0, 1.0)), 1.0);
    }
}

float
iterate(vec2 c, vec2 z)
{
    //c = z * c.x * c.x + c.y;    // Based on a typo; looks pretty cool!
    int i = 0;
    for (int j = 0; j < escape; j++) {
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        vec2 diff = z - c;
        float dist2 = diff.x * diff.x + diff.y * diff.y; // |z-c|^2
        if (dist2 > 10.0)
            break;
        i++;
    }

    return float(i) / float(escape);
}

