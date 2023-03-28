import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { OverlayModule } from "@angular/cdk/overlay";

import { AppComponent } from "./app.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MaterialModule } from "./mat.module";
import { FlexLayoutModule } from "@angular/flex-layout";
import { TagComponent } from "./components/tag/tag.component";
import { TooltipComponent } from "./components/tooltip/tooltip.component";
import { HttpClientModule } from "@angular/common/http";
import { OverlayDirective } from "./components/tag/overlay.directive";
import { RouterModule, Routes } from "@angular/router";
import { SideMenuComponent } from "./components/sidemenu/sidemenu.component";
import { PageMapComponent } from "./pages/page-map/page-map.component";
import { ControlsComponent } from "./components/controls/controls.component";
import { AppMainPageComponent } from "./components/main-page/main-page.component";
import { PageHouseComponent } from "./pages/page-house/page-house.component";
import { PageStairsComponent } from "./pages/page-stairs/page-stairs.component";
import { MatIconRegistry } from "@angular/material/icon";
import { CookieService } from "ngx-cookie-service";
import { DisqusModule } from "ngx-disqus";
import { NgxGoogleAnalyticsModule } from "ngx-google-analytics";
import { PageInstallationsComponent } from "./pages/page-installation/page-installation.component";
import { PageConstructionComponent } from "./pages/page-construction/page-construction.component";
import { PageWiredComponent } from "./pages/page-wired/page-wired.component";
import { routes } from "./app.router";

import { SvgStairsComponent } from "./2d-svg/svg-stair-steps/svg-stair-steps.component";
import { SvgStairPlanComponent } from "./2d-svg/svg-stair-plan/svg-stair-plan.component";
import { SvgComponent } from "./2d-svg/svg-house-plan/svg-plan.component";
import { SvgCrossComponent } from "./2d-svg/svg-house-cross/svg-cross.component";
import { AppSVGComponent } from "./components/app-svg/app-svg.component";
import { AppTableComponent } from "./components/table/table.component";
import { PageCostsComponent } from "./pages/page-costs/page-costs.component";
import { SafeHtmlPipe } from "./shared/safehtml.pipe";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { PageAboutComponent } from "./pages/page-about/page-about.component";
import { ThreeConstructionComponent } from "./3d-three/three-construction/three-construction.component";
import { AppContextMenuComponent } from "./components/context-menu/context-menu.component";
import { Page3dHouseComponent } from "./pages/page-3d-house/page-3d-house.component";
import { ThreeHouseComponent } from "./3d-three/three-house/three-house.component";
import { BaseThreeComponent } from "./3d-three/base-three.component";
import { CommonModule } from "@angular/common";
import { PagePlanningComponent } from "./pages/page-planning/page-planning.component";
import { AppTablePlanningComponent } from "./pages/page-planning/table-planning/table-planning.component";
import { PageFacadeComponent } from "./pages/page-facade/page-facade.component";
import { AppFooterComponent } from "./components/footer/footer.component";
import { MapButtonsComponent } from "./pages/page-map/map-buttons/map-buttons.component";
import { AppColorComponent } from "./components/color/color.component";
import { ButtonStateComponent } from "./components/button-state/button-state.component";
import { CheckboxStateComponent } from "./components/checkbox-state/checkbox-state.component";
import { CheckboxTocComponent } from "./components/checkbox-toc/checkbox-toc.component";
@NgModule({
  declarations: [
    AppComponent,
    AppColorComponent,
    AppFooterComponent,
    SideMenuComponent,
    ThreeConstructionComponent,
    ThreeHouseComponent,
    AppSVGComponent,
    SvgComponent,
    SvgCrossComponent,
    SvgStairsComponent,
    SvgStairPlanComponent,
    TagComponent,
    PageHouseComponent,
    PageStairsComponent,
    PageInstallationsComponent,
    PageAboutComponent,
    PageConstructionComponent,
    PageWiredComponent,
    PageCostsComponent,
    Page3dHouseComponent,
    PagePlanningComponent,
    PageMapComponent,
    PageFacadeComponent,
    PageCostsComponent,
    BaseThreeComponent,
    TooltipComponent,
    OverlayDirective,
    ControlsComponent,
    AppMainPageComponent,
    SafeHtmlPipe,
    AppTableComponent,
    AppTablePlanningComponent,
    AppContextMenuComponent,
    MapButtonsComponent,
    CheckboxStateComponent,
    CheckboxTocComponent,
    ButtonStateComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    BrowserAnimationsModule,
    MaterialModule,
    FlexLayoutModule,
    HttpClientModule,
    OverlayModule,
    FontAwesomeModule,
    DisqusModule.forRoot("passiv"),
    NgxGoogleAnalyticsModule.forRoot("G-W580DX5P7G"),
    RouterModule.forRoot(routes, {
      anchorScrolling: "enabled",
      // onSameUrlNavigation: "reload",
      scrollPositionRestoration: "disabled",
    }),
  ],
  providers: [CookieService],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(iconRegistry: MatIconRegistry) {
    iconRegistry.addSvgIconSet("material-icons-outlined");
  }
}
