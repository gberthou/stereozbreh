function stereo_fcode(width, height, attenuation, N)
{
    const k = N+1;
    return `
    precision highp float;

    uniform sampler2D pattern_texture;
    uniform sampler2D depth_texture[` + N.toString() + `];

    float depth_to_perturbation(float depth)
    {
        return -depth * ` + attenuation.toFixed(3) + ` / ` + k.toFixed(3) + `;
    }

    float compute_perturbation(float x, float y)
    {
        float p = 0.;
        for(int i = 1; i <= ` + N.toString() + `; ++i)
        {
            float depth = texture2D(depth_texture[i-1], vec2(x, y)).x;
            p += (i > int(floor(x)) ? 0. : depth_to_perturbation(depth));
        }
        return p;
    }

    void main()
    {
        vec2 p = gl_FragCoord.xy / vec2(` + width.toFixed(1) + `, ` + height.toFixed(1) + `);
        float x = p.x * ` + k.toFixed(3) + `;
        float y = clamp(p.y * ` + k.toFixed(3) + ` - ` + ((k-1.)/2.).toFixed(3) + `, 0., 1.);

        x += compute_perturbation(x, y);

        gl_FragColor = texture2D(pattern_texture, vec2(x, p.y));
    }
    `;
}

function stereo_filter_texture(gl, texture)
{
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
}

function stereo(gl, width, height, pattern_texture, depth_textures)
{
    const fcode = stereo_fcode(width, height, .5, depth_textures.length);
    const program = loadShaders(gl, VCODE_SCREEN, fcode);

    const aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
    const uPattern        = gl.getUniformLocation(program, "pattern_texture");
    const uDepth          = gl.getUniformLocation(program, "depth_texture");

    const buffer = create_screen_buffer(gl);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);

    attachTexture(gl, gl.TEXTURE0, pattern_texture);
    stereo_filter_texture(gl, pattern_texture);
    for(var i = 0; i < depth_textures.length; ++i)
    {
        attachTexture(gl, gl.TEXTURE1 + i, depth_textures[i]);
        stereo_filter_texture(gl, depth_textures[i]);
    }

    gl.activeTexture(gl.TEXTURE0);

    gl.useProgram(program);
    gl.uniform1i(uPattern, 0);

    var indices = new Array(depth_textures.length);
    for(var i = 0; i < depth_textures.length; ++i)
        indices[i] = i+1;
    gl.uniform1iv(uDepth, indices);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.disable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aVertexPosition);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
