const VCODE_SCREEN = `
attribute vec4 aVertexPosition;

void main()
{
  gl_Position =  vec4(aVertexPosition.xy, 0., 1.);
}
`;

function loadShaders(gl, vcode, fcode)
{
	const vertexShader = gl.createShader(gl.VERTEX_SHADER);
	const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

	gl.shaderSource(vertexShader, vcode);
	gl.shaderSource(fragmentShader, fcode);

	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
    {
		console.error("ERROR compiling vertex shader!", gl.getShaderInfoLog(vertexShader));
		return;
	}

	gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
    {
		console.error("ERROR compiling fragment shader!", gl.getShaderInfoLog(fragmentShader));
		return;
	}

	const program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    {
		console.error("ERROR linking program!", gl.getProgramInfoLog(program));
		return;
	}
	gl.validateProgram(program);
	if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS))
    {
		console.error("ERROR validating program!", gl.getProgramInfoLog(program));
		return;
	}

    return program;
}

function create_screen_buffer(gl)
{
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    const positions = [
         1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
        -1.0, -1.0,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    return buffer;
}

function createTexture(gl, width, height)
{
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    return tex;
}

function attachTexture(gl, index, texture)
{
    gl.activeTexture(index);
    gl.bindTexture(gl.TEXTURE_2D, texture);
}

function createFramebuffer(gl, texture)
{
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    return fb;
}

function displayTexture(gl, texture, width, height)
{
    const FCODE_TEXTURE = function (width, height) {
        return `
        uniform sampler2D uTexture;

        void main()
        {
            gl_FragColor = texture2D(uTexture, gl_FragCoord.xy / vec2(` + width.toFixed(6) + `, ` + height.toFixed(6) + `));
        }
        `;
    };
    const program = loadShaders(gl, VCODE_SCREEN, FCODE_TEXTURE(width, height));
    const aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
    const uTexture = gl.getUniformLocation(program, "uTexture");
    const buffer = create_screen_buffer(gl);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);

    attachTexture(gl, gl.TEXTURE0, texture);

    gl.useProgram(program);
    gl.uniform1i(uTexture, 0);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.disable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Actually draw
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aVertexPosition);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
