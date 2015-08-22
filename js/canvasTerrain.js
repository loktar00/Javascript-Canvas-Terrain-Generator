function generateTerrainMap(mapDimension, unitSize, roughness) {
    "use strict";

    var map = create2DArray(mapDimension+1, mapDimension+1);
    startDisplacement(map, mapDimension);
    return map;

    // Setup the map array for use
    function create2DArray(d1, d2) {
        var data = [],
            x = 0,
            y = 0;

        for (x = 0; x < d1; x ++) {
            data[x] = [];
            for (y = 0; y < d2; y ++) {
                data[x][y] = 0;
            }
        }
        return data;
    }

    // Starts off the map generation, seeds the first 4 corners
    function startDisplacement(map, mapDimension){
        var topRight = 0,
            topLeft = 0,
            bottomRight = 0,
            bottomLeft = 0,
            center = 0;

        // top left
        map[0][0] = Math.random();
        topLeft = map[0][0];

        // bottom left
        map[0][mapDimension] = Math.random();
        bottomLeft = map[0][mapDimension];

        // top right
        map[mapDimension][0] = Math.random();
        topRight = map[mapDimension][0];

        // bottom right
        map[mapDimension][mapDimension] = Math.random();
        bottomRight = map[mapDimension][mapDimension];

        // Center
        map[mapDimension / 2][mapDimension / 2] = map[0][0] + map[0][mapDimension] + map[mapDimension][0] + map[mapDimension][mapDimension] / 4;
        map[mapDimension / 2][mapDimension / 2] = normalize(map[mapDimension / 2][mapDimension / 2]);
        center = map[mapDimension / 2][mapDimension / 2];

        /* Non wrapping terrain */
        map[mapDimension / 2][mapDimension] = bottomLeft + bottomRight + center / 3;
        map[mapDimension / 2][0] = topLeft + topRight + center / 3;
        map[mapDimension][mapDimension / 2] = topRight + bottomRight + center / 3;
        map[0][mapDimension / 2] = topLeft + bottomLeft + center / 3;

        /*Wrapping terrain */

        /*map[mapDimension / 2][mapDimension] = bottomLeft + bottomRight + center + center / 4;
        map[mapDimension / 2][0] = topLeft + topRight + center + center / 4;
        map[mapDimension][mapDimension / 2] = topRight + bottomRight + center + center / 4;
        map[0][mapDimension / 2] = topLeft + bottomLeft + center + center / 4;*/


        // Call displacment
        midpointDisplacment(mapDimension);
    }

    // Workhorse of the terrain generation.
    function midpointDisplacment(dimension){
        var newDimension = dimension / 2,
            topRight = 0,
            topLeft = 0,
            bottomLeft = 0,
            bottomRight = 0,
            center = 0,
            x = 0, y = 0,
            i = 0, j = 0;

        if (newDimension > unitSize){
            for(i = newDimension; i <= mapDimension; i += newDimension){
                for(j = newDimension; j <= mapDimension; j += newDimension){
                    x = i - (newDimension / 2);
                    y = j - (newDimension / 2);

                    topLeft = map[i - newDimension][j - newDimension];
                    topRight = map[i][j - newDimension];
                    bottomLeft = map[i - newDimension][j];
                    bottomRight = map[i][j];

                    // Center
                    map[x][y] = (topLeft + topRight + bottomLeft + bottomRight) / 4 + displace(dimension);
                    map[x][y] = normalize(map[x][y]);
                    center = map[x][y];

                    // Top
                    if(j - (newDimension * 2) + (newDimension / 2) > 0){
                        map[x][j - newDimension] = (topLeft + topRight + center + map[x][j - dimension + (newDimension / 2)]) / 4 + displace(dimension);
                    }else{
                        map[x][j - newDimension] = (topLeft + topRight + center) / 3 + displace(dimension);
                    }

                    map[x][j - newDimension] = normalize(map[x][j - newDimension]);

                    // Bottom
                    if(j + (newDimension / 2) < mapDimension){
                        map[x][j] = (bottomLeft + bottomRight + center + map[x][j + (newDimension / 2)]) / 4 + displace(dimension);
                    }else{
                        map[x][j] = (bottomLeft + bottomRight + center) / 3 + displace(dimension);
                    }

                    map[x][j] = normalize(map[x][j]);

                    //Right
                    if(i + (newDimension / 2) < mapDimension){
                        map[i][y] = (topRight + bottomRight + center + map[i + (newDimension / 2)][y]) / 4 + displace(dimension);
                    }else{
                        map[i][y] = (topRight + bottomRight + center) / 3 + displace(dimension);
                    }

                    map[i][y] = normalize(map[i][y]);

                    // Left
                    if(i - (newDimension * 2) + (newDimension / 2) > 0){
                        map[i - newDimension][y] = (topLeft + bottomLeft + center + map[i - dimension + (newDimension / 2)][y]) / 4 + displace(dimension);
                    }else{
                        map[i - newDimension][y] = (topLeft + bottomLeft + center) / 3 + displace(dimension);
                    }

                    map[i - newDimension][y] = normalize(map[i - newDimension][y]);
                }
            }
            midpointDisplacment(newDimension);
        }
    }

    // Random function to offset the center
    function displace(num){
        var max = num / (mapDimension + mapDimension) * roughness;
        return (Math.random() - 0.5) * max;
    }

    // Normalize the value to make sure its within bounds
    function normalize(value){
        return Math.max(Math.min(value, 1), 0);
    }
}