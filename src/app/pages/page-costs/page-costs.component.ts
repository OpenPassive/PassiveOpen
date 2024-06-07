import { Component } from "@angular/core";
import { BehaviorSubject, first } from "rxjs";
import { Section, SensorType } from "src/app/components/enum.data";
import { Door } from "src/app/house-parts/door.model";
import { HousePartModel } from "src/app/house-parts/model/housePart.model";
import { Sensor } from "src/app/house-parts/sensor-models/sensor.model";
import { SensorLight } from "src/app/house-parts/sensor-models/sensorLight.model";
import { Water } from "src/app/house-parts/sensor-models/water.model";
import { Window, WindowForm } from "src/app/house-parts/window.model";
import { Cost, CostTable, GroupRow } from "src/app/house/cost.model";
import { House } from "src/app/house/house.model";
import { HouseService } from "src/app/house/house.service";
import { round, sum } from "src/app/shared/global-functions";
import { generateUUID } from "three/src/math/MathUtils";

@Component({
  selector: "app-page-costs",
  templateUrl: "./page-costs.component.html",
  styleUrls: ["./page-costs.component.scss"],
})
export class PageCostsComponent {
  Section = Section;

  tables$ = new BehaviorSubject<CostTable[]>([]);
  hiddenTables$ = new BehaviorSubject<CostTable[]>([]);
  totals$ = new BehaviorSubject<CostTable>(undefined);

  house: House;
  all: HousePartModel[];

  constructor(private houseService: HouseService) {
    this.houseService.house$
      .pipe(first((x) => x !== undefined))
      .subscribe((house) => {
        this.house = house;

        this.all = Object.keys(house.houseParts).flatMap((key) => {
          return house.houseParts[key];
        });

        this.tables$.next([
          //
          this.getKitchen(),
          //
        ]);
        this.hiddenTables$.next([
          //
          this.getPreps(),
          this.getConstruction(),
          this.getOpenings(),
          this.getElectra(),
          this.getFinish(),
          this.getWater(),
          this.getOutsideFinish(),
          this.getBathroom(),
          //
        ]);
        this.totals$.next(this.getTotals());
      });
  }

  getT<T extends HousePartModel<any>>(
    type: any,
    keys: (keyof T)[],
    callback: (key: T) => Partial<Cost>,
    filterCallback: (key: T) => boolean = () => true,
    count = true
  ) {
    const uuid = generateUUID();

    // this.getT<Door>(Door, [], (door) => ({
    //   name: "Door casing",
    //   price: 60,
    // })),
    // this.getT<Water<any>>(
    //   Water,
    //   ["sensorType"],
    //   (x) => ({
    //     name: "Warm water",
    //     price: 20,
    //     unit: "m",
    //   }),
    //   (x) => x.sensorType === SensorType.waterWarm,
    //   false
    // ),

    const parts = Object.values(
      this.all
        .filter((x) => x instanceof type)
        .filter((x) => filterCallback(x as any))
        .reduce((accumulator, value: any) => {
          const key = keys.map((x) => `${value[x as any]}`).join(",");
          if (!(key in accumulator)) {
            accumulator[key] = {
              count: 0,
              part: value,
            };
          }
          if (type === Sensor && !count) {
            //@ts-ignore //todo repair
            accumulator[key].count += (value as Sensor<any>).getLength();
          } else {
            accumulator[key].count += 1;
          }
          return accumulator;
        }, {})
    ).map((counter: { count: number; part: T }) => {
      const cost = new Cost(callback(counter.part));

      cost.amount = round(counter.count, 1);
      cost.uuid = uuid;
      return cost;
    });

    if (parts.length > 1) {
      const groupRow = new GroupRow({
        uuid,
        name: `${parts[0].name}`,
        costs: parts,
      });
      groupRow[parts[0].name] = false;
      return groupRow;
    } else {
      if (!parts[0]) return undefined;
      const row = parts[0];
      row.uuid = undefined;
      return row;
    }
  }

  getFinish(): CostTable {
    const house = this.houseService.house$.value;
    const { innerLength, outerLength } = this.houseService.getWallLength();
    const { innerArea, outerArea } = this.houseService.getWallArea();
    return new CostTable({
      section: Section.costsFinishes,

      alias: "Finishes",
      // desc: TemplateRef<any>,
      costs: [
        new Cost({
          amount: innerLength,
          name: "Crown molding",
          price: 3,
          unit: "m",
        }),
        new Cost({
          amount: innerLength,
          name: "Baseboard",
          price: 3,
          unit: "m",
        }),
        this.getT<Door>(Door, [], (door) => ({
          name: "Door casing",
          price: 60,
        })),
        this.getT<Window>(Window, [], (door) => ({
          name: "Window casing",
          price: 60,
        })),
        new Cost({
          amount: innerArea,
          name: "Drywall / Gips boards",
          price: 10,
          unit: "m2",
        }),
      ],
    });
  }
  getWater(): CostTable {
    const house = this.houseService.house$.value;
    const { innerLength, outerLength } = this.houseService.getWallLength();
    const { innerArea, outerArea } = this.houseService.getWallArea();

    return new CostTable({
      section: Section.costsWater,
      alias: "Water ",
      // desc: TemplateRef<any>,
      costs: [
        this.getT<Water<any>>(
          Water,
          ["sensorType"],
          (x) => ({
            name: "Cold water",
            price: 20,
            unit: "m",
          }),
          (x) => x.sensorType === SensorType.waterCold,
          false
        ),
        this.getT<Water<any>>(
          Water,
          ["sensorType"],
          (x) => ({
            name: "Warm water",
            price: 20,
            unit: "m",
          }),
          (x) => x.sensorType === SensorType.waterWarm,
          false
        ),
        this.getT<Water<any>>(
          Water,
          ["sensorType"],
          (x) => ({
            name: "Rain water",
            price: 20,
            unit: "m",
          }),
          (x) => x.sensorType === SensorType.waterWarm,
          false
        ),
        this.getT<Water<any>>(
          Water,
          ["sensorType"],
          (x) => ({
            name: "Drains",
            price: 20,
            unit: "m",
          }),
          (x) => [SensorType.drain, SensorType.toilet].includes(x.sensorType),
          false
        ),
      ],
    });
  }
  getOutsideFinish(): CostTable {
    const house = this.houseService.house$.value;
    const { innerLength, outerLength } = this.houseService.getWallLength();
    const { innerArea, outerArea } = this.houseService.getWallArea();
    return new CostTable({
      section: Section.costsOuterFinishes,
      alias: "Outer finishes",
      // desc: TemplateRef<any>,
      costs: [
        new Cost({
          amount: innerLength,
          name: "Crown molding",
          price: 3,
          unit: "m",
        }),
        new Cost({
          amount: innerLength,
          name: "Baseboard",
          price: 3,
          unit: "m",
        }),
        this.getT<Door>(Door, [], (door) => ({
          name: "Door casing",
          price: 60,
        })),
        this.getT<Window>(Window, [], (door) => ({
          name: "Window casing",
          price: 60,
        })),
        new Cost({
          amount: innerArea,
          name: "Drywall / Gips boards",
          price: 10,
          unit: "m2",
        }),
      ],
    });
  }
  getElectra(): CostTable {
    const house = this.houseService.house$.value;
    return new CostTable({
      section: Section.costsElectra,

      alias: "Electra",
      costs: [
        new Cost({
          amount: this.houseService.getGroups(SensorType.socket).length,
          name: "Circuit breaker",
          sizeOrVersion: "10A - 240v",
          price: 10,
        }),

        new Cost({
          amount: Math.ceil(
            this.houseService.getGroups(SensorType.socket).length / 4
          ),
          name: "Circuit breaker Earth Group",
          sizeOrVersion: "240v",
          price: 80,
        }),

        this.getT<Sensor<any>>(
          Sensor,
          ["sensorType"],
          (x) => ({
            name: "Electric power socket",
            sizeOrVersion: `230v`,
            price: 20,
          }),
          (x) => {
            return x.sensorType === SensorType.socket;
          }
        ),

        this.getT<Sensor<any>>(
          Sensor,
          ["sensorType"],
          (x) => ({
            name: "Electric wires",
            sizeOrVersion: "2.5mm2 230v",
            price: 2.0,
            unit: "m",
          }),
          (x) => [SensorType.socket].includes(x.sensorType),
          false
        ),

        this.getT<Sensor<any>>(
          Sensor,
          ["sensorType"],
          (x) => ({
            name: "Perilex socket",
            price: 60,
          }),
          (x) => {
            return x.sensorType === SensorType.perilex;
          }
        ),

        this.getT<Sensor<any>>(
          Sensor,
          ["sensorType"],
          (x) => ({
            name: "Perilex wire",
            sizeOrVersion: "5 sub wires",
            price: 2.0,
            unit: "m",
          }),
          (x) => [SensorType.perilex].includes(x.sensorType),
          false
        ),

        this.getT<SensorLight<any>>(
          SensorLight,
          ["sensorType"],
          (x) => ({
            name: "Light socket",
            price: 20,
          }),
          (x) => true
        ),

        this.getT<Sensor<any>>(
          Sensor,
          ["sensorType"],
          (x) => ({
            name: "Switch (light)",
            sizeOrVersion: "Double pulse",
            price: 20,
          }),
          (x) => {
            return x.sensorType === SensorType.lightSwitch;
          }
        ),
        this.getT<Sensor<any>>(
          Sensor,
          ["sensorType"],
          (x) => ({
            name: "Dimmer",
            price: 20,
          }),
          (x) => {
            return x.sensorType === SensorType.dimmer;
          }
        ),
        this.getT<Sensor<any>>(
          Sensor,
          ["sensorType"],
          (x) => ({
            name: "Wifi AP",
            price: 100,
          }),
          (x) => {
            return x.sensorType === SensorType.wifi;
          }
        ),
        this.getT<Sensor<any>>(
          Sensor,
          [],
          (x) => ({
            name: "Ethernet cable",
            sizeOrVersion: "CAT6",
            price: 0.6,
            unit: "m",
          }),
          (x) => [SensorType.ethernet, SensorType.poe].includes(x.sensorType),
          false
        ),
      ],
    });
  }
  getPreps(): CostTable {
    return new CostTable({
      section: Section.costsPreparations,

      alias: "Preparations",
      costs: [
        new Cost({
          name: "Förhandsbesked",
          price: 2000, // 20000 sek
        }),
        new Cost({
          name: "Bygglov",
          price: 3000, // 30000 sek
        }),
        new Cost({
          name: "Dirt work",
          price: 1000,
        }),
        new Cost({
          name: "Ground prep",
          price: 9000,
        }),
        new Cost({
          name: "Constructions calculations",
          price: 3000,
        }),
        new Cost({
          name: "PassivHaus Certification",
          price: 3000,
        }),
        new Cost({
          name: "Utilities connections /fees",
          price: 15000,
        }),
        new Cost({
          name: "Tool rental",
          price: 3000,
        }),
      ],
    });
  }
  getConstruction(): CostTable {
    const house = this.houseService.house$.value;
    return new CostTable({
      section: Section.costsConstruction,
      alias: "Construction",
      costs: [
        new Cost({
          name: "foundation",
          price: 9000,
        }),
        new Cost({
          name: "footer",
          price: 9000,
        }),
        new Cost({
          name: "Concrete prefab floor",
          price: 32000,
        }),
        new Cost({
          name: "Studs",
          price: 10000,
        }),
        new Cost({
          name: "OSB",
          price: 10000,
        }),
      ],
    });
  }
  getBathroom(): CostTable {
    const house = this.houseService.house$.value;
    return new CostTable({
      section: Section.costsConstruction,
      alias: "Bathroom",
      costs: [
        new Cost({
          name: "Complete Bathroom",
          price: 9000,
        }),
      ],
    });
  }
  getKitchen(): CostTable {
    const house = this.houseService.house$.value;
    return new CostTable({
      section: Section.costsConstruction,
      alias: "Kitchen",
      costs: [
        new Cost({
          name: "Dishwasher",
          type: "Bosch SMV4HAX40N",
          other:
            "https://www.consumentenbond.nl/vaatwasser/producten/bosch/smv4hax40n",
          price: 800,
        }),
        new Cost({
          name: "Cooking plate",
          type: `Siemens EX807NX68E`,
          other: `Can be 2000e cheaper, https://www.consumentenbond.nl/inductiekookplaat/producten/siemens/ex807nx68e`,
          price: 5000,
        }),
        new Cost({
          name: "Integrated Freezer & Fridge",
          type: `?Siemens-ki81rvsf0`,
          other: `https://www.coolblue.be/nl/product/867986/siemens-ki81rvsf0.html`,
          price: 2000,
        }),
        new Cost({
          name: "Oven",
          type: `Smaksak`,
          other: ``,
          price: 1000,
        }),
        new Cost({
          name: "Microwave",
          type: `Mattradition`,
          other: ``,
          price: 700,
        }),

        // 60x60 = 60
        // 60x37 = 50
        // 60 high = 150
        new Cost({
          name: "All cabinets",
          type: `Method`,
          other: ``,
          price: 60 * 8 + 50 * 8 + 150 * 6,
        }),
        new Cost({
          name: "Doors",
          type: ``,
          other: ``,
          price: 60 * 16 + 6 * 200,
        }),
        new Cost({
          name: "Countertop ",
          type: `Multiplex`,
          other: ``,
          price: 400,
        }),
        new Cost({
          name: "Floor and backtiles",
          price: 1160,
        }),
      ],
    });
  }
  getOpenings(): CostTable {
    const house = this.houseService.house$.value;
    return new CostTable({
      section: Section.costsOpenings,
      alias: "Openings",
      costs: [
        this.getT<Door>(Door, ["outside"], (door) => ({
          name: "Door",
          sizeOrVersion: `230x${door.width}`,
          price: door.outside ? 600 : 200,
          unit: "#",
          other: `${door.outside ? "Outer door" : "Inner door"}`,
        })),

        this.getT<Window>(
          Window,
          ["width", "height", "windowForm"],
          (x) => ({
            name: "Window",
            sizeOrVersion: `${x.height * 1000}mm x ${x.width * 1000}mm`,
            price: x.width * x.height * 800,
            other: `${x.windowForm}`,
          }),
          (x) => ![WindowForm.windowWall].includes(x.windowForm)
        ),
        this.getT<Window>(
          Window,
          ["width", "height", "windowForm"],
          (x) => ({
            name: "Window wall",
            sizeOrVersion: `Custom`,
            price: 60000,
            other: `main window wall`,
          }),
          (x) => [WindowForm.windowWall].includes(x.windowForm)
        ),
      ],
    });
  }
  getTotals(): CostTable {
    const allCosts = [
      ...this.tables$.value,
      ...this.hiddenTables$.value,
    ].flatMap(
      (costTable) =>
        new Cost({
          price: sum(
            costTable.costs
              .filter((x) => x !== undefined)
              .map((y) => y.calcPrice)
          ),
          name: costTable.alias,
        })
    );
    console.log();

    return new CostTable({
      section: Section.costsTotals,
      alias: "Total",
      costs: [
        ...allCosts,
        new Cost({
          price: sum(allCosts.map((x) => x.price)),
          amount: 0.12,
          name: "Unexpected costs (12%)",
        }),
      ],
    });
  }
}
