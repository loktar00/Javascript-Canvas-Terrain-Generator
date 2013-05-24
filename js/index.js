window.onload = terrainGeneration;

function terrainGeneration(){
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
		voxCanvas = document.getElementById('voxelview');	
	
	generate.onclick = function(){
		var elTerDimension = document.getElementById('terdim'),
			elRoughness = document.getElementById('roughness'),
			elUnitsize = document.getElementById('unitsize'),
			selMapType = document.getElementById('maptype'),
			chkPerspective = document.getElementById('perspective'),
			chkShadowMap = document.getElementById('shadowmap');
			elSunX = document.getElementById("sunx"),
			elSunY = document.getElementById("suny");			
			
		roughness = parseInt(elRoughness.value);
		mapDimension = parseInt(elTerDimension.value);
		unitSize = parseInt(elUnitsize.value);
		mapType = parseInt(selMapType.options[selMapType.selectedIndex].value);
		genPerspective = chkPerspective.checked;
		genShadows = chkShadowMap.checked;
		
		if(roughness < 0 || isNaN(roughness)){
			roughness = 1;
		}
		
		if(mapDimension < 0 || isNaN(mapDimension)){
			mapDimension = 256;
		}
		
		if(unitSize < 1 || isNaN(unitSize)){
			unitSize = 1;
		}
		
		if(genShadows){
			sunX = parseInt(elSunX.value);
			sunY = parseInt(elSunY.value);
			
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
			drawShadowMap(mapDimension, sunX, sunY, 3);
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
	}
	
	// Round to nearest pixel
	function round(n)
	{
		if (n-(parseInt(n)) >= 0.5){
			return parseInt(n)+1;
		}else{
			return parseInt(n);
		}
	}
	
	//Create Shadowmap
	function drawShadowMap(size, sunPosX, sunPosY, sunHeight){
		var ctx = mapCanvas.getContext("2d"),
		x = 0, y = 0,
		idx,
		colorFill = 0,
		sunX, sunY, sunZ, 
		pMag, pX, pY, pZ,
		mag, dX, dY, dZ,
		ambLight;
		
		// Suns position
		sunX = sunPosX;
		sunY = sunPosY;
		sunZ = sunHeight;
		ambLight = 0;
		
		for(x = 0; x <= mapDimension; x += unitSize){
			for(y = 0; y <=  mapDimension; y += unitSize){		
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
				
				while(pX >= 0 && pX < mapDimension && pY >= 0 && pY < mapDimension && pZ <= sunZ){
					
					if((map[round(pX)][round(pY)]) > pZ){
					
						ctx.fillStyle = "rgba(" + 0 + "," +  0 + "," + 0 +"," + 0.7 + ")";
						ctx.fillRect (x, y, unitSize, unitSize);
						break;
					}
					
					pX += (dX * unitSize);
					pY += (dY * unitSize);
					pZ += (dZ * unitSize);
				}
			}
		}
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
		
		
		var Ray = 0, AngRay, iRay, ix, iy, iz, px, py, pz, dx, dy, dz, idz, fov, Highest, VxHigh, ScreenAt, MidOut, vy;
		
		//Field of view
		fov = 1;		
		iRay = fov / mapDimension;

		// Gets the distance multiplier for the camera
		ScreenAt = parseInt((mapDimension / 2) * Math.tan(fov / 2));
		
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
		canvasData = ctx.getImageData(0, 0, mapDimension, mapDimension),
		x = 0,
		y = 0,
		r = 0, g = 0, b = 0, gamma = 500,
		colorFill = 0;
		
		for(x = 0; x <= size; x += unitSize){
			for(y = 0; y <= size; y += unitSize){
				switch(mapType){
					case 1: // Color map
						if(mapData[x][y] < 0){
							colorFill = "001b92";
						}else if(mapData[x][y] >= 0 && mapData[x][y] <= 0.3){
							colorFill = colorFade("0x001b92","0x234af1",(mapData[x][y] * 200)/(0.4 * 200)).toString(16);
						}else if(mapData[x][y] > 0.3 && mapData[x][y] <= 0.8){
							colorFill = colorFade("0xe3deb0","0x3a8e40",(mapData[x][y] * 200)/(0.8 * 200)).toString(16);
						}else if(mapData[x][y] > 0.8 && mapData[x][y] <= 0.98){
							colorFill = colorFade("0x3a8e40","0x7e7e7e",(mapData[x][y] * 200)/(0.98 * 200)).toString(16);
						}else if(mapData[x][y] > 0.98 && mapData[x][y] <= 1){
							colorFill = colorFade("0x7e7e7e","0xdfdfdf",(mapData[x][y] * 200)/(1 * 200)).toString(16);
						}else if(mapData[x][y] >= 1){
							colorFill = "c6c6c6";
						}
						ctx.fillStyle = "#" + colorFill;
						break;
					case 2: // Standard
						colorFill = Math.floor(map[x][y] * 250);
						ctx.fillStyle = "rgb(" + colorFill + "," +  colorFill + "," + colorFill +")";
						break;
					case 3: // 10 shades
						if(mapData[x][y] <= 0){
							colorFill  = 0;
						}else if(mapData[x][y] > 0 && mapData[x][y] <= 0.1){
							colorFill = 20;
						}else if(mapData[x][y] > 0.1 && mapData[x][y] <= 0.2){
							colorFill = 40;
						}else if(mapData[x][y] > 0.2 && mapData[x][y] <= 0.3){
							colorFill = 60;
						}else if(mapData[x][y] > 0.3 && mapData[x][y] <= 0.4){
							colorFill = 80;
						}else if(mapData[x][y] > 0.4 && mapData[x][y] <= 0.5){
							colorFill = 100;
						}else if(mapData[x][y] > 0.5 && mapData[x][y] <= 0.6){
							colorFill = 120;
						}else if(mapData[x][y] > 0.6 && mapData[x][y] <= 0.7){
							colorFill = 140;
						}else if(mapData[x][y] > 0.7 && mapData[x][y] <= 0.8){
							colorFill = 160;
						}else if(mapData[x][y] > 0.8 && mapData[x][y] <= 0.9){
							colorFill = 180;
						}else if(mapData[x][y] > 0.9 && mapData[x][y] <= 1){
							colorFill = 200;
						}else if(mapData[x][y] >= 1){
							colorFill = 210;
						}
						
						ctx.fillStyle = "rgb(" + colorFill + "," +  colorFill + "," + colorFill +")";
						break;
					case 4: // 2 shades
						if(mapData[x][y] <= 0.5){
							mapData[x][y] = 0;
						}else if(mapData[x][y] > 0.5){
							mapData[x][y] = 220;
						}
						
						colorFill = mapData[x][y];
						ctx.fillStyle = "rgb(" + colorFill + "," +  colorFill + "," + colorFill +")";
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
						
						ctx.fillStyle = "rgb(" + Math.floor(r) + "," +  Math.floor(g) + "," + Math.floor(b) +")";
						break;
				}
				
				ctx.fillRect (x, y, unitSize, unitSize);
			}
		}
	}
};	