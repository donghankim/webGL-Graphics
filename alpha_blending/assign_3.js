
var canvas;
var gl;
var program;

// virtual trackball code
var mouse_moving  = true;
var start_x; var start_y;

// rendering variables
var voxel_data;
var voxel_texture;
var voxel_x = 256; var voxel_y = 256; var voxel_z = 256;
var render_type = 2.0;

var perspective_matrix = perspective(60, 1, 0.1, 100);
var orthogonal_matrix = ortho(-0.5, 0.5, -0.5, 0.5, -0.5, 1000);
var eye_ = vec3(2.0, 0.0, 0.0);
var at_ = vec3(0.0, 0.0, 0.0);
var up_ = vec3(0.0, 1.0, 0.0);

// cube volume verticies and index
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

window.onload = function init(){
    canvas = document.getElementById( "gl-canvas" );
    canvas.oncontextmenu = () => false;

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
    gl.enable(gl.DEPTH_TEST);
    // gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	//  Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // virtual trackball + mouse commands
    canvas.addEventListener("mousedown", mouse_down, false);
    canvas.addEventListener("mousemove", mouse_move, false);
    canvas.addEventListener("mouseup", mouse_up, false);

    // read RAW file
    document.getElementById('inputfile').addEventListener('change', file_reader);
};

function file_reader(){
    const reader = new FileReader();
    reader.onload = function (evt) {

        var data = new DataView(evt.target.result);
        voxel_data = new Uint8Array(data.buffer);
        set_voxel_texture();
    };
    reader.readAsArrayBuffer(this.files[0]);
    var img_dim = this.files[0].name.split(/[_|.]/);
    voxel_x = parseInt(img_dim[1]);
    voxel_y = parseInt(img_dim[2]);
    voxel_z = parseInt(img_dim[3]);
}

function set_voxel_texture(){
    voxel_texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_3D, voxel_texture);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.R8, voxel_x, voxel_y, voxel_z, 0, gl.RED, gl.UNSIGNED_BYTE, voxel_data);
    gl.uniform1i(gl.getUniformLocation(program, "vol"), 0);
    set_volume_cube();
    render();
}

function set_transfer_texture(){
    var transfer_data = new Uint8Array(256 * 4);
    for (var i = 0; i < 256; i++) {
        transfer_data[i * 4] = transfer_function[i][0];
        transfer_data[i * 4 + 1] = transfer_function[i][1];
        transfer_data[i * 4 + 2] = transfer_function[i][2];
        transfer_data[i * 4 + 3] = transfer_function[i][3] * 255;
    }

    var transfer_texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_3D, transfer_texture);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_BASE_LEVEL, 0);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAX_LEVEL, 0);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA, 256, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(transfer_data));
    gl.generateMipmap(gl.TEXTURE_3D);
    gl.uniform1i(gl.getUniformLocation(program, "transfer_texture"), 1);
}

function set_uniform_matrix(){
    var eyeLoc = gl.getUniformLocation(program, "viewdir");
    gl.uniform3fv(eyeLoc, eye_);

    var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    var rotation_mat = rotate(45, vec3(0,1,0));
    var modelViewMatrix = lookAt(eye_, at_, up_);
    var temp = mult(modelViewMatrix, rotation_mat);
    temp = modelViewMatrix;

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(temp));

    var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(perspective_matrix));

    var typeLoc = gl.getUniformLocation(program, "type");
    gl.uniform1f(typeLoc, render_type);
}

function set_volume_cube(){
    // vertex
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cube_vertex), gl.STATIC_DRAW);

    var vPositionHandle = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPositionHandle, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPositionHandle);

    // index
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(cube_indicies), gl.STATIC_DRAW);
}

// Render function
function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

	// for 32bit index buffer
	var ext = gl.getExtension('OES_element_index_uint');
    set_transfer_texture();
    set_uniform_matrix();

    gl.drawElements(gl.TRIANGLES, cube_indicies.length, gl.UNSIGNED_INT, 0);

}

// ---------------------------------- Functions for virtual trackball ----------------------------------

var zoom = function (wh_event) {
    var dir = vec3(0.0, 0.0, 0.0);
    for (var i = 0; i < 3; i++)
        dir[i] = eye_[i] - at_[i];

    if (wh_event.deltaY < 0) {
        for (var i = 0; i < 3; i++)
            eye_[i] -= 0.05 * dir[i];
    } else {
        for (var i = 0; i < 3; i++)
            eye_[i] += 0.05 * dir[i];
    }
    render();
}

var mouse_down = function (evt) {
    mouse_moving = true;
    start_x = evt.pageX; start_y = evt.pageY;
    evt.preventDefault();
}

var mouse_move = function (evt) {
    if (!mouse_moving) {
        return;
    }

    // left mouse clicked (rotation)
    if (evt.which == 1) {
        var from_arc = arcproject(start_x, start_y);
        var end_arc = arcproject(evt.pageX, evt.pageY);
        var rot_axis = cross(from_arc, end_arc);
        console.log(rot_axis);
        rot_axis = normalize(rot_axis);


        var rot_angle = Math.asin(axis_length);
        var c = Math.cos(rot_angle);
        var s = Math.sin(rot_angle);
        var t = 1 - c;

        var rot_matrix = mat3(
            t * rot_axis[0] * rot_axis[0] + c, t * rot_axis[0] * rot_axis[1] - s * rot_axis[2], t * rot_axis[0] * rot_axis[2] + s * rot_axis[1],
            t * rot_axis[0] * rot_axis[1] + s * rot_axis[2], t * rot_axis[1] * rot_axis[1] + c, t * rot_axis[1] * rot_axis[2] - s * rot_axis[0],
            t * rot_axis[0] * rot_axis[2] - s * rot_axis[1], t * rot_axis[1] * rot_axis[2] + s * rot_axis[0], t * rot_axis[2] * rot_axis[2] + c
        );

        eye_ = mult(rot_matrix, eye_);
        eye_ = normalize(eye_);
        up_ = mult(rot_matrix, up_);
        up_ = normalize(up_);

        render();
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
        else if (evt.pageY < start_y) {
            for (var i = 0; i < 3; i++)
                eye_[i] += 0.005 * dir[i];
        }
        render();
    }
}

var mouse_up = function (evt) {
    mouse_moving = false;
}

function set_mip() {
    render_type = 1.0;
    render();
}

function set_alphaComp() {
    render_type = 2.0;
    render();
}
