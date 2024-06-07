import { Floor } from "src/app/components/enum.data";
import { Other } from "src/app/house-parts/other.model";
import {
  Elevation,
  RoofPoint,
  RoofStyle,
  RoofType,
} from "src/app/house/cross.model";
import { House, HousePart } from "src/app/house/house.model";
import { PolylineSVG } from "src/app/house-parts/svg-other/polyline.svg";
import { PolygonSVG } from "src/app/house-parts/svg-other/polygon.svg";
import { PathSVG } from "src/app/house-parts/svg-other/path.svg";
import { Measure } from "src/app/house-parts/measure.model";
import { angleBetween } from "src/app/shared/global-functions";
import { HousePartModel } from "src/app/house-parts/model/housePart.model";
import { CircleSVG } from "src/app/house-parts/svg-other/circle.svg";
const measureRoof = () => {
  return [
    new Measure({
      housePart: HousePart.measures,
      selector: "house-width",
      floor: Floor.all,
      direction: -90,
      textRotate: 0,
      decimals: 3,
      onUpdate: function (this: Measure, house: House) {
        const cross = house.cross;
        this.offsetMeters = 2;
        this.a = [0, 0];
        this.b = [cross.innerWidth, 0];
      },
    }),
    new Measure({
      housePart: HousePart.measures,
      selector: "house-inner-width",
      floor: Floor.all,
      direction: -90,
      textRotate: 0,
      decimals: 3,
      onUpdate: function (this: Measure, house: House) {
        const cross = house.cross;
        this.offsetMeters = 1;
        this.a = [cross.wallOuterThickness, 0];
        this.b = [cross.innerWidth - cross.wallOuterThickness, 0];
      },
    }),

    new Measure({
      housePart: HousePart.measures,
      selector: "minimum",
      floor: Floor.all,
      direction: 0,
      textRotate: 0,
      decimals: 3,
      onUpdate: function (this: Measure, house: House) {
        const cross = house.cross;
        const level = cross.elevations[Elevation.topFloor];
        const i = cross.getIntersectionWithRoof(cross.minimumHeight);
        this.offsetPixels = -5;
        this.offsetMeters = -0;
        const x = cross.innerWidth - i[0];
        this.a = [x, -level];
        this.b = [x, -i[1]];
        this.outOfDesign = cross.wallOuterThickness === i[0];
      },
    }),
    new Measure({
      housePart: HousePart.measures,
      selector: "minimum-h",
      floor: Floor.all,
      direction: -90,
      textRotate: 0,
      decimals: 3,
      onUpdate: function (this: Measure, house: House) {
        const cross = house.cross;
        const level = cross.elevations[Elevation.topFloor];
        const i = cross.getIntersectionWithRoof(cross.minimumHeight);
        this.offsetPixels = 0;
        this.offsetMeters = 1.5;
        const x = cross.innerWidth - i[0];
        this.a = [x, -i[1]];
        this.b = [x + i[0] - cross.wallOuterThickness, -level];
        this.setVisibility(cross.wallOuterThickness !== i[0]);
      },
    }),
    new Measure({
      housePart: HousePart.measures,
      selector: "minimum-room",
      floor: Floor.all,
      direction: 0,
      textRotate: 0,
      decimals: 3,
      onUpdate: function (this: Measure, house: House) {
        const cross = house.cross;
        const level = cross.elevations[Elevation.topFloor];
        const i = cross.getIntersectionWithRoof(cross.minimumHeightRoom);
        this.offsetPixels = -20;
        this.offsetMeters = -0;
        const x = cross.innerWidth - i[0];
        this.a = [x, -level];
        this.b = [x, -i[1]];
      },
    }),

    new Measure({
      housePart: HousePart.measures,
      selector: "minimum-room-h",
      floor: Floor.all,
      direction: -90,
      textRotate: 0,
      decimals: 3,
      onUpdate: function (this: Measure, house: House) {
        const cross = house.cross;
        const level = cross.elevations[Elevation.topFloor];
        const i = cross.getIntersectionWithRoof(cross.minimumHeightRoom);
        this.offsetPixels = 0;
        this.offsetMeters = 1.5;
        const x = cross.innerWidth - i[0];
        this.a = [x, -i[1]];
        this.b = [x + i[0] - cross.wallOuterThickness, -level];
      },
    }),
    new Measure({
      housePart: HousePart.measures,
      selector: "lower-roof",
      floor: Floor.all,
      textRotate: 0,
      decimals: 3,
      onUpdate: function (this: Measure, house: House) {
        const cross = house.cross;
        const high = cross.roofPoints[RoofPoint.bendInside];
        const low = cross.roofPoints[RoofPoint.wallInside];
        this.offsetPixels = 0;
        this.offsetMeters = -0.5;
        this.a = [low[0], -low[1]];
        this.b = [high[0], -high[1]];
        this.direction = angleBetween(this.a, this.b) - 90;
      },
    }),
    new Measure({
      housePart: HousePart.measures,
      selector: "lower-roof-outside",
      floor: Floor.all,
      textRotate: 0,
      decimals: 3,
      onUpdate: function (this: Measure, house: House) {
        const cross = house.cross;
        const high = cross.roofPoints[RoofPoint.bendOutside];
        const low = cross.roofPoints[RoofPoint.sprocketOutside];
        this.offsetPixels = 0;
        this.offsetMeters = 0.5;
        this.a = [low[0], -low[1]];
        this.b = [high[0], -high[1]];
        this.direction = angleBetween(this.a, this.b) - 90;
      },
    }),
    new Measure({
      housePart: HousePart.measures,
      selector: "lower-roof-outside-total",
      floor: Floor.all,
      textRotate: 0,
      decimals: 3,
      onUpdate: function (this: Measure, house: House) {
        const cross = house.cross;
        const high = cross.roofPoints[RoofPoint.bendOutside];
        const low = cross.roofPoints[RoofPoint.lowestOutside];
        this.offsetPixels = 0;
        this.offsetMeters = 1.0;
        this.a = [low[0], -low[1]];
        this.b = [high[0], -high[1]];
        this.direction = angleBetween(this.a, this.b) - 90;
      },
    }),

    new Measure({
      housePart: HousePart.measures,
      selector: "higher-roof",
      floor: Floor.all,
      textRotate: 0,
      decimals: 3,
      onUpdate: function (this: Measure, house: House) {
        const cross = house.cross;
        const low = cross.roofPoints[RoofPoint.bendInside];
        const high = cross.roofPoints[RoofPoint.topInside];
        this.offsetPixels = 0;
        this.offsetMeters = -0.5;
        this.a = [low[0], -low[1]];
        this.b = [high[0], -high[1]];
        this.direction = angleBetween(this.a, this.b) - 90;
      },
    }),
    new Measure({
      housePart: HousePart.measures,
      selector: "higher-roof-outside",
      floor: Floor.all,
      textRotate: 0,
      decimals: 3,
      onUpdate: function (this: Measure, house: House) {
        const cross = house.cross;
        const low = cross.roofPoints[RoofPoint.bendOutside];
        const high = cross.roofPoints[RoofPoint.topOutside];
        this.offsetPixels = 0;
        this.offsetMeters = 0.5;
        this.a = [low[0], -low[1]];
        this.b = [high[0], -high[1]];
        this.direction = angleBetween(this.a, this.b) - 90;
      },
    }),
    new Measure({
      housePart: HousePart.measures,
      selector: "facade",
      floor: Floor.all,
      textRotate: 0,
      decimals: 3,
      onUpdate: function (this: Measure, house: House) {
        const cross = house.cross;
        const low = [0, cross.elevations[Elevation.ground]];
        const high = cross.roofPoints[RoofPoint.topFacade];
        this.offsetPixels = 40;
        this.offsetMeters = -2;
        this.a = [0, -low[1]];
        this.b = [0, -high[1]];
        this.direction = 0;
      },
    }),

    new Measure({
      housePart: HousePart.measures,
      selector: "height",
      floor: Floor.all,
      textRotate: 0,
      decimals: 3,
      direction: 180,
      onUpdate: function (this: Measure, house: House) {
        const cross = house.cross;
        const low = [0, cross.elevations[Elevation.ground]];
        const high = cross.roofPoints[RoofPoint.topOutside];
        this.offsetPixels = 80;
        this.offsetMeters = 0;
        this.a = [cross.innerWidth, -low[1]];
        this.b = [high[0], -high[1]];
        this.direction = 0; //
      },
    }),
  ];
};
const drawRoofCircle = () => {
  return [
    new Other<PolygonSVG>({
      type: "polygon",
      housePart: HousePart.roofCircle,
      floor: Floor.all,
      selector: "building-roof-circle-wall1",

      dataSVG: {},
      onUpdate: function (this: Other<PolygonSVG>, house: House) {
        const cross = house.cross;
        this.square(cross.wallOuterThickness, cross.roofCircleWalls, [
          cross.innerWidth - cross.wallOuterThickness,
          -cross.elevations[Elevation.topFloor] - cross.roofCircleWalls,
        ]);
        this.coords[0][1] -= 1;
      },
    }),
    new Other<PolygonSVG>({
      type: "polygon",
      housePart: HousePart.roofCircle,
      floor: Floor.all,
      selector: "building-roof-circle-wall2",

      dataSVG: {},
      onUpdate: function (this: Other<PolygonSVG>, house: House) {
        const cross = house.cross;
        this.square(cross.wallOuterThickness, cross.roofCircleWalls, [
          0,
          -cross.elevations[Elevation.topFloor] - cross.roofCircleWalls,
        ]);
        this.coords[1][1] -= 1;
      },
    }),
    new Other<PolygonSVG>({
      type: "polygon",
      housePart: HousePart.roofCircle,
      floor: Floor.all,
      selector: "roof-circle-fill",
      dataSVG: {},
      onUpdate: function (this: Other<PolygonSVG>, house: House) {
        const cross = house.cross;
        this.coords = [
          ...[0, 1, 2, 3, 4].map((i) =>
            cross.pointOnCircleRoof(Math.PI * -(i / 4), RoofType.outer)
          ),
        ].map((x) => {
          return [x[0], -x[1]];
        });
      },
    }),
    new Other<PolygonSVG>({
      type: "polygon",
      housePart: HousePart.roofCircle,
      floor: Floor.all,
      selector: "roof-circle-shadow",
      dataSVG: {},
      onUpdate: function (this: Other<PolygonSVG>, house: House) {
        const cross = house.cross;
        this.coords = [
          ...[0, 1, 2, 3, 4].map((i) =>
            cross.pointOnCircleRoof(Math.PI * -(i / 4), RoofType.outer)
          ),
          ...[0, 1, 2, 3, 4]
            .map((i) =>
              cross.pointOnCircleRoof(Math.PI * -(i / 4), RoofType.inner)
            )
            .reverse(),
        ].map((x) => {
          return [x[0], -x[1]];
        });
      },
    }),
    new Other<PolygonSVG>({
      type: "polygon",
      housePart: HousePart.roofCircle,
      floor: Floor.all,
      selector: "roof-circle",
      dataSVG: {
        fill: "url(#clip-roof2)",
      },
      onUpdate: function (this: Other<PolygonSVG>, house: House) {
        const cross = house.cross;
        this.coords = [
          ...[0, 1, 2, 3, 4].map((i) =>
            cross.pointOnCircleRoof(Math.PI * -(i / 4), RoofType.outer)
          ),
          ...[0, 1, 2, 3, 4]
            .map((i) =>
              cross.pointOnCircleRoof(Math.PI * -(i / 4), RoofType.inner)
            )
            .reverse(),
        ].map((x) => {
          return [x[0], -x[1]];
        });
      },
    }),

    new Other<PathSVG>({
      type: "path",
      floor: Floor.all,
      selector: "roof-circle__h-circle",
      dataSVG: {
        lineThickness: 2,
      },
      onUpdate: function (this: Other<PathSVG>, house: House) {
        const cross = house.cross;
        const [x, y] = cross.pointOnCircleRoof(0, RoofType.outer);
        const extraRadius = x - cross.innerWidth;
        const radius = extraRadius * 2 + cross.innerWidth;
        this.dataSVG.d = `M${radius},0 a1,1 0 0,0 ${-radius},0`;
        this.dataSVG.transform = `translate(${-extraRadius} ${-y})`;
        this.applyDataSVG();
      },
    }),
    new Other<PolylineSVG>({
      type: "polyline",
      housePart: HousePart.roofCircle,
      floor: Floor.all,
      selector: "roof-circle__h-line",
      dataSVG: {
        lineThickness: 2,
      },
      onUpdate: function (this: Other<PolylineSVG>, house: House) {
        const cross = house.cross;
        const left = cross.pointOnCircleRoof(Math.PI, RoofType.outer);
        const center = [cross.roofCenter[0], left[1]];
        this.coords = [
          cross.pointOnCircleRoof(Math.PI * (-3 / 4), RoofType.sketch), // top-left
          center,
          left, // left
          cross.pointOnCircleRoof(0, RoofType.outer), // right
          center,
          cross.pointOnCircleRoof(Math.PI * (-1 / 4), RoofType.sketch),
        ].map(function (x) {
          return [x[0], -x[1]];
        });
      },
    }),
  ];
};
const pointDiameter = 0.2;
const drawRoof70 = () => {
  return [
    new Other<PolygonSVG>({
      type: "polygon",
      housePart: HousePart.roof70,
      floor: Floor.all,
      selector: "building-roof-70-wall1",

      dataSVG: {},
      onUpdate: function (this: Other<PolygonSVG>, house: House) {
        const cross = house.cross;
        this.square(cross.wallOuterThickness, cross.roof70Walls, [
          0,
          -cross.elevations[Elevation.topFloor] - cross.roof70Walls,
        ]);
        this.coords[1][1] -= 1;
      },
    }),
    new Other<PolygonSVG>({
      type: "polygon",
      housePart: HousePart.roof70,
      floor: Floor.all,
      selector: "building-roof-70-wall2",

      dataSVG: {},
      onUpdate: function (this: Other<PolygonSVG>, house: House) {
        const cross = house.cross;
        this.square(cross.wallOuterThickness, cross.roof70Walls, [
          cross.innerWidth - cross.wallOuterThickness,
          -cross.elevations[Elevation.topFloor] - cross.roof70Walls,
        ]);
        this.coords[0][1] -= 1;
      },
    }),
    new Other<PolygonSVG>({
      type: "polygon",
      housePart: HousePart.roof70,
      floor: Floor.all,
      selector: "roof-70-fill",
      dataSVG: {},
      onUpdate: function (this: Other<PolygonSVG>, house: House) {
        const cross = house.cross;
        this.coords = cross
          .pointOf70Roof()
          .slice(0, 7)
          .map(([x, y]) => [x, -y]);
      },
    }),
    new Other<PolygonSVG>({
      type: "polygon",
      housePart: HousePart.roof70,
      floor: Floor.all,
      selector: "roof-70-shadow",
      dataSVG: {},
      onUpdate: function (this: Other<PolygonSVG>, house: House) {
        const cross = house.cross;
        this.coords = cross.pointOf70Roof(true).map(([x, y]) => [x, -y]);
      },
    }),
    new Other<PolygonSVG>({
      type: "polygon",
      housePart: HousePart.roof70,
      floor: Floor.all,
      selector: "roof-70",
      dataSVG: {
        fill: "url(#clip-roof2)",
      },
      onUpdate: function (this: Other<PolygonSVG>, house: House) {
        const cross = house.cross;
        this.coords = cross.pointOf70Roof().map(([x, y]) => [x, -y]);
      },
    }),
    new Other<PolygonSVG>({
      type: "polygon",
      housePart: HousePart.roof70,
      floor: Floor.all,
      selector: "building-roof-70-kicker-1",
      dataSVG: {},
      onUpdate: function (this: Other<PolygonSVG>, house: House) {
        const cross = house.cross;
        this.coords = [
          cross.roofPoints[RoofPoint.lowestOutside],
          cross.roofPoints[RoofPoint.sprocketOutside],
          cross.roofPoints[RoofPoint.footOutside],
        ];

        this.coords = this.coords.map((xy) => [xy[0], -xy[1]]);
      },
    }),
    new Other<PolygonSVG>({
      type: "polygon",
      housePart: HousePart.roof70,
      floor: Floor.all,
      selector: "building-roof-70-kicker-2",
      dataSVG: {},
      onUpdate: function (this: Other<PolygonSVG>, house: House) {
        const cross = house.cross;
        this.coords = [
          cross.roofPoints[RoofPoint.lowestOutside],
          cross.roofPoints[RoofPoint.sprocketOutside],
          cross.roofPoints[RoofPoint.footOutside],
        ];
        const offset = cross.innerWidth; // - cross.wallOuterThickness;
        this.coords = this.coords.map((xy) => [offset - xy[0], -xy[1]]);
      },
    }),
    new Other<PolylineSVG>({
      type: "polyline",
      housePart: HousePart.roof70,
      floor: Floor.all,
      selector: "bend-point__h-line",
      dataSVG: {
        lineThickness: 2,
      },
      onUpdate: function (this: Other<PolylineSVG>, house: House) {
        const cross = house.cross;
        const level = cross.elevations[Elevation.topFloor];
        this.coords = [
          [0, -level - cross.roof70Walls],
          [cross.bendPoint[0], -level - cross.roof70Walls],
          [cross.bendPoint[0], -level + cross.bendPoint[1] + pointDiameter],
        ];
      },
    }),
    new Other<CircleSVG>({
      type: "circle",
      housePart: HousePart.roof70,
      floor: Floor.all,
      selector: "bend-point__h-point",
      dataSVG: {
        lineThickness: 2,
      },
      onUpdate: function (this: Other<CircleSVG>, house: House) {
        const cross = house.cross;
        const level = cross.elevations[Elevation.topFloor];

        this.dataSVG.cx = cross.bendPoint[0];
        this.dataSVG.cy = -level + cross.bendPoint[1];
        this.dataSVG.r = pointDiameter;
        this.applyDataSVG();
      },
    }),
  ];
};

export const crossBuildingParts: HousePartModel[] = [
  new Other<PolygonSVG>({
    type: "polygon",

    floor: Floor.all,
    selector: "building-ground-fill",
    dataSVG: {},
    onUpdate: function (this: Other<PolygonSVG>, house: House) {
      const cross = house.cross;
      const margin = 1.5;
      this.square(
        cross.innerWidth + margin * 2,
        Math.abs(cross.elevations[Elevation.ground]) + margin,
        [-margin, -cross.elevations[Elevation.ground]]
      );
    },
  }),

  new Other<PolygonSVG>({
    type: "polygon",

    floor: Floor.all,
    selector: "building-ground",
    dataSVG: {
      fill: "url(#diagonalHatch)",
    },
    onUpdate: function (this: Other<PolygonSVG>, house: House) {
      const cross = house.cross;
      const margin = 1.5;
      const level = Math.abs(cross.elevations[Elevation.ground]);
      const h = cross.crawlerHeight - level;
      this.square(cross.innerWidth + margin * 2, h + margin, [-margin, level]);
    },
  }),

  new Other<PolylineSVG>({
    type: "polyline",
    selector: "building-ground-line",
    dataSVG: {},
    onUpdate: function (this: Other<PolylineSVG>, house: House) {
      const cross = house.cross;
      const level = cross.elevations[Elevation.ground];
      this.coords = [
        [-2, -level],
        [cross.innerWidth + 2, -level],
      ];
    },
  }),
  new Other<PolygonSVG>({
    type: "polygon",

    floor: Floor.all,
    selector: "building-walls",

    dataSVG: {},
    onUpdate: function (this: Other<PolygonSVG>, house: House) {
      const cross = house.cross;
      const topFloor = cross.elevations[Elevation.topFloor];
      const height = topFloor + -cross.elevations[Elevation.crawlerFloor];

      this.square(cross.innerWidth, height, [0, -topFloor]);
    },
  }),
  new Other<PolygonSVG>({
    type: "polygon",

    floor: Floor.all,
    selector: "building-room",

    dataSVG: {},
    onUpdate: function (this: Other<PolygonSVG>, house: House) {
      const cross = house.cross;
      this.square(
        cross.innerWidth - cross.wallOuterThickness * 2,
        cross.ceilingHeight,
        [cross.wallOuterThickness, -cross.elevations[Elevation.ceiling]]
      );
    },
  }),
  new Other<PolygonSVG>({
    type: "polygon",

    floor: Floor.all,
    selector: "building-fill",

    dataSVG: {},
    onUpdate: function (this: Other<PolygonSVG>, house: House) {
      const cross = house.cross;
      const roofWall =
        cross.viewedRoofStyle === RoofStyle.roof70
          ? cross.roof70Walls
          : cross.roofCircleWalls;
      const top = cross.elevations[RoofPoint.wallInside] - 1;
      this.square(cross.innerWidth, top - cross.elevations[Elevation.ground], [
        0,
        -top,
      ]);
    },
  }),
  new Other<PolygonSVG>({
    type: "polygon",

    floor: Floor.all,
    selector: "building-crawler",

    dataSVG: {},
    onUpdate: function (this: Other<PolygonSVG>, house: House) {
      const cross = house.cross;
      this.square(
        cross.innerWidth - cross.wallOuterThickness * 2,
        cross.crawlerHeight,
        [cross.wallOuterThickness, -cross.elevations[Elevation.crawlerCeiling]]
      );

      this.outOfDesign = !house.cross.crawlerSpace;
    },
  }),
  ...drawRoof70(),
  ...drawRoofCircle(),
  ...measureRoof(),
].filter((x) => x);
