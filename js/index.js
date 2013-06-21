window.onload = terrainGeneration;

function terrainGeneration(){
    "use strict";
    // Set these variables to adjust how the map is generated
    var mapDimension,
        unitSize, // Power of 2
        roughness,
        genPerspective,
        genShadows, sunX = 300, sunY = 300,
        mapType,
        map,
        generate = document.getElementById('generate'),
        btnSaveMap = document.getElementById('savemap'),
        mapCanvas = document.getElementById('canvas'),
        mapCtx = mapCanvas.getContext("2d"),
        voxCanvas = document.getElementById('voxelview');

    generate.onclick = function(){
        var elTerDimension = document.getElementById('terdim'),
            elRoughness = document.getElementById('roughness'),
            elUnitsize = document.getElementById('unitsize'),
            selMapType = document.getElementById('maptype'),
            chkPerspective = document.getElementById('perspective'),
            chkShadowMap = document.getElementById('shadowmap'),
            elSunX = document.getElementById("sunx"),
            elSunY = document.getElementById("suny");

        roughness = parseInt(elRoughness.value, 10);
        mapDimension = parseInt(elTerDimension.value, 10);
        unitSize = parseInt(elUnitsize.value, 10);
        mapType = parseInt(selMapType.options[selMapType.selectedIndex].value, 10);
        genPerspective = chkPerspective.checked;
        genShadows = chkShadowMap.checked;

        roughness = roughness || 8;
        mapDimension = mapDimension || 256;
        unitSize = unitSize || 1;

        if(genShadows){
            sunX = parseInt(elSunX.value, 10);
            sunY = parseInt(elSunY.value, 10);

            if(isNaN(sunX)){
                sunX = 300;
            }

            if(isNaN(sunY)){
                sunY = 300;
            }
        }

        mapCanvas.width = mapDimension;
        mapCanvas.height = mapDimension;

        map = generateTerrainMap(mapDimension, unitSize, roughness);

        // Draw everything after the terrain vals are generated
        drawMap(mapDimension, "canvas", map, mapType);

        if(genShadows){
            drawShadowMap(mapDimension, sunX, sunY, 4);
        }

        if(genPerspective){
            voxCanvas.width = mapDimension;
            voxCanvas.height = mapDimension;

            drawRenderedMap(mapDimension, 300, mapDimension / 8, 300, mapDimension / 2, mapDimension + 50);
        }

        btnSaveMap.style.display = "block";
    };

    // Save the current heightmap into a new window. Found info on http://www.nihilogic.dk/labs/canvas2image/
    btnSaveMap.onclick = function(){
        var strDataURI = mapCanvas.toDataURL();
        window.open(strDataURI);
    };

    // Round to nearest pixel
    function round(n)
    {
        if (n-(parseInt(n, 10)) >= 0.5){
            return parseInt(n, 10)+1;
        }else{
            return parseInt(n, 10);
        }
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

                    if((map[round(pX)][round(pY)]) > pZ){
                        colorFill = {r : 0, g : 0, b : 0, a : 180};

                        for (var w = 0; w < unitSize; w++) {
                            for (var h = 0; h < unitSize; h++) {
                                var pData = (~~ (x+w) + (~~ (y+h) * canvas.width)) * 4;

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
    }

    //Create Voxel View
    function drawRenderedMap(size, viewAngle, yaw, camHeight, camX, camY){
        var ctx = voxCanvas.getContext("2d"),
            sCtx = mapCanvas.getContext("2d"),
            sCanvasData = sCtx.getImageData(0, 0, mapDimension, mapDimension),
            idx;

        ctx.clearRect(0,0,mapDimension,mapDimension);

        document.onkeydown = function(evt){
            if (evt.keyCode === 39){
                drawRenderedMap(size, viewAngle, yaw, camHeight, camX+=5, camY);
            }else if (evt.keyCode === 37){
                drawRenderedMap(size, viewAngle, yaw, camHeight, camX-=5, camY);
            }else if (evt.keyCode === 38){
                drawRenderedMap(size, viewAngle, yaw, camHeight, camX, camY-=5);
            }else if (evt.keyCode === 40){
                drawRenderedMap(size, viewAngle, yaw, camHeight, camX, camY+=5);
            }else if (evt.keyCode === 107){
                drawRenderedMap(size, viewAngle, yaw, camHeight-=5, camX, camY);
            }else if (evt.keyCode === 109){
                drawRenderedMap(size, viewAngle, yaw, camHeight+=5, camX, camY);
            }
        };


        var Ray = 0, AngRay, iRay, ix, iy, iz, idy, px, py, pz, dx, dy, dz, idz, fov, Highest, VxHigh, ScreenAt, MidOut, vy;

        //Field of view
        fov = 1;
        iRay = fov / mapDimension;

        // Gets the distance multiplier for the camera
        ScreenAt = parseInt((mapDimension / 2) * Math.tan(fov / 2), 10);

        // Angle of view
        vy = viewAngle;

        // Camera height
        MidOut = yaw;

        for (AngRay=(vy-(fov/2)); Ray < mapDimension; Ray+=unitSize, AngRay+=iRay) {

            // Camera position
            px = camX;
            py = camY;

            // how much to increment based on the angle for the ray
            ix = Math.cos (AngRay);
            iy = Math.sin (AngRay);

            idy = Math.cos (AngRay - (vy));
            dy = idy;

            // Set the current position at the bottom of the image
            Highest = mapDimension;

              while (px>=0 && px<mapDimension && py>=0 && py<(mapDimension+200)) {

                VxHigh = (((map[round(px)][round(py)]* camHeight)  * (ScreenAt  / dy)) + MidOut) / map[round(px)][round(py)] ;

                /* If it's above the highest point drawn so far. */
                 if (VxHigh < Highest) {

                    idx = (round(px) + round(py) * mapDimension) * 4;
                    ctx.fillStyle = "rgb(" + sCanvasData.data[idx + 0] + "," +  sCanvasData.data[idx + 1] + "," + sCanvasData.data[idx + 2] +")";
                    ctx.fillRect(Ray, VxHigh, unitSize,  Highest - VxHigh);

                    // Uncomment this line to see the overhead perspective of what your looking at
                    //ctx.fillRect (round(px), round(py), unitSize, unitSize);

                    if (VxHigh < 0){
                        break;
                    }

                    Highest = VxHigh + 0.5;
                 }

                px += ix;
                py += iy;
                dy += idy;
             }
        }

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
        var waterStart={r:39,g:50,b:63},
            waterEnd={r:10,g:20,b:40},
            sandStart={r:98,g:105,b:83},
            sandEnd={r:189,g:189,b:144},
            grassStart={r:67,g:100,b:18},
            grassEnd={r:22,g:38,b:3},
            mtnEnd={r:67,g:80,b:18},
            mtnStart={r:60,g:56,b:31},
            rockStart={r:130,g:130,b:130},
            rockEnd={r:90,g:90,b:90},
            snowStart={r:200,g:200,b:200},
            snowEnd={r:255,g:255,b:255};


        for(x = 0; x <= size; x += unitSize){
            for(y = 0; y <= size; y += unitSize){
                colorFill = {r : 0, g : 0, b : 0};

                switch(mapType){
                    case 1: // Color map
                        var  data = mapData[x][y];
                        if (data >= 0 && data <= 0.3) {
                            colorFill = fade(waterStart, waterEnd, 30, parseInt(data * 100, 10));
                        } else if (data > 0.3 && data <= 0.35) {
                            colorFill = fade(sandStart, sandEnd, 5, parseInt(data * 100, 10) - 30);
                        } else if (data > 0.35 && data <= 0.8) {
                            colorFill = fade(grassStart, grassEnd, 45, parseInt(data * 100, 10) - 35);
                        } else if (data > 0.8 && data <= 0.95) {
                            colorFill = fade(mtnStart, mtnEnd, 15, parseInt(data * 100, 10) - 80);
                        } else if (data > 0.95 && data <= 1) {
                            colorFill = fade(rockStart, rockEnd, 5, parseInt(data * 100, 10) - 98);
                        }
                        break;
                    case 2: // Standard
                        var standardShade = Math.floor(map[x][y] * 250);
                        colorFill = {r : standardShade, g : standardShade, b : standardShade};
                        break;
                    case 3: // 10 shades
                        var greyShade = Math.round(~~(mapData[x][y]*100)/25)*25;
                        colorFill = {r : greyShade, g : greyShade, b : greyShade};
                        break;
                    case 4: // 2 shades
                        if(mapData[x][y] <= 0.5){
                            mapData[x][y] = 0;
                        }else if(mapData[x][y] > 0.5){
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
                        var pData = (~~ (x+w) + (~~ (y+h) * canvas.width)) * 4;

                        imgData[pData] = colorFill.r;
                        imgData[pData + 1] = colorFill.g;
                        imgData[pData + 2] = colorFill.b;
                        imgData[pData + 3] = 255;
                    }
                }
            }
        }

        ctx.putImageData(img, 0, 0);

        // utility for color interpolation
        function fade(colorStart, colorEnd, totalSteps, step) {
            var rStart = colorStart.r,
                rEnd = colorEnd.r,
                gStart = colorStart.g,
                gEnd = colorEnd.g,
                bStart = colorStart.b,
                bEnd = colorEnd.b,
                r = rEnd + (~~ ((rStart - rEnd) / totalSteps) * step),
                g = gEnd + (~~ ((gStart - gEnd) / totalSteps) * step),
                b = bEnd + (~~ ((bStart - bEnd) / totalSteps) * step);

            return {
                r: r,
                g: g,
                b: b
            };
        }
    }
}