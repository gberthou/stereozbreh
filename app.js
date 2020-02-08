var vertexShaderText = 
[
"attribute vec3 position;",
"uniform mat4 mview;",
"uniform mat4 mproj;",
"void main()",
"{",
"    gl_Position = mproj * mview * vec4(position, 1.0);",
"}"
].join("\n");

var fragmentShaderText =
[
"void main()",
"{",
"    gl_FragColor = vec4((1. - gl_FragCoord.z) * vec3(1., 1., 1.), 1.);",
"}"
].join("\n");


var cubeIndices =
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
	var canvas = document.getElementById("game-surface");
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

    return {
        gl: _gl,
        width: parseInt(canvas.getAttribute("width"), 10),
        height: parseInt(canvas.getAttribute("height"), 10)
    };
}

function initShaders(gl)
{
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

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

	var _program = gl.createProgram();
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
    var cubeVertices = 
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

    var gl = context.gl;

    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertices), gl.STATIC_DRAW);

    var ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);
    
    gl.vertexAttribPointer(shader.vPosition, 3, gl.FLOAT, gl.FALSE, 3*Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(shader.vPosition);

    var projMatrix = new Float32Array(16);
    var ratio = context.width / context.height;
    glMatrix.mat4.ortho(projMatrix, -2*ratio, 2*ratio, -2, 2, 1, 5);
    //glMatrix.mat4.perspective(projMatrix, 100*Math.PI/180, 4./3, .1, 2);

	gl.useProgram(shader.program);
    gl.uniformMatrix4fv(shader.vMproj, false, projMatrix);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
}

function draw(gl)
{
    const RADIUS = 3.0;
    const ANGLE_MAX_RAD = Math.PI/4.;

    var z = 1.0;
    var theta = -ANGLE_MAX_RAD;
    

    var _draw = function(dt) {
        var x = RADIUS * Math.cos(theta);
        var y = -RADIUS * Math.sin(theta);
        theta += .01;

        var viewMatrix = new Float32Array(16);
        glMatrix.mat4.lookAt(viewMatrix, glMatrix.vec3.fromValues(x, y, z), glMatrix.vec3.fromValues(0, 0, 0), glMatrix.vec3.fromValues(0, 0, 1));
        gl.uniformMatrix4fv(shader.vMview, false, viewMatrix);

        gl.clearColor(0, 0, 0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(_draw);
    };

    requestAnimationFrame(_draw);
}

function initDemo()
{
    var context = initGL();
    var gl = context.gl;

    //shader = initShaders(context.gl);
    //initScene(context, shader);

    //draw(context.gl);

    voronoi_draw(gl, 800/32, 600/30);
}
