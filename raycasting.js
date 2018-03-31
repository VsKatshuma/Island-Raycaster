
var canvas = document.getElementById('world');
var g = canvas.getContext('2d');

var width = window.innerWidth;
var height = window.innerHeight;

canvas.width = width;
canvas.height = height;

var requestAnimationFrame = window.requestAnimationFrame ||
                            window.mozRequestAnimationFrame ||
                            window.msRequestAnimationFrame ||
                            window.oRequestAnimationFrame ||
                            window.webkitRequestAnimationFrame;

var island = [];
for (var x = 0; x < 700; x++) {
    var column = [];
    for (var y = 0; y < 700; y++) {
        column.push(Math.random() * 500);
    }
    island.push(column);
}

var rotate = true;

document.onkeypress = function (event) { // Chekkaa onkeypress, miten sitä kuuluu käyttää
    event = event || window.event;
    //console.log(event.keyCode);
    if (event.keyCode === 114) {
        rotate = !rotate;
    }
};

// 32-bit pixel manipulation https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/

var pixels = g.createImageData(width, height);

// Create an empty background image

var voidArray = new ArrayBuffer(pixels.data.length);
var voidPixel = new Uint32Array(voidArray);
for (var coordinate = 0; coordinate < width * height; coordinate++)
    voidPixel[coordinate] = (255 << 24) | (73 << 16) | (29 << 8) | 0;

var rotation = 0; // Current rotation in radians between 0 and 2π
var fortyFive = 45 * (Math.PI / 180); // Radiaaneille oma funktio?
var viewAngle = 14 * (Math.PI / 180);
var dirX = -Math.cos(fortyFive); // Muuta nimi kuten initX tai jotain?
var dirY = -Math.cos(fortyFive);

var hypotenuse = Math.sqrt(Math.pow(island.length / 2, 2) * 2);
var deadZone = Math.floor(width / 2 - hypotenuse);
var verticalDeadZone = (height - island.length) / 2; // Suoraan ylhäältä kuvattu grid ei mahdu näytölle

// Grid traversal http://www.cse.yorku.ca/~amana/research/grid.pdf

function raycasting() {
    var imageArray = voidArray.slice(); // Voitaisiin tehdä ilman sliceä, jos käsiteltäisiin pienempää imageDataa
    var channel = new Uint8ClampedArray(imageArray);
    var pixel = new Uint32Array(imageArray);

    var center = island.length / 2; // Testaa, hajottaako pariton pituus valmiin ratkaisun.
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
            checkY = slope * (island.length - originX) + originY;
        } else {
            console.log("Mitä tehdään?");
        }
        if (directionY > 0) { // Crossaa y 0
            checkX = -originY / slope + originX;
        } else if (directionY < 0) { // Crossaa y 700
            checkX = (island.length - originY) / slope + originX;
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

        while (coordX >= 0 && coordX <= 699 && coordY >= 0 && coordY <= 699) { // pituus ulkoiseen variin
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
            var moveY = Math.tan(viewAngle);

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
                var elevation = island[currentTileX][currentTileY];

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
    /*for (var x = 0; x < width; x += 2) {
        for (var y = height - 1; y >= 0; y -= 2) {
            var green = Math.ceil(Math.random() * 255);
            pixel[y * width + x] =
                (255 << 24) | // alpha
                (0 << 16) | // blue
                (green << 8) | // green
                 0;		// red
            pixel[(y + 1) * width + x] =
                (255 << 24) | // alpha
                (0 << 16) | // blue
                (green << 8) | // green
                 0;		// red
            pixel[y * width + x + 1] =
                (255 << 24) | // alpha
                (0 << 16) | // blue
                (green << 8) | // green
                 0;		// red
            pixel[(y + 1) * width + x + 1] =
                (255 << 24) | // alpha
                (0 << 16) | // blue
                (green << 8) | // green
                 0;		// red
        }
    }*/
    pixels.data.set(channel);
}

var previousSecond = Math.floor(Date.now() / 1000);
var framesPerSecond = "0";
var frames = 0;

var previousFrame = Date.now();
var twoPi = 2 * Math.PI; // move this to a better place
var rotationPeriod = 16000; // milliseconds
var spin = twoPi / rotationPeriod;

function animation() {

    var currentSecond = Math.floor(Date.now() / 1000);
    var currentFrame = Date.now();

    if (currentSecond > previousSecond) {
        previousSecond = currentSecond;
        framesPerSecond = frames.toString();
        frames = 1;
    } else {
        frames += 1;
    }

    if (rotate) {
        rotation = (rotation + (currentFrame - previousFrame) * spin) % twoPi;
    }
    previousFrame = currentFrame;

    raycasting();

    g.putImageData(pixels, 0, 0);

    g.fillStyle = '#00FF00';
    g.font = '17px Courier New';
    g.fillText(framesPerSecond + " fps", 9, 22);
    g.fillText("Press R to toggle rotation", 9, 44);

    requestAnimationFrame(animation);
}

console.log(width + " x " + height);

animation();
