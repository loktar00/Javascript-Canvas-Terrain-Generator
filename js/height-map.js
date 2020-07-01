export default class HeightMap {
    constructor(mapDimension = 256, unitSize = 1, roughness = 8, tile = false) {
        this.mapDimension = mapDimension;
        this.unitSize = unitSize;
        this.roughness = roughness;
        this.tile = true;

        this.map = Array(mapDimension + 1).fill(0).map(el => new Array(mapDimension + 1).fill(0).map(el => 0));
        this.startDisplacement();
    }

    get mapData() {
        return this.map;
    }

    // Starts off the map generation, seeds the first 4 corners
    startDisplacement = () => {
        const {map, mapDimension, tile} = this;

        // top left
        map[0][0] = Math.random();

        // bottom left
        map[0][mapDimension] = Math.random();

        // top right
        map[mapDimension][0] = Math.random();

        // bottom right
        map[mapDimension][mapDimension] = Math.random();

        // Center
        map[mapDimension / 2][mapDimension / 2] = map[0][0] + map[0][mapDimension] + map[mapDimension][0] + map[mapDimension][mapDimension] / 4;
        map[mapDimension / 2][mapDimension / 2] = this.normalize(map[mapDimension / 2][mapDimension / 2]);

        this.midpointDisplacment(mapDimension);
    }

    midpointDisplacment = (plot) => {
        const {map, mapDimension, unitSize} = this;

        const subPlot = plot / 2;

        if (subPlot > unitSize){
            for (let i = subPlot; i <= mapDimension; i += subPlot) {
                for (let j = subPlot; j <= mapDimension; j += subPlot) {
                    const x = i - (subPlot / 2);
                    const y = j - (subPlot / 2);

                    const topLeft = map[i - subPlot][j - subPlot];
                    const topRight = map[i][j - subPlot];
                    const bottomLeft = map[i - subPlot][j];
                    const bottomRight = map[i][j];

                    // Center
                    map[x][y] = (topLeft + topRight + bottomLeft + bottomRight) / 4 + this.displace(plot);
                    map[x][y] = this.normalize(map[x][y]);

                    const center = map[x][y];

                    // Top
                    const top = topLeft + topRight + center;

                    if (j > subPlot) {
                        map[x][j - subPlot] = (top + map[x][j - plot + (subPlot / 2)]) / 4 + this.displace(plot);
                    } else {
                        map[x][j - subPlot] = top / 3 + this.displace(plot);
                    }

                    map[x][j - subPlot] = this.normalize(map[x][j - subPlot]);

                    // Bottom
                    const bottom = bottomLeft + bottomRight + center;

                    if (j < mapDimension) {
                        map[x][j] = (bottom + map[x][j + (subPlot / 2)]) / 4 + this.displace(plot);
                    } else {
                        map[x][j] = bottom / 3 + this.displace(plot);
                    }

                    map[x][j] = this.normalize(map[x][j]);

                    //Right
                    const right = topRight + bottomRight + center;

                    if(i < mapDimension){
                        map[i][y] = (right + map[i + (subPlot / 2)][y]) / 4 + this.displace(plot);
                    } else {
                        map[i][y] = right / 3 + this.displace(plot);
                    }

                    map[i][y] = this.normalize(map[i][y]);

                    // Left
                    const left = topLeft + bottomLeft + center;

                    if(i > subPlot){
                        map[i - subPlot][y] = (left + map[i - plot + (subPlot / 2)][y]) / 4 + this.displace(plot);
                    } else {
                        map[i - subPlot][y] = left / 3 + this.displace(plot);
                    }

                    map[i - subPlot][y] = this.normalize(map[i - subPlot][y]);
                }
            }

            this.midpointDisplacment(subPlot);
        }
    }

    // Random function to offset the center
    displace = (amount) => {
        const { mapDimension, roughness } = this;
        const max = amount / ( mapDimension * 2 ) * roughness;
        return (Math.random() - 0.5) * max;
    }

    // Normalize the value to make sure its within bounds
    normalize = (value) => {
        return Math.max(Math.min(value, 1), 0);
    }
}