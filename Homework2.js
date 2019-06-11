"use strict";

var canvas;
var gl;
var program;

var projectionMatrix;
var modelViewMatrix;
var instanceMatrix;
var modelViewMatrixLoc;

var Yangle = 0; // rotation of camera around y-axis
var Zangle = 0.001; // rotation of camera around z-axis
var Xangle = 0;

// used for modelview matrx
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var incremento_left = 0.5; // value used for left side arm - leg movement
var incremento_right = -0.5; // value used for right side arm - leg movement

var step = -20; // step forward during movement
var run_rate = 2; // rate of movement of legs during run state

var show_obstacle = true; // used to hide and show obstacles via button
var avviaAnimazione = false; // boolean to start animation
var camera_rotation = true; // boolean to rotate or not camera aroud target

var vertices = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0)
];

var colorsArray = [];
var vertexColors = [
    vec4(0.6, 0.32, 0.17, 1),  // dark brown

    // not used colors
    vec4(0.0, 0.0, 0.0, 1.0),  // black
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(0.0, 1.0, 1.0, 1.0),  // white
    vec4(0.0, 1.0, 1.0, 1.0)   // cyan
];

var torsoId = 0;
var headId = 1;
var head1Id = 1;

var leftUpperArmId = 2;
var leftLowerArmId = 3;
var rightUpperArmId = 4;
var rightLowerArmId = 5;

var leftUpperLegId = 6;
var leftLowerLegId = 7;
var rightUpperLegId = 8;
var rightLowerLegId = 9;

var head2Id = 10;

// new 
var idTail = 11;

/////////////////////////////

var torsoHeight = 7.5;
var torsoWidth = 3.0;

var upperArmHeight = 3.5;
var upperArmWidth = 1.0;

var lowerArmHeight = 3.5;
var lowerArmWidth = 0.7;

var lowerLegHeight = 3.5;
var upperLegWidth = 1.0;

var upperLegHeight = 3.5;
var lowerLegWidth = 0.7;

var headHeight = 3.5;
var headWidth = 2.0;
//new
var tailHeight = 3.0;
var tailWidth = 0.8;

var totalNodes = 23; // new 10->23

var tailAngle = -58;
var jump_angle = 0; // angle of torso during jump
var jumpHeight = 0; // how much the horse jump over z-axis

var theta = [-90, 25,                        // torso , head1
    90, 0, 90, 0,                 // left arm (up - low) , right arm (up - low)
    90, -10, 90, -10,                // left leg (up - low) , right leg (up - low)
    0,                              // head2
    tailAngle,
    0, 0, 0, 0,                    // obstacle Base, circle, upright, upleft
    90, 90,                         // obstacle rod right left
    18, -18                            // obstacle oblique 1, 2
];



////////////////////  data for obstacles  /////////
var distance_from_target = 30;

var obstacle_Base_ID = 12;

var obstacle_Base_Height = 17.5;
var obstacle_Base_Width = 3;

var obstacle_Circle_ID = 13;
var obstacle_Circle2_ID = 22;

var obstacle_Circle_Height = 5;
var obstacle_Circle_Width = 2;

var obstacle_UpRight_ID = 14;

var obstacle_UpRight_Height = 1.5;
var obstacle_UpRight_Width = 1.3;

var obstacle_UpLeft_ID = 15;

var obstacle_UpLeft_Height = 1.5;
var obstacle_UpLeft_Width = 1.3;

var obstacle_rod_left_ID = 16;

var obstacle_rod_left_Height = lowerArmHeight + upperArmHeight + torsoHeight + headHeight;
var obstacle_rod_left_Width = 1;

var obstacle_rod_right_ID = 17;

var obstacle_rod_right_Height = lowerArmHeight + upperArmHeight + torsoHeight + headHeight;
var obstacle_rod_right_Width = 1;

var obstacle_rod_oblique1_ID = 18;

var obstacle_rod_oblique1_Height = lowerArmHeight + upperArmHeight + torsoHeight + headHeight + 3;
var obstacle_rod_oblique1_Width = 0.81;

var obstacle_rod_oblique2_ID = 19;

var obstacle_rod_oblique2_Height = lowerArmHeight + upperArmHeight + torsoHeight + headHeight + 3;
var obstacle_rod_oblique2_Width = 0.81;

var obstacle_rod_left2_ID = 20;

var obstacle_rod_left_Height = lowerArmHeight + upperArmHeight + torsoHeight + headHeight;
var obstacle_rod_left_Width = 1;

var obstacle_rod_right2_ID = 21;

var obstacle_rod_right_Height = lowerArmHeight + upperArmHeight + torsoHeight + headHeight;
var obstacle_rod_right_Width = 1;

var ground_quote = 5.5; // used in obstacles draw function

////////////////////////////////////////////////////

var numVertices = 24;
var stack = [];
var figure = [];

for (var i = 0; i < totalNodes; i++) figure[i] = createNode(null, null, null, null);

var vBuffer;
var modelViewLoc;
var pointsArray = [];

// camera controls
var visionAngle = 90;
var orthozoom = 3.5; // used for ortho matrix


//-------------------------------------------

function scale4(a, b, c) {
    var result = mat4();
    result[0][0] = a;
    result[1][1] = b;
    result[2][2] = c;
    return result;
}

//--------------------------------------------

// creates an empty structure : left child - right sibling
function createNode(transform, render, sibling, child) {
    var node = {
        transform: transform,
        render: render,
        sibling: sibling,
        child: child,
    }
    return node;
}

function initializeNode(Id) {

    var mat = mat4();

    switch (Id) {

        case torsoId:

            mat = translate(step, 0.0, jumpHeight);
            mat = mult(mat, rotate(theta[torsoId], 0, 0, 1));
            mat = mult(mat, rotate(jump_angle, 1, 0, 0));
            figure[torsoId] = createNode(mat, torso, null, headId);
            break;

        case headId:
        case head1Id:
        case head2Id:
            mat = translate(0, 1.1 * torsoHeight + 0.5 * headHeight, -torsoWidth * 1.30);
            mat = mult(mat, rotate(theta[head1Id], 1, 0, 0))
            mat = mult(mat, rotate(theta[head2Id], 0, 1, 0));
            mat = mult(mat, translate(0, -0.5 * headHeight, 0.0));
            figure[headId] = createNode(mat, head, leftUpperArmId, null);
            break;

        case leftUpperArmId:

            mat = translate(-(0.7 * torsoWidth), 0.9 * torsoHeight, 0.0);
            mat = mult(mat, rotate(theta[leftUpperArmId], 1, 0, 0));
            figure[leftUpperArmId] = createNode(mat, leftUpperArm, rightUpperArmId, leftLowerArmId);
            break;

        case rightUpperArmId:

            mat = translate(0.7 * torsoWidth, 0.9 * torsoHeight, 0.0);
            mat = mult(mat, rotate(theta[rightUpperArmId], 1, 0, 0));
            figure[rightUpperArmId] = createNode(mat, rightUpperArm, leftUpperLegId, rightLowerArmId);
            break;

        case leftUpperLegId:

            mat = translate(-(0.7 * torsoWidth), 0.1 * upperLegHeight, 0.0);
            mat = mult(mat, rotate(theta[leftUpperLegId], 1, 0, 0));
            figure[leftUpperLegId] = createNode(mat, leftUpperLeg, rightUpperLegId, leftLowerLegId);
            break;

        case rightUpperLegId:

            mat = translate(0.7 * torsoWidth, 0.1 * upperLegHeight, 0.0);
            mat = mult(mat, rotate(theta[rightUpperLegId], 1, 0, 0));
            figure[rightUpperLegId] = createNode(mat, rightUpperLeg, idTail, rightLowerLegId);
            break;

        case idTail:

            mat = translate(0, - 0.3 * torsoHeight, 1.5);
            mat = mult(mat, rotate(tailAngle, 1, 0, 0));
            figure[idTail] = createNode(mat, tailf, null, null);
            break;

        case leftLowerArmId:

            mat = translate(0.0, upperArmHeight, 0.0);
            mat = mult(mat, rotate(theta[leftLowerArmId], 1, 0, 0));
            figure[leftLowerArmId] = createNode(mat, leftLowerArm, null, null);
            break;

        case rightLowerArmId:

            mat = translate(0.0, upperArmHeight, 0.0);
            mat = mult(mat, rotate(theta[rightLowerArmId], 1, 0, 0));
            figure[rightLowerArmId] = createNode(mat, rightLowerArm, null, null);
            break;

        case leftLowerLegId:

            mat = translate(0.0, upperLegHeight, 0.0);
            mat = mult(mat, rotate(theta[leftLowerLegId], 1, 0, 0));
            figure[leftLowerLegId] = createNode(mat, leftLowerLeg, null, null);
            break;

        case rightLowerLegId:

            mat = translate(0.0, upperLegHeight, 0.0);
            mat = mult(mat, rotate(theta[rightLowerLegId], 1, 0, 0));
            figure[rightLowerLegId] = createNode(mat, rightLowerLeg, null, null);
            break;

        ///////////////////////////////////////////////////////////////////////////
        /////////////////////////////////// new ///////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////

        case obstacle_Base_ID:

            mat = translate(distance_from_target, -9, ground_quote);
            mat = mult(mat, rotate(theta[(obstacle_Base_ID)], 0, 0, 1));
            figure[obstacle_Base_ID] = createNode(mat, obstacle_Base, null, obstacle_Circle_ID);
            break;

        case obstacle_Circle_ID:

            mat = translate(0, 6.2, -(obstacle_Base_Width) + 0.1);
            mat = mult(mat, rotate(theta[obstacle_Circle_ID], 1, 0, 0));
            figure[obstacle_Circle_ID] = createNode(mat, obstacle_Circle, obstacle_UpRight_ID, null);
            break;

        case obstacle_UpRight_ID:

            mat = translate(0, 4.5, -(obstacle_Base_Width) + 0.55);
            mat = mult(mat, rotate(theta[obstacle_UpRight_ID], 1, 0, 0));
            figure[obstacle_UpRight_ID] = createNode(mat, obstacle_UpRight, obstacle_UpLeft_ID, null);
            break;

        case obstacle_UpLeft_ID:

            mat = translate(0, 11.4, -(obstacle_Base_Width) + 0.55);
            mat = mult(mat, rotate(theta[obstacle_UpLeft_ID], 1, 0, 0));
            figure[obstacle_UpLeft_ID] = createNode(mat, obstacle_UpLeft, obstacle_rod_left_ID, null);
            break;

        case obstacle_rod_left_ID:

            mat = translate(0, 18.5, -(obstacle_rod_right_Height) + 1.5);
            mat = mult(mat, rotate(theta[obstacle_rod_left_ID], 1, 0, 0));

            figure[obstacle_rod_left_ID] = createNode(mat, obstacle_rod_left, obstacle_rod_right_ID, null);
            break;

        case obstacle_rod_right_ID:

            mat = translate(0, -1, -(obstacle_rod_right_Height) + 1.5);
            mat = mult(mat, rotate(theta[obstacle_rod_right_ID], 1, 0, 0));
            figure[obstacle_rod_right_ID] = createNode(mat, obstacle_rod_right, obstacle_rod_oblique1_ID, null);
            break;

        case obstacle_rod_oblique1_ID:
            // type: \
            mat = translate(0, -1, -10.5);
            mat = mult(mat, rotate(theta[obstacle_rod_oblique1_ID], 1, 0, 0));
            figure[obstacle_rod_oblique1_ID] = createNode(mat, obstacle_rod_oblique1, obstacle_rod_oblique2_ID, null);
            break;

        case obstacle_rod_oblique2_ID:
            // type: /
            mat = translate(0, -1, -(obstacle_Base_Width) - 1.3);
            mat = mult(mat, rotate(theta[obstacle_rod_oblique2_ID], 1, 0, 0));
            figure[obstacle_rod_oblique2_ID] = createNode(mat, obstacle_rod_oblique2, obstacle_rod_left2_ID, null);
            break;

        case obstacle_rod_left2_ID:

            mat = translate(0, 19.5 + obstacle_rod_left_Width * 1.3, -(obstacle_rod_right_Height) + 1.5);
            mat = mult(mat, rotate(theta[obstacle_rod_left_ID], 1, 0, 0));

            figure[obstacle_rod_left2_ID] = createNode(mat, obstacle_rod_left, obstacle_rod_right2_ID, null);
            break;

        case obstacle_rod_right2_ID:

            mat = translate(0, -2 - obstacle_rod_left_Width * 1.3, -(obstacle_rod_right_Height) + 1.5);
            mat = mult(mat, rotate(theta[obstacle_rod_right_ID], 1, 0, 0));
            figure[obstacle_rod_right2_ID] = createNode(mat, obstacle_rod_right, obstacle_Circle2_ID, null);
            break;

        case obstacle_Circle2_ID:

            mat = translate(0, 8, -4.5);
            mat = mult(mat, rotate(theta[obstacle_UpRight_ID], 1, 0, 0));
            figure[obstacle_Circle2_ID] = createNode(mat, obstacle_UpRight, null, null);
            break;

    }

}

function traverse(Id) {

    if (Id == null) return;
    stack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
    figure[Id].render();
    if (figure[Id].child != null) traverse(figure[Id].child);
    modelViewMatrix = stack.pop();
    if (figure[Id].sibling != null) traverse(figure[Id].sibling);
}

function torso() {

    configTexture(field)

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * torsoHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(torsoWidth, torsoHeight, torsoWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);

    gl.deleteTexture(checkboard)
}

function head() {

    instanceMatrix = mult(modelViewMatrix, translate(0, 0.5 * headHeight, 0));
    instanceMatrix = mult(instanceMatrix, scale4(headWidth, headHeight, headWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function tailf() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * tailHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(tailWidth, tailHeight, tailWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function leftUpperArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(upperArmWidth, upperArmHeight, upperArmWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function leftLowerArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(lowerArmWidth, lowerArmHeight, lowerArmWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function rightUpperArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(upperArmWidth, upperArmHeight, upperArmWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function rightLowerArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(lowerArmWidth, lowerArmHeight, lowerArmWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function leftUpperLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(upperLegWidth, upperLegHeight, upperLegWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function leftLowerLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(lowerLegWidth, lowerLegHeight, lowerLegWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function rightUpperLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(upperLegWidth, upperLegHeight, upperLegWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function rightLowerLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(lowerLegWidth, lowerLegHeight, lowerLegWidth))
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

///////////////////// obstacles //////////////////////

function obstacle_Base() {

    configTexture(checkboard)

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * obstacle_Base_Height, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(obstacle_Base_Width, obstacle_Base_Height, obstacle_Base_Width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function obstacle_Circle() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * obstacle_Circle_Height, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(obstacle_Circle_Width, obstacle_Circle_Height, obstacle_Circle_Width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function obstacle_Circle2() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * obstacle_UpLeft_Height, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(obstacle_UpLeft_Width, obstacle_UpLeft_Height, obstacle_UpLeft_Width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function obstacle_UpLeft() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * obstacle_UpLeft_Height, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(obstacle_UpLeft_Width, obstacle_UpLeft_Height, obstacle_UpLeft_Width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function obstacle_UpRight() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * obstacle_UpRight_Height, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(obstacle_UpRight_Width, obstacle_UpRight_Height, obstacle_UpRight_Width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function obstacle_rod_left() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * obstacle_rod_left_Height, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(obstacle_rod_left_Width, obstacle_rod_left_Height, obstacle_rod_left_Width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);

}

function obstacle_rod_right() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * obstacle_rod_right_Height, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(obstacle_rod_right_Width, obstacle_rod_right_Height, obstacle_rod_right_Width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function obstacle_rod_oblique1() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * obstacle_rod_oblique1_Height, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(obstacle_rod_oblique1_Width, obstacle_rod_oblique1_Height, obstacle_rod_oblique1_Width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function obstacle_rod_oblique2() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * obstacle_rod_oblique2_Height, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(obstacle_rod_oblique2_Width, obstacle_rod_oblique2_Height, obstacle_rod_oblique2_Width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function obstacle_rod_left2() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * obstacle_rod_left_Height, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(obstacle_rod_left_Width, obstacle_rod_left_Height, obstacle_rod_left_Width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);

}

function obstacle_rod_right2() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * obstacle_rod_right_Height, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(obstacle_rod_right_Width, obstacle_rod_right_Height, obstacle_rod_right_Width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

////////////////////////////////////////////////////////////


function cube() {

    quad(6, 2, 1, 5); // frontale

    quad(5, 4, 7, 6); // torso superiore
    quad(5, 4, 0, 1); // fianco destro
    quad(1, 0, 3, 2); // pancia sotto
    quad(2, 3, 7, 6); // fianco sinistro

    ass(3, 7, 4, 0); // sedere

}

function quad(a, b, c, d) {
    pointsArray.push(vertices[a]);
    colorsArray.push(vertexColors[0]);
    texCoordsArray.push(coordinateTexture[0]); // new

    pointsArray.push(vertices[b]);
    colorsArray.push(vertexColors[0]);
    texCoordsArray.push(coordinateTexture[1]);

    pointsArray.push(vertices[c]);
    colorsArray.push(vertexColors[0]);
    texCoordsArray.push(coordinateTexture[2]);

    pointsArray.push(vertices[d]);
    colorsArray.push(vertexColors[0]);
    texCoordsArray.push(coordinateTexture[3]);
}

// function to get black ass (colorsArray.push(vertexColors[1] = black);
function ass(a, b, c, d) {

    pointsArray.push(vertices[a]);
    colorsArray.push(vertexColors[1]);
    texCoordsArray.push(coordinateTexture[0]); // new

    pointsArray.push(vertices[b]);
    colorsArray.push(vertexColors[1]);
    texCoordsArray.push(coordinateTexture[1]);

    pointsArray.push(vertices[c]);
    colorsArray.push(vertexColors[1]);
    texCoordsArray.push(coordinateTexture[2]);

    pointsArray.push(vertices[d]);
    colorsArray.push(vertexColors[1]);
    texCoordsArray.push(coordinateTexture[3]);

}


// --------------- TEXTURES from TexturedCube4 ---------------

var texCoordsArray = [];
var texDim = 256;
var nquadric = 8;
var field, checkboard;
var set;

var coordinateTexture = [
    vec2(0, 0),
    vec2(1, 0),
    vec2(1, 1),
    vec2(0, 1)
];

var layer1 = new Uint8Array(4 * texDim * texDim);
for (var i = 0; i < texDim; i++) {
    for (var j = 0; j < texDim; j++) {
        var patchx = Math.floor(i / (texDim / nquadric));
        var patchy = Math.floor(j / (texDim / nquadric));
        if (patchx % 2 ^ patchy % 2) set = 255;
        else set = 0;
        layer1[4 * i * texDim + 4 * j] = set;
        layer1[4 * i * texDim + 4 * j + 1] = set;
        layer1[4 * i * texDim + 4 * j + 2] = set;
        layer1[4 * i * texDim + 4 * j + 3] = 255;
    }
}

var layer2 = new Uint8Array(4 * texDim * texDim);
// scacchiera
for (var i = 0; i < texDim; i++) {
    for (var j = 0; j < texDim; j++) {

        set = 255 - j; // linear decrease of intensity

        layer2[4 * i * texDim + 4 * j] = set;
        layer2[4 * i * texDim + 4 * j + 1] = set;
        layer2[4 * i * texDim + 4 * j + 2] = set;
        layer2[4 * i * texDim + 4 * j + 3] = 255;
    }
}

function configTexture() {
    field = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, field);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texDim, texDim, 0, gl.RGBA, gl.UNSIGNED_BYTE, layer1);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    checkboard = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, checkboard);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texDim, texDim, 0, gl.RGBA, gl.UNSIGNED_BYTE, layer2);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

}


// -----------------------------------------------------------

window.onload = function init() {

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(70, -90, canvas.width, canvas.height);

    gl.clearColor(1, 1, 1, 1);

    // added to hide hidden surfaces
    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    instanceMatrix = mat4();

    projectionMatrix = (ortho(-10.0 * orthozoom, 10.0 * orthozoom, -10.0 * orthozoom, 10.0 * orthozoom, -180.0, 180.0));

    projectionMatrix = mult(projectionMatrix, rotateY(60));
    projectionMatrix = mult(projectionMatrix, rotateX(40));
    projectionMatrix = mult(projectionMatrix, rotateZ(5));


    modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, rotateX(25));
    modelViewMatrix = mult(modelViewMatrix, rotateY(60));


    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

    cube();

    // new
    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    ///////////////////// textures /////////////////////////////

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    configTexture();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, field);
    gl.uniform1i(gl.getUniformLocation(program, "Tex0"), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, checkboard);
    gl.uniform1i(gl.getUniformLocation(program, "Tex1"), 1);

    ////////////////////////////////////////////////////////

    document.getElementById("CameraY").onchange = function (event) {
        Yangle = event.target.value;
        initializeNode(torsoId);
    };

    document.getElementById("CameraZ").onchange = function (event) {
        Zangle = event.target.value;
        initializeNode(torsoId);
    };

    document.getElementById("CameraX").onchange = function (event) {
        Xangle = event.target.value;
        initializeNode(torsoId);
    };

    document.getElementById("obstacle").onclick = function (event) {
        show_obstacle = !show_obstacle;
        if (!show_obstacle) {
            document.getElementById('obstacle').innerHTML = "Click to show obstacle";
        } else {
            document.getElementById('obstacle').innerHTML = "Click to hide obstacle";
        }
    };

    document.getElementById("stop_rotation").onclick = function (event) {
        camera_rotation = !camera_rotation;
    }

    document.getElementById("saltaostacolo").onclick = function (event) {
        avviaAnimazione = !avviaAnimazione;
    }

    document.getElementById("refresh").onclick = function (event) {
        location.reload(); 
    }

    ////////////////////////////////////////////////////////

    for (i = 0; i < totalNodes; i++) initializeNode(i);
    render();
}
var render = function () {

    gl.clear(gl.COLOR_BUFFER_BIT);

    var theta = 200.0;
    var phi = 160.0;

    eye = vec3(Math.sin(phi), Math.sin(theta), Math.cos(phi));
    modelViewMatrix = lookAt(eye, at, up);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));


    if (camera_rotation) {
        //camera POV rotation   
        projectionMatrix = mult(projectionMatrix, rotateY(Yangle));
        projectionMatrix = mult(projectionMatrix, rotateZ(Zangle));
        projectionMatrix = mult(projectionMatrix, rotateX(Xangle));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));
    }

    // animation
    if (avviaAnimazione) {

        LegArmMovement();
        step += 0.35;
        camera_rotation = true;
        Zangle = 0.02; Xangle = 0.02; Yangle = 0.02;


        // start jump
        if (step >= 10 && step <= 45) {
            // equazione parabola della traiettoria
            step += 0.4;
            jumpHeight = (0.03265 * step * step) + (-1.7959 * step) + 14.694;
            jumpPosition();
        }

        // stop animation
        if (step >= 50) {
            finalPosition();
            avviaAnimazione = false;
            

        }
    }

    for (i = 0; i < totalNodes; i++) initializeNode(i);

    // new 
    traverse(torsoId);
    if (show_obstacle)
        traverse(obstacle_Base_ID);

    requestAnimFrame(render);
}

function LegArmMovement() {

    // LEFT SIDE - LEG

    // reach upperbound
    if (theta[leftUpperLegId] > 120)
        incremento_left = -run_rate;
    // reach lowerbound
    if (theta[leftUpperLegId] < 60)
        incremento_left = +run_rate;

    theta[leftUpperLegId] += incremento_left;

    // LEFT SIDE - ARM 

    // reach upperbound
    if (theta[leftUpperArmId] > 120)
        incremento_left = -run_rate;
    // reach lowerbound
    if (theta[leftUpperArmId] < 60)
        incremento_left = +run_rate;

    theta[leftUpperArmId] += incremento_left;
    theta[leftLowerArmId] += incremento_left / 4;

    // RIGHT SIDE - LEG 

    // reach upperbound
    if (theta[rightUpperLegId] > 120)
        incremento_right = -run_rate;
    // reach lowerbound
    if (theta[rightUpperLegId] < 60)
        incremento_right = +run_rate;

    theta[rightUpperLegId] += incremento_right;

    // RIGHT SIDE - ARM 

    // reach upperbound
    if (theta[rightUpperArmId] > 120)
        incremento_right = -run_rate;
    // reach lowerbound
    if (theta[rightUpperArmId] < 60)
        incremento_right = +run_rate;

    theta[rightUpperArmId] += incremento_right;
    theta[rightLowerArmId] += incremento_right / 4;

    for (i = 0; i < totalNodes; i++) initializeNode(i);

    return
}

function jumpPosition() {
    // legs and arms are locked straight

    theta[leftUpperArmId] = 30;
    theta[leftLowerArmId] = 0;

    theta[rightUpperArmId] = 30;
    theta[rightLowerArmId] = 0;

    ///////////////////////

    theta[leftUpperLegId] = 160;
    theta[rightUpperLegId] = 160;

    ///////////////////////

    theta[head1Id] = 10;


    for (i = 0; i < totalNodes; i++) initializeNode(i);

    return

}

function finalPosition() {

    theta[leftUpperArmId] = 90;
    theta[leftLowerArmId] = 0;

    theta[rightUpperArmId] = 90;
    theta[rightLowerArmId] = 0;

    ///////////////////////

    theta[leftUpperLegId] = 90;
    theta[rightUpperLegId] = 90;

    ///////////////////////

    theta[head1Id] = 45;
    //////////////////////

    for (i = 0; i < totalNodes; i++) initializeNode(i);

    return

}
