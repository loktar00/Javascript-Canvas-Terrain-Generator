(function() {
    const template = document.createElement('template');
    template.innerHTML = `
        <canvas id="terrain-canvas"></canvas>
    `;

    class HeightMap extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({mode: 'open'});
            this.shadowRoot.appendChild(template.content.cloneNode(true));
        }

        connectedCallback() {
            if (!this.hasAttribute('size')) {
                this.setAttribute('size', 128);
            }

            if (!this.hasAttribute('unit')) {
                this.setAttribute('unit', 1);
            }

            if (!this.hasAttribute('rough')) {
                this.setAttribute('rough', 5);
            }

            this.terrainGenerator();
        }

        get size() {
            return parseInt(this.getAttribute('size'), 10);
        }

        get unit() {
            return  parseInt(this.getAttribute('unit'), 10);
        }

        get rough() {
            return  parseInt(this.getAttribute('rough'), 10);
        }

        normalize(value) {
            return Math.max(Math.min(value, 1), 0);
        }

        // Random function to offset the center
        displace(num) {
            const {size, rough} = this;
            const max = num / (size + size) * rough;
            return (Math.random() - 0.5) * max;
        }


        // Draw the map
        drawMap(canvasId) {
            const {unit, size, map} = this;
            const canvas = this.shadowRoot.getElementById('terrain-canvas');
            const ctx = canvas.getContext("2d");
            const img = ctx.createImageData(canvas.height, canvas.width);
            let imgData = img.data;

            for(let x = 0; x <= size - 1; x += unit){
                for(let y = 0; y <= size - 1; y += unit){
                    const standardShade = Math.floor(map[x][y] * 250);
                    const colorFill = {r : standardShade, g : standardShade, b : standardShade};

                    for (let w = 0; w <= unit; w++) {
                        for (let h = 0; h <= unit; h++) {
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
        }

          // Workhorse of the terrain generation.
        midpointDisplacment(dimension){
            const {unit, size, map} = this;

            const newDimension = dimension / 2;
            let topRight = 0;
            let topLeft = 0;
            let bottomLeft = 0;
            let bottomRight = 0;
            let center = 0;
            let x = 0;
            let y = 0;

            if (newDimension > unit) {
                for(let i = newDimension; i <= size; i += newDimension){
                    for(let j = newDimension; j <= size; j += newDimension){
                        x = i - (newDimension / 2);
                        y = j - (newDimension / 2);

                        topLeft = map[i - newDimension][j - newDimension];
                        topRight = map[i][j - newDimension];
                        bottomLeft = map[i - newDimension][j];
                        bottomRight = map[i][j];

                        // Center
                        map[x][y] = (topLeft + topRight + bottomLeft + bottomRight) / 4 + this.displace(dimension);
                        map[x][y] = this.normalize(map[x][y]);
                        center = map[x][y];

                        // Top
                        if(j - (newDimension * 2) + (newDimension / 2) > 0){
                            map[x][j - newDimension] = (topLeft + topRight + center + map[x][j - dimension + (newDimension / 2)]) / 4 + this.displace(dimension);
                        }else{
                            map[x][j - newDimension] = (topLeft + topRight + center) / 3 + this.displace(dimension);
                        }

                        map[x][j - newDimension] = this.normalize(map[x][j - newDimension]);

                        // Bottom
                        if(j + (newDimension / 2) < size){
                            map[x][j] = (bottomLeft + bottomRight + center + map[x][j + (newDimension / 2)]) / 4 + this.displace(dimension);
                        }else{
                            map[x][j] = (bottomLeft + bottomRight + center) / 3 + this.displace(dimension);
                        }

                        map[x][j] = this.normalize(map[x][j]);

                        //Right
                        if (i + (newDimension / 2) < size) {
                            map[i][y] = (topRight + bottomRight + center + map[i + (newDimension / 2)][y]) / 4 + this.displace(dimension);
                        } else {
                            map[i][y] = (topRight + bottomRight + center) / 3 + this.displace(dimension);
                        }

                        map[i][y] = this.normalize(map[i][y]);

                        // Left
                        if (i - (newDimension * 2) + (newDimension / 2) > 0) {
                            map[i - newDimension][y] = (topLeft + bottomLeft + center + map[i - dimension + (newDimension / 2)][y]) / 4 + this.displace(dimension);
                        } else {
                            map[i - newDimension][y] = (topLeft + bottomLeft + center) / 3 + this.displace(dimension);
                        }

                        map[i - newDimension][y] = this.normalize(map[i - newDimension][y]);
                    }
                }

                this.midpointDisplacment(newDimension);
            }
        }

        startDisplacement(){
            const {size, map} = this;
            let topRight = 0;
            let topLeft = 0;
            let bottomRight = 0;
            let bottomLeft = 0;
            let center = 0;

            // top left
            map[0][0] = Math.random();
            topLeft = map[0][0];

            // bottom left
            map[0][size] = Math.random();
            bottomLeft = map[0][size];

            // top right
            map[size][0] = Math.random();
            topRight = map[size][0];

            // bottom right
            map[size][size] = Math.random();
            bottomRight = map[size][size];

            // Center
            map[size / 2][size / 2] = map[0][0] + map[0][size] + map[size][0] + map[size][size] / 4;
            map[size / 2][size / 2] = this.normalize(map[size / 2][size / 2]);
            center = map[size / 2][size / 2];

            /* Non wrapping terrain */
            map[size / 2][size] = bottomLeft + bottomRight + center / 3;
            map[size / 2][0] = topLeft + topRight + center / 3;
            map[size][size / 2] = topRight + bottomRight + center / 3;
            map[0][size / 2] = topLeft + bottomLeft + center / 3;

            // Call displacment
            this.midpointDisplacment(size);
        }

        generateTerrainMap() {
            const {size} = this;
            this.map = Array(size + 1).fill(0).map(el => new Array(size + 1).fill(0).map(el => 0));
            this.startDisplacement();
        }

        terrainGenerator() {
            const {size, unit, rough} = this;
            const mapCanvas = this.shadowRoot.getElementById('terrain-canvas');

            mapCanvas.width = size;
            mapCanvas.height = size;

            this.generateTerrainMap(size, unit, rough);

            // Draw everything after the terrain vals are generated
            this.drawMap('terrain-canvas');
        }
    }

    window.customElements.define('height-map', HeightMap);
})();