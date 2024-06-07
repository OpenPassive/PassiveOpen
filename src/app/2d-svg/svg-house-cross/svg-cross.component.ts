import { AfterViewInit, Component, OnDestroy } from "@angular/core";
import * as d3 from "d3";
import { BasicSVGComponent } from "src/app/2d-svg/base-svg.component";
import { Graphic, Section, State } from "src/app/components/enum.data";
import { Elevation, RoofPoint, RoofStyle } from "src/app/house/cross.model";
import { SvgLoader } from "../d3.service";
import { crossBuildingParts } from "./cross.data";
import { HousePart } from "src/app/house/house.model";

@Component({
  selector: "app-svg-cross",
  templateUrl: "./svg-cross.component.html",
  styleUrls: ["./svg-cross.component.scss"],
})
export class SvgCrossComponent extends BasicSVGComponent {
  marginInMeters = [3, 3, 3, 3];
  figure: SvgLoader;
  graphic = Graphic.cross;
  RoofStyle = RoofStyle;

  addHousePartModelsAndSVG() {
    crossBuildingParts.forEach(this.getHousePartsCallback);
  }

  beforeInit() {}
  afterUpdate() {
    this.debugDrawPoints(); //// Only for debug
  }

  afterInit() {
    console.log("loadFigure");

    this.svgLoaders.push(
      this.d3Service.loadSVG(
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
      )
    );
  }

  setMarginAndSize() {
    const low = this.cross.elevations[Elevation.crawlerFloor];
    this.svgSizeInMeters = [
      [0, -this.cross.elevations[RoofPoint.topOutside]],
      [
        this.house.outerBase,
        -low + this.cross.elevations[RoofPoint.topOutside],
      ],
    ];
    // const [[x, y], [maxX, maxY]] = this.drawingSize;
    const margin = 3;
    this.marginInMeters = [margin, margin, margin, margin];
  }

  debugDrawPoints() {
    this.house.cross.pointOf70Roof().forEach((point, i) => {
      d3.select<SVGCircleElement, unknown>(`#debug-point-${i}`)
        .attr("cx", point[0])
        .attr("cy", -point[1])
        .attr("r", 0.051)
        .style("fill", "var(--accent-color)")
        .attr("stroke-width", 0);
    });

    //   Object.keys(RoofPoint).forEach((key: RoofPoint, i) => {
    //     const point = this.house.construction.getRoofPoint(key);

    //     d3.select<SVGCircleElement, unknown>(`#debug-point-${i}`)
    //       .attr("cx", point[0] + this.cross.wallOuterThickness)
    //       .attr("cy", point[1])
    //       .attr("r", 0.1)
    //       .style("fill", "var(--primary-color)")
    //       .attr("stroke-width", 0);
    //   });
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

  setHousePartVisibility() {
    const states = this.statesService.states$.value;
    const house = this.houseService.house$.value;

    crossBuildingParts.forEach((housePart) => {
      let vis = true;

      if (housePart.housePart === HousePart.measures) vis = true; //states[State.measure];

      if (housePart.selector.includes("__h-")) vis = true;
      housePart.setVisibility(vis);
    });
  }
}
