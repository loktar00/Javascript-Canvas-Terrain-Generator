import HeightMap from './height-map.js';

window.onload = terrainGeneration;

var mapCanvas = document.getElementById('canvas'),
    imgSave = document.getElementById('imgSave'),
    settings = {
        roughness : 8,
        mapDimension : 256,
        unitSize : 1,
        mapType : 1,
        smoothness : 0.1,
        smoothIterations : 0,
        genShadows : false,
        sunX : -100,
        sunY : -100,
        sunZ : 4,
        render : function(){
            terrainGeneration();
        }
    };

function terrainGeneration(){
    "use strict";
    // Set these variables to adjust how the map is generated
    var mapDimension,
        unitSize = 0, // Power of 2
        roughness = 0,
        genShadows = 0,
        sunX = settings.sunX,
        sunY = settings.sunY,
        sunZ = settings.sunZ,
        mapType = 0,
        map = 0,
        mapCanvas = document.getElementById('canvas'),
        mapCtx = mapCanvas.getContext("2d");

    // init
    roughness = parseInt(settings.roughness, 10);
    mapDimension = parseInt(settings.mapDimension, 10);
    unitSize = parseInt(settings.unitSize, 10);
    mapType = parseInt(settings.mapType, 10);

    genShadows = settings.genShadows;

    if (genShadows) {
        sunX = parseInt(settings.sunX, 10);
        sunY = parseInt(settings.sunY, 10);
        sunZ = parseInt(settings.sunZ, 10);
    }

    mapCanvas.width = mapDimension;
    mapCanvas.height = mapDimension;
    map = new HeightMap(mapDimension, unitSize, roughness).mapData;

    // Smooth terrain
    for(var i = 0; i < settings.smoothIterations; i++){
        map = smooth(map, mapDimension, settings.smoothness);
    }

    // Draw everything after the terrain vals are generated
    drawMap(mapDimension, "canvas", map, mapType);

    if(genShadows){
        drawShadowMap(mapDimension, sunX, sunY, sunZ);
    }


    // Round to nearest pixel
    function round(n) {
        if (n-(parseInt(n, 10)) >= 0.5){
            return parseInt(n, 10) + 1;
        }else{
            return parseInt(n, 10);
        }
    }

    // smooth function
    function smooth(data, size, amt) {
        /* Rows, left to right */
        for (var x = 1; x < size; x++){
            for (var z = 0; z < size; z++){
                data[x][z] = data[x - 1][z] * (1 - amt) + data[x][z] * amt;
            }
        }

        /* Rows, right to left*/
        for (x = size - 2; x < -1; x--){
            for (z = 0; z < size; z++){
                data[x][z] = data[x + 1][z] * (1 - amt) + data[x][z] * amt;
            }
        }

        /* Columns, bottom to top */
        for (x = 0; x < size; x++){
            for (z = 1; z < size; z++){
                data[x][z] = data[x][z - 1] * (1 - amt) + data[x][z] * amt;
            }
        }

        /* Columns, top to bottom */
        for (x = 0; x < size; x++){
            for (z = size; z < -1; z--){
                data[x][z] = data[x][z + 1] * (1 - amt) + data[x][z] * amt;
            }
        }

        return data;
    }

    //Create Shadowmap
    function drawShadowMap(size, sunPosX, sunPosY, sunHeight){
        var shadowCanvas = document.createElement("canvas"),
            sCtx = shadowCanvas.getContext("2d"),
            x = 0, y = 0,
            idx,
            colorFill = {r : 0, g : 0, b : 0, a : 0},
            sunX, sunY, sunZ,
            pX, pY, pZ,
            mag, dX, dY, dZ;

        shadowCanvas.width = shadowCanvas.height = mapDimension;

        var img = sCtx.createImageData(shadowCanvas.width, shadowCanvas.height),
            imgData = img.data;

        // Suns position
        sunX = sunPosX;
        sunY = sunPosY;
        sunZ = sunHeight;

        for(x = 0; x < mapDimension; x += unitSize){
            for(y = 0; y < mapDimension; y += unitSize){
                dX = sunX - x;
                dY = sunY - y;
                dZ = sunZ - map[x][y];

                mag = Math.sqrt(dX * dX + dY * dY + dZ * dZ);

                dX = (dX / mag);
                dY = (dY / mag);
                dZ = (dZ / mag);

                pX = x;
                pY = y;
                pZ = map[x][y];

                while(pX > 0 && pX < mapDimension && pY > 0 && pY < mapDimension && pZ < sunZ){

                    if((map[~~(pX)][~~(pY)]) > pZ){
                        colorFill = {r : 0, g : 0, b : 0, a : 200};

                        for (var w = 0; w < unitSize; w++) {
                            for (var h = 0; h < unitSize; h++) {
                                var pData = (~~ (x + w) + (~~ (y + h) * canvas.width)) * 4;

                                imgData[pData] = colorFill.r;
                                imgData[pData + 1] = colorFill.g;
                                imgData[pData + 2] = colorFill.b;
                                imgData[pData + 3] += colorFill.a;
                            }
                        }
                        break;
                    }

                    pX += (dX * unitSize);
                    pY += (dY * unitSize);
                    pZ += (dZ * unitSize);
                }
            }
        }


        sCtx.putImageData(img, 0, 0);
        mapCtx.drawImage(shadowCanvas, 0, 0);
        var strDataURI = mapCanvas.toDataURL();
        imgSave.src = strDataURI;
    }

  // Draw the map
  function drawMap(size, canvasId, mapData, mapType){
    var canvas = document.getElementById(canvasId),
        ctx = canvas.getContext("2d"),
        x = 0,
        y = 0,
        r = 0, g = 0, b = 0, gamma = 500,
        colorFill = 0,
        img = ctx.createImageData(canvas.height, canvas.width),
        imgData = img.data;


    // colormap colors
    var waterStart={r:10,g:20,b:40},
        waterEnd={r:39,g:50,b:63},
        grassStart={r:22,g:38,b:3},
        grassEnd={r:67,g:100,b:18},
        mtnEnd={r:60,g:56,b:31},
        mtnStart={r:67,g:80,b:18},
        rocamtStart={r:90,g:90,b:90},
        rocamtEnd={r:130,g:130,b:130},
        snowStart={r:255,g:255,b:255},
        snowEnd={r:200,g:200,b:200};


    for(x = 0; x <= size - 1; x += unitSize){
        for(y = 0; y <= size - 1; y += unitSize){
            colorFill = {r : 0, g : 0, b : 0};

            switch(mapType){
                case 1: // Color map
                    var  data = mapData[x][y];
                    if (data >= 0 && data <= 0.3) {
                        colorFill = fade(waterStart, waterEnd, 30, parseInt(data * 100, 10));
                    } else if (data > 0.3 && data <= 0.7) {
                        colorFill = fade(grassStart, grassEnd, 45, parseInt(data * 100, 10) - 30);
                    } else if (data > 0.7 && data <= 0.95) {
                        colorFill = fade(mtnStart, mtnEnd, 15, parseInt(data * 100, 10) - 70);
                    } else if (data > 0.95 && data <= 1) {
                        colorFill = fade(rocamtStart, rocamtEnd, 5, parseInt(data * 100, 10) - 95);
                    }
                    break;
                case 2: // Standard
                    var standardShade = Math.floor(map[x][y] * 250);
                    colorFill = {r : standardShade, g : standardShade, b : standardShade};
                    break;
                case 3: // 10 shades
                    var greyShade = Math.round(~~(mapData[x][y]*100) / 25) * 25;
                    colorFill = {r : greyShade, g : greyShade, b : greyShade};
                    break;
                case 4: // 2 shades
                    if(mapData[x][y] <= 0.5) {
                        mapData[x][y] = 0;
                    }else if(mapData[x][y] > 0.5) {
                        mapData[x][y] = 220;
                    }

                    var grey = mapData[x][y];
                    colorFill = { r :  grey, g : grey, b : grey};
                    break;
                case 5:
                    // Section of code modified from http://www.hyper-metrix.com/processing-js/docs/index.php?page=Plasma%20Fractals
                    if (mapData[x][y] < 0.5) {
                        r = mapData[x][y] * gamma;
                    } else {
                        r = (1.0 - mapData[x][y]) * gamma;
                    }

                    if (mapData[x][y] >= 0.3 && mapData[x][y] < 0.8) {
                        g = (mapData[x][y] - 0.3) * gamma;
                    } else if (mapData[x][y] < 0.3) {
                        g = (0.3 - mapData[x][y]) * gamma;
                    } else {
                        g = (1.3 - mapData[x][y]) * gamma;
                    }

                    if (mapData[x][y] >= 0.5) {
                        b = (mapData[x][y] - 0.5) * gamma;
                    } else {
                        b = (0.5 - mapData[x][y]) * gamma;
                    }
                    colorFill = { r :  ~~r, g : ~~g, b : ~~b};
                    break;
            }

            for (var w = 0; w <= unitSize; w++) {
                for (var h = 0; h <= unitSize; h++) {
                    var pData = ( ~~(x + w) + ( ~~(y + h) * canvas.width)) * 4;

                    imgData[pData] = colorFill.r;
                    imgData[pData + 1] = colorFill.g;
                    imgData[pData + 2] = colorFill.b;
                    imgData[pData + 3] = 255;
                }
            }
        }
    }

    ctx.putImageData(img, 0, 0);

    // Add to an image so its easier to save
    var strDataURI = mapCanvas.toDataURL();
    imgSave.src = strDataURI;

    function fade(startColor, endColor, steps, step){
        var scale = step / steps,
            r = startColor.r + scale * (endColor.r - startColor.r),
            b = startColor.b + scale * (endColor.b - startColor.b),
            g = startColor.g + scale * (endColor.g - startColor.g);

        return {
            r: r,
            g: g,
            b: b
        }
    };
  }
}



var gui = new dat.GUI();

gui.add(settings, 'roughness');
gui.add(settings, 'mapDimension', [64,128,256,512,1024]);
gui.add(settings, 'unitSize', [1,2,4] );
gui.add(settings, 'mapType', {'Color Map' : 1, 'Gray Scale' : 2, '10 Shades' : 3, '2 Shades' : 4, 'Plasma' : 5});

gui.add(settings, 'smoothness', 0, 0.99);
gui.add(settings, 'smoothIterations');

var shadowSection = gui.addFolder('Shadow Map');
shadowSection.add(settings, 'genShadows');
shadowSection.add(settings, 'sunX');
shadowSection.add(settings, 'sunY');
shadowSection.add(settings, 'sunZ');

gui.add(settings, 'render');