//
//   2021 Fall COSE436 interactive Visualization
//   Instructor: Won-Ki Jeong (wkjeong@korea.ac.kr)
//
//   Assignment 2 Texture Mapping
//

var exercise_num = 2;
var canvas;
var gl;
var program;

var eye, at, up;
var xangle = 0.0;
var yangle = 0.0;
var delta_translate = 0.0;

var points = [];
var temp_indicies = [];
var indicies = [];
var face_normal = [];
var vertex_normals = [];
var adj_list = {};

var sphere;

// Cubemap raw texture image
var texSize = 16;

var image1 = new Uint8Array(4*texSize*texSize);
var image2 = new Uint8Array(4*texSize*texSize);
var image3 = new Uint8Array(4*texSize*texSize);
var image4 = new Uint8Array(4*texSize*texSize);
var image5 = new Uint8Array(4*texSize*texSize);
var image6 = new Uint8Array(4*texSize*texSize);

var cubeMap;

window.onload = function init(){
	canvas = document.getElementById("gl-canvas");
	canvas.oncontextmenu = () => false;

	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) { alert("WebGL isn't available"); }

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);

	gl.enable(gl.DEPTH_TEST);

	//
	//  Load shaders and initialize buffers
	//
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	console.log("good till here")
	gl.useProgram(program);
	document.getElementById('inputfile').addEventListener('change', off_reader);

	/*
	// Create CubeMap Texture
	configureCubeMap();

	gl.activeTexture(gl.TEXTURE0);
	gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);

	// Use Sphere.js (external library)
	sphere = new Sphere(gl, 0.5, 36, 36, true);

	gl.bindBuffer(gl.ARRAY_BUFFER, sphere.vboVertex);

	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, sphere.stride, 0);
	gl.enableVertexAttribArray(vPosition);


	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere.vboIndex);
	*/

};

function off_reader() {
	const reader = new FileReader();
	reader.onload = function (evt) {
		parser(evt.target.result);
	};
	reader.readAsText(this.files[0]);
}

function calc_normal(v1, v2) {
	var V = vec3(v1[1] * v2[2] - v1[2] * v2[1], v1[2] * v2[0] - v1[0] * v2[2], v1[0] * v2[1] - v1[1] * v2[0]);
	var mag = Math.sqrt(V[0] * V[0] + V[1] * V[1] + V[2] * V[2]);
	return vec3(V[0] / mag, V[1] / mag, V[2] / mag);
}

function parser(text) {

	// reset all arrays for new object
	points = [];
	temp_indicies = [];
	indicies = [];
	face_normal = [];
	vertex_normals = [];
	adj_list = {};

	const lines = text.split('\n');
	numVtx = 0;
	numFace = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		// Skip empty or comment line
		if (line === '' || line.startsWith('#')) continue;

		// Parse line into parts using space as delimiter
		const parts = line.split(/\s+/);
		const parts_length = parts.length;

		if (parts_length == 3) {
			if (numVtx == 0 && numFace == 0) {
				numVtx = parts[0];
				numFace = parts[1];
				continue;
			}
		}

		if (parts_length == 4) {
			var idx1 = parts[1]; var idx2 = parts[2]; var idx3 = parts[3];
			indicies.push(parseInt(idx1, 10));
			indicies.push(parseInt(idx2, 10));
			indicies.push(parseInt(idx3, 10));

			var v1 = vec3(points[3 * idx1], points[3 * idx1 + 1], points[3 * idx1 + 2]);
			var v2 = vec3(points[3 * idx2], points[3 * idx2 + 1], points[3 * idx2 + 2]);
			var v3 = vec3(points[3 * idx3], points[3 * idx3 + 1], points[3 * idx3 + 2]);

			var vert1 = vec3(v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]);
			var vert2 = vec3(v1[0] - v3[0], v1[1] - v3[1], v1[2] - v3[2]);
			face_normal.push(calc_normal(vert1, vert2));
		}

		for (let j = 0; j < parts.length; j++) {
			if (parts_length == 3) {
				points.push(parseFloat(parts[j]));
			}
			else if (parts_length == 4 && j != 0) {
				var int_indicies = parseInt(parts[j]);
				var line_num = parseInt(temp_indicies.length / 3);
				temp_indicies.push(int_indicies);

				// adjacency list calculation
				if (int_indicies in adj_list) {
					if (temp_indicies.length == 0) {
						line_num = 0;
					}
					adj_list[int_indicies].push(line_num);
				}
				else {
					adj_list[int_indicies] = [line_num];
				}
			}
		}


	}

	// vertex normal calculation
	for (const [vertex, vertex_list] of Object.entries(adj_list)) {
		var v_normal = vec3(0, 0, 0);
		for (let i = 0; i < vertex_list.length; i++) {
			let f_n = face_normal[vertex_list[i]];
			v_normal[0] += f_n[0];
			v_normal[1] += f_n[1];
			v_normal[2] += f_n[2];
		}
		v_normal[0] = v_normal[0] / vertex_list.length;
		v_normal[1] = v_normal[1] / vertex_list.length;
		v_normal[2] = v_normal[2] / vertex_list.length;
		var mag = Math.sqrt(v_normal[0] * v_normal[0] + v_normal[1] * v_normal[1] + v_normal[2] * v_normal[2])

		vertex_normals.push(v_normal[0] / mag);
		vertex_normals.push(v_normal[1] / mag);
		vertex_normals.push(v_normal[2] / mag);
	}

	if(exercise_num == 1){
		exercise1();
	}

}

function set_cube_uniform_matrix(){
	eye = vec3(0.0, 0.0, 0.0);
	eye[0] = Math.sin(xangle) * Math.cos(yangle);
	eye[1] = Math.sin(xangle) * Math.sin(yangle);
	eye[2] = Math.cos(xangle);
	at = vec3(0.0, 0.0, 0.0);
	up = vec3(0.0, 1.0, 0.0);

	var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
	var modelViewMatrix = lookAt(eye, at, up);
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

	var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
	var projectionMatrix = ortho(-1,1,-1,1,-10,10);
	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
}

function set_cube_buffers(){

	// Vertex Position
	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

	var vPositionHandle = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPositionHandle, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPositionHandle);

	// Vertex Index
	var indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indicies), gl.STATIC_DRAW);

}

function configureTexture(image){
	texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

	/*
	if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
		gl.generateMipmap(gl.TEXTURE_2D);
	} else {
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	}
	*/

	gl.generateMipmap(gl.TEXTURE_2D);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}

function set_cube_texture(){
	var image = new Image();
	image.onload = function () {
		configureTexture(image);
	}
	image.src = "mob.bmp";


	var texture_coordinates = [
		0.33, 0.25,
		0.66, 0.25,
		0.66, 0.50,
		0.33, 0.50,
		0.33, 1.0,
		0.33, 0.75,
		0.66, 0.75,
		0.66, 1.0,
		0.33, 0.75,
		0.33, 0.5,
		0.66, 0.5,
		0.66, 0.75,
		0.33, 0.0,
		0.66, 0.0,
		0.66, 0.25,
		0.33, 0.25,
		0.0, 0.75,
		0.0, 0.5,
		0.25, 0.5,
		0.25, 0.75,
		1.0, 0.75,
		0.66, 0.75,
		0.66, 0.5,
		1.0, 0.5
	];


	var texBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(texture_coordinates), gl.STATIC_DRAW);

	var texHandler = gl.getAttribLocation(program, "texCoord");
	gl.vertexAttribPointer(texHandler, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(texHandler);
}

function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}


function configureCubeMap()
{
	// Generate checkerboard texture
	for (var i = 0; i < texSize; i++) {
		for (var j = 0; j < texSize; j++) {

			var c = ((((i&0x1)==0)^((j&0x1))==0))*255;

			image1[4*i*texSize+4*j]   = c;
			image1[4*i*texSize+4*j+1] = c;
			image1[4*i*texSize+4*j+2] = c;
			image1[4*i*texSize+4*j+3] = 255;

			image2[4*i*texSize+4*j]   =  c;
			image2[4*i*texSize+4*j+1] =  c;
			image2[4*i*texSize+4*j+2] =  0;
			image2[4*i*texSize+4*j+3] =  255;

			image3[4*i*texSize+4*j]   =  c;
			image3[4*i*texSize+4*j+1] =  0;
			image3[4*i*texSize+4*j+2] =  c;
			image3[4*i*texSize+4*j+3] =  255;

			image4[4*i*texSize+4*j]   =  0;
			image4[4*i*texSize+4*j+1] =  c;
			image4[4*i*texSize+4*j+2] =  c;
			image4[4*i*texSize+4*j+3] =  255;

			image5[4*i*texSize+4*j]   =  255;
			image5[4*i*texSize+4*j+1] =  c;
			image5[4*i*texSize+4*j+2] =  c;
			image5[4*i*texSize+4*j+3] =  255;

			image6[4*i*texSize+4*j]   =  c;
			image6[4*i*texSize+4*j+1] =  c;
			image6[4*i*texSize+4*j+2] =  255;
			image6[4*i*texSize+4*j+3] =  255;
		}
	}


    cubeMap = gl.createTexture();

	// Bind texture and initialize


	// ToDo


}

function exercise1() {

	set_cube_uniform_matrix();
	set_cube_buffers();
	set_cube_texture();

	const textureCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

	render();
}

var render = function(){
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	var ext = gl.getExtension('OES_element_index_uint');

	if (exercise_num == 1){
		// Change Viewpoint
		xangle += 0.01;
		yangle += 0.02;
		delta_translate += 0.05;
		translation = Math.sin(delta_translate);
		var model_translate = translate(-translation, 0.0, 0.0);


		eye[0] = Math.sin(xangle) * Math.cos(yangle);
		eye[1] = Math.sin(xangle) * Math.sin(yangle);
		eye[2] = Math.cos(xangle);

		var viewdir = vec3(at[0] - eye[0], at[1] - eye[1], at[2] - eye[2]);
		var viewdirLoc = gl.getUniformLocation(program, "viewdir");
		gl.uniform3fv(viewdirLoc, viewdir);

		var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
		var modelViewMatrix = lookAt(eye, at, up);
		var temp = mult(modelViewMatrix, model_translate);
		gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(temp));

		// Draw triangles
		gl.drawElements(gl.TRIANGLES, indicies.length, gl.UNSIGNED_INT, 0);

		requestAnimFrame(render);
	}
	else if (exercise_num == 2) {

	}



}
