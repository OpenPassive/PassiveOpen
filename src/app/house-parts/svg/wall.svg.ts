import { SafeHtml } from "@angular/platform-browser";
import * as d3 from "d3";
import { Footprint } from "../footprint.model";
import { HousePartSVG } from "../model/housePart.model";
import { Wall, WallSide, WallType } from "../wall.model";

export class WallSVG extends HousePartSVG<Wall> {
  svgRight: d3.Selection<SVGPolylineElement, unknown, HTMLElement, any>;
  svgLeft: d3.Selection<SVGPolylineElement, unknown, HTMLElement, any>;
  svgFill: d3.Selection<SVGPolygonElement, unknown, HTMLElement, any>;
  svgOrigin: d3.Selection<SVGCircleElement, unknown, HTMLElement, any>;

  setD3() {
    this.svg = d3.select(`#${this.selector}`);
    this.theoretic = this.model.type === WallType.theoretic;

    this.classes = [`type-${this.model.type}`];
    if (this.model.gable) this.classes.push("wall-gable");
    if (this.theoretic) this.classes.push("wall-theoretic");

    this.svgOrigin = this.svg.select<SVGCircleElement>(".wall-origin");
    this.svgLeft = this.svg.select<SVGPolylineElement>(".wall-left");
    this.svgRight = this.svg.select<SVGPolylineElement>(".wall-right");
    this.svgFill = this.svg.select<SVGPolygonElement>(".wall-fill");

    if (this.model.type === WallType.outer) {
      this.model.thickness = this.model.parent.parent.wallOuterThickness;
    }
    if (this.model.type === WallType.inner) {
      this.model.thickness = this.model.parent.parent.wallInnerThickness;
    }
  }
  drawWhenNotVisible(): void {
    this.svgFill.attr("points", "");
    this.svgLeft.attr("points", "");
    this.svgRight.attr("points", "");
    this.svgOrigin.attr("r", "0");
  }

  initDraw() {
    // Extra's
    this.svgOrigin
      .attr("cx", this.model.origin[0])
      .attr("cy", this.model.origin[1]);

    if (this.model.sides.in && this.model.sides.out) {
      this.svgFill.attr(
        "points",
        [...this.model.sides.in, ...[...this.model.sides.out].reverse()].join(
          " "
        )
      );
    }

    for (let wallSide of Object.keys(WallSide)) {
      const side = wallSide as WallSide;
      if (!(side in this.model.sides)) {
        continue;
      }
      let lineSVG: d3.Selection<SVGPolygonElement, unknown, HTMLElement, any>;
      if (side === WallSide.in) {
        lineSVG = this.svgLeft;
      } else {
        lineSVG = this.svgRight;
      }

      lineSVG.attr("points", this.model.sides[side].join(" "));
      if (lineSVG.node()) {
        lineSVG.node().classList.add(`side-${side}`);
      }
    }
    this.model.innerWallLength = this.model.getLength(WallSide.in);
    this.model.outerWallLength = this.model.getLength(WallSide.out);
  }

  updateScale() {
    if (this.svgOrigin) {
      this.svgOrigin.attr("r", this.meterPerPixel * this.lineThickness * 10);
    }
    if (this.svgLeft) {
      this.svgLeft.attr(
        "stroke-width",
        this.meterPerPixel *
          this.lineThickness *
          (this.model.type === WallType.theoretic ? 4 : 1) // DEV
      );
    }
    if (this.svgRight) {
      this.svgRight.attr(
        "stroke-width",
        this.meterPerPixel *
          this.lineThickness *
          (this.model.type === WallType.theoretic ? 4 : 1) // DEV
      );
    }
  }

  tooltip = (): SafeHtml => {
    const wall = this.model;
    return `Wall <b>${wall.orientation}</b> (${
      wall.parent instanceof Footprint
        ? "outer wall"
        : "of " + wall.parent + " room"
    } ) 
    <br>Inside ${wall.getLength(WallSide.in, 2)} m2
    <br>Outside ${(wall.outerWallLength = wall.getLength(WallSide.out, 2))} m2`;
  };
}
