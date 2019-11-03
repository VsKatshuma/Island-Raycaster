
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
            if (Date.now() % 3) {
                row.push(1);
            } else {
                row.push(0);
            }
        }
        column.push(row);
    }
    terrain.push(column);
}

// Controls
var rotationActive = true;
var spin = 0; // position of the camera, an angle between 0 and 2π
var speed = 0.01; // how much the angle rotates every frame
var screenDistance = 1000; // how far away the screen projection is from the position of the camera

var rDown = false;
var xDown = false;
//var upDown = false;
//var downDown = false;

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
    if (event.code === 'ArrowUp'/* && !upDown*/) {
//        upDown = true;
        screenDistance += 10;
    }
    if (event.code === 'ArrowDown'/* && !downDown*/) {
//        downDown = true;
        screenDistance -= 10;
    }
};

document.onkeyup = function(event) {
    event = event || window.event;
    if (event.code === 'KeyR')
        rDown = false;
    if (event.code === 'KeyX')
        xDown = false;
//    if (event.code === 'ArrowUp')
//        upDown = false;
//    if (event.code === 'ArrowDown')
//        downDown = false;
};

function access(x, y, z) {
    try {
        return terrain[x][y][z];
    } catch {
        TypeError: return null;
    }
}

//abstraktiot
//meillä on piste, ruutu, suunnat mihin raycast menee
    //Tuo selitys siitä, mistä tämä on otettu takaisin tämän eteen
var pixels = g.createImageData(width, height); // TODO: Muuta, jos kuvan suuruus muuttuu lennossa
var centerX = Math.ceil(width / 2); // TODO: Muuta, jos kuvan suuruun muuttuu lennossa
var centerY = Math.ceil(height / 2); // TODO: You know

function raycast() {
    var imageArray = new ArrayBuffer(pixels.data.length);
    var channel = new Uint8ClampedArray(imageArray);
    var pixel = new Uint32Array(imageArray);

    //origin, direction, radius, callback

    var originX = 150;
    var originY = 150;
    var originZ = -50;

    // TODO: Calculate based on current rotation or screen placement.

    var directionX = -Math.cos(rotation);
    var directionY = -Math.cos(angle);
    var directionZ = Math.cos(rotation);

    var leftVectorX = directionX;
    var leftVectorY = (directionY * Math.cos(Math.PI)) - (directionZ * Math.sin(Math.PI));
    var leftVectorZ = (directionY * Math.sin(Math.PI)) + (directionZ * Math.cos(Math.PI));

    var upVectorX = directionX;
    var upVectorY = (directionY * Math.cos(ninety)) - (directionZ * Math.sin(ninety));
    var upVectorZ = (directionY * Math.sin(ninety)) + (directionZ * Math.cos(ninety));

    //var screenCenterX = directionX * distanceFromOrigin;
    //var screenCenterY = directionY * distanceFromOrigin;
    //var screenCenterZ = directionZ * distanceFromOrigin;

    for (var x = 0; x < width; x++) {
        for (var y = 0; y < height; y++) {

            // CALCULATE DIRECTION (?) :)
            var currentX = Math.round(originX + (leftVectorX * (x - centerX)) + (upVectorX * (y - centerY)));
            var currentY = Math.round(originY + (leftVectorY * (x - centerX)) + (upVectorY * (y - centerY)));
            var currentZ = Math.round(originZ + (leftVectorZ * (x - centerX)) + (upVectorZ * (y - centerY)));

            var stepX = 0;
            var stepY = 0;
            var stepZ = 0;
            if (directionX > 0) { stepX = 1; } else if (directionX < 0) { stepX = -1; }
            if (directionY > 0) { stepY = 1; } else if (directionY < 0) { stepY = -1; }
            if (directionZ > 0) { stepZ = 1; } else if (directionZ < 0) { stepZ = -1; }

            // Catch an infinite loop.
            if (stepX === 0 && stepY === 0 && stepZ === 0)
                throw new RangeError("Raycast in zero direction!");

            // How far we have to move in units of t to cross a voxel.
            var tX = 1 / Math.abs(directionX);
            var tY = 1 / Math.abs(directionY);
            var tZ = 1 / Math.abs(directionZ);


/*
// Bring the ray to the starting edge of the world.

var offset = x;
var offsetY = y;

var centerX = center + offset * directionY;
var centerY = center + offset * -directionX;

// Ray origin, which will be updated to start from the edge of the grid
var originX = centerX;
var originY = centerY;

var pointX = originX + directionX;
var pointY = originY + directionY;
var pointZ = originZ + directionZ;

var slope = (originY - pointY) / (originX - pointX);
var checkX = 0;
var checkY = 0;

if (directionX > 0) { // Crossaa x 0
    checkY = slope * -originX + originY;
} else if (directionX < 0) { // Crossaa x 700
    checkY = slope * (terrain.length - originX) + originY;
} else {
    console.log("Mitä tehdään?");
}
if (directionY > 0) { // Crossaa y 0
    checkX = -originY / slope + originX;
} else if (directionY < 0) { // Crossaa y 700
    checkX = (terrain.length - originY) / slope + originX;
} else {
    console.log("Mitä tehdään?");
}

if (checkX >= 0 && checkX < 700) {
    if (directionY > 0) {
        originX = checkX;
        originY = 0;
    } else if (directionY < 0) {
        originX = checkX;
        originY = 699;
    } else {
        console.log("Mitä tehdään?");
    }
} else if (checkY >= 0 && checkY < 700) {
    if (directionX > 0) {
        originX = 0;
        originY = checkY;
    } else if (directionX < 0) {
        originX = 699;
        originY = checkY;
    } else {
        console.log("Mitä tehdään?");
    }
} else if (checkX === 700) {
    if (directionY > 0) {
        originX = 699;
        originY = 0;
    } else if (directionY < 0) {
        originX = 699;
        originY = 699;
    } else {
        console.log("Mitä tehdään?");
    }
} else if (checkY === 700) {
    if (directionX > 0) {
        originX = 0;
        originY = 699;
    } else if (directionX < 0) {
        originX = 699;
        originY = 699;
    } else {
        console.log("Mitä tehdään?");
    }
} else { // Ray never intersects grid
    continue;
}
*/


var tMaxX = 0;
var tMaxY = 0;
var tMaxZ = 0;

if (directionX > 0) {
    if (currentX < 0) {
        // Move currentX to the edge 0
        tMaxX = Math.abs(currentX) / tX;
        currentX = Math.round(currentX + (tMaxX * tX));
    } else if (currentX > 100) {
        pixel[y * width + x] =
            (255 << 24) | // alpha
            (73 << 16) | // blue
            (29 << 8) | // green
             0;		// red
        continue;
    }
} else if (directionX < 0) {
    if (currentX > 100) {
        // Move currentX to the edge 100
        tMaxX = (currentX - 100) / tX;
        currentX = Math.round(currentX - (tMaxX * tX));
    } else if (currentX < 0) {
        pixel[y * width + x] =
            (255 << 24) | // alpha
            (73 << 16) | // blue
            (29 << 8) | // green
             0;		// red
        continue;
    }
} else {
    console.log("Mitä tehdään?");
}

if (directionY > 0) {
    if (currentY < 0) {
        // Move currentY to the edge 0
        tMaxY = Math.abs(currentY) / tY;
        currentY = Math.round(currentY + (tMaxY * tY));
    } else if (currentY > 100) {
        pixel[y * width + x] =
            (255 << 24) | // alpha
            (73 << 16) | // blue
            (29 << 8) | // green
             0;		// red
        continue;
    }
} else if (directionY < 0) {
    if (currentY > 100) {
        // Move currentY to the edge 100
        tMaxY = (currentY - 100) / tY;
        currentY = Math.round(currentY - (tMaxY * tY));
    } else if (currentY < 0) {
        pixel[y * width + x] =
            (255 << 24) | // alpha
            (73 << 16) | // blue
            (29 << 8) | // green
             0;		// red
        continue;
    }
} else {
    console.log("Mitä tehdään?");
}

if (directionZ > 0) {
    if (currentZ < 0) {
        // Move currentZ to the edge 0
        tMaxZ = Math.abs(currentZ) / tZ;
        currentZ = Math.round(currentZ + (tMaxZ * tZ));
    } else if (currentZ > 100) {
        pixel[y * width + x] =
            (255 << 24) | // alpha
            (73 << 16) | // blue
            (29 << 8) | // green
             0;		// red
        continue;
    }
} else if (directionZ < 0) {
    if (currentZ > 100) {
        // Move currentZ to the edge 100
        tMaxZ = (currentZ - 100) / tZ;
        currentZ = Math.round(currentZ - (tMaxZ * tZ));
    } else if (currentZ < 0) {
        pixel[y * width + x] =
            (255 << 24) | // alpha
            (73 << 16) | // blue
            (29 << 8) | // green
             0;		// red
        continue;
    }
} else {
    console.log("Mitä tehdään?");
}



//t at first encountered boundary of X (0 or 99)
//var verBoundary = distance to next ver line / length of vector * cos(currentRotationAngle);
//var tMaxX = (Math.ceil(originX) - originX) / Math.cos(fortyFive);

//t at first encountered boundary of Y (0 or 99)
//var horBoundary = distance to next hor line / length of vector * cos(currentRotationAngle);
//var tMaxY = (Math.ceil(originY) - originY) / Math.cos(fortyFive);

//t at first encountered boundary of Z (0 or 99)
//var tMaxZ =

            //var face = [0, 0, 0];

            //var rayLive = 0;
/*
            if (!access(currentX, currentY, currentZ)) {
                while (// ray has not gone past bounds of world
                    (stepX > 0 ? currentX < 99 : currentX > 0) &&
                    (stepY > 0 ? currentY < 99 : currentY > 0) &&
                    (stepZ > 0 ? currentZ < 99 : currentZ > 0)) {
                //while (rayLive < 100) {
                        if (tMaxX < tMaxY) {
                            if (tMaxX < tMaxZ) {
                                //if (tMaxX > radius)
                                //    break;
                                // Update which cube we are now in.
                                currentX += stepX;
                                // Adjust tMaxX to the next X-oriented boundary crossing.
                                tMaxX += tX;
                                // Record the normal vector of the cube face we entered.
                                //face[0] = -stepX;
                                //face[1] = 0;
                                //face[2] = 0;
                                //rayLive++;
                                if (access(currentX, currentY, currentZ))
                                    break;
                            } else {
                                //if (tMaxZ > radius)
                                //    break;
                                currentZ += stepZ;
                                tMaxZ += tZ;
                                //face[0] = 0;
                                //face[1] = 0;
                                //face[2] = -stepZ;
                                //rayLive++;
                                if (access(currentX, currentY, currentZ))
                                    break;
                            }
                        } else {
                            if (tMaxY < tMaxZ) {
                                //if (tMaxY > radius)
                                //    break;
                                currentY += stepY;
                                tMaxY += tY;
                                //face[0] = 0;
                                //face[1] = -stepY;
                                //face[2] = 0;
                                //rayLive++;
                                if (access(currentX, currentY, currentZ))
                                    break;
                            } else {
                                // Identical to the second case, repeated for simplicity in
                                // the conditionals.
                                //if (tMaxZ > radius)
                                //    break;
                                currentZ += stepZ;
                                tMaxZ += tZ;
                                //face[0] = 0;
                                //face[1] = 0;
                                //face[2] = -stepZ;
                                //rayLive++;
                                if (access(currentX, currentY, currentZ))
                                    break;
                            }
                        }
                    }
            }
                console.log(currentX, currentY, currentZ);
                if (access(currentX, currentY, currentZ)) {
                    pixel[y * width + x] =
                        (255 << 24) | // alpha
                        (73 << 16) | // blue
                        (200 << 8) | // green
                         0;		// red
                } else {
                    pixel[y * width + x] =
                        (255 << 24) | // alpha
                        (73 << 16) | // blue
                        (29 << 8) | // green
                         0;		// red
                }
                //var foundType = terrain[currentX][currentY][currentZ];
*/
        }
    }

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
    pixels.data.set(channel);
}




// 32-bit pixel manipulation https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/

var panel = g.createImageData(208, 54);

var panelBuffer = new ArrayBuffer(panel.data.length)
var panelArray = new Uint8ClampedArray(panelBuffer);
var panelPixel = new Uint32Array(panelBuffer);
for (var coordin = 0; coordin < 208 * 54; coordin++)
    panelPixel[coordin] = (255 << 24) | (50 << 16) | (50 << 8) | 50;
panel.data.set(panelArray);

// Create an empty background image

var voidArray = new ArrayBuffer(pixels.data.length);
var voidPixel = new Uint32Array(voidArray);
for (var coordinate = 0; coordinate < width * height; coordinate++)
    voidPixel[coordinate] = (255 << 24) | (73 << 16) | (29 << 8) | 0;

var rotation = 0; // Current rotation in radians between 0 and 2π
var fortyFive = 45 * (Math.PI / 180); // Radiaaneille oma funktio?
var ninety = 90 * (Math.PI / 180);
var angle = 45 * (Math.PI / 180);
var dirX = -Math.cos(fortyFive); // Muuta nimi kuten initX tai jotain?
var dirY = -Math.cos(fortyFive);

var hypotenuse = Math.sqrt(Math.pow(terrain.length / 2, 2) * 2);
var deadZone = Math.floor(width / 2 - hypotenuse);
var verticalDeadZone = (height - terrain.length) / 2; // Suoraan ylhäältä kuvattu grid ei mahdu näytölle

// Grid traversal http://www.cse.yorku.ca/~amana/research/grid.pdf

function raycasting() {

    var imageArray = voidArray.slice(); // Voitaisiin tehdä ilman sliceä, jos käsiteltäisiin pienempää imageDataa
    var channel = new Uint8ClampedArray(imageArray);
    var pixel = new Uint32Array(imageArray);

    var center = terrain.length / 2; // Testaa, hajottaako pariton pituus valmiin ratkaisun.
    var centerOfScreen = Math.ceil(width / 2); // Voi kenties ottaa pois raycasting-funktion sisältä.

    // direction vector multipliers, these change according to rotation
    var directionX = dirX * Math.cos(rotation) - dirY * Math.sin(rotation);
    var directionY = dirY * Math.cos(rotation) + dirX * Math.sin(rotation);
    // initialize increment phase movement direction
    var stepX = 0;
    var stepY = 0;
    if (directionX > 0) { stepX = 1; } else if (directionX < 0) { stepX = -1; }
    if (directionY > 0) { stepY = 1; } else if (directionY < 0) { stepY = -1; }
    //var reverseStepX = -1 * stepX;
    //var reverseStepY = -1 * stepY;
    // how far we have to move in units of t to cross a square
    var tDeltaX = 1 / Math.abs(directionX);
    var tDeltaY = 1 / Math.abs(directionY);
    for (var x = deadZone; x < width - deadZone; x++) {

/*The traversal algorithm breaks down the ray into intervals of t, each of which spans one voxel.
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
We loop until either we find a voxel with a non-empty object list or we fall out of the end of the grid.*/

        var offset = x - centerOfScreen;

        var centerX = center + offset * directionY;
        var centerY = center + offset * -directionX;

        // Ray origin, which will be updated to start from the edge of the grid
        var originX = centerX;
        var originY = centerY;

        var pointX = originX + directionX;
        var pointY = originY + directionY;

        var slope = (originY - pointY) / (originX - pointX);
        var checkX = 0;
        var checkY = 0;

        if (directionX > 0) { // Crossaa x 0
            checkY = slope * -originX + originY;
        } else if (directionX < 0) { // Crossaa x 700
            checkY = slope * (terrain.length - originX) + originY;
        } else {
            console.log("Mitä tehdään?");
        }
        if (directionY > 0) { // Crossaa y 0
            checkX = -originY / slope + originX;
        } else if (directionY < 0) { // Crossaa y 700
            checkX = (terrain.length - originY) / slope + originX;
        } else {
            console.log("Mitä tehdään?");
        }

        if (checkX >= 0 && checkX < terrain.length) {
            if (directionY > 0) {
                originX = checkX;
                originY = 0;
            } else if (directionY < 0) {
                originX = checkX;
                originY = terrain.length - 1;
            } else {
                console.log("Mitä tehdään?");
            }
        } else if (checkY >= 0 && checkY < terrain.length) {
            if (directionX > 0) {
                originX = 0;
                originY = checkY;
            } else if (directionX < 0) {
                originX = terrain.length - 1;
                originY = checkY;
            } else {
                console.log("Mitä tehdään?");
            }
        } else if (checkX === terrain.length) {
            if (directionY > 0) {
                originX = terrain.length - 1;
                originY = 0;
            } else if (directionY < 0) {
                originX = terrain.length - 1;
                originY = terrain.length - 1;
            } else {
                console.log("Mitä tehdään?");
            }
        } else if (checkY === terrain.length) {
            if (directionX > 0) {
                originX = 0;
                originY = terrain.length - 1;
            } else if (directionX < 0) {
                originX = terrain.length - 1;
                originY = terrain.length - 1;
            } else {
                console.log("Mitä tehdään?");
            }
        } else { // Ray never intersects grid
            continue;
        }

        // Record the visited tiles
        var traversedTiles = [];

        //t at first encountered vertical boundary
        //var verBoundary = distance to next ver line / length of vector * cos(currentRotationAngle);
        var tMaxX = (Math.ceil(originX) - originX) / Math.cos(fortyFive);

        //t at first encountered horizontal boundary
        //var horBoundary = distance to next hor line / length of vector * cos(currentRotationAngle);
        var tMaxY = (Math.ceil(originY) - originY) / Math.cos(fortyFive);

        var coordX = Math.floor(originX);
        var coordY = Math.floor(originY);

        while (coordX >= 0 && coordX < terrain.length && coordY >= 0 && coordY < terrain.length) { // pituus ulkoiseen variin
            traversedTiles.push([coordX, coordY]);
            if (tMaxX < tMaxY) {
                tMaxX = tMaxX + tDeltaX;
                coordX = coordX + stepX;
            } else if (tMaxY < tMaxX) {
                tMaxY = tMaxY + tDeltaY;
                coordY = coordY + stepY;
            } else {
                tMaxX = tMaxX + tDeltaX;
                tMaxY = tMaxY + tDeltaY;
                coordX = coordX + stepX;
                coordY = coordY + stepY;
            }
        }

        if (traversedTiles.length > 0) { // Ideaalimaailmassa tämäkin voitaisiin skipata?

            var screenX = centerX + -directionX * hypotenuse;
            var screenY = centerY + -directionY * hypotenuse;

            //var currentY =

            // kun piirrettävä y liikkuu 1 askeleen ylöspäin, chekattava y liikkuu tan 30 verran
            var moveY = Math.tan(angle);

            var lastElevation = 0;
            var lastElevationX = screenX;
            var lastElevationY = screenY;
            //pidetään kirjaa edellisestä elevaatiosta ja siitä, missä kohdassa se oli
            //saadaan tietää, mikä kohta seuraavassa tulisi olla näkyvissä

            // varjoon jääminen katsotaan pitämällä muistissa edellisen elevaation kohtaa,
            // ja miinustamalla sen arvosta tan(asteen) kokoinen pätkä, jolloin chekataan, näkyykö seuraava
            // katsotaan etäisyys edelliseen piirrettyyn pisteeseen

            for (var index = 0; index < traversedTiles.length; index++) {

                var currentTileX = traversedTiles[index][0];
                var currentTileY = traversedTiles[index][1];
                var elevation = terrain[currentTileX][currentTileY];

                var distanceFromScreen = Math.sqrt(
                    Math.pow(currentTileX - screenX, 2) +
                    Math.pow(currentTileY - screenY, 2)
                );

                var drawY = Math.ceil(height - (distanceFromScreen * moveY + verticalDeadZone + elevation));

                //jos differenssi on ylempänä tietyn tresholdin edellisestä,
                //piirrä väliin ruskeaa
                //jos differenssi on

                pixel[drawY * width + x] =
                    (255 << 24) | // alpha
                    (73 << 16) | // blue
                    (200 << 8) | // green
                     0;		// red

            }

            /*while (currentTile < traversedTiles.length) {

            }*/

            /*for (var y = height - 1; y >= 0; y--) {
                pixel[y * width + x] =
                    (255 << 24) | // alpha
                    (73 << 16) | // blue
                    (200 << 8) | // green
                     0;		// red
            }*/

        }
    }
    pixels.data.set(channel);
}


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
    /*for (var coordinate = 0; coordinate < width * height; coordinate++) {
        pixel[coordinate] = (255 << 24) | (73 << 16) | (14 << 8) | 0;
    }*/

    var pixelMultiplier = 2; // How many pixels^2 are covered by one ray.
    for (var y = 0; y < height; y = y + (1 * pixelMultiplier)) {
        for (var x = 0; x < width; x = x + (1 * pixelMultiplier)) {
    //for (var y = 0; y < 1; y++) {
    //    for (var x = 0; x < 1; x++) {
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
            //console.log("RayDirection: " + rayDirection);
            //t:t, joissa ray osuu piirrettävän alueen reunoihin
            var tX1 = (-50 - cameraPosition[0]) / rayDirection[0];
            var tX2 = (50 - cameraPosition[0]) / rayDirection[0];
            var tY1 = (-50 - cameraPosition[1]) / rayDirection[1];
            var tY2 = (50 - cameraPosition[1]) / rayDirection[1];
            var tZ1 = (-50 - cameraPosition[2]) / rayDirection[2];
            var tZ2 = (50 - cameraPosition[2]) / rayDirection[2];
            /*console.log("tX1: " + tX1);
            console.log("tX2: " + tX2);
            console.log("tY1: " + tY1);
            console.log("tY2: " + tY2);
            console.log("tZ1: " + tZ1);
            console.log("tZ2: " + tZ2);*/
            if (tX1 < tX2) {
                if (tY1 < tY2) {
                    if (tZ1 < tZ2) {
                        if (Math.max(tX1, tY1, tZ1) <= Math.min(tX2, tY2, tZ2)) {
                            colorPixels(pixel, pixelMultiplier, x, y, 255, 73, 200, 0);
                        }
                    } else {
                        if (Math.max(tX1, tY1, tZ2) <= Math.min(tX2, tY2, tZ1)) {
                            colorPixels(pixel, pixelMultiplier, x, y, 255, 73, 200, 0);
                        }
                    }
                } else {
                    if (tZ1 < tZ2) {
                        if (Math.max(tX1, tY2, tZ1) <= Math.min(tX2, tY1, tZ2)) {
                            colorPixels(pixel, pixelMultiplier, x, y, 255, 73, 200, 0);
                        }
                    } else {
                        if (Math.max(tX1, tY2, tZ2) <= Math.min(tX2, tY1, tZ1)) {
                            colorPixels(pixel, pixelMultiplier, x, y, 255, 73, 200, 0);
                        }
                    }
                }
            } else {
                if (tY1 < tY2) {
                    if (tZ1 < tZ2) {
                        if (Math.max(tX2, tY1, tZ1) <= Math.min(tX1, tY2, tZ2)) {
                            colorPixels(pixel, pixelMultiplier, x, y, 255, 73, 200, 0);
                        }
                    } else {
                        if (Math.max(tX2, tY1, tZ2) <= Math.min(tX1, tY2, tZ1)) {
                            colorPixels(pixel, pixelMultiplier, x, y, 255, 73, 200, 0);
                        }
                    }
                } else {
                    if (tZ1 < tZ2) {
                        if (Math.max(tX2, tY2, tZ1) <= Math.min(tX1, tY1, tZ2)) {
                            colorPixels(pixel, pixelMultiplier, x, y, 255, 73, 200, 0);
                        }
                    } else {
                        if (Math.max(tX2, tY2, tZ2) <= Math.min(tX1, tY1, tZ1)) {
                            colorPixels(pixel, pixelMultiplier, x, y, 255, 73, 200, 0);
                        }
                    }
                }
            }
            /*if (Math.max(tX1, tY1, tZ1) <= Math.min(tX2, tY2, tZ2)) {
                colorPixels(pixel, pixelMultiplier, x, y, 255, 73, 200, 0);
            }*/
            /*else {
                colorPixels(pixel, pixelMultiplier, x, y, 255, 73, 14, 0);
            }*/
        }
    }

    pixels.data.set(channel);
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

function rotateUp(camDir, ax) {
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
var twoPI = 2 * Math.PI; // move this to a better place

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

    if (rotationActive) {
        spin = (spin + speed) % twoPI;
        //var spin = twoPi / speed;
        //rotation = (rotation + (currentFrame - previousFrame) * spin) % twoPi;
        cameraPosition = [
            300 * Math.cos(spin),
            250,
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
    g.fillText(framesPerSecond + " fps", 9, 22);
    g.fillText("R - stop/resume simulation", 9, 44);

    requestAnimationFrame(processFrame);
}

console.log("Window size: " + width + " x " + height);

processFrame();
