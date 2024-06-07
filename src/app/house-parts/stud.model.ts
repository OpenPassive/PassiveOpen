import { Floor } from "../components/enum.data";
import { House, HousePart, xy } from "../house/house.model";
import { angleXY, offset, rotateXY } from "../shared/global-functions";
import { HousePartModel } from "./model/housePart.model";
import { StudSVG } from "./svg/stud.svg";
import { Wall, WallSide, WallType } from "./wall.model";

const studWidth = 45 / 1000;
const studHeight = 300 / 1000;
const insideFinish = 88 / 1000;
const outsideFinish = 144 / 1000;
const maxAmount = 55;

let id = 0;

export const createStuds = (house: House) => {
  const walls = house.houseParts.walls.filter(
    (wall: Wall) => wall.type === WallType.outer && wall.tower !== true
  ) as Wall[];

  return walls
    .flatMap((wall) => {
      if (!wall.gable) return;
      const amount = Math.ceil(
        (wall.getLength(WallSide.out) - outsideFinish * 2) / house.studDistance
      );
      console.log(wall.selector, wall.angle);

      return Array(16)
        .fill(0)
        .map((_, index) => {
          return new Stud({
            main: [0, maxAmount].includes(index),
            visible: true,
            selector: `stud-${index}-${id++}`,
            wall,
            floor: Floor.all,
            parent: wall,
            index,
          });
        });
    })
    .filter((x) => x);
};

export class Stud extends HousePartModel<StudSVG> {
  housePart: HousePart = HousePart.studs;
  main: boolean;
  coords: xy[];
  visible: boolean;
  wall: Wall;
  index: number;

  constructor(data: Partial<Stud>) {
    super();
    Object.assign(this, data);
  }

  onUpdate(house: House): void {
    this.outOfDesign =
      Math.ceil(
        (this.wall.getLength(WallSide.out) - outsideFinish * 2) /
          house.studDistance
      ) <
      this.index + 1;

    const start = angleXY(
      this.wall.angle,
      -insideFinish - studHeight,
      this.wall.origin
    );
    const origin = angleXY(this.wall.angle - 90, insideFinish, start);

    const angle = [180, 0].includes(this.wall.angle)
      ? this.wall.angle + 180
      : this.wall.angle;
    this.coords = this.template()
      .map((coord: xy) => rotateXY(coord, [0, 0], angle))
      .map((coord: xy) =>
        angleXY(this.wall.angle, house.studDistance * this.index, coord)
      )
      .map((coord: xy) => offset(origin, coord));
  }
  afterUpdate(): void {}
  getSVGInstance(): void {
    this.svg = new StudSVG(this);
  }

  template() {
    return [
      [0, 0],
      [studWidth, 0],
      [studWidth, studHeight],
      [0, studHeight],
      [0, 0],
    ];
  }
}
