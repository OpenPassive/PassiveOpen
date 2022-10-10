import { Component, AfterViewInit, ElementRef, OnDestroy } from "@angular/core";
import * as d3 from "d3";
import { AppService } from "src/app/app.service";
import { BasicSVG } from "src/app/svg/base-svg.component";
import { Graphic, Section } from "src/app/components/enum.data";
import { TooltipService } from "src/app/components/tooltip/tooltip.service";
import { HouseService } from "src/app/house/house.service";
import { D3Service, SvgLoader } from "../d3.service";
import {
  Elevation,
  RoofPoint,
  RoofStyle,
  RoofType,
} from "src/app/house/cross.model";

@Component({
  selector: "app-svg-cross",
  templateUrl: "./svg-cross.component.html",
  styleUrls: ["./svg-cross.component.scss"],
})
export class SvgCrossComponent
  extends BasicSVG
  implements AfterViewInit, OnDestroy
{
  marginInMeters = [3, 3, 3, 3];
  figure: SvgLoader;
  graphic = Graphic.cross;
  RoofStyle = RoofStyle;

  constructor(
    public houseService: HouseService,
    public appService: AppService,
    public tooltipService: TooltipService,
    public host: ElementRef,
    public d3Service: D3Service
  ) {
    super(houseService, appService, tooltipService, host, d3Service);
  }

  ngAfterViewInit(): void {
    this.loadFigure();
    this.setUp();
  }

  loadFigure() {
    this.figure = this.d3Service.loadSVG(
      "assets/models/dude.svg",
      ".g-figure",
      (selector) => {
        const h = 1.9;
        const scale = h / 568;
        let elev, offset, flip;
        const w = 117 * scale;

        if ([Section.roofBasics].includes(this.section)) {
          elev = this.house$.value.cross.elevations[Elevation.groundFloor];
          offset = this.house$.value.cross.topFloorThickness * 3;
          flip = true;
        } else {
          elev = this.house$.value.cross.elevations[Elevation.topFloor];
          offset = this.house$.value.cross.innerWidth / 2 - w / 2 + 0.5;
          flip = false;
        }
        d3.select(selector)
          .selectChild("svg")
          .attr("height", 568 * scale + "px") //width="117.184px" height="568.086px"
          .attr("y", -elev - h + "px")
          .attr("x", offset + "px")
          .attr("width", w + "px")
          .selectChild("g")
          .attr("transform", flip ? `translate(117,0) scale(-1 1)` : "");
      }
    );
  }

  svgUpdateMarginAndSize() {
    this.drawingSize = [
      [0, -(this.cross.elevations[Elevation.crawlerFloor] + 3)],
      [this.house.outerBase, this.cross.elevations[Elevation.topFloor] - 3],
    ];
    const margin = 3;
    this.marginInMeters = [margin, margin, margin, margin];

    this.drawBendPoint();
    this.drawPoints(); //// Only for debug
    this.figure.update();
  }

  drawPoints() {
    const x = this.cross.getIntersectionWithRoof(this.cross.minimumHeight);
    const i = this.cross.getIntersectionWithRoof(this.cross.minimumHeightRoom);
    const level = this.cross.elevations[Elevation.topFloor];
    // [...this.cross.innerRoofContourLine, x, i].forEach((x, i) => {
    //   d3.select<SVGCircleElement, unknown>(`#roof-point-${i}`)
    //     .attr("cx", x[0] + this.cross.wallOuterThickness)
    //     .attr("cy", -level - x[1])
    //     .attr("r", i < 4 ? 0.1 : 0.13)
    //     .style("fill", i < 4 ? "var(--color-50)" : "var(--color-80)")
    //     .attr("stroke-width", this.meterPerPixel * 0);
    // });

    Object.keys(RoofPoint).forEach((key: RoofPoint,i) => {
      const point = this.house.construction.getRoofPoint(key);
      
      d3.select<SVGCircleElement, unknown>(`#debug-point-${i}`)
        .attr("cx", point[0]+this.cross.wallOuterThickness )
        .attr("cy", -point[1])
        .attr("r", 0.1)
        .style("fill", "var(--primary-color)")
        .attr("stroke-width", 0);
    });
  }

  drawBendPoint() {
    const pointDiameter = 0.1;
    const level = this.cross.elevations[Elevation.topFloor];
    d3.select<SVGPolylineElement, unknown>("#bend-point__h-line")
      .attr(
        "points",
        [
          [0, -level - this.cross.roof70Walls],
          [this.cross.bendPoint[0], -level - this.cross.roof70Walls],
          [
            this.cross.bendPoint[0],
            -level + this.cross.bendPoint[1] + pointDiameter,
          ],
        ].join(" ")
      )
      .attr("stroke-width", this.meterPerPixel * 2);
    d3.select<SVGCircleElement, unknown>("#bend-point__h-point")
      .attr("cx", this.cross.bendPoint[0])
      .attr("cy", -level + this.cross.bendPoint[1])
      .attr("r", pointDiameter)
      .attr("stroke-width", this.meterPerPixel * 2);
  }

  roofCheck(roofStyle: RoofStyle) {
    const cross = this.house$.value.cross;
    const current = cross.roofStyle;
    if (this.section === Section.roof70) {
      return roofStyle === RoofStyle.roof70 ? 1 : 0;
    } else if (this.section === Section.roofCircle) {
      return roofStyle === RoofStyle.roofCircle ? 1 : 0;
    } else {
      return [RoofStyle.roofCircleAnd70, roofStyle].includes(current) ? 1 : 0;
    }
  }
}
