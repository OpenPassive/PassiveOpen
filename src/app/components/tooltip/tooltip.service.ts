import {
  ConnectionPositionPair,
  Overlay,
  OverlayRef,
} from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { ComponentRef, Injectable } from "@angular/core";
import { SafeHtml } from "@angular/platform-browser";
import { BehaviorSubject, Subject, takeUntil } from "rxjs";
import { HousePartSVG } from "src/app/house-parts/model/housePart.model";
import { Sensor } from "src/app/house-parts/sensor-models/sensor.model";
import { HouseService } from "../../house/house.service";
import { TooltipComponent } from "./tooltip.component";

@Injectable({
  providedIn: "root",
})
export class TooltipService {
  tooltipHTML$ = new BehaviorSubject<SafeHtml>(undefined);

  overlayRef: OverlayRef;
  unsubscribe = new Subject<void>();
  componentRef: ComponentRef<TooltipComponent>;
  arrowEl: HTMLElement;
  origin;

  constructor(private overlay: Overlay, private houseService: HouseService) {}

  attachPopup([x, y], obj: HousePartSVG<any>) {
    // console.clear();
    this.detachOverlay();
    this.origin =
      obj instanceof Sensor ? obj.svg.svgIcon.node() : obj.svg.node();

    this.overlayRef = this.overlay.create({
      positionStrategy: this.getPositionStrategy([x, y]),
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: false,
    });

    this.overlayRef
      .backdropClick()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.detachOverlay();
      });
    this.attachOverlay(obj);
  }
  detachOverlay() {
    if (this.overlayRef && this.overlayRef.hasAttached()) {
      this.overlayRef.detach();
    }
  }
  updateOverlay() {
    // if (this.overlayRef && !this.overlayRef.hasAttached()) {
    //   this.overlayRef.updatePosition();
    // }
  }

  attachOverlay(obj: HousePartSVG): void {
    if (this.overlayRef && !this.overlayRef.hasAttached()) {
      const portal = new ComponentPortal(TooltipComponent);
      this.componentRef = this.overlayRef.attach(portal);
      this.componentRef.instance.html = obj.tooltip(
        this.houseService.house$.value
      );
    }
  }
  getPositionStrategy([x, y]) {
    return this.overlay
      .position()
      .flexibleConnectedTo(this.origin)
      .withPositions([
        new ConnectionPositionPair(
          { originX: "center", originY: "top" },
          { overlayX: "center", overlayY: "bottom" },
          0,
          -20
        ),
        new ConnectionPositionPair(
          { originX: "center", originY: "bottom" },
          { overlayX: "center", overlayY: "top" },
          0,
          20,
          "flipped"
        ),
      ])
      .withPush(true);
  }
}
