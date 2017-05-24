uniform vec2 julia_c;
varying vec2 uvfrag;

void
main()
{
    vec2 z = uvfrag * 2.0 - 1.0;
    float v = iterate(julia_c, z);
    //float v = iterate(z, z);
    gl_FragColor = itToColor(v);
}
