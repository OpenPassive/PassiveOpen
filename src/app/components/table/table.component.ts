import {
  Component,
  ElementRef,
  QueryList,
  ViewChildren,
  Input,
} from "@angular/core";
import { BehaviorSubject, map } from "rxjs";
import { HouseService } from "src/app/house/house.service";
import {
  column,
  Cost,
  CostTable,
  GroupRow,
  Prop,
  TotalRow,
} from "src/app/house/cost.model";
import { round } from "src/app/shared/global-functions";

@Component({
  selector: "app-table",
  templateUrl: "./table.component.html",
  styleUrls: ["./table.component.scss"],
})
export class AppTableComponent {
  dataSource;
  costTable;

  @Input() set data(costTable: CostTable) {
    this.costTable = costTable;
    const costs = costTable.costs.filter((x) => x);
    this.dataSource = [
      ...costs.flatMap((x: Cost | GroupRow) => {
        if (x instanceof GroupRow) return [x, ...x.costs];
        return x;
      }),
      new TotalRow({
        name: `Total ${costTable.alias.toLocaleLowerCase()}`,
        costs,
      }),
    ];
  }

  columns: column[] = [
    { id: "folded", name: "", def: (x) => `${x}` },
    { id: Prop.name, name: "Name", def: (x) => `${x}` },
    {
      id: "calcAmount",
      name: "#",
      def: (x, y = "x") => `${x}${y}`,
    },
    {
      id: "price",
      name: "Piece price",
      def: (x) => `${this.readableNumbers(Number(x))}`,
    },
    {
      id: "calcPrice",
      name: "Sum price",
      def: (x) => `${this.readableNumbers(Number(x), -2)}`,
    },
    {
      id: Prop.sizeOrVersion,
      name: "Size or Version",
      def: (x) => `${x}`,
    },
    { id: Prop.remarks, name: "remarks", def: (x) => `${x}` },
  ];

  @ViewChildren("tableRows", { read: ElementRef })
  rowContainers: QueryList<ElementRef<HTMLTableRowElement>>;

  groupRow = {};
  columnNames = this.columns.map((x) => x.id);

  parts = [];

  constructor(private houseService: HouseService) {}

  readableNumbers(x: number, decimals?): string {
    if (decimals !== undefined) {
      return `€${round(x, 0).toLocaleString()}`;
    }
    if (x > 1000) {
      return `€${round(x).toLocaleString()}`;
    }
    return `€${x}`;
  }

  rowClick(row: Cost | GroupRow) {
    if (row instanceof GroupRow) {
      row.toggleFold();
      this.rowContainers.forEach((rowEl) => {
        const classes = rowEl.nativeElement.classList;
        if (classes.contains(`group-${row.uuid}`)) {
          classes.toggle(`row-folded`);
        }
      });
    }
  }
}
