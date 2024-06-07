import { House, HousePart, HouseUser, xy } from "../house.model";
import { Room } from "../../house-parts/room.model";
import {
  CornerType,
  Wall,
  WallSide,
  WallType,
} from "../../house-parts/wall.model";
import { Door } from "src/app/house-parts/door.model";
import { CableType, Floor, SensorType } from "../../components/enum.data";
import { mixPoints, offset } from "../../shared/global-functions";
import { Window, WindowForm } from "../../house-parts/window.model";
import { lindeLundUpstairs } from "./lindeLund.upstairs";
import { Footprint } from "src/app/house-parts/footprint.model";
import { RoofPoint } from "../cross.model";
import { lindelundOther } from "./lindeLund.other";
import { Other } from "src/app/house-parts/other.model";
import { EmbeddedSVG } from "src/app/house-parts/svg-other/embedded-svg.svg";

import { Sensor } from "src/app/house-parts/sensor-models/sensor.model";
import { Water } from "src/app/house-parts/sensor-models/water.model";
import { SensorLight } from "src/app/house-parts/sensor-models/sensorLight.model";
import { Vent } from "src/app/house-parts/sensor-models/vent.model";

const groundToiletWidth = 0.8;
const standardWindowWidth = 1.2;

export const lindeLund: HouseUser = {
  studAmount: 13,
  studDistance: 0.6,
  towerWidth: 1,
  wallInnerThickness: 0.07,
  wallOuterThickness: 0.531,
  roofOuterThickness: 0.5,
  studAmountNorth: 10,
  studAmountSouth: 5,
  studAmountWest: 14,
  studAmountEast: 7,
  showTower: true,
  balconyWidth: 6.2,

  ceilingHeight: 3.0,
  floorAboveGround: 0.7,
  crawlerHeight: 1.0,
  crawlerSpace: true,
  name: "Lindelund",
  orientation: {
    lat: 55.91832399684094,
    lng: 13.654632669220504,
    rotation: 10,
  },
  garage: {
    width: 8.7,
    length: 9.7,
    orientation: {
      lat: 55.91832399684094,
      lng: 13.654632669220504,
      rotation: 45,
    },
  },
  parts: [
    ...lindelundOther,
    //// Outerwalls ////
    new Footprint({
      name: "outside",
      // tower
      floor: Floor.ground,
      onUpdate: function (this: Room, house: House) {
        const s = house.stramien;
        const t = house.tower;

        this.coords = [
          [s.in.we.b, s.in.ns.b],
          [s.in.we.b, s.in.ns.a],
          [s.in.we.c, s.in.ns.a],
          [s.in.we.c, t.innerCoords[0][1]],
          t.innerCoords[0],
          t.innerCoords[1],
          t.innerCoords[2],
          t.innerCoords[3],
          [t.innerCoords[3][0], s.in.ns.b],
          // [s.in.we.c, s.in.ns.b],
          [s.in.we.d, s.in.ns.b],
          [s.in.we.d, s.in.ns.c],
          [s.in.we.c, s.in.ns.c],
          [s.in.we.c, s.in.ns.d],
          [s.in.we.b, s.in.ns.d],
          [s.in.we.b, s.in.ns.c],
          [s.in.we.a, s.in.ns.c],
          [s.in.we.a, s.in.ns.b],
        ];
      },
      parts: [
        ...[...Array(17).keys()]
          .map((i, index, arr) => {
            const towerCorners = [3, 4, 5, 6, 7];
            const gables = [1, 9, 12, 15];

            if ([3, 4, 5, 6, 7].includes(i)) return;
            const innerCorners = [0, 11, 14, 17];

            const l = arr.length;
            return new Wall({
              type: WallType.outer,
              floor: Floor.all,
              gable: gables.includes(i),
              tower: towerCorners.includes(i),
              onUpdate: function (this: Wall, house: House) {
                const getCorner = (i) => {
                  if (i === towerCorners[0] || i === towerCorners[4] + 1)
                    return CornerType.inside;

                  if (innerCorners.includes(i)) return CornerType.inside;
                  if (!innerCorners.includes(i)) return CornerType.outside;
                };

                this.drawByRoom(
                  i,
                  i + 1 !== l ? i + 1 : 0,
                  house,
                  getCorner(i),
                  getCorner(i + 1)
                );
              },
              parts: [
                ...(i === 16 // West-Wing-North-Wall
                  ? [1].map(
                      (x) =>
                        new Window({
                          rotate: 90,
                          width: standardWindowWidth,
                          elevation: 0.9,
                          onUpdate: function (this: Window, house: House) {
                            const wall = this.parent;
                            this.height =
                              house.cross.ceilingHeight - 0.4 - this.elevation;

                            this.origin = wall.getPosition(
                              WallSide.out,
                              x / 2,
                              this.width / 2
                            );
                          },
                        })
                    )
                  : []),

                ...(i === 15 // West-wing-West-wall
                  ? [
                      new Window({
                        // Top floor / gable
                        windowForm: WindowForm.hexagon,
                        floor: Floor.top,
                        rotate: 0,
                        width: standardWindowWidth,
                        elevation: 0.9,
                        onUpdate: function (this: Window, house: House) {
                          const wall = this.parent;
                          this.height =
                            house.cross.ceilingHeight - 0.4 - this.elevation;
                          this.origin = wall.getPosition(
                            WallSide.out,
                            1 / 2,
                            this.width / 2
                          );
                        },
                      }),
                      ...[1, 2].map(
                        (x) =>
                          new Window({
                            rotate: 0,
                            width: standardWindowWidth,
                            elevation: 0.9,
                            onUpdate: function (this: Window, house: House) {
                              const wall = this.parent;
                              this.height =
                                house.cross.ceilingHeight -
                                0.4 -
                                this.elevation;
                              this.origin = wall.getPosition(
                                WallSide.out,
                                x / 3,
                                this.width / 2
                              );
                            },
                          })
                      ),
                    ]
                  : []),
                ...(i === 14 // West-Wing-South-Wall
                  ? [1, 2].map(
                      (x) =>
                        new Window({
                          rotate: -90,
                          width: standardWindowWidth,
                          elevation: 0.9,
                          onUpdate: function (this: Window, house: House) {
                            const wall = this.parent;
                            this.height =
                              house.cross.ceilingHeight - 0.4 - this.elevation;
                            if (wall.innerWallLength < 5) {
                              this.width = wall.innerWallLength / 3 - 0.2;
                            } else {
                              this.width = 1.4;
                            }
                            this.origin = wall.getPosition(
                              WallSide.out,
                              x / 3,
                              this.width / 2
                            );
                          },
                        })
                    )
                  : []),
                ...(i === 13
                  ? [1].map(
                      (x) =>
                        new Window({
                          rotate: 0,
                          width: standardWindowWidth,
                          elevation: 0.9,
                          onUpdate: function (this: Window, house: House) {
                            const wall = this.parent;
                            this.height =
                              house.cross.ceilingHeight - 0.4 - this.elevation;

                            this.origin = offset(
                              wall.getPosition(WallSide.in, 1, -0.9),
                              [-wall.thickness, 0]
                            );
                          },
                        })
                    )
                  : []),
                ...(i === 12 // South-glass-facade-South-Wall
                  ? [1].map(
                      (x) =>
                        new Window({
                          rotate: -90,
                          floor: Floor.all,
                          elevation: 0,
                          windowForm: WindowForm.windowWall,
                          onUpdate: function (this: Window, house: House) {
                            this.height =
                              house.cross.elevations[RoofPoint.topInside];
                            const wall = this.parent;
                            (this.width = wall.innerWallLength),
                              (this.origin = wall.getPosition(
                                WallSide.out,
                                x / 2,
                                this.width / 2
                              ));
                          },
                        })
                    )
                  : []),

                ...(i === 11
                  ? [1].map(
                      (x) =>
                        new Window({
                          rotate: 180,
                          width: standardWindowWidth,
                          elevation: 0.9,
                          onUpdate: function (this: Window, house: House) {
                            const wall = this.parent;
                            this.height =
                              house.cross.ceilingHeight - 0.4 - this.elevation;

                            this.origin = offset(
                              wall.getPosition(
                                WallSide.in,
                                0,
                                this.width + 0.9
                              ),
                              [wall.thickness, 0]
                            );
                          },
                        })
                    )
                  : []),
                ...(i === 10 // East-Wing-South-Wall
                  ? [1].map(
                      (x) =>
                        new Window({
                          rotate: -90,
                          width: standardWindowWidth,
                          elevation: 0.9,
                          onUpdate: function (this: Window, house: House) {
                            const wall = this.parent;
                            this.height =
                              house.cross.ceilingHeight - 0.4 - this.elevation;
                            this.origin = wall.getPosition(
                              WallSide.out,
                              x / 2,
                              this.width / 2
                            );
                          },
                        })
                    )
                  : []),
                ...(i === 9 // East-Wing-East-Wall
                  ? [
                      new Window({
                        windowForm: WindowForm.hexagon,
                        floor: Floor.top,
                        rotate: 180,
                        width: standardWindowWidth,
                        elevation: 0.9,
                        onUpdate: function (this: Window, house: House) {
                          const wall = this.parent;
                          this.height =
                            house.cross.ceilingHeight - 0.4 - this.elevation;
                          this.origin = wall.getPosition(
                            WallSide.out,
                            1 / 2,
                            this.width / 2
                          );
                        },
                      }),
                      ...[0, 1].map(
                        (x) =>
                          new Window({
                            rotate: 180,
                            width: standardWindowWidth,
                            elevation: 0.9,
                            onUpdate: function (this: Window, house: House) {
                              const wall = this.parent;
                              this.height =
                                house.cross.ceilingHeight -
                                0.4 -
                                this.elevation;
                              this.origin = wall.getPosition(
                                WallSide.out,
                                x,
                                this.width / 2 +
                                  (this.width + 0.8) * (x === 0 ? 1 : -1)
                              );
                            },
                          })
                      ),
                      ...[0, 1].map(
                        (x) =>
                          new Door({
                            floor: Floor.ground,
                            scale: [-1, x === 0 ? -1 : 1],
                            // width: 1,
                            outside: true,

                            onUpdate: function (this: Door, house: House) {
                              const side = WallSide.in;
                              const wall = this.parent;
                              const wallMid = wall.innerWallLength / 2;
                              this.origin = offset(wall.origin, [
                                0,
                                x === 0
                                  ? wallMid - this.width
                                  : wallMid + this.width,
                              ]);
                            },
                          })
                      ),
                    ]
                  : []),
                ...(i === 8 // East-Wing-North-Wall
                  ? [1].map(
                      (x) =>
                        new Window({
                          rotate: 90,
                          width: standardWindowWidth,
                          elevation: 0.9,
                          onUpdate: function (this: Window, house: House) {
                            const wall = this.parent;
                            this.height =
                              house.cross.ceilingHeight - 0.4 - this.elevation;
                            this.origin = wall.getPosition(
                              WallSide.out,
                              1 / 2,
                              this.width / 2 - house.wallOuterThickness / 2
                            );
                          },
                        })
                    )
                  : []),

                ...(i === 2 // North-East-west-wall
                  ? [1, 2.5].map(
                      (x) =>
                        new Window({
                          rotate: 180,
                          width: standardWindowWidth,
                          elevation: 0.9,
                          onUpdate: function (this: Window, house: House) {
                            const wall = this.parent;
                            this.height =
                              house.cross.ceilingHeight - 0.4 - this.elevation;
                            this.origin = wall.getPosition(
                              WallSide.out,
                              x / 3,
                              this.width / 2
                            );
                          },
                        })
                    )
                  : []),
                ...(i === 1 // North-wing-North-wall
                  ? [
                      new Window({
                        windowForm: WindowForm.hexagon,
                        floor: Floor.top,
                        rotate: 90,
                        width: standardWindowWidth,
                        elevation: 0.9,
                        onUpdate: function (this: Window, house: House) {
                          const wall = this.parent;
                          this.height =
                            house.cross.ceilingHeight - 0.4 - this.elevation;
                          this.origin = wall.getPosition(
                            WallSide.out,
                            1 / 2,
                            this.width / 2
                          );
                        },
                      }),
                      ...[1, 2].map(
                        (x) =>
                          new Window({
                            rotate: 90,
                            width: standardWindowWidth,
                            elevation: 0.9,
                            onUpdate: function (this: Window, house: House) {
                              const wall = this.parent;
                              this.height =
                                house.cross.ceilingHeight -
                                0.4 -
                                this.elevation;
                              this.origin = wall.getPosition(
                                WallSide.out,
                                x / 3,
                                this.width / 2
                              );
                            },
                          })
                      ),
                    ]
                  : []),
                ...(i === 0 // North-wing-west-wall
                  ? [
                      new Door({
                        outside: true,
                        width: 1,
                        height: 2.7,
                        floor: Floor.ground,
                        rotate: 0,
                        scale: [1, 1],
                        onUpdate: function (this: Door, house: House) {
                          this.origin = offset(
                            this.parent.getPosition(
                              WallSide.in,
                              0,
                              1.2 + house.wallInnerThickness
                            ),
                            [-house.wallOuterThickness, 0]
                          );
                        },
                      }),
                      ...[2, 5].map(
                        (x) =>
                          new Window({
                            rotate: 0,
                            width: standardWindowWidth,
                            elevation: 0.9,
                            onUpdate: function (this: Window, house: House) {
                              const wall = this.parent;
                              this.height =
                                house.cross.ceilingHeight -
                                0.4 -
                                this.elevation;
                              this.origin = wall.getPosition(
                                WallSide.out,
                                (x + 1) / 8,
                                this.width / 2
                              );
                            },
                          })
                      ),
                    ]
                  : []),
              ],
            });
          })
          .filter((x) => x),

        /// Tower walls
        ...[...Array(8).keys()]
          .map((i, index, arr) => {
            return new Wall({
              type: WallType.outer,

              tower: true,
              onUpdate: function (this: Wall, house: House) {
                this.ceiling = house.cross.ceilingHeight;
                this.outOfDesign = !house.showTower;

                this.floor = i < 3 ? Floor.all : Floor.tower;
                if (this.outOfDesign) return;

                const wallDiff =
                  house.wallOuterThickness - house.wallInnerThickness;

                const innerCoords = JSON.parse(
                  JSON.stringify(house.tower.innerCoords)
                );

                this.origin = [house.stramien.in.we.c, innerCoords[0][1]];
                this.innerWallLength = house.towerWidth - wallDiff;
                const nextI = i === 7 ? 0 : i + 1;

                if (i === 0) {
                  innerCoords[i][0] = house.stramien.in.we.c;
                }
                if (i === 2) {
                  innerCoords[nextI][1] = house.stramien.in.ns.b;
                }

                this.sides = {
                  [WallSide.out]: [
                    house.tower.outerCoords[i],
                    house.tower.outerCoords[nextI],
                  ],
                  [WallSide.in]: [innerCoords[i], innerCoords[nextI]],
                };
              },
              parts: [
                ...(i === 0 // North
                  ? [
                      new Sensor<Wall>({
                        sensorType: SensorType.socket,
                        amount: 2,
                        group: 4,
                        onUpdate: function (this: Sensor<Wall>, house: House) {
                          const wall = this.parent;
                          const point = wall.getPosition(WallSide.in, 0, 0);
                          this.coords = [
                            wall.getPosition(WallSide.in, 1, -0.2),
                            point,
                            mixPoints(point, house.serverRoom, true),
                            house.serverRoom,
                          ];
                        },
                      }),
                    ]
                  : []),

                ...(i === 1 // NorthWest
                  ? [
                      new Door({
                        outside: true,
                        rotate: 45 + 90,
                        scale: [1, 1],
                        floor: Floor.ground,
                        onUpdate: function (this: Door, house: House) {
                          this.outOfDesign = !house.showTower;
                          if (this.outOfDesign) return;
                          const side = WallSide.out;
                          const wall = this.parent;
                          this.origin = wall.getPosition(
                            side,
                            1 / 2,
                            -this.width / 2
                          );
                        },
                      }),
                      new Window({
                        rotate: 45 + 90,
                        scale: [1, 1],
                        floor: Floor.top,
                        width: 0.8,
                        elevation: 1,
                        height: 2.0,
                        onUpdate: function (this: Window, house: House) {
                          this.outOfDesign = !house.showTower;
                          if (this.outOfDesign) return;
                          const side = WallSide.out;
                          const wall = this.parent;
                          this.origin = wall.getPosition(
                            side,
                            1 / 2,
                            this.width / 2
                          );
                        },
                      }),
                    ]
                  : []),

                ...(i === 2 // East
                  ? [
                      new Sensor<Wall>({
                        sensorType: SensorType.socket,
                        amount: 2,
                        group: 4,
                        onUpdate: function (this: Sensor<Wall>, house: House) {
                          const wall = this.parent;
                          const point = wall.getPosition(WallSide.in, 0, 0.2);
                          this.coords = [
                            point,
                            mixPoints(point, house.serverRoom, true),
                            house.serverRoom,
                          ];
                        },
                      }),
                    ]
                  : []),
                ...(i === 3 // SouthEast
                  ? []
                  : []),
                ...(i === 4 // South
                  ? []
                  : []),
                ...(i === 5 // SouthWest
                  ? []
                  : []),
                ...(i === 6 // West
                  ? []
                  : []),
                ...(i === 7 // NorthWest
                  ? []
                  : []),
              ],
            });
          })
          .filter((x) => x),
      ],
    }),

    //// South rooms ////
    // West / Left
    new Room({
      name: "West",
      usage: "Vardagsrum",
      floor: Floor.ground,
      onUpdate: function (this: Room, house: House) {
        const s = house.stramien;
        this.northWestCorner = [s.in.we.a, s.in.ns.b];
        this.squaredRoom(
          s.in.we.b - s.in.we.a - house.wallInnerThickness,
          s.in.ns.c - s.in.ns.b
        );
      },
      parts: [
        // North
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic("n", house, house.wallOuterThickness);
          },
          parts: [
            new Sensor<Wall>({
              offset: [0, 0.3],
              sensorType: SensorType.ethernet,
              onUpdate: function (this: Sensor<Wall>) {
                const techRoom = this.parent.parent.parent.serverRoom;
                const point = this.parent.getPosition(WallSide.in, 3 / 4, 0);
                this.coords = [
                  point,
                  mixPoints(techRoom, point, false),
                  techRoom,
                ];
              },
            }),
            new Sensor<Wall>({
              offset: [0, 0.3],
              sensorType: SensorType.ethernet,
              onUpdate: function (this: Sensor<Wall>) {
                const techRoom = this.parent.parent.parent.serverRoom;
                const point = this.parent.getPosition(WallSide.in, 1 / 4, 0);
                this.coords = [
                  point,
                  mixPoints(techRoom, point, false),
                  techRoom,
                ];
              },
            }),
            new Sensor({
              group: 1,
              sensorType: SensorType.socket,
              amount: 2,
              offset: [0, 0.3], // No included in cable length
              onUpdate: function (this: Sensor<Wall>) {
                const group = this.parent.parent.centralElectricity;
                const point = offset(
                  this.parent.sides[WallSide.in][1],
                  [-1, 0]
                );
                this.coords = [point];
              },
            }),
            new Sensor({
              group: 1,
              sensorType: SensorType.socket,
              amount: 2,
              offset: [0, 0.3], // No included in cable length
              onUpdate: function (this: Sensor<Wall>) {
                const group = this.parent.parent.centralElectricity;
                const dist = this.parent.parent.width / 2;
                const point = offset(this.parent.sides[WallSide.in][1], [
                  -dist,
                  0,
                ]);
                this.coords = [point];
              },
            }),
            new Sensor({
              group: 1,
              sensorType: SensorType.socket,
              amount: 2,
              offset: [0, 0.3], // No included in cable length
              onUpdate: function (this: Sensor<Wall>) {
                const group = this.parent.parent.centralElectricity;
                const point = offset(this.parent.sides[WallSide.in][0], [1, 0]);
                this.coords = [point];
              },
            }),
          ],
        }),
        // East
        new Wall({
          type: WallType.inner,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawByRoom(
              1,
              2,
              house,
              CornerType.straight,
              CornerType.straight
            );
          },
          parts: [
            new Sensor({
              group: 2,
              sensorType: SensorType.socket,
              amount: 2,
              offset: [-0.3, 0], // No included in cable length
              onUpdate: function (this: Sensor<Wall>) {
                const group = this.parent.parent.centralElectricity;
                const point = offset(
                  this.parent.sides[WallSide.in][1],
                  [0, -1]
                );
                this.coords = [point];
              },
            }),
            new Sensor({
              group: 1,
              sensorType: SensorType.socket,
              amount: 2,
              offset: [-0.3, 0], // No included in cable length
              onUpdate: function (this: Sensor<Wall>) {
                const group = this.parent.parent.centralElectricity;
                const point = offset(this.parent.sides[WallSide.in][0], [0, 1]);
                this.coords = [point];
              },
            }),
            new Door({
              floor: Floor.ground,
              scale: [1, -1],
              onUpdate: function (this: Door, house: House) {
                const side = WallSide.in;
                const wallMid = this.parent.parent.height / 2;
                this.origin = offset(this.parent.sides[side][0], [
                  0,
                  wallMid - this.width,
                ]);
              },
            }),
            new Door({
              floor: Floor.ground,
              scale: [1, 1],
              onUpdate: function (this: Door, house: House) {
                const side = WallSide.in;
                const wallMid = this.parent.parent.height / 2;
                this.origin = offset(this.parent.sides[side][0], [
                  0,
                  wallMid + this.width,
                ]);
              },
            }),

            ...[
              SensorType.dimmer,
              SensorType.lightSwitch,
              SensorType.temperature,
            ].map(
              (sensorType, i) =>
                new Sensor<Wall>({
                  sensorType,
                  offsetWall: SensorType.dimmer === sensorType ? 1 : 0.3,
                  onUpdate: function (this: Sensor<Wall>, house: House) {
                    const point = this.parent.getPosition(
                      WallSide.in,
                      1 / 3,
                      0
                    );

                    this.coords = [
                      point,
                      mixPoints(house.serverRoom, point, false),
                      house.serverRoom,
                    ];
                  },
                })
            ),
          ],
        }),
        // South
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic("s", house, house.wallOuterThickness);
          },
          parts: [
            new Sensor({
              group: 2,
              sensorType: SensorType.socket,
              amount: 2,
              offset: [0, -0.3], // No included in cable length
              onUpdate: function (this: Sensor<Wall>, house: House) {
                const wall = this.parent;
                const point = offset(wall.sides[WallSide.in][0], [-1, 0]);
                this.coords = [point];
              },
            }),
            new Sensor({
              group: 2,
              sensorType: SensorType.socket,
              amount: 2,
              offset: [0, -0.3], // No included in cable length
              onUpdate: function (this: Sensor<Wall>) {
                const dist = this.parent.parent.width / 2;
                const point = offset(this.parent.sides[WallSide.in][0], [
                  -dist,
                  0,
                ]);
                this.coords = [point];
              },
            }),
            new Sensor({
              group: 2,
              sensorType: SensorType.socket,
              amount: 2,
              offset: [0, -0.3], // No included in cable length
              onUpdate: function (this: Sensor<Wall>) {
                const group = this.parent.parent.centralElectricity;
                const point = offset(this.parent.sides[WallSide.in][1], [1, 0]);
                this.coords = [point];
              },
            }),
          ],
        }),
        // West
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic("w", house, house.wallOuterThickness);
          },
          parts: [
            new Sensor<Wall>({
              group: 1,
              sensorType: SensorType.socket,
              amount: 2,
              offset: [0.3, 0], // No included in cable length
              onUpdate: function (this: Sensor<Wall>) {
                const group = this.parent.parent.centralElectricity;
                const point = offset(this.parent.sides[WallSide.in][1], [0, 1]);
                this.coords = [point];
              },
            }),
            new Sensor<Wall>({
              group: 2,
              sensorType: SensorType.socket,
              amount: 2,
              offset: [0.3, 0], // No included in cable length
              onUpdate: function (this: Sensor<Wall>) {
                const group = this.parent.parent.centralElectricity;
                const point = offset(
                  this.parent.sides[WallSide.in][0],
                  [0, -1]
                );
                this.coords = [point];
              },
            }),
          ],
        }),

        new Sensor<Room>({
          sensorType: SensorType.smoke,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const point1 = offset(this.parent.northWestCorner, [
              this.parent.width * 0.8,
              this.parent.height * 0.5,
            ]);
            const point2 = offset(point1, [0, -this.parent.height * 0.5]);

            this.coords = [
              point1,
              point2,
              mixPoints(point2, house.serverRoom, false),
              house.serverRoom,
            ];
          },
        }),
        new Sensor<Room>({
          sensorType: SensorType.socket,
          amount: 2,
          cableOnly: true,
          group: 1,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            this.coords = [
              offset(room.northWestCorner, [room.width, room.height / 2 - 1]),
              offset(room.northWestCorner, [room.width, 0]),
              offset(room.northWestCorner, [0, 0]),
              offset(room.northWestCorner, [0, room.height / 2 - 1]),
            ];
          },
        }),
        new Sensor<Room>({
          sensorType: SensorType.socket,
          amount: 2,
          cableOnly: true,
          group: 2,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            this.coords = [
              offset(room.northWestCorner, [0, room.height / 2 + 1]),
              offset(room.northWestCorner, [0, room.height]),
              offset(room.northWestCorner, [room.width, room.height]),
              offset(room.northWestCorner, [room.width, room.height / 2 + 1]),
            ];
          },
        }),
        new Sensor<Room>({
          group: 1,
          sensorType: SensorType.socket,
          amount: 2,
          cableOnly: true,

          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = offset(room.northWestCorner, [
              room.width - house.wallInnerThickness,
              0,
            ]);
            this.coords = [
              point,
              mixPoints(house.serverRoom, point, true),
              house.serverRoom,
            ];
          },
        }),

        new Sensor<Room>({
          group: 2,
          sensorType: SensorType.socket,
          amount: 2,
          cableOnly: true,

          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = offset(room.northWestCorner, [
              room.width,
              room.height / 2 + 1,
            ]);
            this.coords = [
              offset(room.northWestCorner, [
                room.width - house.wallInnerThickness,
                room.height / 2 + 1,
              ]),
              point,
              mixPoints(house.serverRoom, point, false),
              house.serverRoom,
            ];
          },
        }),

        ...[SensorType.camera, SensorType.poe].map(
          (sensorType) =>
            new Sensor<Room>({
              sensorType,
              cableType: CableType.OutsidePOE,
              offset: [0, -1],
              onUpdate: function (this: Sensor<Room>, house: House) {
                const room = this.parent;
                const point = offset(room.northWestCorner, [
                  room.width / 2,
                  -house.wallOuterThickness,
                ]);
                this.coords = [point, offset(point, [0, 1]), house.serverRoom];
              },
            })
        ),

        ...[SensorType.camera, SensorType.poe].map(
          (sensorType) =>
            new Sensor<Room>({
              sensorType,
              cableType: CableType.OutsidePOE,
              offset: [0, 1],
              onUpdate: function (this: Sensor<Room>, house: House) {
                const room = this.parent;
                const point = offset(room.northWestCorner, [
                  1,
                  room.height + house.wallOuterThickness,
                ]);
                this.coords = [point, offset(point, [0, -1]), house.serverRoom];
              },
            })
        ),
        new SensorLight<Room>({
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = offset(room.center, [0, 0]);
            this.coords = [
              point,
              mixPoints(house.serverRoom, point, false),
              house.serverRoom,
            ];
          },
        }),
        new Vent<Room>({
          sensorType: SensorType.ventOut,
          size: 200,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = room.center;
            this.coords = [
              point,
              mixPoints(house.serverRoom, point, false),
              house.serverRoom,
            ];
          },
        }),
      ],
    }),
    // East / Right
    new Room({
      name: "East",
      usage: "Matplats",
      floor: Floor.ground,
      onUpdate: function (this: Room, house: House) {
        const s = house.stramien;
        this.northWestCorner = [
          s.in.we.c + house.wallInnerThickness,
          s.in.ns.b,
        ];
        this.squaredRoom(
          s.in.we.d - s.in.we.c - house.wallInnerThickness,
          s.in.ns.c - s.in.ns.b
        );
      },
      parts: [
        // North
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic("n", house, house.wallOuterThickness);
          },
          parts: [
            new Sensor<Wall>({
              sensorType: SensorType.lightSwitch,
              onUpdate: function (this: Sensor<Wall>, house: House) {
                const point = this.parent.getPosition(WallSide.in, 1 / 3, 0);

                this.coords = [
                  point,
                  mixPoints(house.serverRoom, point, false),
                  house.serverRoom,
                ];
              },
            }),
            new Sensor<Wall>({
              group: 3,
              sensorType: SensorType.socket,
              amount: 2,
              onUpdate: function (this: Sensor<Wall>) {
                this.coords = [this.parent.getPosition(WallSide.in, 1 / 3, 0)];
              },
            }),
            new Sensor<Wall>({
              group: 3,
              sensorType: SensorType.socket,
              amount: 2,
              onUpdate: function (this: Sensor<Wall>) {
                this.coords = [this.parent.getPosition(WallSide.in, 2 / 3, 0)];
              },
            }),
            new Sensor<Wall>({
              offset: [0, 0.3],
              sensorType: SensorType.ethernet,
              onUpdate: function (this: Sensor<Wall>) {
                const techRoom = this.parent.parent.parent.serverRoom;
                const point = this.parent.getPosition(WallSide.in, 3 / 4, 0);
                this.coords = [
                  point,
                  mixPoints(techRoom, point, true),
                  techRoom,
                ];
              },
            }),
          ],
        }),
        // East
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic("e", house, house.wallOuterThickness);
          },
          parts: [
            ...[SensorType.camera, SensorType.poe].map(
              (sensorType) =>
                new Sensor<Wall>({
                  sensorType,
                  cableType: CableType.OutsidePOE,
                  offsetWall: -0.3,
                  onUpdate: function (this: Sensor<Wall>, house: House) {
                    const point = this.parent.getPosition(WallSide.in, 0, 0);
                    this.coords = [
                      offset(point, [house.wallOuterThickness, 0]),
                      offset(point, [-1, 1]),
                      house.serverRoom,
                    ];
                  },
                })
            ),
            new Sensor<Wall>({
              sensorType: SensorType.lightSwitch,
              onUpdate: function (this: Sensor<Wall>, house: House) {
                const point = this.parent.getPosition(WallSide.in, 0, 1.5);

                this.coords = [
                  point,
                  mixPoints(house.serverRoom, point, false),
                  house.serverRoom,
                ];
              },
            }),
          ],
        }),
        // south
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic("s", house, house.wallOuterThickness);
          },
          parts: [
            new Sensor<Wall>({
              group: 3,
              amount: 2,
              sensorType: SensorType.socket,
              onUpdate: function (this: Sensor<Wall>) {
                this.coords = [this.parent.getPosition(WallSide.in, 1 / 3, 0)];
              },
            }),
            new Sensor<Wall>({
              group: 3,
              sensorType: SensorType.socket,
              amount: 2,
              offset: [0, 0.3], // No included in cable length
              onUpdate: function (this: Sensor<Wall>) {
                this.coords = [this.parent.getPosition(WallSide.in, 2 / 3, 0)];
              },
            }),

            new Sensor<Wall>({
              sensorType: SensorType.ethernet,
              onUpdate: function (this: Sensor<Wall>) {
                const techRoom = this.parent.parent.parent.serverRoom;
                const point = this.parent.getPosition(WallSide.in, 1 / 4, 0);
                const point2 = this.parent.parent.northWestCorner;
                this.coords = [
                  point,
                  mixPoints(point, point2, true),
                  point2,
                  mixPoints(techRoom, point2, true),
                  techRoom,
                ];
              },
            }),
          ],
        }),
        // west
        new Wall({
          type: WallType.inner,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawByRoom(
              3,
              0,
              house,
              CornerType.straight,
              CornerType.straight
            );
          },
          parts: [
            ...[
              SensorType.dimmer,
              SensorType.lightSwitch,
              SensorType.temperature,
            ].map(
              (sensorType, i) =>
                new Sensor<Wall>({
                  sensorType,
                  offsetWall: SensorType.dimmer === sensorType ? 1 : 0.3,
                  onUpdate: function (this: Sensor<Wall>, house: House) {
                    const point = this.parent.getPosition(WallSide.in, 1, -1.5);
                    this.coords = [
                      point,
                      mixPoints(house.serverRoom, point, false),
                      house.serverRoom,
                    ];
                  },
                })
            ),
            new Door({
              floor: Floor.ground,
              scale: [1, 1],
              rotate: 180,
              onUpdate: function (this: Door, house: House) {
                const side = WallSide.in;
                const wallMid = this.parent.parent.height / 2;
                this.origin = offset(this.parent.sides[side][1], [
                  0,
                  wallMid - this.width,
                ]);
              },
            }),
            new Door({
              floor: Floor.ground,
              scale: [1, -1],
              rotate: 180,
              onUpdate: function (this: Door, house: House) {
                const side = WallSide.in;
                const wallMid = this.parent.parent.height / 2;
                this.origin = offset(this.parent.sides[side][1], [
                  0,
                  wallMid + this.width,
                ]);
              },
            }),
          ],
        }),
        new Sensor<Room>({
          sensorType: SensorType.socket,
          amount: 2,
          cableOnly: true,
          group: 3,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            this.coords = [
              offset(room.northWestCorner, [room.width, room.height / 2 - 1]),
              offset(room.northWestCorner, [room.width, 0]),
              offset(room.northWestCorner, [0, 0]),
              offset(room.northWestCorner, [0, room.height / 2 - 1]),
            ];
          },
        }),
        new Sensor<Room>({
          sensorType: SensorType.socket,
          amount: 2,
          cableOnly: true,
          group: 3,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            this.coords = [
              offset(room.northWestCorner, [0, room.height / 2 + 1]),
              offset(room.northWestCorner, [0, room.height]),
              offset(room.northWestCorner, [room.width, room.height]),
              offset(room.northWestCorner, [room.width, room.height / 2 + 1]),
            ];
          },
        }),
        new Sensor<Room>({
          group: 3,
          sensorType: SensorType.socket,
          amount: 2,
          cableOnly: true,

          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = offset(room.northWestCorner, [0, 0]);
            this.coords = [
              point,
              mixPoints(house.serverRoom, point, true),
              house.serverRoom,
            ];
          },
        }),
        new Sensor<Room>({
          group: 3,
          sensorType: SensorType.socket,
          amount: 2,
          cableOnly: true,

          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = offset(room.northWestCorner, [
              -house.wallInnerThickness,
              room.height / 2 + 1,
            ]);
            this.coords = [
              offset(room.northWestCorner, [0, room.height / 2 + 1]),
              point,
              mixPoints(house.serverRoom, point, false),
              house.serverRoom,
            ];
          },
        }),
        new SensorLight<Room>({
          sensorType: SensorType.lightBulb,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = offset(room.center, [0, 0]);
            this.coords = [
              point,
              mixPoints(house.serverRoom, point, false),
              house.serverRoom,
            ];
          },
        }),
        new Vent<Room>({
          sensorType: SensorType.ventOut,
          size: 200,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = room.center;
            this.coords = [
              point,
              mixPoints(house.serverRoom, point, false),
              house.serverRoom,
            ];
          },
        }),
      ],
    }),
    // South / center / Down
    new Room({
      name: "Central",
      usage: "kök",
      floor: Floor.ground,
      onUpdate: function (this: Room, house: House) {
        this.northWestCorner = [house.stramien.in.we.b, house.stramien.in.ns.b];
        this.squaredRoom(
          house.stramien.in.we.c - house.stramien.in.we.b,
          house.stramien.in.ns.d - house.stramien.in.ns.b
        );
      },
      parts: [
        // east Short
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.ceiling = house.cross.ceilingHeight;
            this.innerWallLength =
              house.stramien.in.ns.d - house.stramien.in.ns.c;
            this.origin = offset(this.parent.northWestCorner, [
              this.parent.width,
              house.stramien.in.ns.c - house.stramien.in.ns.b,
            ]);
            this.sides = {
              [WallSide.in]: [
                offset(this.origin, [
                  house.wallOuterThickness,
                  +house.wallOuterThickness,
                ]),
                offset(this.origin, [
                  house.wallOuterThickness,
                  this.innerWallLength + house.wallOuterThickness,
                ]),
              ],
              [WallSide.in]: [
                offset(this.origin, [0, 0]),
                offset(this.origin, [0, this.innerWallLength]),
              ],
            };
          },
          parts: [
            new Sensor<Wall>({
              group: 4,
              amount: 3,
              sensorType: SensorType.socket,
              onUpdate: function (this: Sensor<Wall>) {
                this.coords = [this.parent.getPosition(WallSide.in, 1 / 2, 0)];
              },
            }),
            new Sensor<Wall>({
              group: 4,
              amount: 2,
              sensorType: SensorType.socket,
              onUpdate: function (this: Sensor<Wall>) {
                this.coords = [this.parent.getPosition(WallSide.in, 0, -1)];
              },
            }),
          ],
        }),
        // East theoretic
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic("e", house, house.wallOuterThickness);
          },
          parts: [
            new Sensor<Wall>({
              sensorType: SensorType.lightSwitch,
              onUpdate: function (this: Sensor<Wall>, house: House) {
                const point = this.parent.getPosition(WallSide.in, 0, 1.5);
                this.coords = [
                  point,
                  mixPoints(house.serverRoom, point, false),
                  house.serverRoom,
                ];
              },
            }),
          ],
        }),
        // South
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic("s", house, house.wallOuterThickness);
          },
          parts: [
            new Other<EmbeddedSVG>({
              floor: Floor.all,
              housePart: HousePart.example,
              type: "svg",
              dataSVG: {
                filename: "Table.svg",
              },
              selector: "Table",
              onUpdate: function (this: Other<EmbeddedSVG>) {
                const wall: Wall = this.parent;
                const point = wall.getPosition(WallSide.in, 0, 1.3 + 1.3 + 0.8);
                this.dataSVG.rotation = 0;
                this.dataSVG.anchor = offset(point, [0, -0.8 - (0.8 + 0.8)]);
                this.applyDataSVG();
              },
            }),
          ],
        }),
        // West short
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.ceiling = house.cross.ceilingHeight;
            this.innerWallLength =
              house.stramien.in.ns.d - house.stramien.in.ns.c;
            this.origin = offset(this.parent.northWestCorner, [
              0,
              house.stramien.in.ns.d - house.stramien.in.ns.b,
            ]);
            this.sides = {
              [WallSide.in]: [
                offset(this.origin, [
                  -house.wallOuterThickness,
                  +house.wallOuterThickness,
                ]),
                offset(this.origin, [
                  -house.wallOuterThickness,
                  -this.innerWallLength + house.wallOuterThickness,
                ]),
              ],
              [WallSide.in]: [
                offset(this.origin, [0, 0]),
                offset(this.origin, [0, -this.innerWallLength]),
              ],
            };
          },
          parts: [
            new Sensor<Wall>({
              group: 5,
              amount: 6,
              sensorType: SensorType.socket,
              onUpdate: function (this: Sensor<Wall>) {
                this.coords = [this.parent.getPosition(WallSide.in, 1 / 2, 0)];
              },
            }),
            new Sensor<Wall>({
              group: 5,
              amount: 6,
              sensorType: SensorType.socket,
              onUpdate: function (this: Sensor<Wall>) {
                this.coords = [this.parent.getPosition(WallSide.in, 1, 1)];
              },
            }),
            ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(
              (i) =>
                new Other<EmbeddedSVG>({
                  floor: Floor.all,
                  housePart: HousePart.example,
                  type: "svg",
                  selector: `kitchen-${i}`,
                  dataSVG: {
                    filename: "kitchen.svg",
                  },
                  onUpdate: function (this: Other<EmbeddedSVG>) {
                    let y = 0.6 * i;
                    if (i > 4) y = 0.6 * (i - 5);
                    if (i > 8) y = 0.6 * (i - 8);
                    if (i > 12) y = -(0.6 + 0.9);

                    let x = -0.6;
                    if (i > 4) x = 1.2 + 0.6;
                    if (i > 8) x = 1.8;
                    if (i > 12) x = 0.6 * (i - 13);

                    this.dataSVG.rotation = 0;
                    if (i > 4) this.dataSVG.rotation = 180;
                    if (i > 8) this.dataSVG.rotation = 0;
                    if (i > 12) this.dataSVG.rotation = -90;

                    if (i === 4) {
                      this.dataSVG.scale = [1, 0.4 / 0.6];
                      y -= 0.6 - this.dataSVG.scale[1] * 0.6;
                    }
                    const wall: Wall = this.parent;
                    const point = wall.getPosition(WallSide.in, 1, y);
                    this.dataSVG.anchor = offset(point, [x, 0]);
                    this.applyDataSVG();
                  },
                })
            ),

            new Other<EmbeddedSVG>({
              floor: Floor.all,
              housePart: HousePart.example,
              type: "svg",
              selector: "sink",
              dataSVG: {
                filename: "sink.svg",
              },
              onUpdate: function (this: Other<EmbeddedSVG>) {
                const wall: Wall = this.parent;
                const point = wall.getPosition(WallSide.in, 1, -1.5);
                this.dataSVG.anchor = offset(point, [0.6, 0]);
                this.dataSVG.rotation = -90;
                this.applyDataSVG();
              },
            }),
            new Other<EmbeddedSVG>({
              floor: Floor.all,
              housePart: HousePart.example,
              type: "svg",
              selector: "induction",
              dataSVG: {
                filename: "induction.svg",
              },
              onUpdate: function (this: Other<EmbeddedSVG>) {
                const wall: Wall = this.parent;
                const point = wall.getPosition(WallSide.in, 1, 0.6);
                this.dataSVG.rotation = 180;
                this.dataSVG.anchor = offset(point, [1.2 + 0.6, 0]);
                this.applyDataSVG();
              },
            }),
          ],
        }),

        // West theoretic
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic("w", house, house.wallOuterThickness);
          },
          parts: [
            ...[
              SensorType.dimmer,
              SensorType.lightSwitch,
              SensorType.temperature,
            ].map(
              (sensorType, i) =>
                new Sensor<Wall>({
                  sensorType,
                  offsetWall: SensorType.dimmer === sensorType ? 1 : 0.3,
                  onUpdate: function (this: Sensor<Wall>, house: House) {
                    const point = this.parent.getPosition(WallSide.in, 1, -1.5);
                    this.coords = [
                      point,
                      mixPoints(house.serverRoom, point, false),
                      house.serverRoom,
                    ];
                  },
                })
            ),
            ...[SensorType.lightSwitch, SensorType.temperature].map(
              (sensorType, i) =>
                new Sensor<Wall>({
                  sensorType,
                  onUpdate: function (this: Sensor<Wall>, house: House) {
                    const point = this.parent.getPosition(WallSide.in, 0, 1.5);
                    this.coords = [
                      point,
                      mixPoints(house.serverRoom, point, false),
                      house.serverRoom,
                    ];
                  },
                })
            ),

            ...[SensorType.drain, SensorType.waterWarm].map(
              (sensorType) =>
                new Water<Wall>({
                  sensorType,
                  onUpdate: function (this: Sensor<Wall>, house: House) {
                    const wall = this.parent;
                    const room = wall.parent;
                    const point = wall.getPosition(WallSide.in, 0, 1.5);
                    this.coords = [
                      point,
                      mixPoints(house.serverRoom, point, true),
                      house.serverRoom,
                    ];
                  },
                })
            ),
          ],
        }),

        // North
        new Wall({
          type: WallType.inner,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawByRoom(
              0,
              1,
              house,
              CornerType.straight,
              CornerType.straight
            );
          },
          parts: [
            new Door({
              floor: Floor.ground,
              rotate: 90,
              scale: [-1, 1],
              onUpdate: function (this: Door, house: House) {
                this.origin = this.parent.getPosition(WallSide.in, 0, 0);
              },
            }),
          ],
        }),
        new Sensor<Room>({
          group: 7,
          offset: [0.6, 0],
          sensorType: SensorType.perilex,
          verticalCableLength: 4,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const point = offset(this.parent.northWestCorner, [
              0,
              this.parent.height - 2,
            ]);

            this.coords = [
              point,
              mixPoints(point, house.serverRoom, true),
              house.serverRoom,
            ];
          },
        }),
        new Sensor<Room>({
          group: 4,
          cableOnly: true,
          sensorType: SensorType.socket,
          amount: 2,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const point = offset(this.parent.northWestCorner, [
              this.parent.width * 0.5,
              0,
            ]);

            this.coords = [
              offset(this.parent.northWestCorner, [
                this.parent.width,
                this.parent.height,
              ]),
              offset(this.parent.northWestCorner, [this.parent.width, 0]),
              point,
              mixPoints(point, house.serverRoom, true),
              house.serverRoom,
            ];
          },
        }),
        new Sensor<Room>({
          group: 5,
          cableOnly: true,
          sensorType: SensorType.socket,
          amount: 2,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const point = offset(this.parent.northWestCorner, [
              this.parent.width * 0.5,
              0,
            ]);

            this.coords = [
              offset(this.parent.northWestCorner, [0, this.parent.height]),
              offset(this.parent.northWestCorner, [0, 0]),
              point,
              mixPoints(point, house.serverRoom, true),
              house.serverRoom,
            ];
          },
        }),
        new Sensor<Room>({
          group: 5,
          amount: 6,
          sensorType: SensorType.socket,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const point1 = offset(this.parent.northWestCorner, [
              this.parent.width * 0.3,
              this.parent.height * 0.8,
            ]);
            const point2 = offset(this.parent.northWestCorner, [
              0,
              this.parent.height * 0.8,
            ]);

            this.coords = [point1, mixPoints(point1, point2, true), point2];
          },
        }),
        new Sensor<Room>({
          group: 5,
          amount: 2,
          offset: [0.3, 0],
          sensorType: SensorType.socket,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const point1 = offset(this.parent.northWestCorner, [
              this.parent.width * 0,
              this.parent.height * 0.15,
            ]);
            const point2 = offset(this.parent.northWestCorner, [
              0,
              this.parent.height * 0.15,
            ]);

            this.coords = [point1, mixPoints(point1, point2, true), point2];
          },
        }),
        new Sensor<Room>({
          group: 4,
          amount: 2,
          offset: [-0.3, 0],
          sensorType: SensorType.socket,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const point1 = offset(this.parent.northWestCorner, [
              this.parent.width * 1,
              this.parent.height * 0.15,
            ]);
            const point2 = offset(this.parent.northWestCorner, [
              this.parent.width * 1,
              this.parent.height * 0.15,
            ]);

            this.coords = [point1, mixPoints(point1, point2, true), point2];
          },
        }),

        new Sensor<Room>({
          sensorType: SensorType.smoke,
          verticalCableLength: 2 + 4,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const point1 = offset(this.parent.northWestCorner, [
              this.parent.width * 0.3,
              this.parent.height * 0.8,
            ]);
            const point2 = offset(this.parent.northWestCorner, [
              this.parent.width * 0,
              this.parent.height * 0.8,
            ]);
            const point3 = this.parent.northWestCorner;

            this.coords = [
              point1,
              point2,
              point3,
              mixPoints(point3, house.serverRoom, true),
              house.serverRoom,
            ];
          },
        }),

        new Sensor<Room>({
          sensorType: SensorType.ethernet,
          offset: [0.3, 0],
          onUpdate: function (this: Sensor<Room>) {
            const techRoom = this.parent.parent.serverRoom;
            const point = offset(this.parent.northWestCorner, [
              0,
              this.parent.height * 0.5 - 2,
            ]);
            this.coords = [point, mixPoints(techRoom, point, false), techRoom];
          },
        }),

        new Sensor<Room>({
          sensorType: SensorType.ethernet,
          offset: [0.3, 0],
          onUpdate: function (this: Sensor<Room>) {
            const techRoom = this.parent.parent.serverRoom;
            const point = offset(this.parent.northWestCorner, [
              0,
              this.parent.height * 0.8,
            ]);
            this.coords = [point, mixPoints(techRoom, point, false), techRoom];
          },
        }),
        new Sensor<Room>({
          offset: [-0.3, 0],
          sensorType: SensorType.ethernet,
          onUpdate: function (this: Sensor<Room>) {
            const techRoom = this.parent.parent.serverRoom;
            const point = offset(this.parent.northWestCorner, [
              this.parent.width,
              this.parent.height * 0.5 - 2,
            ]);
            this.coords = [point, mixPoints(techRoom, point, false), techRoom];
          },
        }),

        new Sensor<Room>({
          sensorType: SensorType.pir,
          cableType: CableType.SharedEthernet,
          offset: [0, 0.3],
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = offset(room.northWestCorner, [room.width / 2, 0]);
            const point2 = mixPoints(point, house.serverRoom, true);
            this.coords = [point, point2, house.serverRoom];
          },
        }),
        new SensorLight<Room>({
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = offset(room.center, [0, 0]);
            this.coords = [
              point,
              mixPoints(house.serverRoom, point, false),
              house.serverRoom,
            ];
          },
        }),
        new Vent<Room>({
          sensorType: SensorType.ventIn,
          size: 200,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = room.center;
            this.coords = [
              point,
              mixPoints(house.serverRoom, point, false),
              house.serverRoom,
            ];
          },
        }),
      ],
    }),

    //// North rooms ////

    // Hall
    new Room({
      name: "Hall",
      usage: "Entré",
      floor: Floor.ground,
      onUpdate: function (this: Room, house: House) {
        this.northWestCorner = house.stair.stairOrigin;
        this.squaredRoom(
          house.stramien.ground.we.hall - house.stramien.in.we.b,
          house.stramien.in.ns.b -
            house.stramien.ground.ns.hall -
            house.wallInnerThickness
        );
      },
      parts: [
        new Sensor<Room>({
          sensorType: SensorType.pir,
          cableType: CableType.SharedEthernet,
          offset: [-0.3, 0],
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = offset(room.northWestCorner, [
              room.width,
              room.height - 1,
            ]);
            const point2 = offset(room.northWestCorner, [
              room.width,
              room.height,
            ]);
            this.coords = [point, point2, house.serverRoom];
          },
        }),
        // East
        new Wall({
          type: WallType.inner,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawByRoom(
              1,
              2,
              house,
              CornerType.straight,
              CornerType.straight
            );
          },
          parts: [
            new Door({
              scale: [1, 1],
              rotate: 0,
              floor: Floor.ground,
              onUpdate: function (this: Door, house: House) {
                this.origin = offset(
                  this.parent.getPosition(WallSide.in, 1, -0.2),
                  [-house.wallInnerThickness, 0]
                );
              },
            }),
            new Door({
              scale: [-1, 1],
              rotate: 0,
              floor: Floor.ground,
              onUpdate: function (this: Door, house: House) {
                const toiletHeight =
                  house.stramien.in.ns.b -
                  house.tower.innerCoords[0][1] -
                  house.wallInnerThickness * 1 -
                  0.9;
                this.origin = offset(
                  this.parent.getPosition(WallSide.out, 1, -toiletHeight),
                  [-house.wallInnerThickness, 0]
                );
              },
            }),
            ...[SensorType.lightSwitch, SensorType.temperature].map(
              (sensorType) =>
                new Sensor<Wall>({
                  sensorType,
                  offsetWall: 0.3,
                  onUpdate: function (this: Sensor<Wall>, house: House) {
                    const point = this.parent.getPosition(WallSide.in, 1, -2.5);
                    this.coords = [
                      point,
                      mixPoints(house.serverRoom, point, false),
                      house.serverRoom,
                    ];
                  },
                })
            ),
            ...[SensorType.lightSwitch, SensorType.temperature].map(
              (sensorType) =>
                new Sensor<Wall>({
                  sensorType,
                  offsetWall: -0.3,
                  onUpdate: function (this: Sensor<Wall>, house: House) {
                    const point = offset(
                      this.parent.getPosition(WallSide.in, 1, -2.5),
                      [house.wallInnerThickness, 0]
                    );
                    this.coords = [
                      point,
                      mixPoints(house.serverRoom, point, false),
                      house.serverRoom,
                    ];
                  },
                })
            ),
          ],
        }),

        // West
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic("w", house, house.wallOuterThickness);
          },
          parts: [
            new Sensor<Wall>({
              sensorType: SensorType.lightSwitch,
              onUpdate: function (this: Sensor<Wall>, house: House) {
                const point = this.parent.getPosition(WallSide.in, 0, 2.5);
                this.coords = [
                  point,
                  mixPoints(house.serverRoom, point, false),
                  house.serverRoom,
                ];
              },
            }),
          ],
        }),
        new SensorLight<Room>({
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = offset(room.center, [0, 0]);
            this.coords = [
              point,
              mixPoints(house.serverRoom, point, false),
              house.serverRoom,
            ];
          },
        }),
      ],
    }),

    // Office
    new Room({
      name: "Office",
      usage: "Office",
      floor: Floor.ground,
      onUpdate: function (this: Room, house: House) {
        this.northWestCorner = [house.stramien.in.we.b, house.stramien.in.ns.a];
        this.squaredRoom(
          house.stramien.in.we.c - house.stramien.in.we.b,
          house.stramien.ground.ns.hall -
            house.stramien.in.ns.a -
            house.wallInnerThickness
        );
      },
      parts: [
        // west theoretic
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic("w", house, house.wallOuterThickness);
          },
          parts: [
            ...[2 / 6, 4 / 6].map(
              (distance) =>
                new Sensor<Wall>({
                  offsetWall: 0.3,
                  sensorType: SensorType.ethernet,
                  onUpdate: function (this: Sensor<Wall>) {
                    const techRoom = this.parent.parent.parent.serverRoom;
                    const point = this.parent.getPosition(
                      WallSide.in,
                      distance,
                      0
                    );
                    this.coords = [
                      point,
                      mixPoints(techRoom, point, false),
                      techRoom,
                    ];
                  },
                })
            ),
          ],
        }),
        // south
        new Wall({
          floor: Floor.ground,
          type: WallType.inner,
          onUpdate: function (this: Wall, house: House) {
            this.drawByRoom(
              2,
              3,
              house,
              CornerType.straight,
              CornerType.straight
            );
          },
          parts: [
            new Door({
              rotate: 90,
              floor: Floor.ground,
              scale: [1, 1],
              onUpdate: function (this: Door, house: House) {
                this.origin = this.parent.getPosition(
                  WallSide.in,
                  1,
                  -(
                    house.stair.totalWidth +
                    house.wallInnerThickness -
                    this.width
                  )
                );
              },
            }),
            ...[0, 1, 2].map(
              (i) =>
                new Sensor<Wall>({
                  amount: 2,
                  offsetWall: -0.3,
                  sensorType: SensorType.socket,
                  onUpdate: function (this: Sensor<Wall>, house: House) {
                    const techRoom = house.serverRoom;
                    const point = this.parent.getPosition(
                      WallSide.in,
                      (i + 1) / 6,
                      0
                    );
                    this.coords = [point];
                  },
                })
            ),
            ...[SensorType.lightSwitch, SensorType.temperature].map(
              (sensorType) =>
                new Sensor<Wall>({
                  sensorType,
                  offsetWall: 0.3,
                  onUpdate: function (this: Sensor<Wall>, house: House) {
                    const wall = this.parent;
                    const point = wall.getPosition(WallSide.in, 1 / 2, 0);
                    this.coords = [
                      point,
                      mixPoints(house.serverRoom, point, false),
                      house.serverRoom,
                    ];
                  },
                })
            ),
            new Sensor<Wall>({
              sensorType: SensorType.lightSwitch,
              offsetWall: -0.3,
              onUpdate: function (this: Sensor<Wall>, house: House) {
                const wall = this.parent;
                const point = offset(wall.getPosition(WallSide.in, 1 / 2, 0), [
                  0,
                  house.wallInnerThickness,
                ]);
                this.coords = [
                  point,
                  mixPoints(house.serverRoom, point, false),
                  house.serverRoom,
                ];
              },
            }),
          ],
        }),
        // east theoretic
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic("e", house, house.wallOuterThickness);
          },
          parts: [
            ...[SensorType.camera, SensorType.poe].map(
              (sensorType) =>
                new Sensor<Wall>({
                  sensorType,
                  cableType: CableType.OutsidePOE,
                  offsetWall: -0.3,
                  onUpdate: function (this: Sensor<Wall>, house: House) {
                    const point = this.parent.getPosition(WallSide.in, 0, 0);
                    this.coords = [
                      offset(point, [house.wallOuterThickness, 0]),
                      offset(point, [-1, 1]),
                      house.serverRoom,
                    ];
                  },
                })
            ),
            ...[2 / 6, 4 / 6].map(
              (distance) =>
                new Sensor<Wall>({
                  offsetWall: -0.3,
                  sensorType: SensorType.ethernet,
                  onUpdate: function (this: Sensor<Wall>) {
                    const techRoom = this.parent.parent.parent.serverRoom;
                    const point = this.parent.getPosition(
                      WallSide.in,
                      distance,
                      0
                    );
                    this.coords = [
                      point,
                      mixPoints(techRoom, point, false),
                      techRoom,
                    ];
                  },
                })
            ),
          ],
        }),
        // north theoretic
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic("n", house, house.wallOuterThickness);
          },
          parts: [
            ...[1 / 6, 5 / 6].map(
              (distance) =>
                new Sensor<Wall>({
                  offset: [0, 0.3],
                  sensorType: SensorType.ethernet,
                  onUpdate: function (this: Sensor<Wall>) {
                    const techRoom = this.parent.parent.parent.serverRoom;
                    const point = this.parent.getPosition(
                      WallSide.in,
                      distance,
                      0
                    );
                    this.coords = [
                      point,
                      mixPoints(techRoom, point, false),
                      techRoom,
                    ];
                  },
                })
            ),
          ],
        }),

        new Sensor<Room>({
          sensorType: SensorType.smoke,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const point1 = offset(this.parent.northWestCorner, [
              this.parent.width * 0.5,
              this.parent.height * 0.5,
            ]);

            this.coords = [
              point1,
              mixPoints(point1, house.serverRoom, true),
              house.serverRoom,
            ];
          },
        }),
        new Sensor<Room>({
          sensorType: SensorType.socket,
          amount: 2,
          via: Floor.ceiling,
          group: 6,
          offset: [0, 0.3], // No included in cable length
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const group = room.centralElectricity;
            const point = offset(room.northWestCorner, [1, 0]);
            this.coords = [point];
          },
        }),
        new Sensor<Room>({
          sensorType: SensorType.socket,
          amount: 2,
          group: 6,
          offset: [0, 0.3], // No included in cable length
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const group = room.centralElectricity;
            const point = offset(room.northWestCorner, [room.width - 1, 0]);
            this.coords = [point];
          },
        }),
        new Sensor<Room>({
          sensorType: SensorType.socket,
          amount: 2,
          group: 6,
          offset: [0.3, 0], // No included in cable length
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const group = room.centralElectricity;
            const point = offset(room.northWestCorner, [0, room.height - 1]);
            this.coords = [point];
          },
        }),
        new Sensor<Room>({
          sensorType: SensorType.socket,
          amount: 2,
          group: 6,
          offset: [0.3, 0], // No included in cable length
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const group = room.centralElectricity;
            const point = offset(room.northWestCorner, [0, 1]);
            this.coords = [point];
          },
        }),
        new Sensor<Room>({
          sensorType: SensorType.socket,
          amount: 2,
          group: 6,
          offset: [-0.3, 0], // No included in cable length
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const group = room.centralElectricity;
            const point = offset(room.northWestCorner, [room.width, 1]);
            this.coords = [point];
          },
        }),
        new Sensor<Room>({
          sensorType: SensorType.socket,
          amount: 2,
          group: 6,
          offset: [-0.3, 0], // No included in cable length
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const group = room.centralElectricity;
            const point = offset(room.northWestCorner, [
              room.width,
              room.height - 1,
            ]);
            this.coords = [point];
          },
        }),
        new Sensor<Room>({
          sensorType: SensorType.socket,
          amount: 2,
          cableOnly: true,
          group: 6,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const group = room.centralElectricity;
            house.serverRoom;

            this.coords = [
              offset(room.northWestCorner, [0, room.height - 1]),
              offset(room.northWestCorner, [0, 0]),
              offset(room.northWestCorner, [room.width, 0]),
              offset(room.northWestCorner, [room.width, room.height]),
              offset(room.northWestCorner, [room.width * 0.5, room.height]),
              mixPoints(
                house.serverRoom,
                offset(room.northWestCorner, [room.width * 0.5, room.height]),
                false
              ),
              house.serverRoom,
            ];
          },
        }),
        new SensorLight<Room>({
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = offset(room.center, [0, 0]);
            this.coords = [
              point,
              mixPoints(house.serverRoom, point, false),
              house.serverRoom,
            ];
          },
        }),
        new Vent<Room>({
          sensorType: SensorType.ventOut,
          size: 200,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = room.center;
            this.coords = [
              point,
              mixPoints(house.serverRoom, point, false),
              house.serverRoom,
            ];
          },
        }),
      ],
    }),
    // toilet
    new Room({
      name: "Toilet",
      floor: Floor.ground,
      usage: "WC",
      onUpdate: function (this: Room, house: House) {
        const height =
          house.stramien.in.ns.b -
          house.tower.innerCoords[0][1] -
          house.wallInnerThickness * 2 -
          0.9;
        const width = groundToiletWidth;
        this.northWestCorner = [
          house.stramien.in.we.b +
            house.stair.totalWidth -
            house.stair.walkWidth +
            house.wallInnerThickness,
          house.stramien.in.ns.b - height - house.wallInnerThickness,
        ];
        this.squaredRoom(width, height);
      },
      parts: [
        // North
        new Wall({
          floor: Floor.ground,
          type: WallType.inner,
          onUpdate: function (this: Wall, house: House) {
            this.drawByRoom(
              0,
              1,
              house,
              CornerType.straight,
              CornerType.outside
            );
          },
          parts: [
            new Water<Wall>({
              sensorType: SensorType.toilet,
              size: 120,
              onUpdate: function (this: Sensor<Wall>, house: House) {
                const point = offset(
                  this.parent.getPosition(WallSide.in, 1 / 2, 0),
                  [0, 0.2]
                );
                this.coords = [
                  point,
                  mixPoints(house.serverRoom, point, true),
                  house.serverRoom,
                ];
              },
            }),
          ],
        }),

        // East
        new Wall({
          floor: Floor.ground,
          type: WallType.inner,
          onUpdate: function (this: Wall, house: House) {
            this.drawByRoom(
              1,
              2,
              house,
              CornerType.outside,
              CornerType.straight
            );
          },
          parts: [
            new Water<Wall>({
              sensorType: SensorType.drain,
              onUpdate: function (this: Sensor<Wall>, house: House) {
                const point = offset(
                  this.parent.getPosition(WallSide.in, 2 / 3, 0),
                  [0, 0]
                );
                const room = this.parent.parent;
                const point2: xy = [point[0], room.northWestCorner[1] + 0.2];
                this.coords = [point, point2];
              },
            }),
            new Water<Wall>({
              sensorType: SensorType.waterWarm,
              onUpdate: function (this: Sensor<Wall>, house: House) {
                const point = offset(
                  this.parent.getPosition(WallSide.in, 2 / 3, 0),
                  [0, 0]
                );
                const room = this.parent.parent;
                this.coords = [
                  point,
                  mixPoints(house.serverRoom, point, true),
                  house.serverRoom,
                ];
              },
            }),
          ],
        }),

        // West theoretic
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawByRoom(
              3,
              0,
              house,
              CornerType.straight,
              CornerType.straight
            );
          },
          parts: [
            new Sensor<Wall>({
              sensorType: SensorType.lightSwitch,
              onUpdate: function (this: Sensor<Wall>, house: House) {
                const point = this.parent.getPosition(WallSide.in, 0, 0.8);
                this.coords = [
                  point,
                  mixPoints(house.serverRoom, point, false),
                  house.serverRoom,
                ];
              },
            }),
          ],
        }),
        new SensorLight<Room>({
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = offset(room.center, [0, 0]);
            this.coords = [
              point,
              mixPoints(house.serverRoom, point, false),
              house.serverRoom,
            ];
          },
        }),
        new Vent<Room>({
          sensorType: SensorType.ventIn,
          size: 200,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = room.center;
            this.coords = [
              point,
              mixPoints(house.serverRoom, point, false),
              house.serverRoom,
            ];
          },
        }),
      ],
    }),

    // Server / Tech / Boiler Room
    new Room({
      name: "Server",
      usage: "KLK",
      floor: Floor.ground,
      onUpdate: function (this: Room, house: House) {
        const height =
          house.stramien.in.ns.b -
          house.tower.innerCoords[0][1] -
          house.wallInnerThickness * 2 -
          0.9;
        // const height = 1.0;
        const toiletOffset =
          house.stramien.ground.we.hall +
          groundToiletWidth +
          house.wallInnerThickness * 2;

        this.northWestCorner = [
          toiletOffset,
          house.stramien.in.ns.b - height - house.wallInnerThickness,
        ];
        this.squaredRoom(house.stramien.in.we.c - toiletOffset, height);
      },
      parts: [
        new Wall({
          floor: Floor.ground,
          type: WallType.inner,
          onUpdate: function (this: Wall, house: House) {
            this.drawByRoom(
              0,
              1,
              house,
              CornerType.straight,
              CornerType.straight
            );
          },
          parts: [
            ...[0, 1, 2].map(
              (i) =>
                new Sensor<Wall>({
                  amount: i === 1 ? 2 : 1,
                  offsetWall: i === 1 ? -0.3 : 0.3,
                  sensorType: SensorType.socket,
                  onUpdate: function (this: Sensor<Wall>, house: House) {
                    const techRoom = house.serverRoom;
                    const point = this.parent.getPosition(
                      WallSide.in,
                      (i + 1) / 4,
                      0
                    );
                    this.coords = [
                      offset(point, [
                        0,
                        i === 1 ? -house.wallInnerThickness : 0,
                      ]),
                      offset(point, [0, 0]),
                      mixPoints(techRoom, point, false),
                      techRoom,
                    ];
                  },
                })
            ),
          ],
        }),

        new Sensor<Room>({
          sensorType: SensorType.smoke,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const point1 = this.parent.center;
            this.coords = [
              point1,
              mixPoints(point1, house.serverRoom, true),
              house.serverRoom,
            ];
          },
        }),

        ...[SensorType.poe, SensorType.wifi].map(
          (sensorType) =>
            new Sensor<Room>({
              offset: [0, 0.3],
              sensorType,
              onUpdate: function (this: Sensor<Room>, house: House) {
                const point1 = this.parent.center;
                this.coords = [
                  point1,
                  mixPoints(point1, house.serverRoom, true),
                  house.serverRoom,
                ];
              },
            })
        ),
        ...[SensorType.lightSwitch, SensorType.temperature].map(
          (sensorType) =>
            new Sensor<Room>({
              sensorType,
              offset: [0, 0.3],
              onUpdate: function (this: Sensor<Room>, house: House) {
                const room = this.parent;
                const point = offset(room.northWestCorner, [
                  room.width * 0.2,
                  room.height * 0.0,
                ]);
                const point2 = offset(room.northWestCorner, [
                  room.width * 0.0,
                  room.height * 0.0,
                ]);
                this.coords = [
                  point,
                  point2,
                  mixPoints(house.serverRoom, point2, false),
                  house.serverRoom,
                ];
              },
            })
        ),
        new SensorLight<Room>({
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = offset(room.center, [0, 0]);
            this.coords = [
              point,
              mixPoints(house.serverRoom, point, false),
              house.serverRoom,
            ];
          },
        }),
        new Vent<Room>({
          sensorType: SensorType.ventIn,
          size: 100,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = room.center;
            this.coords = [
              point,
              mixPoints(house.serverRoom, point, false),
              house.serverRoom,
            ];
          },
        }),
      ],
    }),

    // Tower
    new Room({
      name: "Tower",
      floor: Floor.ground,
      onUpdate: function (this: Room, house: House) {
        this.outOfDesign = !house.showTower;
        if (this.outOfDesign) return;
        const wallDiff = house.wallOuterThickness - house.wallInnerThickness;
        this.northWestCorner = [
          house.stramien.out.we.c - wallDiff,
          house.tower.innerCoords[0][1],
        ];

        this.center = offset(this.northWestCorner, [1, 1]);
        this.centralElectricity = this.center;
        this.coords = [
          this.northWestCorner,
          house.tower.innerCoords[0],
          house.tower.innerCoords[1],
          house.tower.innerCoords[2],
          house.tower.innerCoords[3],
          [
            house.tower.innerCoords[3][0],
            house.stramien.in.ns.b - house.wallInnerThickness,
          ],
          [
            this.northWestCorner[0],
            house.stramien.in.ns.b - house.wallInnerThickness,
          ],
        ];
      },
      parts: [
        // South
        new Wall({
          type: WallType.inner,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.outOfDesign = !house.showTower;
            if (this.outOfDesign) return;
            this.drawByRoom(
              6,
              0,
              house,
              CornerType.outside,
              CornerType.straight
            );
          },
          parts: [
            new Door({
              scale: [1, 1],
              rotate: 180,
              floor: Floor.ground,
              onUpdate: function (this: Door, house: House) {
                this.outOfDesign = !house.showTower;
                if (this.outOfDesign) return;
                this.floor = Floor.ground;
                this.origin = this.parent.getPosition(WallSide.in, 1, 0);
              },
            }),
          ],
        }),
        // // west
        new Wall({
          type: WallType.inner,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.outOfDesign = !house.showTower;
            if (this.outOfDesign) return;
            this.drawByRoom(
              5,
              6,
              house,
              CornerType.straight,
              CornerType.outside
            );
          },
          parts: [
            new Door({
              scale: [-1, 1],
              rotate: -90,
              floor: Floor.ground,
              onUpdate: function (this: Door, house: House) {
                this.outOfDesign = !house.showTower;
                if (this.outOfDesign) return;
                this.floor = Floor.ground;
                this.origin = this.parent.getPosition(
                  WallSide.in,
                  0,
                  house.wallInnerThickness
                );
              },
            }),
          ],
        }),
        new Sensor<Room>({
          sensorType: SensorType.pir,
          cableType: CableType.SharedEthernet,
          offset: [0.3, 0],
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = offset(room.northWestCorner, [0, room.height - 1]);
            const point2 = mixPoints(point, house.serverRoom, true);
            this.coords = [point, point2, house.serverRoom];
          },
        }),
        new SensorLight<Room>({
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = offset(room.center, [0, 0]);
            this.coords = [
              point,
              mixPoints(house.serverRoom, point, false),
              house.serverRoom,
            ];
          },
        }),
      ],
    }),

    // Laundry
    new Room({
      name: "Laundry",
      usage: "Klädvård",
      floor: Floor.ground,
      onUpdate: function (this: Room, house: House) {
        const serverHeight =
          house.stramien.in.ns.b -
          house.tower.innerCoords[0][1] -
          house.wallInnerThickness * 2 -
          0.9;

        const width =
          house.stramien.in.we.c -
          house.stramien.ground.we.hall -
          house.wallInnerThickness;
        const height =
          house.stramien.in.ns.b -
          house.stramien.ground.ns.hall -
          serverHeight -
          house.wallInnerThickness * 2;

        this.northWestCorner = [
          house.stramien.ground.we.hall + house.wallInnerThickness,
          house.stramien.ground.ns.hall,
        ];
        this.squaredRoom(width, height);

        // const serverRoomHeight =
        //   house.stramien.in.ns.b -
        //   house.tower.innerCoords[0][1] -
        //   house.wallInnerThickness * 2 -
        //   0.9;
        // const height =
        //   house.stramien.in.ns.b -
        //   house.stramien.ground.ns.hall -
        //   serverRoomHeight;

        // const toiletOffset =
        //   house.stramien.ground.we.hall +
        //   groundToiletWidth +
        //   house.wallInnerThickness * 2;

        // this.northWestCorner = [
        //   house.stramien.ground.we.hall,
        //   house.stair.stairOrigin[1],
        // ];

        // // const toiletServer: xy = [
        // //   toiletOffset,
        // //   house.stramien.in.ns.b - serverRoomHeight - house.wallInnerThickness,
        // // ];

        // const width = house.stramien.in.ns.c - toiletOffset;

        // this.width = round(width);
        // this.height = round(height);
        // this.coords = [
        //   this.northWestCorner,
        //   offset(this.northWestCorner, [width, 0]),
        //   offset(this.northWestCorner, [width, height]),
        //   offset(this.northWestCorner, [0, height]),
        // ];

        // this.center = offset(this.northWestCorner, [width / 2, height / 2]);
        // this.centralElectricity = this.center;

        // this.coords = [
        //   this.northWestCorner,
        //   offset(this.northWestCorner, [width, 0]),
        //   offset(this.northWestCorner, [width, height]),
        //   [this.northWestCorner[0] + width, toiletServer[1]],
        //   toiletServer,
        //   [toiletServer[0], this.northWestCorner[1] + height],
        //   offset(this.northWestCorner, [0, height]),
        // ];

        // this.center = offset(this.northWestCorner, [width / 2, height / 2]);
        // this.centralElectricity = this.center;
      },
      parts: [
        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic("n", house, house.wallOuterThickness);
          },

          parts: [
            new Water<Wall>({
              sensorType: SensorType.drain,
              onUpdate: function (this: Sensor<Wall>, house: House) {
                const room = this.parent.parent;
                const point = room.center;
                this.coords = [
                  point,
                  mixPoints(house.serverRoom, point, true),
                  house.serverRoom,
                ];
              },
            }),
            ...[SensorType.waterCold, SensorType.waterRain].map(
              (sensorType) =>
                new Water<Wall>({
                  sensorType,
                  offsetWall: sensorType === SensorType.waterRain ? 0 : 0.3,
                  onUpdate: function (this: Sensor<Wall>, house: House) {
                    const wall = this.parent;
                    const point = wall.getPosition(
                      WallSide.in,
                      sensorType === SensorType.waterRain ? 2 / 3 : 3 / 4,
                      0
                    );
                    this.coords = [
                      point,
                      mixPoints(house.serverRoom, point, false),
                      house.serverRoom,
                    ];
                  },
                })
            ),
            ...[SensorType.waterCold, SensorType.waterRain].map(
              (sensorType) =>
                new Water<Wall>({
                  sensorType,
                  offsetWall: sensorType === SensorType.waterRain ? 0 : 0.3,
                  onUpdate: function (this: Sensor<Wall>, house: House) {
                    const wall = this.parent;
                    const point = wall.getPosition(
                      WallSide.in,
                      sensorType === SensorType.waterRain ? 1 / 3 : 1 / 4,
                      0
                    );
                    const point2 = wall.getPosition(
                      WallSide.in,
                      sensorType === SensorType.waterRain ? 2 / 3 : 3 / 4,
                      0
                    );
                    this.coords = [point, point2];
                  },
                })
            ),
            new Water<Wall>({
              sensorType: SensorType.drain,
              onUpdate: function (this: Sensor<Wall>, house: House) {
                const wall = this.parent;
                const room = wall.parent;
                const point = wall.getPosition(WallSide.in, 1 / 2, 0);
                const point2 = room.center;
                this.coords = [point, point2];
              },
            }),
          ],
        }),

        new Wall({
          type: WallType.theoretic,
          floor: Floor.ground,
          onUpdate: function (this: Wall, house: House) {
            this.drawTheoretic("w", house, house.wallInnerThickness);
          },

          parts: [],
        }),

        new Sensor<Room>({
          sensorType: SensorType.smoke,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const point1 = this.parent.center;
            this.coords = [
              point1,
              mixPoints(point1, house.serverRoom, true),
              house.serverRoom,
            ];
          },
        }),

        new Sensor<Room>({
          sensorType: SensorType.ethernet,
          offset: [0.3, 0],
          onUpdate: function (this: Sensor<Room>, house: House) {
            const techRoom = house.serverRoom;
            const room = this.parent;
            const point = offset(room.northWestCorner, [
              room.width * 0.0,
              room.height * 0.5,
            ]);
            this.coords = [point, mixPoints(techRoom, point, false), techRoom];
          },
        }),
        new SensorLight<Room>({
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = offset(room.center, [0, 0]);
            this.coords = [
              point,
              mixPoints(house.serverRoom, point, false),
              house.serverRoom,
            ];
          },
        }),
        new Vent<Room>({
          sensorType: SensorType.ventIn,
          size: 200,
          onUpdate: function (this: Sensor<Room>, house: House) {
            const room = this.parent;
            const point = room.center;
            this.coords = [
              point,
              mixPoints(house.serverRoom, point, false),
              house.serverRoom,
            ];
          },
        }),
      ],
    }),

    //  upstairs
    ...lindeLundUpstairs,
  ],
};
