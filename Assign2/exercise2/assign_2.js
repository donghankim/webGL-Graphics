//
//   2021 Fall COSE436 interactive Visualization
//   Instructor: Won-Ki Jeong (wkjeong@korea.ac.kr)
//
//   Assignment 2 Texture Mapping
//

var canvas;
var gl;
var program;

var eye, at, up;
var delta_translate;
var eye_translate;
var sphere;

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

var cube_texCoord = [
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

// Cubemap raw texture image
var texSize = 16;

var image1 = new Uint8Array(4*texSize*texSize);
var image2 = new Uint8Array(4*texSize*texSize);
var image3 = new Uint8Array(4*texSize*texSize);
var image4 = new Uint8Array(4*texSize*texSize);
var image5 = new Uint8Array(4*texSize*texSize);
var image6 = new Uint8Array(4*texSize*texSize);

var cubeMap;

window.onload = init;

//
// Make CubeMap texture
//
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
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image2);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image3);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image4);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image5);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image6);

	gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.activeTexture(gl.TEXTURE0);
	gl.uniform1i(gl.getUniformLocation(program, "cubeMap"), 0);

}


function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

	sphere = new Sphere(gl, 0.15, 36, 36, true);
	delta_translate = 0.0;
	eye_translate = 0.0;
	eye = vec3(0.0, 0.0, 0.5);
	at = vec3(0.0, 0.0, -1.0);
	up = vec3(0.0, 1.0, 0.0);

	// Create CubeMap Texture
    configureCubeMap();
    render();
}

function set_uniform_matrix() {
	eye_translate += 0.01;
	eye[1] = 0.15*Math.sin(eye_translate);
	var viewdir = vec3(at[0] - eye[0], at[1] - eye[1], at[2] - eye[2]);
	var viewdirLoc = gl.getUniformLocation(program, "viewdir");
	gl.uniform3fv(viewdirLoc, viewdir);

	var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
	var projectionMatrix = perspective(45, 1.0, 0.1, 1000);
	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

}

function set_render_type(type = ""){
	if (type == "cube") {
		var render_type = 10.0;
		var typeLoc = gl.getUniformLocation(program, "type");
		gl.uniform1f(typeLoc, render_type);

		var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
		var modelViewMatrix = lookAt(eye, at, up);
		gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
	}
	else if (type == "sphere") {
		var render_type = 20.0;
		var typeLoc = gl.getUniformLocation(program, "type");
		gl.uniform1f(typeLoc, render_type);

		// Change Viewpoint
		delta_translate += 0.01
		var x_translation = 0.15*Math.sin(delta_translate);
		var model_translate_matrix = translate(x_translation, 0.0, 0.0);

		var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
		var modelViewMatrix = lookAt(eye, at, up);
		var animated_matrix = mult(modelViewMatrix, model_translate_matrix);
		gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(animated_matrix));
	}
}

function prep_cube_render(){

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
	gl.bufferData(gl.ARRAY_BUFFER, flatten(cube_texCoord), gl.STATIC_DRAW);

	var texHandler = gl.getAttribLocation(program, "texCoord");
	gl.vertexAttribPointer(texHandler, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(texHandler);

	// index
	var indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(cube_indicies), gl.STATIC_DRAW);

}

function prep_sphere_render(){

	// vertex
	gl.bindBuffer(gl.ARRAY_BUFFER, sphere.vboVertex);
	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, sphere.stride, 0);
	gl.enableVertexAttribArray(vPosition);

	// normal
	var vNormal = gl.getAttribLocation(program, "vNormal");
	gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, sphere.stride, 12);
	gl.enableVertexAttribArray(vNormal);

	// texcoord
	var texHandler = gl.getAttribLocation(program, "texCoord");
	gl.vertexAttribPointer(texHandler, 2, gl.FLOAT, false, sphere.stride, 24);
	gl.enableVertexAttribArray(texHandler);

	// index
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere.vboIndex);

}

var render = function()
{
    gl.flush();
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	var ext = gl.getExtension('OES_element_index_uint');

	set_uniform_matrix();
	// render cube
	set_render_type(type = "cube");
	prep_cube_render();
	gl.drawElements(gl.TRIANGLES, cube_indicies.length, gl.UNSIGNED_INT, 0);

	// render sphere
	set_render_type(type = "sphere");
	prep_sphere_render();
	gl.drawElements(gl.TRIANGLES, sphere.getIndexCount(), gl.UNSIGNED_SHORT, 0);

    requestAnimFrame(render);
}
