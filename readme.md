Javascript Terrain Generator
====================

Generates heightmaps, and shadow maps using JS and canvas.

[See it in action](http://loktar00.github.io/Javascript-Canvas-Terrain-Generator/)


### Things that still need to be done

- Improve the shadow map rendering
- modernize primary src files

### Web Component

Use as a web component, source in webcomponent

```
    <script type="module" src="/height-map.js"></script>
    <body>
        <height-map></height-map>
    </body>
``

## Options

Attribute     | Options     | Default      | Description
---           | ---         | ---          | ---
`size`         | *int*    | `128`        | Power of 2 size of element
`unit`         | *int*    | `1`         | Resolution size of pixels
`rough`         | *int*    | `5`        | Roughness value for terrain generation

