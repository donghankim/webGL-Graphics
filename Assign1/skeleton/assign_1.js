//
//   2021 Fall COSE436 interactive Visualization
//   Instructor: Won-Ki Jeong (wkjeong@korea.ac.kr)
//

var canvas;
var gl;
var program;

var numVtx;
var numFace;

// loading file
var points  = [];
var temp_indicies = [];
var indicies = [];
var face_normal = [];
var vertex_normals = [];
var adj_list = {};

// for rendering
var render_mode = "triangles";
var projection_type = "perspective";
var perspective_matrix = perspective(15, 1, -0.5, 0.5);
var orthogonal_matrix = ortho(-0.5, 0.5, -0.5, 0.5, -0.5, 1000);
var eye_min_z = 0.5;
var eye_ = vec3(0.0, 0.0, 2.0);
var at_ = vec3(0.0, 0.0, -1.0);
var up_ = vec3(0.0, 1.0, 0.0);

// for user interaction
var mouse_moving = true
var start_x; var start_y;

var zoom = function(wh_event){
	var dir = vec3(0.0, 0.0, 0.0);
	for(var i = 0; i < 3; i++)
		dir[i] = eye_[i] - at_[i];

	if(wh_event.deltaY < 0) {
		for(var i = 0; i < 3; i++)
			eye_[i] -= 0.05*dir[i];
	} else {
		for (var i = 0; i < 3; i++)
			eye_[i] += 0.05 * dir[i];
	}
	render();
}

var mouse_down = function(evt){
	mouse_moving = true;
	start_x = evt.pageX; start_y = evt.pageY;
	evt.preventDefault();
}

var mouse_move = function(evt){
	if (!mouse_moving){
		return;
	}

	// left mouse clicked (rotation)
	if (evt.which == 1) {
		console.log("left");
		console.log(evt.pageX, evt.pageY);
	}
	// middle mouse clicked (pan)
	else if (evt.which == 2) {
		var dX = (evt.pageX - start_x) * 2 * Math.PI / canvas.width;
		var dY = (evt.pageY - start_y) * 2 * Math.PI / canvas.height;

		if (at_[0] + dX <= 5 && at_[0] + dX >= -5)   //change camera angle
			at_[0] += dX;
		if (at_[1] - dY <= 5 && at_[1] - dY >= -5)
			at_[1] -= dY;
		start_x = evt.pageX, start_y = evt.pageY;
		evt.preventDefault();
		render();

	}
	// right mouse clicked (zoom)
	else if (evt.which == 3) {
		var dir = vec3(0.0, 0.0, 0.0);
		for (var i = 0; i < 3; i++)
			dir[i] = eye_[i] - at_[i];
		if (evt.pageY >= start_y) {
			for (var i = 0; i < 3; i++)
				eye_[i] -= 0.005 * dir[i];
		}
		else {
			for (var i = 0; i < 3; i++)
				eye_[i] += 0.005 * dir[i];
		}
		render();
	}


}

var mouse_up = function(evt){
	mouse_moving = false;
}


window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
	canvas.oncontextmenu = () => false;

	canvas.addEventListener("mousedown", mouse_down, false);
	canvas.addEventListener("mousemove", mouse_move, false);
	canvas.addEventListener("mouseup", mouse_up, false);

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.enable(gl.DEPTH_TEST);

	//  Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

	// Callback for .OFF file reader
	document.getElementById('inputfile').addEventListener('change', off_reader);
};



function off_reader()
{
	const reader = new FileReader();
	reader.onload = function(evt) {
		parser(evt.target.result);
	};
	reader.readAsText(this.files[0]);
}

function calc_normal(v1, v2){
	var V = vec3(v1[1]*v2[2] - v1[2]*v2[1], v1[2]*v2[0] - v1[0]*v2[2], v1[0]*v2[1] - v1[1]*v2[0]);
	var mag = Math.sqrt(V[0] * V[0] + V[1] * V[1] + V[2] * V[2]);
	return vec3(V[0]/mag, V[1]/mag, V[2]/mag);
}

//
// Parser for input text file
//
function parser(text){
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

		if(parts_length == 3){
			if (numVtx == 0 && numFace == 0) {
				numVtx = parts[0];
				numFace = parts[1];
				continue;
			}
		}

		if(parts_length == 4){
			var idx1 = parts[1]; var idx2 = parts[2]; var idx3 = parts[3];
			indicies.push(parseInt(idx1, 10));
			indicies.push(parseInt(idx2, 10));
			indicies.push(parseInt(idx3, 10));

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

		for(let j=0; j < parts.length; j++){
			if(parts_length == 3){
				points.push(parseFloat(parts[j]));
			}
			else if(parts_length == 4 && j != 0){
				var int_indicies = parseInt(parts[j]);
				var line_num = parseInt(temp_indicies.length / 3);
				temp_indicies.push(int_indicies);

				// adjacency list calculation
				if (int_indicies in adj_list){
					if(temp_indicies.length == 0){
						line_num = 0;
					}
					adj_list[int_indicies].push(line_num);
				}
				else{
					adj_list[int_indicies] = [line_num];
				}
			}
		}


	}

	// vertex normal calculation
	for (const [vertex, vertex_list] of Object.entries(adj_list)) {
		var v_normal = vec3(0,0,0);
		for(let i = 0; i < vertex_list.length; i++){
			let f_n = face_normal[vertex_list[i]];
			v_normal[0] += f_n[0];
			v_normal[1] += f_n[1];
			v_normal[2] += f_n[2];
		}
		v_normal[0] = v_normal[0]/vertex_list.length;
		v_normal[1] = v_normal[1]/vertex_list.length;
		v_normal[2] = v_normal[2]/vertex_list.length;
		var mag = Math.sqrt(v_normal[0]*v_normal[0] + v_normal[1]*v_normal[1] + v_normal[2]*v_normal[2])

		vertex_normals.push(v_normal[0]/mag);
		vertex_normals.push(v_normal[1]/mag);
		vertex_normals.push(v_normal[2]/mag);
	}


	//
	// Create buffers
	//

	// ToDo: Create Buffer for Vertex Normals

	var vNBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vNBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertex_normals), gl.STATIC_DRAW);

	var vNPositionHandle = gl.getAttribLocation(program, "v_normal_input");
	gl.vertexAttribPointer(vNPositionHandle, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vNPositionHandle);


	// Vertex Position
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPositionHandle = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPositionHandle, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPositionHandle );

	// Vertex Index
	var indexBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, indexBuffer );
	gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indicies), gl.STATIC_DRAW );

	render();
}

function wireframe_rendering(){
	render_mode = "lines"
	render()

}

function smooth_rendering(){
	render_mode = "triangles"
	render()
}

function orthogonal_projection(){
	projection_type = "orthogonal";
	render()
}

function perpective_projection(){
	projection_type = "perspective";
	render()
}

function set_transformation_matrix(){
	var normal_matrix_loc = gl.getUniformLocation(program, "normalMatrix");
	var modelView_matrix_loc = gl.getUniformLocation(program, "modelViewMatrix");

	// transformation matricies
	var normal_matrix = mat4(1.0);
	var modelView_matrix = lookAt(eye_, at_, up_);
	gl.uniformMatrix4fv(normal_matrix_loc, false, flatten(normal_matrix));
	gl.uniformMatrix4fv(modelView_matrix_loc, false, flatten(modelView_matrix));

}

function set_light_source(){

	// get location
	var light_pos_loc1 = gl.getUniformLocation(program, "lightPosition1");
	var light_pos_loc2 = gl.getUniformLocation(program, "lightPosition2");
	var ap_loc = gl.getUniformLocation(program, "ambientProduct");
	var dp_loc1 = gl.getUniformLocation(program, "diffuseProduct1");
	var dp_loc2 = gl.getUniformLocation(program, "diffuseProduct2");
	var sp_loc = gl.getUniformLocation(program, "specularProduct");
	var shine_loc = gl.getUniformLocation(program, "shininess");

	// phong lighting parameters
	var lightPosition1 = vec4(5.0, 0.5, 1.0, 0.0);
	var lightPosition2 = vec4(-5.0, 0.5, 1.0, 0.0);
	var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
	var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);

	var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
	var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
	var materialDiffuse1 = vec4(1.0, 0.1, 0.0, 1.0); // what determines color
	var materialDiffuse2 = vec4(0.1, 1.0, 0.0, 1.0);
	var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
	var materialShininess = 100.0;

	var ambientProduct = mult(lightAmbient, materialAmbient);
	var diffuseProduct1 = mult(lightDiffuse, materialDiffuse1);
	var diffuseProduct2 = mult(lightDiffuse, materialDiffuse2);
	var specularProduct = mult(lightSpecular, materialSpecular);

	// set bytes
	gl.uniform4fv(light_pos_loc1, flatten(lightPosition1));
	gl.uniform4fv(light_pos_loc2, flatten(lightPosition2));
	gl.uniform4fv(ap_loc, flatten(ambientProduct));
	gl.uniform4fv(dp_loc1, flatten(diffuseProduct1));
	gl.uniform4fv(dp_loc2, flatten(diffuseProduct2));
	gl.uniform4fv(sp_loc, flatten(specularProduct));
	gl.uniform1f(shine_loc, materialShininess);

}

//
// Render function
//
function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

	// for 32bit index buffer
	var ext = gl.getExtension('OES_element_index_uint');

	if (render_mode == "triangles") {
		set_transformation_matrix();
		set_light_source();

		var projection_matrix_loc = gl.getUniformLocation(program, "projectionMatrix");
		if (projection_type == "perspective") {
			gl.uniformMatrix4fv(projection_matrix_loc, false, flatten(perspective_matrix));
		} else {
			gl.uniformMatrix4fv(projection_matrix_loc, false, flatten(orthogonal_matrix));
		}
		gl.drawElements(gl.TRIANGLES, indicies.length, gl.UNSIGNED_INT, 0);
	}
	else {
		set_transformation_matrix();
		var projection_matrix_loc = gl.getUniformLocation(program, "projectionMatrix");
		if (projection_type == "perspective") {
			gl.uniformMatrix4fv(projection_matrix_loc, false, flatten(perspective_matrix));
		} else {
			gl.uniformMatrix4fv(projection_matrix_loc, false, flatten(orthogonal_matrix));
		}
		gl.drawElements(gl.LINES, indicies.length, gl.UNSIGNED_INT, 0);
	}

	// console.log("render complete");
}


