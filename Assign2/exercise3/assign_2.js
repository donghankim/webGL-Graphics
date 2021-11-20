//
//   2021 Fall COSE436 interactive Visualization
//   Instructor: Won-Ki Jeong (wkjeong@korea.ac.kr)
//
//   Assignment 2 Texture Mapping - exercise 3
//

var canvas;
var gl;
var program;
var disco_ball;

// texture maps
var cImg = 2048;
var envImgSize = 512;
var cubeMap;
var characterHeadMap;
var characterBodyMap;
var characterLegMap;
var characterArmMap;

var eye, at, up;
var xangle = 0.0;
var yangle = 0.0;

var cube_vertex = [
	-0.5000, -0.5000, 0.5000,
	0.5000, -0.5000, 0.5000,
	0.5000, 0.5000, 0.5000,
	-0.5000, 0.5000, 0.5000,
	-0.5000, -0.5000, -0.5000,
	-0.5000, 0.5000, -0.5000,
	0.5000, 0.5000, -0.5000,
	0.5000, -0.5000, -0.5000,
	-0.5000, 0.5000, -0.5000,
	-0.5000, 0.5000, 0.5000,
	0.5000, 0.5000, 0.5000,
	0.5000, 0.5000, -0.5000,
	-0.5000, -0.5000, -0.5000,
	0.5000, -0.5000, -0.5000,
	0.5000, -0.5000, 0.5000,
	-0.5000, -0.5000, 0.5000,
	-0.5000, -0.5000, -0.5000,
	-0.5000, -0.5000, 0.5000,
	-0.5000, 0.5000, 0.5000,
	-0.5000, 0.5000, -0.5000,
	0.5000, -0.5000, -0.5000,
	0.5000, 0.5000, -0.5000,
	0.5000, 0.5000, 0.5000,
	0.5000, -0.5000, 0.5000
];

var cube_indicies = [
	0, 1, 2,
	0, 2, 3,
	4, 5, 6,
	4, 6, 7,
	8, 9, 10,
	8, 10, 11,
	12, 13, 14,
	12, 14, 15,
	20, 21, 22,
	20, 22, 23,
	16, 17, 18,
	16, 18, 19
];

var env_texCoord = [
	// front face
	-1.0, 1.0, 1.0,
	1.0, 1.0, 1.0,
	1.0, -1.0, 1.0,
	-1.0, -1.0, 1.0,
	// back face
	-1.0, -1.0, -1.0,
	-1.0, 1.0, -1.0,
	1.0, 1.0, -1.0,
	1.0, -1.0, -1.0,
	// top face
	-1.0, 1.0, -1.0,
	-1.0, 1.0, 1.0,
	1.0, 1.0, 1.0,
	1.0, 1.0, -1.0,
	// bottom face
	-1.0, -1.0, -1.0,
	1.0, -1.0, -1.0,
	1.0, -1.0, 1.0,
	-1.0, -1.0, 1.0,
	// left face
	-1.0, -1.0, -1.0,
	-1.0, -1.0, 1.0,
	-1.0, 1.0, 1.0,
	-1.0, 1.0, -1.0,
	// right face
	1.0, -1.0, -1.0,
	1.0, 1.0, -1.0,
	1.0, 1.0, 1.0,
	1.0, -1.0, 1.0
];

var head_texCoord = [
	// front face
	-1100/cImg, 1374/cImg, 1.0,
	1455/cImg, 1374/cImg, 1.0,
	1455/cImg, 1024/cImg, 1.0,
	-1100/cImg, -1024/cImg, 1.0,
	// back face
	-400/cImg, -1024/cImg, -1.0,
	-400/cImg, 1374/cImg, -1.0,
	750/cImg, 1374/cImg, -1.0,
	750/cImg, -1024/cImg, -1.0,
	// top face
	0.5, 0.5, 0.5,
	0.5, 0.5, 0.5,
	0.5, 0.5, 0.5,
	0.5, 0.5, 0.5,
	// bottom face
	0.5, 0.5, 0.5,
	0.5, 0.5, 0.5,
	0.5, 0.5, 0.5,
	0.5, 0.5, 0.5,
	// left face
	0.5, 0.5, 0.5,
	0.5, 0.5, 0.5,
	0.5, 0.5, 0.5,
	0.5, 0.5, 0.5,
	// right face
	0.5, 0.5, 0.5,
	0.5, 0.5, 0.5,
	0.5, 0.5, 0.5,
	0.5, 0.5, 0.5
];

var body_texCoord = [

];

var leg_texCoord = [

];

var arm_texCoord = [

];

window.onload = init;

function configureTexture(image) {
	var cube_texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, cube_texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.uniform1i(gl.getUniformLocation(program, "cube_texture"), 0);
}

function configureEnvCubeMap()
{
	// Create a texture.
	var cubeMap = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);

	const faceInfos = [
		{
			target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
			url: '../textures/env/pos_x.png',
		},
		{
			target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
			url: '../textures/env/neg_x.png',
		},
		{
			target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
			url: '../textures/env/pos_y.png',
		},
		{
			target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
			url: '../textures/env/neg_y.png',
		},
		{
			target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
			url: '../textures/env/pos_z.png',
		},
		{
			target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
			url: '../textures/env/neg_z.png',
		},
	];

	faceInfos.forEach((faceInfo) => {
		const { target, url } = faceInfo;

		// Upload the canvas to the cubemap face.
		const level = 0;
		const internalFormat = gl.RGBA;
		const width = 512;
		const height = 512;
		const format = gl.RGBA;
		const type = gl.UNSIGNED_BYTE;

		// setup each face so it's immediately renderable
		gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

		// Asynchronously load an image
		const image = new Image();
		image.src = url;
		image.addEventListener('load', function () {
			gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
			gl.texImage2D(target, level, internalFormat, format, type, image);
			gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
		});
	});

	gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.activeTexture(gl.TEXTURE0);
	gl.uniform1i(gl.getUniformLocation(program, "envMap"), 0);
}


function init()
{
	canvas = document.getElementById("gl-canvas");

	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) { alert("WebGL isn't available"); }

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);

	gl.enable(gl.DEPTH_TEST);

	//
	//  Load shaders and initialize buffers
	//
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	disco_ball = new Sphere(gl, 0.025, 36, 36, true);
	delta_translate = 0.0;
	eye_translate = 0.0;
	eye = vec3(0.0, 0.0, 0.5);
	at = vec3(0.0, 0.0, -1.0);
	up = vec3(0.0, 1.0, 0.0);

	// Create CubeMap Texture
	configureEnvCubeMap();
	render();
}

function set_uniform_matrix() {
	eye_translate += 0.01;
	eye[1] = 0.15 * Math.sin(eye_translate);
	var viewdir = vec3(at[0] - eye[0], at[1] - eye[1], at[2] - eye[2]);
	var viewdirLoc = gl.getUniformLocation(program, "viewdir");
	gl.uniform3fv(viewdirLoc, viewdir);

	var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
	var projectionMatrix = perspective(45, 1.0, 0.1, 1000);
	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

}

function set_render_type(type = "") {
	if (type == "env") {
		var render_type = 10.0;
		var typeLoc = gl.getUniformLocation(program, "type");
		gl.uniform1f(typeLoc, render_type);

		var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
		var scalingMatrix = scalem(10.0, 10.0, 10.0);
		var modelViewMatrix = lookAt(eye, at, up);
		var envViewMatrix = mult(modelViewMatrix, scalingMatrix);
		gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(envViewMatrix));
	}
	else if (type == "sphere") {
		var render_type = 20.0;
		var typeLoc = gl.getUniformLocation(program, "type");
		gl.uniform1f(typeLoc, render_type);

		var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
		var modelViewMatrix = lookAt(eye, at, up);
		var translateMatrix = translate(0.0, 0.15, 0.0);
		var disco_ballViewMatrix = mult(modelViewMatrix, translateMatrix);
		gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(disco_ballViewMatrix));
	}
	else if (type == "character_head") {
		var render_type = 30.0;
		var typeLoc = gl.getUniformLocation(program, "type");
		gl.uniform1f(typeLoc, render_type);

		var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
		var objectMatrix = scalem(0.07, 0.05, 0.05);
		var modelViewMatrix = lookAt(eye, at, up);
		var scaledViewMatrix = mult(modelViewMatrix, objectMatrix);
		gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(scaledViewMatrix));
	}
	else if (type == "character_body") {
		var render_type = 40.0;
		var typeLoc = gl.getUniformLocation(program, "type");
		gl.uniform1f(typeLoc, render_type);

		var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
		var scalingMatrix = scalem(0.05, 0.06, 0.05);
		var translationMatrix = translate(0.0, -1.0, 0.0);
		var objectMatrix = mult(scalingMatrix, translationMatrix);
		var modelViewMatrix = lookAt(eye, at, up);
		var scaledViewMatrix = mult(modelViewMatrix, objectMatrix);
		gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(scaledViewMatrix));
	}
	else if (type == "character_leg"){
		var render_type = 50.0;
		var typeLoc = gl.getUniformLocation(program, "type");
		gl.uniform1f(typeLoc, render_type);

		var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
		var scalingMatrix = scalem(0.05, 0.04, 0.05);
		var translationMatrix = translate(0.0, -2.9, 0.0);
		var objectMatrix = mult(scalingMatrix, translationMatrix);
		var modelViewMatrix = lookAt(eye, at, up);
		var scaledViewMatrix = mult(modelViewMatrix, objectMatrix);
		gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(scaledViewMatrix));
	}
	else if (type == "character_leftArm"){
		var render_type = 60.0;
		var typeLoc = gl.getUniformLocation(program, "type");
		gl.uniform1f(typeLoc, render_type);

		var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
		var scalingMatrix = scalem(0.05, 0.025, 0.05);
		var rotationMatrix = rotate(90, vec3(0,0,1));
		var translationMatrix = translate(-1.25, -1.5, 0.0);
		var objectRMatrix = mult(rotationMatrix, scalingMatrix);
		var objectMatrix = mult(objectRMatrix, translationMatrix);
		var modelViewMatrix = lookAt(eye, at, up);
		var scaledViewMatrix = mult(modelViewMatrix, objectMatrix);
		gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(scaledViewMatrix));
	}
	else if (type == "character_rightArm"){
		var render_type = 60.0;
		var typeLoc = gl.getUniformLocation(program, "type");
		gl.uniform1f(typeLoc, render_type);

		var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
		var scalingMatrix = scalem(0.05, 0.025, 0.05);
		var rotationMatrix = rotate(90, vec3(0, 0, 1));
		var translationMatrix = translate(-1.25, 1.5, 0.0);
		var objectRMatrix = mult(rotationMatrix, scalingMatrix);
		var objectMatrix = mult(objectRMatrix, translationMatrix);
		var modelViewMatrix = lookAt(eye, at, up);
		var scaledViewMatrix = mult(modelViewMatrix, objectMatrix);
		gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(scaledViewMatrix));
	}
}

function prep_sphere_render() {
	// vertex
	gl.bindBuffer(gl.ARRAY_BUFFER, disco_ball.vboVertex);
	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, disco_ball.stride, 0);
	gl.enableVertexAttribArray(vPosition);

	// normal
	var vNormal = gl.getAttribLocation(program, "vNormal");
	gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, disco_ball.stride, 12);
	gl.enableVertexAttribArray(vNormal);

	// texcoord
	var texHandler = gl.getAttribLocation(program, "texCoord");
	gl.vertexAttribPointer(texHandler, 2, gl.FLOAT, false, disco_ball.stride, 24);
	gl.enableVertexAttribArray(texHandler);

	// index
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, disco_ball.vboIndex);
}

function prep_cube_render(texCoords = null) {
	// vertex
	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(cube_vertex), gl.STATIC_DRAW);

	var vPositionHandle = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPositionHandle, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPositionHandle);

	// texcoord
	var texBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);

	if (texCoords == null){
		gl.bufferData(gl.ARRAY_BUFFER, flatten(env_texCoord), gl.STATIC_DRAW);
	} else {
		gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);
	}
	var texHandler = gl.getAttribLocation(program, "texCoord");
	gl.vertexAttribPointer(texHandler, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(texHandler);

	// index
	var indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(cube_indicies), gl.STATIC_DRAW);
}




var render = function()
{
	gl.flush();
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	var ext = gl.getExtension('OES_element_index_uint');

	set_uniform_matrix();

	// render envionemnt
	set_render_type(type = "env");
	prep_cube_render(env_texCoord);
	gl.drawElements(gl.TRIANGLES, cube_indicies.length, gl.UNSIGNED_INT, 0);

	// render sphere
	set_render_type(type = "sphere");
	prep_sphere_render();
	gl.drawElements(gl.TRIANGLES, disco_ball.getIndexCount(), gl.UNSIGNED_SHORT, 0);

	// render character head
	set_render_type(type = "character_head");
	prep_cube_render(head_texCoord);
	gl.drawElements(gl.TRIANGLES, cube_indicies.length, gl.UNSIGNED_INT, 0);

	// render chracter body
	set_render_type(type = "character_body");
	prep_cube_render();
	gl.drawElements(gl.TRIANGLES, cube_indicies.length, gl.UNSIGNED_INT, 0);

	// render chracter legs
	set_render_type(type = "character_leg");
	prep_cube_render();
	gl.drawElements(gl.TRIANGLES, cube_indicies.length, gl.UNSIGNED_INT, 0);

	// render chracter left arm
	set_render_type(type = "character_leftArm");
	prep_cube_render();
	gl.drawElements(gl.TRIANGLES, cube_indicies.length, gl.UNSIGNED_INT, 0);

	set_render_type(type = "character_rightArm");
	prep_cube_render();
	gl.drawElements(gl.TRIANGLES, cube_indicies.length, gl.UNSIGNED_INT, 0);

	requestAnimFrame(render);
}
