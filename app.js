const vertexShaderText = 
[
"attribute vec3 position;",
"uniform mat4 mview;",
"uniform mat4 mproj;",
"void main()",
"{",
"    gl_Position = mproj * mview * vec4(position, 1.0);",
"}"
].join("\n");

const fragmentShaderText =
[
"void main()",
"{",
"    gl_FragColor = vec4((1. - gl_FragCoord.z) * vec3(1., 1., 1.), 1.);",
"}"
].join("\n");

const cubeIndices =
[
    0, 1, 2,
    0, 2, 3,

    4, 5, 6,
    4, 6, 7,

    4, 0, 3,
    4, 3, 7,

    1, 5, 6,
    1, 6, 2,

    0, 1, 5,
    0, 5, 4,

    3, 2, 6,
    3, 6, 7
];

function initGL()
{
	const canvas = document.getElementById("game-surface");
	var _gl = canvas.getContext("webgl");

	if (!_gl)
    {
		console.log("WebGL not supported, falling back on experimental-webgl");
		_gl = canvas.getContext("experimental-webgl");
        if (!_gl)
        {
            alert("Your browser does not support WebGL");
            return;
        }
    }

    _gl.getExtension('WEBGL_depth_texture');

    return {
        gl: _gl,
        width: parseInt(canvas.getAttribute("width"), 10),
        height: parseInt(canvas.getAttribute("height"), 10)
    };
}

function initShaders(gl)
{
	const vertexShader = gl.createShader(gl.VERTEX_SHADER);
	const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

	gl.shaderSource(vertexShader, vertexShaderText);
	gl.shaderSource(fragmentShader, fragmentShaderText);

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

	const _program = gl.createProgram();
	gl.attachShader(_program, vertexShader);
	gl.attachShader(_program, fragmentShader);
	gl.linkProgram(_program);
	if (!gl.getProgramParameter(_program, gl.LINK_STATUS))
    {
		console.error("ERROR linking program!", gl.getProgramInfoLog(_program));
		return;
	}
	gl.validateProgram(_program);
	if (!gl.getProgramParameter(_program, gl.VALIDATE_STATUS))
    {
		console.error("ERROR validating program!", gl.getProgramInfoLog(_program));
		return;
	}

    return {
        program : _program,
        vPosition : gl.getAttribLocation(_program, "position"),
        vMview : gl.getUniformLocation(_program, "mview"),
        vMproj : gl.getUniformLocation(_program, "mproj")
    };
}

function initScene(context, shader)
{
    const cubeVertices = 
    [
        -1, -1, -1,
        1, -1, -1,
        1, 1, -1,
        -1, 1, -1,

        -1, -1, 1,
        1, -1, 1,
        1, 1, 1,
        -1, 1, 1
    ];

    const gl = context.gl;

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertices), gl.STATIC_DRAW);

    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);
    
    gl.vertexAttribPointer(shader.vPosition, 3, gl.FLOAT, gl.FALSE, 3*Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(shader.vPosition);

    var projMatrix = new Float32Array(16);
    const ratio = context.width / context.height;
    glMatrix.mat4.ortho(projMatrix, -2*ratio, 2*ratio, -2, 2, 1, 5);
    //glMatrix.mat4.perspective(projMatrix, 100*Math.PI/180, 4./3, .1, 2);

	gl.useProgram(shader.program);
    gl.uniformMatrix4fv(shader.vMproj, false, projMatrix);
}

function drawDepth(context, shader, x, y, z)
{
    const gl = context.gl;

    var viewMatrix = new Float32Array(16);
    glMatrix.mat4.lookAt(viewMatrix, glMatrix.vec3.fromValues(x, y, z), glMatrix.vec3.fromValues(0, 0, 0), glMatrix.vec3.fromValues(0, 0, 1));
    gl.uniformMatrix4fv(shader.vMview, false, viewMatrix);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clearColor(0, 0, 0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);
}

function draw(context, shader, fb_width, fb_height)
{
    const RADIUS = 3.0;
    const ANGLE_MAX_RAD = Math.PI/4.;
    const N = 5;
    const Z = 1.0;

    var textures = [];

    for(var i = 0; i < N; ++i)
    {
        const theta = -ANGLE_MAX_RAD + 2*i*ANGLE_MAX_RAD/(N-1);
        const x = RADIUS * Math.cos(theta);
        const y = -RADIUS * Math.sin(theta);

        const fb_tex = createTexture(context.gl, fb_width, fb_height);
        const fb     = createFramebuffer(context.gl, fb_tex);

        const depth_tex = createDepthTexture(context.gl, fb_width, fb_height);
        context.gl.framebufferTexture2D(context.gl.FRAMEBUFFER, context.gl.DEPTH_ATTACHMENT, context.gl.TEXTURE_2D, depth_tex, 0);

        textures.push(fb_tex);

        context.gl.bindFramebuffer(context.gl.FRAMEBUFFER, fb);
        context.gl.viewport(0, 0, fb_width, fb_height);

        drawDepth(context, shader, x, y, Z);
    }

    return textures;
}

function generate_depth_textures(context, fb_width, fb_height)
{
    const shader = initShaders(context.gl);
    initScene(context, shader);
    return draw(context, shader, fb_width, fb_height);
}

function fast_draw_texture(context, texture)
{
    const gl = context.gl;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    displayTexture(gl, texture, context.width, context.height);
}

function initDemo()
{
    const context = initGL();
    const gl = context.gl;

    const fb_width = 1024;
    const fb_height = 1024;

    const pattern_width = 512;
    const pattern_height = 1024;

    const textures = generate_depth_textures(context, fb_width, fb_height);

    context.gl.bindFramebuffer(context.gl.FRAMEBUFFER, null);
    context.gl.viewport(0, 0, context.width, context.height);
    
    const pattern_texture = voronoi_draw(context.gl, pattern_width, pattern_height, 16, 32);
    fast_draw_texture(context, textures[0]);

    stereo(gl, context.width, context.height, pattern_texture, textures);
}
