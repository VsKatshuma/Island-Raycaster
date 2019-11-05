
var canvas = document.getElementById('world');
var g = canvas.getContext('2d');

var width = Math.min(window.innerWidth, window.innerHeight);
var height = Math.min(window.innerWidth, window.innerHeight);

canvas.width = width;
canvas.height = height;

var requestAnimationFrame = window.requestAnimationFrame ||
                            window.mozRequestAnimationFrame ||
                            window.msRequestAnimationFrame ||
                            window.oRequestAnimationFrame ||
                            window.webkitRequestAnimationFrame;

var terrain = [];
for (var landX = 0; landX < 100; landX++) {
    var column = [];
    for (var landY = 0; landY < 100; landY++) {
        var row = [];
        for (var landZ = 0; landZ < 100; landZ++) {
            if (landY > 50 && landX > 50 && landZ > 50) {
                row.push(0);
            } else if (landY == 50 && landX > 50 && landZ > 50) {
                row.push(2);
            } else if (landX == 50 && landY > 50 && landZ > 50) {
                row.push(3);
            } else if (landZ == 50 && landX > 50 && landY > 50) {
                row.push(4);
            } else {
                row.push(1);
            }
        }
        column.push(row);
    }
    terrain.push(column);
}

function access(x, y, z) {
    try {
        return terrain[x + 50][y + 50][z + 50];
    } catch {
        TypeError: return null;
    }
}

// Controls
var rotationActive = true;
var spin = 0; // Position of the camera, an angle between 0 and 2π
var speed = 0.01; // Speed of the camera
var screenDistance = 1000; // Distance of screen projection from the camera

var rDown = false;
var xDown = false;
var upDown = false;
var downDown = false;

document.onkeydown = function (event) {
    event = event || window.event;
    console.log(event.code);
    if (event.code === 'KeyR' && !rDown) {
        rDown = true;
        rotationActive = !rotationActive;
    }
    if (event.code === 'KeyX' && !xDown) {
        xDown = true;
        console.log(cameraDirection);
        console.log(cameraUp);
        console.log(cameraRight);
    }
    if (event.code === 'ArrowUp' && !upDown) {
        upDown = true;
    }
    if (event.code === 'ArrowDown' && !downDown) {
        downDown = true;
    }
};

document.onkeyup = function(event) {
    event = event || window.event;
    if (event.code === 'KeyR')
        rDown = false;
    if (event.code === 'KeyX')
        xDown = false;
    if (event.code === 'ArrowUp')
        upDown = false;
    if (event.code === 'ArrowDown')
        downDown = false;
};



// 32-bit pixel manipulation https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/

var pixels = g.createImageData(width, height); // TODO: Muuta kankaan kokoa, jos ikkunan koko muuttuu
var centerX = Math.ceil(width / 2); // TODO: Testaa, hajottaako pariton pituus ratkaisun
var centerY = Math.ceil(height / 2); // TODO: Testaa, hajottaako pariton pituus ratkaisun

// Create an empty background image

var voidArray = new ArrayBuffer(pixels.data.length);
var voidPixel = new Uint32Array(voidArray);
for (var coordinate = 0; coordinate < width * height; coordinate++)
    voidPixel[coordinate] = (255 << 24) | (73 << 16) | (29 << 8) | 0;

// Create info panel

var panel = g.createImageData(226, 110);
var panelBuffer = new ArrayBuffer(panel.data.length)
var panelArray = new Uint8ClampedArray(panelBuffer);
var panelPixel = new Uint32Array(panelBuffer);
for (var coordinate = 0; coordinate < 226 * 110; coordinate++)
    panelPixel[coordinate] = (255 << 24) | (50 << 16) | (50 << 8) | 50;
panel.data.set(panelArray);



    // From "A Fast Voxel Traversal Algorithm for Ray Tracing"
    // by John Amanatides and Andrew Woo, 1987
    // <http://www.cse.yorku.ca/~amana/research/grid.pdf>
    // <http://citeseer.ist.psu.edu/viewdoc/summary?doi=10.1.1.42.3443>
    // Extensions to the described algorithm:
    //   • Imposed a distance limit.
    //   • The face passed through to reach the current cube is provided to
    //     the callback.

    // The foundation of this algorithm is a parameterized representation of
    // the provided ray,
    //                    origin + t * direction,
    // except that t is not actually stored; rather, at any given point in the
    // traversal, we keep track of the *greater* t values which we would have
    // if we took a step sufficient to cross a cube boundary along that axis
    // (i.e. change the integer part of the coordinate) in the variables
    // tMaxX, tMaxY, and tMaxZ.

    // Cube containing origin point.
    //var x = Math.floor(origin[0]);
    //var y = Math.floor(origin[1]);
    //var z = Math.floor(origin[2]);
    // Break out direction vector.
    //var dx = direction[0];
    //var dy = direction[1];
    //var dz = direction[2];
    // Direction to increment x,y,z when stepping.
    //var stepX = signum(dx);
    //var stepY = signum(dy);
    //var stepZ = signum(dz);
    // See description above. The initial values depend on the fractional
    // part of the origin.
    //var tMaxX = intbound(origin[0], dx);
    //var tMaxY = intbound(origin[1], dy);
    //var tMaxZ = intbound(origin[2], dz);
    // The change in t when taking a step (always positive).
    //var tDeltaX = stepX/dx;
    //var tDeltaY = stepY/dy;
    //var tDeltaZ = stepZ/dz;
    // Buffer for reporting faces to the callback.
    //var face = vec3.create();

    // Avoids an infinite loop.
    //if (dx === 0 && dy === 0 && dz === 0)
        //throw new RangeError("Raycast in zero direction!");

    // Rescale from units of 1 cube-edge to units of 'direction' so we can
    // compare with 't'.
    //radius /= Math.sqrt(dx*dx+dy*dy+dz*dz);
/*
    while (// ray has not gone past bounds of world
         (stepX > 0 ? x < wx : x >= 0) &&
         (stepY > 0 ? y < wy : y >= 0) &&
         (stepZ > 0 ? z < wz : z >= 0)) {

    // Invoke the callback, unless we are not *yet* within the bounds of the
    // world.
    if (!(x < 0 || y < 0 || z < 0 || x >= wx || y >= wy || z >= wz))
      if (callback(x, y, z, blocks[x*wy*wz + y*wz + z], face))
        break;

    // tMaxX stores the t-value at which we cross a cube boundary along the
    // X axis, and similarly for Y and Z. Therefore, choosing the least tMax
    // chooses the closest cube boundary. Only the first case of the four
    // has been commented in detail.
    if (tMaxX < tMaxY) {
      if (tMaxX < tMaxZ) {
        if (tMaxX > radius) break;
        // Update which cube we are now in.
        x += stepX;
        // Adjust tMaxX to the next X-oriented boundary crossing.
        tMaxX += tX;
        // Record the normal vector of the cube face we entered.
        face[0] = -stepX;
        face[1] = 0;
        face[2] = 0;
      } else {
        if (tMaxZ > radius) break;
        z += stepZ;
        tMaxZ += tZ;
        face[0] = 0;
        face[1] = 0;
        face[2] = -stepZ;
      }
    } else {
      if (tMaxY < tMaxZ) {
        if (tMaxY > radius) break;
        y += stepY;
        tMaxY += tY;
        face[0] = 0;
        face[1] = -stepY;
        face[2] = 0;
      } else {
        // Identical to the second case, repeated for simplicity in
        // the conditionals.
        if (tMaxZ > radius) break;
        z += stepZ;
        tMaxZ += tZ;
        face[0] = 0;
        face[1] = 0;
        face[2] = -stepZ;
      }
    }
  }
*/


// Grid traversal http://www.cse.yorku.ca/~amana/research/grid.pdf

/*
The traversal algorithm breaks down the ray into intervals of t, each of which spans one voxel.
We start at the ray origin and visit each of these voxels in interval order.

The initialization phase begins by identifying the voxel in which the ray origin, → u, is found.

The integer variables X and Y are initialized to the starting voxel coordinates. In addition,
the variables stepX and stepY are initialized to either 1 or -1 indicating whether X and Y are incremented or
decremented as the ray crosses voxel boundaries (this is determined by the sign of the x and y components of → v).

Next, we determine the value of t at which the ray crosses the first vertical voxel boundary and
store it in variable tMaxX. We perform a similar computation in y and store the result in tMaxY. The
minimum of these two values will indicate how much we can travel along the ray and still remain in the
current voxel.

Finally, we compute tDeltaX and tDeltaY. TDeltaX indicates how far along the ray we must move
(in units of t) for the horizontal component of such a movement to equal the width of a voxel. Similarly,
we store in tDeltaY the amount of movement along the ray which has a vertical component equal to the
height of a voxel.

The incremental phase of the traversal algorithm is outlined below:
We loop until either we find a voxel with a non-empty object list or we fall out of the end of the grid.
*/

var cameraPosition = [0, 0, 0];
var cameraDirection = [0, 0, 1];
var cameraUp = [0, 1, 0];
var cameraRight = [1, 0, 0];

// KOMMENTOI TÄMÄ FUNKTIO, HERRAJUMALA
// KOMMENTOI TÄMÄ FUNKTIO, HERRAJUMALA
// KOMMENTOI TÄMÄ FUNKTIO, HERRAJUMALA
// KOMMENTOI TÄMÄ FUNKTIO, HERRAJUMALA
function raycaster() {
    var imageArray = voidArray.slice();
    var channel = new Uint8ClampedArray(imageArray);
    var pixel = new Uint32Array(imageArray);

    var pixelMultiplier = 4; // How many pixels^2 are covered by one ray.
    for (var y = 0; y < height; y = y + (1 * pixelMultiplier)) {
        for (var x = 0; x < width; x = x + (1 * pixelMultiplier)) {
            // Pikseliä vastaava kohta avaruudessa ruudun projektiossa
            var screenPixel = [
                ((cameraDirection[0] * screenDistance) - cameraPosition[0]) + ((x - centerX) * cameraRight[0]) + (-(y - centerY) * cameraUp[0]),
                ((cameraDirection[1] * screenDistance) - cameraPosition[1]) + ((x - centerX) * cameraRight[1]) + (-(y - centerY) * cameraUp[1]),
                ((cameraDirection[2] * screenDistance) - cameraPosition[2]) + ((x - centerX) * cameraRight[2]) + (-(y - centerY) * cameraUp[2])
            ];
            var rayDirection = [
                screenPixel[0] - cameraPosition[0],
                screenPixel[1] - cameraPosition[1],
                screenPixel[2] - cameraPosition[2]
            ];

            // Ray coefficients on the edges of [-50, 49] in all directions
            var tX1 = (-49.99 - cameraPosition[0]) / rayDirection[0];
            var tX2 = (49.99 - cameraPosition[0]) / rayDirection[0];
            var tY1 = (-49.99 - cameraPosition[1]) / rayDirection[1];
            var tY2 = (49.99 - cameraPosition[1]) / rayDirection[1];
            var tZ1 = (-49.99 - cameraPosition[2]) / rayDirection[2];
            var tZ2 = (49.99 - cameraPosition[2]) / rayDirection[2];

            //console.log("tX1: " + tX1); console.log("tX2: " + tX2);
            //console.log("tY1: " + tY1); console.log("tY2: " + tY2);
            //console.log("tZ1: " + tZ1); console.log("tZ2: " + tZ2);

            // Determine the direction the cube is approached from
            if (tX1 < tX2) {
                if (tY1 < tY2) {
                    if (tZ1 < tZ2) {
                        var t = Math.max(tX1, tY1, tZ1);
                        if (t <= Math.min(tX2, tY2, tZ2)) {
                            var hit = [t * rayDirection[0] + cameraPosition[0], t * rayDirection[1] + cameraPosition[1], t * rayDirection[2] + cameraPosition[2]];
                            voxelTraversal(pixel, pixelMultiplier, x, y, hit, rayDirection);
                        }
                    } else {
                        var t = Math.max(tX1, tY1, tZ2);
                        if (t <= Math.min(tX2, tY2, tZ1)) {
                            var hit = [t * rayDirection[0] + cameraPosition[0], t * rayDirection[1] + cameraPosition[1], t * rayDirection[2] + cameraPosition[2]];
                            voxelTraversal(pixel, pixelMultiplier, x, y, hit, rayDirection);
                        }
                    }
                } else {
                    if (tZ1 < tZ2) {
                        var t = Math.max(tX1, tY2, tZ1);
                        if (t <= Math.min(tX2, tY1, tZ2)) {
                            var hit = [t * rayDirection[0] + cameraPosition[0], t * rayDirection[1] + cameraPosition[1], t * rayDirection[2] + cameraPosition[2]];
                            voxelTraversal(pixel, pixelMultiplier, x, y, hit, rayDirection);
                        }
                    } else {
                        var t = Math.max(tX1, tY2, tZ2);
                        if (t <= Math.min(tX2, tY1, tZ1)) {
                            var hit = [t * rayDirection[0] + cameraPosition[0], t * rayDirection[1] + cameraPosition[1], t * rayDirection[2] + cameraPosition[2]];
                            voxelTraversal(pixel, pixelMultiplier, x, y, hit, rayDirection);
                        }
                    }
                }
            } else {
                if (tY1 < tY2) {
                    if (tZ1 < tZ2) {
                        var t = Math.max(tX2, tY1, tZ1);
                        if (t <= Math.min(tX1, tY2, tZ2)) {
                            var hit = [t * rayDirection[0] + cameraPosition[0], t * rayDirection[1] + cameraPosition[1], t * rayDirection[2] + cameraPosition[2]];
                            voxelTraversal(pixel, pixelMultiplier, x, y, hit, rayDirection);
                        }
                    } else {
                        var t = Math.max(tX2, tY1, tZ2);
                        if (t <= Math.min(tX1, tY2, tZ1)) {
                            var hit = [t * rayDirection[0] + cameraPosition[0], t * rayDirection[1] + cameraPosition[1], t * rayDirection[2] + cameraPosition[2]];
                            voxelTraversal(pixel, pixelMultiplier, x, y, hit, rayDirection);
                        }
                    }
                } else {
                    if (tZ1 < tZ2) {
                        var t = Math.max(tX2, tY2, tZ1);
                        if (t <= Math.min(tX1, tY1, tZ2)) {
                            var hit = [t * rayDirection[0] + cameraPosition[0], t * rayDirection[1] + cameraPosition[1], t * rayDirection[2] + cameraPosition[2]];
                            voxelTraversal(pixel, pixelMultiplier, x, y, hit, rayDirection);
                        }
                    } else {
                        var t = Math.max(tX2, tY2, tZ2);
                        if (t <= Math.min(tX1, tY1, tZ1)) {
                            var hit = [t * rayDirection[0] + cameraPosition[0], t * rayDirection[1] + cameraPosition[1], t * rayDirection[2] + cameraPosition[2]];
                            voxelTraversal(pixel, pixelMultiplier, x, y, hit, rayDirection);
                        }
                    }
                }
            }
        }
    }
    pixels.data.set(channel);
}

function voxelTraversal(pixelStream, pixelMultiplier, drawX, drawY, hit, rayDirection) {

    rayDirection = normalize(rayDirection);

    // inital voxel coordinates
    let voxelX = Math.floor(hit[0]);
    let voxelY = Math.floor(hit[1]);
    let voxelZ = Math.floor(hit[2]);

    if (access(voxelX, voxelY, voxelZ) == 1) {
        colorPixels(pixelStream, pixelMultiplier, drawX, drawY, 255, 73, 200, 0);
        return;
    }

    // voxel traversal direction
    let stepX = Math.sign(rayDirection[0]);
    let stepY = Math.sign(rayDirection[1]);
    let stepZ = Math.sign(rayDirection[2]);

    // Catch an infinite loop.
    if (stepX === 0 && stepY === 0 && stepZ === 0)
        throw new RangeError("Raycast in zero direction!");

    // where ray crosses the first voxel boundary
    let tMaxX = undefined;
    let tMaxY = undefined;
    let tMaxZ = undefined;

    if (stepX < 0) {
        tMaxX = (hit[0] - Math.floor(hit[0])) / Math.cos(rayDirection[0]);
    } else {
        tMaxX = (Math.ceil(hit[0]) - hit[0]) / Math.cos(rayDirection[0]);
    }
    if (stepY < 0) {
        tMaxY = (hit[1] - Math.floor(hit[1])) / Math.cos(rayDirection[1]);
    } else {
        tMaxY = (Math.ceil(hit[1]) - hit[1]) / Math.cos(rayDirection[1]);
    }
    if (stepZ < 0) {
        tMaxZ = (hit[2] - Math.floor(hit[2])) / Math.cos(rayDirection[2]);
    } else {
        tMaxZ = (Math.ceil(hit[2]) - hit[2]) / Math.cos(rayDirection[2]);
    }

    // How far we have to move in units of t to cross a voxel.
    let tDeltaX = 1 / Math.abs(rayDirection[0]);
    let tDeltaY = 1 / Math.abs(rayDirection[1]);
    let tDeltaZ = 1 / Math.abs(rayDirection[2]);

    let current = 0;

    // Voxel traversal
    do {
        if (tMaxX < tMaxY) {
            if (tMaxX < tMaxZ) {
                voxelX = voxelX + stepX;
                if (voxelX < -50 || voxelX > 49) { // Didn't hit anything
                    //console.log("Exiting in step 1 with " + hit + " and voxelX: " + voxelX);
                    return;
                }
                tMaxX = tMaxX + tDeltaX;
            } else {
                voxelZ = voxelZ + stepZ;
                if (voxelZ < -50 || voxelZ > 49) { // Didn't hit anything
                    //console.log("Exiting in step 2 with " + hit + " and voxelZ: " + voxelZ);
                    return;
                }
                tMaxZ = tMaxZ + tDeltaZ;
            }
        } else {
            if (tMaxY < tMaxZ) {
                voxelY = voxelY + stepY;
                if (voxelY < -50 || voxelY > 49) { // Didn't hit anything
                    //console.log("Exiting in step 3 with " + hit + " and voxelY: " + voxelY);
                    return;
                }
                tMaxY = tMaxY + tDeltaY;
            } else {
                voxelZ = voxelZ + stepZ;
                if (voxelZ < -50 || voxelZ > 49) { // Didn't hit anything
                    //console.log("Exiting in step 4 with " + hit + " and voxelZ: " + voxelZ);
                    return;
                }
                tMaxZ = tMaxZ + tDeltaZ;
            }
        }
        current = access(voxelX, voxelY, voxelZ);
    } while (current == 0);

    if (current == 1) {
        colorPixels(pixelStream, pixelMultiplier, drawX, drawY, 255, 73, 200, 0);
    } else if (current == 2) {
        colorPixels(pixelStream, pixelMultiplier, drawX, drawY, 255, 200, 73, 0);
    } else if (current == 3) {
        colorPixels(pixelStream, pixelMultiplier, drawX, drawY, 255, 73, 0, 200);
    } else if (current == 4) {
        colorPixels(pixelStream, pixelMultiplier, drawX, drawY, 255, 200, 0, 73);
    }
}

function colorPixels(pixelStream, pixelMultiplier, x, y, alpha, blue, green, red) {
    for (var j = 0; j < pixelMultiplier; j++) {
        for (var i = 0; i < pixelMultiplier; i++) {
            pixelStream[(y + j) * width + (x + i)] =
                (alpha << 24) | // alpha
                (blue << 16) | // blue
                (green << 8) | // green
                 red;		// red
        }
    }
}

function lookAt(position, target) { // Returns a unit vector pointing from position to target
    let x = target[0] - position[0];
    let y = target[1] - position[1];
    let z = target[2] - position[2];
    return normalize([x, y, z]);
}

function normalize(vector) { // Reduces a vector into a unit vector
    let magnitude = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1] + vector[2] * vector[2]);

    if (magnitude != 0) {
        return [vector[0] / magnitude, vector[1] / magnitude, vector[2] / magnitude];
    } else {
        console.log("encountered a zero vector.");
        return [vector[0], vector[1], vector[2]];
    }
}

function rotateAroundYAxis(vector) {
    return [
        (vector[0] * Math.cos(ninety)) + (vector[2] * Math.sin(ninety)),
        vector[1],
        (-vector[0] * Math.sin(ninety)) + (vector[2] * Math.cos(ninety))
    ];
}

function crossProduct(vector, up) {
    return [
        vector[1] * up[2] - vector[2] * up[1],
        vector[2] * up[0] - vector[0] * up[2],
        vector[0] * up[1] - vector[1] * up[0]
    ];
}

function rotateUp(camDir, ax) { // https://www.youtube.com/watch?v=q-ESzg03mQc
    var cross = crossProduct(camDir, ax);

    var temp3 = -Math.cos(ninety);
    var temp4 = -Math.sin(ninety);

    var temp5 = [temp3 * camDir[0], temp3 * camDir[1], temp3 * camDir[2]];
    var temp6 = [temp4 * cross[0], temp4 * cross[1], temp4 * cross[2]];

    return [temp5[0] + temp6[0], temp5[1] + temp6[1], temp5[2] + temp6[2]];
}

var previousSecond = Math.floor(Date.now() / 1000);
var framesPerSecond = "0";
var frames = 0;

var previousFrame = Date.now();
var twoPI = Math.PI * 2;
var ninety = Math.PI / 2;

function processFrame() {

    var currentSecond = Math.floor(Date.now() / 1000);
    var currentFrame = Date.now();

    if (currentSecond > previousSecond) {
        previousSecond = currentSecond;
        framesPerSecond = frames.toString();
        frames = 1;
    } else {
        frames += 1;
    }

    if (upDown)
        screenDistance -= 20;
    if (downDown)
        screenDistance += 20;

    if (rotationActive) {
        spin = (spin + speed) % twoPI;
        //rotation = (rotation + (currentFrame - previousFrame) * spin) % twoPI;
        cameraPosition = [
            300 * Math.cos(spin),
            200,
            300 * Math.sin(spin)
        ];
        cameraDirection = lookAt(cameraPosition, [0, 0, 0]);
        var axis = normalize(rotateAroundYAxis([cameraPosition[0], 0, cameraPosition[2]])); // Tangent to the camera path
        cameraUp = rotateUp(cameraDirection, axis);
        cameraRight = crossProduct(cameraDirection, cameraUp);
        raycaster();
        g.putImageData(pixels, 0, 0);
    }
    g.putImageData(panel, 0, 0);
    previousFrame = currentFrame;

    g.fillStyle = '#00FF00';
    g.font = '12px Courier New';
    g.fillText("Island Raycaster © VsKatshuma", 8, 20);
    g.fillText(framesPerSecond + " fps", 8, 40);
    g.fillText("R - stop/resume simulation", 8, 60);
    g.fillText("Up - Zoom out", 8, 80);
    g.fillText("Down - Zoom in", 8, 100);

    requestAnimationFrame(processFrame);
}

console.log("Window size: " + width + " x " + height);

processFrame();
