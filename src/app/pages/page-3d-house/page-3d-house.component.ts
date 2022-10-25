import { AfterViewInit, Component, NgZone } from "@angular/core";
import { AppService } from "src/app/app.service";
import { HouseService } from "src/app/house/house.service";
import { Section, Tag } from "src/app/components/enum.data";
import { round, sum } from "src/app/shared/global-functions";
import { rowHeatCalc, Thicknesses } from "src/app/house/construction.model";

export type column = {
  id: keyof rowHeatCalc;
  name: string;
  def?: (x: any, y?: any) => string;
};

@Component({
  selector: "app-page-3d-house",
  templateUrl: "./page-3d-house.component.html",
  styleUrls: ["./page-3d-house.component.scss"],
})
export class Page3dHouseComponent implements AfterViewInit {
  house$ = this.houseService.house$;
  Tag = Tag;
  Section = Section;
  update = this.houseService.update;
  round = round;
  Thicknesses = Thicknesses;

  joists = [200, 300, 350, 400];

  columns: column[] = [
    { id: "name", name: "Name", def: (x) => `${x}` },
    { id: "diameter", name: "Diameter", def: (x) => `${round(x, 3)}` },
    { id: "lambda", name: "Lambda", def: (x) => `${round(x, 3)}` },
    { id: "r", name: "R", def: (x) => `${round(x, 2)}` },
    { id: "deltaT", name: "Delta T", def: (x) => `${round(x, 1)}°C` },
    { id: "temp", name: "Temp", def: (x) => `${round(x, 1)}°C` },
  ];
  columnNames = this.columns.map((x) => x.id);

  constructor(public houseService: HouseService) {}

  ngAfterViewInit(): void {}

  currentJoist = () =>
    this.joists.findIndex(
      (y) =>
        y === this.house$.value.construction.Thicknesses[Thicknesses.joists]
    );

  updateJoist(index) {
    this.update("construction", "thicknessJoist", this.joists[index]);
  }
  updateOuterSheet(index) {
    this.update("construction", "thicknessJoist", this.joists[index]);
  }
}
