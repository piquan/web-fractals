varying vec4 world_pos;

void
main()
{
    vec2 p = world_pos.xy;
    float v = iterate(p, p);
    gl_FragColor = itToColor(v);
}
