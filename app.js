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
"    gl_FragColor = vec4(gl_FragCoord.z * vec3(1., 1., 1.), 1.);",
"}"
].join("\n");

var InitDemo = function ()
{
	var canvas = document.getElementById("game-surface");
	var gl = canvas.getContext("webgl");

	if (!gl)
    {
		console.log("WebGL not supported, falling back on experimental-webgl");
		gl = canvas.getContext("experimental-webgl");
        if (!gl)
        {
            alert("Your browser does not support WebGL");
            return;
        }
	}

	//
	// Create shaders
	// 
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

	var program = gl.createProgram();
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

    vPosition = gl.getAttribLocation(program, "position");

    vMview = gl.getUniformLocation(program, "mview");
    vMproj = gl.getUniformLocation(program, "mproj");

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

    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertices), gl.STATIC_DRAW);

    var ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);
    
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, gl.FALSE, 3*Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(vPosition);


    var viewMatrix = new Float32Array(16);
    glMatrix.mat4.lookAt(viewMatrix, glMatrix.vec3.fromValues(0, -2, 1), glMatrix.vec3.fromValues(0, 0, 0), glMatrix.vec3.fromValues(0, 0, 1));

    var projMatrix = new Float32Array(16);
    glMatrix.mat4.ortho(projMatrix, -2, 2, -2, 2, .1, 2);
    //glMatrix.mat4.perspective(projMatrix, 100*Math.PI/180, 4./3, .1, 2);

	gl.useProgram(program);
    gl.uniformMatrix4fv(vMview, false, viewMatrix);
    gl.uniformMatrix4fv(vMproj, false, projMatrix);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

	//
	// Main render loop
	//
	gl.clearColor(0, 0, 0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);
};
