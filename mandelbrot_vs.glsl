varying vec4 world_pos;

void
main()
{
    gl_PointSize = 5.0;
    world_pos = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
