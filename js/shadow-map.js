export default class ShadowMap {
    constructor (size, sunX, sunY, sunZ, mapData) {
        this.size = size;
        this.sunX = sunX;
        this.sunY = sunY;
        this.sunZ = sunZ;
        this.mapData = mapData;
        this.canvas = document.createElement("canvas");
        this.ctx = canvas.getContext("2d");

        this.unitSize = 1; // make configurable

        this.magLookup = Array(size + 1).fill(0).map(el => new Array(size + 1).fill(0).map(el => 0));
        this.magCached = false;
    }

    drawMap = () => {
        const {size, sunX, sunY, sunZ, unitSize, mapData, magLookup, magCached, canvas, ctx} = this;

        canvas.width = canvas.height = size;

        const img = ctx.createImageData(size, size);
        const imgData = img.data;

        for (let x = 0; x < size; x += unitSize) {
            for (let y = 0; y < size; y += unitSize) {
                let dX = sunX - x;
                let dY = sunY - y;
                let dZ = sunZ - mapData[x][y];
                let mag = magLookup[x][y];

                if (!magCached) {
                    mag = Math.sqrt(dX * dX + dY * dY + dZ * dZ);
                    magLookup[x][y] = mag;
                }

                dX = (dX / mag);
                dY = (dY / mag);
                dZ = (dZ / mag);

                let pX = x;
                let pY = y;
                let pZ = mapData[x][y];

                while(pX > 0 && pX < size && pY > 0 && pY < size && pZ < sunZ){

                    if((mapData[~~(pX)][~~(pY)]) > pZ){
                        const colorFill = {r : 0, g : 0, b : 0, a : 200};

                        for (let w = 0; w < unitSize; w++) {
                            for (let h = 0; h < unitSize; h++) {
                                let pData = (~~ (x + w) + (~~ (y + h) * canvas.width)) * 4;

                                imgData[pData] = colorFill.r;
                                imgData[pData + 1] = colorFill.g;
                                imgData[pData + 2] = colorFill.b;
                                imgData[pData + 3] += colorFill.a;
                            }
                        }
                    }

                    pX += (dX * unitSize);
                    pY += (dY * unitSize);
                    pZ += (dZ * unitSize);
                }
            }
        }

        this.magCached = true;
        ctx.putImageData(img, 0, 0);
    }

    get map() {
        return this.canvas;
    }
}
