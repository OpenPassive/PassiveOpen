import { angleXY, offset, round, sum } from "src/app/shared/global-functions";
import { Floor, Graphic } from "../components/enum.data";
import { getGridLines } from "../house-parts/gridLine.model";
import { createMeasures } from "../house-parts/measure.model";
import { HousePartModel } from "../house-parts/model/housePart.model";
import { Room } from "../house-parts/room.model";
import { createStuds } from "../house-parts/stud.model";
import { Wall, WallSide, WallType } from "../house-parts/wall.model";
import { Construction } from "./construction.model";
import { Cross } from "./cross.model";
import { Garage } from "./garage.model";
import { Stair } from "./stairs.model";

export type xy = [number, number];
export type xyz = [number, number, number];

export enum Stramien {
  a = "a",
  b = "b",
  c = "c",
  d = "d",
  toilet = "toilet",
  hall = "hall",
  walkway = "walkway",
}
export enum GridType {
  in = "in",
  out = "out",
  ground = "ground",
  top = "top",
}

export interface StramienGroup {
  we: { [key in Stramien]?: number };
  ns: { [key in Stramien]?: number };
}

export interface Orientation {
  lat: number;
  lng: number;
  rotation: number;
}

export class HouseUser {
  name: string;
  studAmount: number;
  studDistance: number;
  towerWidth: number;
  wallInnerThickness: number;
  wallOuterThickness: number;
  roofOuterThickness: number;
  studAmountNorth: number;
  studAmountSouth: number;
  studAmountWest: number;
  studAmountEast: number;
  balconyWidth: number;
  showTower: boolean;

  ceilingHeight: number;
  floorAboveGround: number;
  crawlerHeight: number;
  crawlerSpace: boolean;

  orientation: Orientation;
  parts: any[];
  a?: any;
  b?: any;
  garage: Garage;
}

export interface Tower {
  innerCoords: xy[];
  outerCoords: xy[];
  outerWallOffset: number;
  width: number;
  houseIncrement: number;
  innerIncrement: number;
  outerIncrement: number;
  show: boolean;
  innerWallLength: number;
  outerWallLength: number;
  wallOuterThickness: number;
  intersectionEast: xy;
  intersectionWest: xy;
  footprintVisible: boolean;
}

export interface SvgUpdate {
  theme: House;
  floor: Floor;
  meterPerPixel: number;
  redrawAll: boolean;
  graphic: Graphic;
  print: boolean;
}

export enum HousePart {
  footprint = "footprint",
  rooms = "rooms",
  walls = "walls",
  gridLines = "gridLines",
  doors = "doors",
  windows = "windows",
  studs = "studs",
  measures = "measures",
  other = "other",
  example = "example",
  sensors = "sensors",

  roof70 = "roof70",
  roofCircle = "roofCircle",

  stair = "stair",
  stairPlan = "stairPlan",
  stairWalkLine = "stairWalkLine",
  stairDebug = "stairDebug",
  stairCrossBuilding = "stairCrossBuilding",
  stairClip = "stairClip",
  distance = "distance",
}

export class House extends HouseUser {
  outerBase = undefined;
  innerBase = undefined;
  extensionToNorth = undefined;
  extensionToSouth = undefined;
  extensionToWest = undefined;
  extensionToEast = undefined;
  houseWidth = undefined;
  houseLength = undefined;
  gridSizeY = undefined;
  gridSizeX = undefined;
  centerHouse: xy = [undefined, undefined];

  balconyEdge = -0.3;
  balconyDepth = 2.5;

  westRoomWidth = 4;
  midRoomExtended = true;
  eastRoomExtended = true;

  serverRoom: xy = [undefined, undefined];
  stramien: {
    in: StramienGroup;
    out: StramienGroup;
    ground: StramienGroup;
    top: StramienGroup;
  };

  cross = new Cross();
  stair = new Stair();

  houseParts: {
    [key in HousePart]?: HousePartModel[];
  } = {};

  construction = new Construction();

  stats: any = {
    wall: {},
    floor: {},
  };

  tower: Tower = {
    show: undefined,
    innerCoords: undefined,
    outerCoords: undefined,
    outerWallOffset: undefined,
    width: undefined,
    houseIncrement: undefined,
    innerIncrement: undefined,
    outerIncrement: undefined,
    innerWallLength: undefined,
    outerWallLength: undefined,
    intersectionEast: undefined,
    intersectionWest: undefined,
    wallOuterThickness: undefined,
    footprintVisible: false,
  };

  constructor(house: HouseUser) {
    super();
    Object.assign(this, house);
    (window as any).house = this;

    this.cross.ceilingHeight = house.ceilingHeight;
    this.cross.floorAboveGround = house.floorAboveGround;
    this.cross.crawlerHeight = house.crawlerHeight;
    this.cross.crawlerSpace = house.crawlerSpace;

    this.flattenHouseJSON();
    this.calculateHouse();
    this.houseParts.gridLines = getGridLines(this);
    this.houseParts.measures = createMeasures(this);
    this.stair.create(this);

    this.updateHouseParts();
    this.houseParts.studs = createStuds(this);

    this.calculateStats();
  }

  updateHouseParts() {
    Object.keys(HousePart).forEach((key) => {
      this.houseParts[key]?.forEach((model: HousePartModel) => {
        model.onUpdate(this);
        model.afterUpdate();
      });
    });
  }

  /** On startup flatten all */
  flattenHouseJSON() {
    Object.keys(HousePart).forEach((key) => {
      if (this.houseParts[key] === undefined) this.houseParts[key] = []; // Generated
    });
    // Parent, Calculate first, Create selector
    const load = (model: HousePartModel, parent) => {
      if (model === undefined) return;
      if (model.housePart === undefined) {
        console.error(`Unknown house part: ${model.constructor.name}`, model);
        // throw new Error(`Unknown house part: ${model.constructor.name}`);
        return;
      }
      model.parent = parent;
      this.houseParts[model.housePart].push(model);
      if (model.parts) model.parts.forEach((x) => load(x, model));
    };
    this.parts.forEach((x) => load(x, this)); // rooms have house as parent
  }

  getLonLat() {
    return [this.orientation.lng, this.orientation.lat];
  }

  calculateTower() {
    this.tower.wallOuterThickness = this.wallOuterThickness;
    this.tower.outerWallOffset = round(
      this.tower.wallOuterThickness * Math.tan((22.5 * Math.PI) / 180)
    );
    this.tower.innerWallLength = this.towerWidth;
    this.tower.outerWallLength =
      this.tower.outerWallOffset * 2 + this.tower.innerWallLength;
    this.tower.show = this.showTower;
    this.tower.width = this.towerWidth; // no use
    this.tower.houseIncrement = round(
      this.tower.outerWallLength / Math.sqrt(2) + this.tower.outerWallLength
    );
  }

  /**Main calculations */
  calculateHouse() {
    const studWidth = 45 / 1000;
    const studDepth = 300 / 1000;
    const innerWallThickness = 88 / 1000;
    const outerWallThickness = round(
      this.wallOuterThickness - innerWallThickness - studDepth,
      3
    );
    console.log(this.wallOuterThickness - innerWallThickness - studDepth);

    const betweenOutsideStuds = round(
      (this.studAmount - 1) * this.studDistance + studWidth,
      3
    );

    this.innerBase = round(
      betweenOutsideStuds - (studDepth + innerWallThickness) * 2,
      3
    );

    this.outerBase = round(betweenOutsideStuds + outerWallThickness * 2, 3); // ~ 6.2m

    const getShortWall = (i, addHalf = false) =>
      round(
        (i - 1) * this.studDistance +
          studWidth +
          (addHalf ? studDepth : 0) +
          innerWallThickness +
          outerWallThickness -
          this.wallOuterThickness,
        3
      );

    this.extensionToNorth = getShortWall(this.studAmountNorth, true);
    this.extensionToSouth = getShortWall(this.studAmountSouth, true);
    this.extensionToWest = getShortWall(this.studAmountWest);
    this.extensionToEast = getShortWall(this.studAmountEast);

    this.calculateTower();
    if (this.tower.show) {
      this.extensionToNorth = Math.max(
        this.extensionToNorth,
        Math.ceil(this.tower.houseIncrement)
      );
    } else {
      this.tower.houseIncrement = 0;
    }

    const inObj: StramienGroup = {
      we: {
        a: this.wallOuterThickness,
        b: this.extensionToWest + this.wallOuterThickness * 1,
        c:
          this.extensionToWest +
          this.outerBase * 1 +
          this.wallOuterThickness * -1,
        d:
          this.extensionToEast +
          this.outerBase +
          this.extensionToWest +
          this.wallOuterThickness * -1,
      },
      ns: {
        a: this.wallOuterThickness,
        b: this.extensionToNorth + this.wallOuterThickness * 1,
        c:
          this.extensionToNorth + this.outerBase + this.wallOuterThickness * -1,
        d:
          this.extensionToNorth +
          this.outerBase +
          this.extensionToSouth +
          this.wallOuterThickness * -1,
      },
    };

    // this.stair.totalWidth = this.innerBase / 2 + this.stair.walkWidth / 2;
    const phi = 1.61803398875;
    this.stair.totalWidth =
      this.stair.walkWidth * phi + this.stair.walkWidth * 2;

    const hallStramienWE =
      inObj.we.b + this.stair.totalWidth - this.stair.walkWidth;
    const hallStramienNS = inObj.ns.b - 5;

    this.stramien = {
      in: inObj,
      out: {
        we: {
          a: inObj.we.a - this.wallOuterThickness,
          b: inObj.we.b - this.wallOuterThickness,
          c: inObj.we.c + this.wallOuterThickness,
          d: inObj.we.d + this.wallOuterThickness,
        },
        ns: {
          a: inObj.ns.a - this.wallOuterThickness,
          b: inObj.ns.b - this.wallOuterThickness,
          c: inObj.ns.c + this.wallOuterThickness,
          d: inObj.ns.d + this.wallOuterThickness,
        },
      },
      top: {
        we: {
          toilet:
            inObj.we.b + this.stair.totalWidth - this.stair.walkWidth - 0.2,
          hall: inObj.we.b + this.stair.totalWidth + 0.2,
        },
        ns: {
          hall: hallStramienNS + 1.5,
          walkway: inObj.ns.b + 1 + 0.5,
        },
      },
      ground: {
        we: {
          hall: hallStramienWE,
        },
        ns: {
          hall: hallStramienNS,
        },
      },
    };

    this.centerHouse = [
      inObj.we.c - (inObj.we.c - inObj.we.b) / 2,
      inObj.ns.c - (inObj.ns.c - inObj.ns.b) / 2,
    ];

    this.stair.stairOrigin = [hallStramienNS, hallStramienWE];

    this.serverRoom = [
      this.stramien.in.we.c - 1,
      this.stramien.in.ns.b - this.wallInnerThickness,
    ];
    this.houseWidth = round(this.stramien.out.we.d - this.stramien.out.we.a);
    this.houseLength = round(this.stramien.out.ns.d - this.stramien.out.ns.a);

    this.calculateTowerCoords();

    // update

    this.cross.calculate(this);
    this.stair.calculate(this);
    this.construction.calculate(this);
  }

  calculateStats() {
    this.getWallLength();
    this.getWallArea();
    this.getFloorArea();
  }
  getWallLength() {
    this.stats.wall.innerLength = Math.ceil(
      sum(
        this.houseParts.walls.map((x: Wall) => {
          if (x.type === WallType.outer) {
            return x.getLength(WallSide.in);
          }

          if (x.type === WallType.inner) {
            return x.getLength(WallSide.out) + x.getLength(WallSide.in);
          }
          return 0;
        })
      )
    );

    this.stats.wall.outerLength = Math.ceil(
      sum(
        this.houseParts.walls
          .filter((x: Wall) => x.type === WallType.outer)
          .map((x: Wall) => x.getLength(WallSide.out)),
        1
      )
    );
  }
  getWallArea() {
    this.stats.wall.innerArea = Math.ceil(
      sum(
        this.houseParts.walls.map((x: Wall) => {
          let l = 0;
          if (x.type === WallType.inner) l += x.getArea(WallSide.out);
          l += x.getArea(WallSide.in);
          return l;
        })
      )
    );

    this.stats.wall.outerArea = Math.ceil(
      sum(
        this.houseParts.walls
          .filter((x: Wall) => x.type === WallType.outer)
          .map((x: Wall) => x.getArea(WallSide.out)),
        1
      )
    );
  }
  getFloorArea() {
    let total: { [key in Floor]?: { area: number; volume: number } } = {};
    Object.keys(Floor).map((f) => {
      total[f] = { area: 0, volume: 0 };
    });

    this.houseParts.rooms
      .filter((x: Room) => x.name !== "innerFootprint")
      .filter((x: Room) => !x.hole)
      .forEach((room: Room) => {
        total[room.floor].area += room.area();
        total[room.floor].volume += room.volume();
        total[Floor.all].area += room.area();
        total[Floor.all].volume += room.volume();
      });

    Object.keys(Floor).map((f) => {
      total[f] = {
        area: round(total[f].area, 0),
        volume: round(total[f].volume, 0),
      };
    });
    this.stats.floor = total;
    return this.stats.floor;
  }
  calculateTowerCoords() {
    if (this.tower.show === false) {
      this.tower.width = 0;
      this.tower.outerWallOffset = 0;
      this.tower.innerWallLength = 0;
      this.tower.outerWallLength = 0;
      this.tower.houseIncrement = 0;
      this.tower.wallOuterThickness = 0;
    }

    let cornerLength =
      this.tower.wallOuterThickness / Math.cos((22.5 * Math.PI) / 180); // checked
    this.tower.innerIncrement = Math.sqrt(this.tower.innerWallLength ** 2 / 2);
    this.tower.outerIncrement = Math.sqrt(this.tower.outerWallLength ** 2 / 2);

    const start: xy = [
      this.stramien.out.we.c + this.tower.outerWallOffset,
      this.stramien.out.ns.b -
        this.tower.innerIncrement -
        this.tower.innerWallLength -
        this.tower.outerWallOffset,
    ];

    const coord1 = start;
    const coord2 = offset(start, [this.tower.width, 0]);
    const coord3 = angleXY(45, this.tower.width, coord2);
    const coord4 = offset(coord3, [0, this.tower.width]);
    const coord5 = angleXY(45 + 90, this.tower.width, coord4);
    const coord6 = offset(coord5, [-this.tower.width, 0]);
    const coord7 = angleXY(45 + 180, this.tower.width, coord6);
    const coord8 = offset(coord7, [0, -this.tower.width]);
    this.tower.innerCoords = [
      coord1,
      coord2,
      coord3,
      coord4,
      coord5,
      coord6,
      coord7,
      coord8,
    ];
    this.tower.outerCoords = [
      angleXY(22.5 - 45 * 3, cornerLength, coord1),
      angleXY(22.5 - 45 * 2, cornerLength, coord2),
      angleXY(22.5 - 45 * 1, cornerLength, coord3),
      angleXY(22.5 - 45 * 0, cornerLength, coord4),
      angleXY(22.5 - 45 * -1, cornerLength, coord5),
      angleXY(22.5 - 45 * -2, cornerLength, coord6),
      angleXY(22.5 - 45 * -3, cornerLength, coord7),
      angleXY(22.5 - 45 * -4, cornerLength, coord8),
    ];

    this.tower.intersectionWest = offset(this.tower.outerCoords[0], [
      -this.tower.wallOuterThickness,
      this.tower.wallOuterThickness,
    ]);

    this.tower.intersectionEast = offset(this.tower.outerCoords[3], [
      -this.tower.wallOuterThickness,
      this.tower.wallOuterThickness,
    ]);

    if (this.tower.show === false) {
      this.tower.intersectionWest = [
        this.stramien.in.we.c,
        this.stramien.in.ns.b,
      ];
      this.tower.intersectionEast = [
        this.stramien.in.we.c,
        this.stramien.in.ns.b,
      ];
      this.tower.innerCoords = [...Array(8).keys()].map((x) => [
        this.stramien.in.we.c,
        this.stramien.in.ns.b,
      ]);
      this.tower.outerCoords = [...Array(8).keys()].map((x) => [
        this.stramien.out.we.c,
        this.stramien.out.ns.b,
      ]);
    }
  }
}
