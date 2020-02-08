function voronoi_fragment(width, height)
{
    const amount = width * height;
    const k = 6. * amount / 2.;
    return `
    precision highp float;

    uniform vec2 uDimensions;
    uniform vec2 uNodes[` + amount.toString() + `];
    uniform vec3 uColors[` + amount.toString() + `];

    float cylindrical_distance(vec2 a, vec2 b)
    {
        float dy = abs(a.y - b.y);
        float dx = abs(a.x - b.x);
        dx = min(dx, 1. - dx);

        return sqrt(dx*dx + dy*dy);
    }

    void main() {
        float sum = 0.;
        vec3 acc = vec3(0., 0., 0.);
        vec2 tmp = gl_FragCoord.xy / uDimensions;
        for(int i = 0; i < ` + amount.toString() + `; ++i)
        {
            float weight = exp(-` + k.toFixed(6).toString() + `*cylindrical_distance(tmp, uNodes[i]));
            sum += weight;
            acc += weight * uColors[i];
        }

        gl_FragColor = vec4(acc / sum, 1.0);
    }
   `;
}

function voronoi_nodes(width, height)
{
    const stepX = 1. / width;
    const stepY = 1. / height;
    var nodes = new Float32Array(2 * width * height); // vec2

    for(var y = 0; y < height; ++y)
        for(var x = 0; x < width; ++x)
        {
            var index = 2 * (x + y * width);
            nodes[index    ] = (x + Math.random()) * stepX;
            nodes[index + 1] = (y + Math.random()) * stepY;
        }

    return nodes;
}

function voronoi_colors(width, height)
{
    const amount = width * height;
    var colors = new Float32Array(3 * amount); // vec3

    for(var i = 0; i < amount; ++i)
    {
        var index = 3 * i;
        colors[index    ] = Math.random();
        colors[index + 1] = Math.random();
        colors[index + 2] = Math.random();
    }

    return colors;
}

function voronoi_draw(gl, width, height, px_per_x, px_per_y)
{
    const nodes_x = width / px_per_x;
    const nodes_y = height / px_per_y;
    const fcode = voronoi_fragment(nodes_x, nodes_y);
    const program = loadShaders(gl, VCODE_SCREEN, fcode);

    const aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
    const uDimensions     = gl.getUniformLocation(program, "uDimensions");
    const uNodes          = gl.getUniformLocation(program, "uNodes");
    const uColors         = gl.getUniformLocation(program, "uColors");

    const buffer = create_screen_buffer(gl);

    const nodes = voronoi_nodes(nodes_x, nodes_y);
    const colors = voronoi_colors(nodes_x, nodes_y);

    const texture = createTexture(gl, width, height);
    const fb      = createFramebuffer(gl, texture);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.viewport(0, 0, width, height);

    gl.useProgram(program);
    gl.uniform2f(uDimensions, width, height);
    gl.uniform2fv(uNodes, nodes);
    gl.uniform3fv(uColors, colors);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.disable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Actually draw
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aVertexPosition);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    return texture;
}
