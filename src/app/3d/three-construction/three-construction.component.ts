import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
} from "@angular/core";
import gsap from "gsap";
import { CookieService } from "ngx-cookie-service";
import { BehaviorSubject, Subscription, fromEvent, debounceTime } from "rxjs";
import { AppService } from "src/app/app.service";
import {
  ConstructionParts,
  Section,
  State,
  Tag,
} from "src/app/components/enum.data";
import { Construction, Thicknesses } from "src/app/house/construction.model";
import { Cross, Elevation, RoofPoint } from "src/app/house/cross.model";
import { House, xy, xyz } from "src/app/house/house.model";
import { HouseService } from "src/app/house/house.service";
import {
  angleBetween,
  angleXY,
  getDiagonal,
  offset,
  phi,
  round,
} from "src/app/shared/global-functions";
import * as THREE from "three";
import { MeshLambertMaterial, MeshPhongMaterial, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { degToRad } from "three/src/math/MathUtils";
import {
  CubeProperties,
  Material,
  ThreeService,
} from "../three-window.service";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { Window } from "src/app/house/window.model";
import { CSG } from "three-csg-ts";

@Component({
  selector: "app-three-construction",
  templateUrl: "./three-construction.component.html",
  styleUrls: ["./three-construction.component.scss"],
})
export class ThreeConstructionComponent implements AfterViewInit, OnDestroy {
  @ViewChild("rendererContainer") rendererContainer: ElementRef;
  resize$ = new BehaviorSubject(undefined);
  house$ = this.houseService.house$;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  scene = new THREE.Scene();
  controls: OrbitControls;
  camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);

  @HostListener("document:keydown", ["$event"])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === "F4") {
      console.log("reset camera");

      this.camera.position.set(10, 10, 10);
      this.camera.lookAt(0, 0, 0);
    }
    if (event.key === "1") {
      this.focusCamera("in");
    }
    if (event.key === "2") {
      this.focusCamera("out");
    }
  }

  subscriptions: Subscription[] = [];
  observer: ResizeObserver;
  orbitControlsCookie;
  modelName = "wallDetail";
  model: THREE.Scene;

  section: Section;
  tag: Tag;

  house: House;
  cross: Cross;
  construction: Construction;
  animations: { [key in ConstructionParts]?: gsap.core.Timeline } = {};
  subModels: { [key in ConstructionParts]?: (THREE.Mesh | THREE.Group)[] } = {};

  thickness;
  crossDepth;
  amountOfStuds;
  outerWallHeight;
  innerWallHeight;
  solePlateThickness;
  demoWith;
  demoDepth = 3;
  floorLVLThickness;
  floorThickness;
  studDistance;
  ceilingHeight;
  joistFlangeWidth;
  joistFlangeHeight = 40 / 1000;
  center;
  mirror: Reflector;
  edgeAngle: number;
  lowerAngle: number;
  upperAngle: number;
  window = new Window({});

  windowRoughOSBClip = this.threeService.createCube({
    material: Material.concrete,
    whd: [
      this.window.roughWidthOSB - (this.window.gap + this.window.thicknessOSB),
      this.window.roughHeightOSB,
      2,
    ],
    xyz: [0, this.window.roughBottomOSB, -1],
  });
  windowRoughClip = this.threeService.createCube({
    material: Material.whiteWood,
    whd: [this.window.roughWidth - this.window.gap, this.window.roughHeight, 2],
    xyz: [0, this.window.roughBottom, -1],
  });

  constructor(
    private threeService: ThreeService,
    private houseService: HouseService,
    private host: ElementRef,
    private appService: AppService,
    private cookieService: CookieService
  ) {}

  onResize(): void {
    const bbox = this.host.nativeElement.getBoundingClientRect();
    const height = bbox.height;
    const width = bbox.width;

    if (this.camera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
    this.renderer.setSize(width, height);
    if (this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  animate(): void {
    window.requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }

  pauseAll() {
    Object.values(ConstructionParts).forEach((key) => {
      this.animations[key].pause();
    });
  }
  focusCamera(side: "in" | "out" | "subGround") {
    console.log("camera to", side);
    var timeline = gsap.timeline();
    var duration = 0.4;
    // gsap.globalTimeline.clear();
    let z = this.center.z;
    if (["in"].includes(side)) z += -10;
    if (["subGround"].includes(side)) z += 1;
    if (["out"].includes(side)) z += 10;

    this.pauseAll();
    timeline.to(this.camera.position, {
      duration,
      x: this.center.x - 10,
      y: ["subGround"].includes(side) ? 0 : 1.8, //height
      z,
      onUpdate: () => {
        this.camera.lookAt(this.center.x, this.center.y, this.center.z);
      },
      onComplete: () => {
        gsap.globalTimeline.play();
      },
    });
  }

  createSceneAndCamera(): void {
    this.orbitControlsCookie = this.cookieService.get("orbitControls");
    const orbitControlsTarget = this.cookieService.get("orbitControlsTarget");

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.minDistance = 0.1;
    this.controls.maxDistance = 50;

    if (this.orbitControlsCookie !== "") {
      this.camera.matrix.fromArray(JSON.parse(this.orbitControlsCookie));
      this.camera.matrix.decompose(
        this.camera.position,
        this.camera.quaternion,
        this.camera.scale
      );
    }
    if (orbitControlsTarget !== "") {
      this.controls.target.fromArray(JSON.parse(orbitControlsTarget));
    }
    // if (this.OrbitControlsCookie === "") ;
    setTimeout(() => {
      this.orbitControlsCookie = undefined;
    }, 200);

    fromEvent(this.controls, "change")
      .pipe(debounceTime(1000))

      .subscribe((x) => {
        this.cookieService.set(
          "orbitControls",
          JSON.stringify(this.camera.matrix.toArray())
        );
        this.cookieService.set(
          "orbitControlsTarget",
          JSON.stringify(this.controls.target.toArray())
        );
      });

    this.scene.background = null;
    this.renderer.shadowMap.enabled = true;
    this.renderer.localClippingEnabled = true;
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);
    this.animate();

    for (let point of [
      ...Object.keys(RoofPoint).map((x: RoofPoint) =>
        this.construction.getRoofPoint(x)
      ),
      this.offsetDistanceBend(
        -this.thickness[Thicknesses.roofJoists],
        RoofPoint.bendOutside
      ),
    ]) {
      const axesHelper = new THREE.AxesHelper(1);
      axesHelper.position.set(
        0,
        point[1],
        this.crossDepth[Thicknesses.joists] - point[0]
      );
      this.scene.add(axesHelper);
    }

    (window as any).camera = this.camera;
    (window as any).renderer = this.renderer;
    (window as any).scene = this.scene;
  }

  getRoofAndOffsetPoints(d) {
    type RoofPointOffset = {
      //@ts-ignore
      [K in RoofPoint as K extends string ? `${K}Offset` : never]: RoofPoint[K];
    };
    let obj: {
      [key in keyof RoofPointOffset | RoofPoint]?: xy;
    } = {};
    Object.keys(RoofPoint).forEach((key: RoofPoint) => {
      obj[key] = this.construction.getRoofPoint(key);
      obj[`${key}Offset`] = this.offsetDistanceBend(d, key);
    });
    return obj;
  }
  offsetDistanceBend = (d, key: RoofPoint): xy => {
    const xy = this.construction.getRoofPoint(key);

    let diffAngle = 0;
    let angle = 0;
    if ([RoofPoint.bendInside, RoofPoint.bendOutside].includes(key)) {
      diffAngle = (this.lowerAngle - this.upperAngle) / 2;
      // diffAngle = -(
      //   90 -
      //   angleBetween(
      //     this.construction.getRoofPoint(RoofPoint.bendInside),
      //     this.construction.getRoofPoint(RoofPoint.bendOutside)
      //   )
      // );
      angle = this.edgeAngle + 90;
    }
    if ([RoofPoint.topInside, RoofPoint.topOutside].includes(key)) {
      diffAngle = 0;
      angle = 90;
    }
    if ([RoofPoint.lowestInside, RoofPoint.lowestOutside].includes(key)) {
      diffAngle = 0;
      angle = this.lowerAngle + 180;
    }
    if (
      [
        RoofPoint.groundFloorInside,
        RoofPoint.groundFloorOutside,
        RoofPoint.wallInside,
        RoofPoint.wallOutside,
      ].includes(key)
    ) {
      diffAngle = 0;
      angle = 180;
    }

    const distance = d / Math.cos(degToRad(diffAngle));
    return angleXY(angle, distance, xy);
  };
  //// LifeCircle ////

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.observer.unobserve(this.host.nativeElement);
  }

  ngAfterViewInit(): void {
    Object.values(ConstructionParts).forEach((key) => {
      this.subModels[key] = [];
      this.animations[key] = gsap.timeline();
    });

    const house = this.house$.value;
    this.cross = house.cross;
    this.construction = house.construction;
    this.thickness = this.construction.thickness;
    this.crossDepth = this.construction.crossDepth;
    this.amountOfStuds = 2 * 3;
    this.outerWallHeight = this.cross.outerWallHeight;
    this.innerWallHeight = this.cross.innerWallHeight;
    this.solePlateThickness = 0.03;
    this.demoWith = this.amountOfStuds * house.studDistance;
    this.studDistance = house.studDistance;
    this.ceilingHeight = this.cross.ceilingHeight;
    this.floorThickness = this.cross.topFloorThickness;
    this.floorLVLThickness = 0.07;
    this.joistFlangeWidth = 60 / 1000;
    this.center = new THREE.Vector3(
      this.demoWith / 2,
      this.outerWallHeight / 3,
      this.crossDepth[Thicknesses.facade] / 2
    );

    this.lowerAngle = round(
      angleBetween(
        this.construction.getRoofPoint(RoofPoint.lowestOutside),
        this.construction.getRoofPoint(RoofPoint.bendOutside)
      ) - 90,
      3
    );
    this.upperAngle = round(
      angleBetween(
        this.construction.getRoofPoint(RoofPoint.bendOutside),
        this.construction.getRoofPoint(RoofPoint.topOutside)
      ) - 90,
      3
    );
    this.edgeAngle =
      180 - ((180 - this.lowerAngle + this.upperAngle) / 2 - this.upperAngle);

    // angleBetween(
    //   this.construction.getRoofPoint(RoofPoint.roofBendInside),
    //   this.construction.getRoofPoint(RoofPoint.roofBendOutside)
    // ) - 90;

    this.createSceneAndCamera();

    // resize
    this.observer = new ResizeObserver((x) => this.resize$.next(x));
    this.observer.observe(this.host.nativeElement);
    this.subscriptions.push(
      this.appService.states$.subscribe((states) => {
        this.setVisibility(states);

        if (this.mirror) this.mirror.visible = states[State.mirror];
      }),
      ...[
        this.resize$.subscribe(() => {
          this.onResize();
        }),
        this.appService.fullscreen$.subscribe((fullscreen) => {
          this.onResize();
          this.controls.enableZoom = fullscreen;
        }),
        this.appService.tag$.subscribe(() => {
          this.tag = this.appService.tag$.value;
        }),
        this.appService.scroll$.subscribe(() => {
          const scroll = this.appService.scroll$.value;
          const previous = this.section;
          if (this.section !== scroll.section) {
            this.section = scroll.section;
            if (
              previous === undefined ||
              this.orbitControlsCookie !== undefined
            )
              return;
            console.log("update camera", previous);

            if (
              [
                Section.constructionFoundation,
                Section.constructionCrawlerSpace,
              ].includes(this.section)
            ) {
              this.focusCamera("subGround");
            } else if (
              [
                Section.constructionFloorLVL,
                Section.constructionRoof,
                Section.constructionWallOSB,
                Section.constructionWallTape,
                Section.constructionWallService,
                Section.constructionWallGips,
                Section.constructionFloor,
              ].includes(this.section)
            ) {
              this.focusCamera("in");
            } else if (
              [
                Section.constructionWallSole,
                Section.constructionWallJoists,
                Section.constructionGroundFloor,
                Section.constructionWallInsulation,
                Section.constructionWallOuterSheet,
                Section.constructionWallSpace,
                Section.constructionWallFacade,
              ].includes(this.section)
            ) {
              this.focusCamera("out");
            }
          }
        }),
      ]
    );

    this.threeService.basicGround(this.scene, -3);
    this.threeService.lights(this.scene);

    this.buildConstruction();

    this.scene.traverse(function (child) {
      // @ts-ignore
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    const scale = 0.5;
    this.threeService.importGLTF("Male_Standing.glb", (mesh: THREE.Mesh) => {
      this.scene.add(mesh);
      mesh.scale.set(scale, scale, scale);
      mesh.rotateY(degToRad(-90 - 20));
      mesh.position.set(
        this.demoWith / 2,
        this.cross.elevations[Elevation.topFloor],
        -2
      );
    });
  }

  buildConstruction() {
    this.demoDepth = this.construction.getRoofPoint(RoofPoint.topOutside)[0];

    this.buildFoundation();
    this.buildICF();
    this.buildGroundFloor();
    this.buildTapes();
    this.buildWindowOSB();
    this.buildOSB();
    this.buildOSBRoof();
    this.buildTopFloor();
    this.buildFloorLVL();

    this.buildTopFloorOSB();
    this.buildSole();
    this.buildJoist();
    this.buildRoofJoists();
    // this.buildInsulation();
    this.buildServiceInsulation();
    this.buildServiceBeams();
    this.buildOuterSheet();
    this.buildSpace();
    this.buildRoofSpace();
    this.buildFacade();
    this.buildGips();
    this.buildRoofTiles();
    this.debugMeasureBlock();
    this.createMirror();
    const states = this.appService.states$.value;
    Object.values(ConstructionParts).forEach((key) => {
      this.subModels[key].forEach((x) => this.scene.add(x));
      this.animations[key].progress(states[key] === true ? 0 : 1);
    });
  }
  createMirror() {
    this.mirror = new Reflector(new THREE.PlaneGeometry(30, 30), {
      color: new THREE.Color(0x7f7f7f),
      textureWidth: window.innerWidth * window.devicePixelRatio,
      textureHeight: window.innerHeight * window.devicePixelRatio,
    });
    this.mirror.visible = this.appService.states$.value[State.mirror];

    this.mirror.position.set(
      -2,
      0,
      -this.construction.getRoofPoint(RoofPoint.topOutside)[0]
    );
    this.scene.add(this.mirror);
  }

  createJoist(
    length,
    height,
    flangeHeight = 40 / 1000,
    webWidth = 5 / 1000
  ): THREE.Group {
    const flangeWidth = this.joistFlangeWidth;

    // red, green, blue
    const parts: CubeProperties[] = [
      {
        material: Material.pine,
        whd: [flangeWidth, length, flangeHeight],
        xyz: [0, 0, 0],
      },
      {
        material: Material.pine,
        whd: [flangeWidth, length, flangeHeight],
        xyz: [0, 0, height - flangeHeight],
      },
      {
        material: Material.osb,
        whd: [webWidth, length, height - flangeHeight * 2],
        xyz: [flangeWidth / 2 - webWidth / 2, 0, flangeHeight],
      },
    ];

    const group = new THREE.Group();
    parts.forEach((p, i) => {
      const cube = this.threeService.createCube(p);
      group.add(cube);
      if (i === 2) cube.material[0].color = new THREE.Color(0xd9d9d9);
    });

    return group;
  }

  createCornerTape(w, w2, t, l): THREE.Group {
    const group = new THREE.Group();

    const mesh = this.threeService.createCube({
      material: Material.tape,
      whd: [l, w, t],
    });
    mesh.rotateX(degToRad(0));
    this.translate(mesh, 0, -w, 0);
    group.add(mesh);

    const mesh2 = this.threeService.createCube({
      material: Material.tape,
      whd: [l, w2, t],
    });
    mesh2.rotateX(degToRad(90));
    this.translate(mesh2, 0, -w2 / 2 - t / 2, -w2 / 2 + t / 2);
    group.add(mesh2);

    return group;
  }

  createIFCblock(
    innerWidth,
    blockLength,
    blockHeight,
    insulationWidth
  ): THREE.Group {
    const group = new THREE.Group();

    const left = this.threeService.createCube({
      material: Material.foam,
      whd: [blockLength, blockHeight, insulationWidth],
    });
    const right = this.threeService.createCube({
      material: Material.foam,
      whd: [blockLength, blockHeight, insulationWidth],
    });

    this.translate(left, 0, 0, 0);
    this.translate(right, 0, 0, innerWidth + insulationWidth);

    group.add(left);
    group.add(right);
    this.scene.add(group);

    return group;
  }

  translate(item: THREE.Mesh | THREE.Group, x, y, z) {
    item.applyMatrix4(new THREE.Matrix4().makeTranslation(x, y, z));
  }

  /** Sets defaults visibility based on states */
  setVisibility(states, duration = 1.2) {
    this.pauseAll();
    Object.values(ConstructionParts).forEach((key) => {
      const anim = this.animations[key];
      const show = states[key] === true;
      const visible = anim.progress() === 0;
      const hidden = anim.progress() === 1;

      if (show) {
        if (hidden || duration === 0) {
          anim.timeScale(1).reverse(); // add
        } else {
          gsap.to(anim, { progress: 0, duration });
        }
      } else {
        if (visible || duration === 0) {
          anim.timeScale(2).play(); // remove
        } else {
          gsap.to(anim, { progress: 1, duration });
        }
      }
    });
  }
  buildFoundation() {
    const key = ConstructionParts.foundation;

    const w = this.demoWith;
    const h = 0.3;
    const d = 0.4;

    const top = this.cross.elevations[Elevation.crawlerFloor];
    const bottom = top - h;

    const mesh = this.threeService.createCube({
      material: Material.concrete,
      whd: [w, h, d],
      xyz: [0, bottom, this.crossDepth[Thicknesses.groundFloorEdge] - d * 0.8],
    });
    this.subModels[key].push(mesh);

    // <======== animation  ========> //
    this.animations[key].to(mesh.scale, {
      z: 0,
      y: 0,
      duration: 0.6,
      ease: "power3",
    });
    this.animations[key].to(mesh, {
      visible: false,
      duration: 0,
    });
  }

  buildRoofJoists() {
    const key = ConstructionParts.roofJoists;
    this.subModels[key] = [];
    this.buildRoofHigherJoists();
    this.buildRoofLowerJoists();

    const groups = this.subModels[key];

    groups
      .flatMap((x) => x.children)
      .sort((a, b) => a.position.x - b.position.x)
      .forEach((joist, i) => {
        this.scaleZInOut(key, joist, 0.1);
      });
    this.buildRoofLVL();
  }

  buildRoofLowerJoists() {
    const key = ConstructionParts.roofJoists;

    const wallInner = this.construction.getRoofPoint(RoofPoint.wallInside);
    const lowerInner = this.construction.getRoofPoint(RoofPoint.wallInside);
    const lowerOuter = this.construction.getRoofPoint(RoofPoint.wallOutside);
    const higherInner = this.construction.getRoofPoint(RoofPoint.bendInside);
    const higherOuter = this.construction.getRoofPoint(RoofPoint.bendOutside);

    const h = this.thickness[Thicknesses.roofJoists];
    const group = new THREE.Group();
    this.subModels[key].push(group);
    group.rotateX(degToRad(this.lowerAngle));
    this.translate(group, 0, lowerOuter[1], -lowerOuter[0]);
    const l = getDiagonal(lowerOuter, higherOuter);

    const localPlanes = [];

    // const verticalPlane = new THREE.Plane(
    //   new THREE.Vector3(0, 0, 1),
    //   higherOuter[0]
    // );
    // localPlanes.push(verticalPlane);

    const angleBend = -(90 - angleBetween(higherInner, higherOuter));
    const verticalAngled = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    localPlanes.push(verticalAngled);
    let rotation = new THREE.Matrix4().makeRotationX(degToRad(angleBend));
    verticalAngled.applyMatrix4(
      rotation.setPosition(
        new THREE.Vector3(0, higherInner[1], -higherInner[0])
      )
    );
    const horizontalAngled = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    localPlanes.push(horizontalAngled);
    horizontalAngled.applyMatrix4(
      new THREE.Matrix4().setPosition(new THREE.Vector3(0, lowerInner[1], 0))
    );

    const offset = 0;
    const offsetBlock = 0.05;
    const lengthBlock = 0.5;
    const lengthBlock2 = 0.5;
    const blockingHeight = h - this.joistFlangeHeight * 2 - offsetBlock * 2;
    for (let i of [...Array(this.amountOfStuds + 1).keys()]) {
      let spacing = i * this.studDistance - this.joistFlangeWidth / 2;
      if (i === 0) spacing = 0;
      const joist = this.createJoist(l + offset * 2, h);
      joist.position.set(0, -offset, 0);

      const blocking = this.threeService.createCube({
        material: Material.pine,
        whd: [this.joistFlangeWidth, offset + lengthBlock, blockingHeight],
        xyz: [0, 0, this.joistFlangeHeight + offsetBlock],
      });
      joist.add(blocking);

      const blocking2 = this.threeService.createCube({
        material: Material.pine,
        whd: [this.joistFlangeWidth, offset + lengthBlock2, blockingHeight],
        xyz: [
          0,
          l + offset - lengthBlock2,
          this.joistFlangeHeight + offsetBlock,
        ],
      });
      joist.add(blocking2);

      joist.children
        .flatMap((x: THREE.Mesh) => x.material)
        .forEach((mat: MeshPhongMaterial) => {
          mat.side = THREE.DoubleSide;
          mat.clippingPlanes = localPlanes;
          mat.clipIntersection = false;
          mat.clipShadows = true;
        });

      this.translate(joist, spacing, 0, 0);
      group.add(joist);
    }

    // localPlanes.forEach((plane) => {
    //   const helper = new THREE.PlaneHelper(plane, 1, 0xff0000);
    //   this.scene.add(helper);
    // });
  }
  buildRoofHigherJoists() {
    const key = ConstructionParts.roofJoists;

    const lowerInner = this.construction.getRoofPoint(RoofPoint.bendInside);
    const lowerOuter = this.construction.getRoofPoint(RoofPoint.bendOutside);
    const higherInner = this.construction.getRoofPoint(RoofPoint.topInside);
    const higherOuter = this.construction.getRoofPoint(RoofPoint.topOutside);

    const group = new THREE.Group();
    this.subModels[key].push(group);
    const angle = angleBetween(lowerOuter, higherOuter) - 90;
    group.rotateX(degToRad(angle));
    this.translate(group, 0, lowerOuter[1], -lowerOuter[0]);
    const h = this.thickness[Thicknesses.roofJoists];
    const l = getDiagonal(lowerOuter, higherOuter);

    const localPlanes = [];

    const verticalPlane = new THREE.Plane(
      new THREE.Vector3(0, 0, 1),
      higherOuter[0] - this.cross.roofRidgeWidth / 2
    );
    localPlanes.push(verticalPlane);

    const angleBend = angleBetween(lowerInner, lowerOuter) - 90;
    const verticalAngled = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
    localPlanes.push(verticalAngled);
    let rotation = new THREE.Matrix4().makeRotationX(degToRad(angleBend));
    verticalAngled.applyMatrix4(
      rotation.setPosition(new THREE.Vector3(0, lowerInner[1], -lowerInner[0]))
    );

    const offset = 1;
    const offsetBlock = 0.05;
    const lengthBlock = 0.5;
    const lengthBlock2 = 0.5;
    const blockingHeight = h - this.joistFlangeHeight * 2 - offsetBlock * 2;
    for (let i of [...Array(this.amountOfStuds + 1).keys()]) {
      let spacing = i * this.studDistance - this.joistFlangeWidth / 2;
      if (i === 0) spacing = 0;
      const joist = this.createJoist(l + offset * 2, h);
      joist.position.set(0, -offset, -h);

      const blocking = this.threeService.createCube({
        material: Material.pine,
        whd: [this.joistFlangeWidth, offset + lengthBlock, blockingHeight],
        xyz: [0, 0, this.joistFlangeHeight + offsetBlock],
      });
      joist.add(blocking);

      const blocking2 = this.threeService.createCube({
        material: Material.pine,
        whd: [this.joistFlangeWidth, offset + lengthBlock2, blockingHeight],
        xyz: [
          0,
          l + offset - lengthBlock2,
          this.joistFlangeHeight + offsetBlock,
        ],
      });
      joist.add(blocking2);

      joist.children
        .flatMap((x: THREE.Mesh) => x.material)
        .forEach((mat: MeshPhongMaterial) => {
          mat.side = THREE.DoubleSide;
          mat.clippingPlanes = localPlanes;
          mat.clipIntersection = false;
          mat.clipShadows = true;
        });

      this.translate(joist, spacing, 0, 0);
      group.add(joist);
    }
  }

  buildICF() {
    const key = ConstructionParts.crawlerSpace;
    const innerThickness = 200 / 1000;
    const blockLength = 600 / 1000;
    const blockHeight = 300 / 1000;
    const insulationWidth = 67 / 1000;
    const totalThickness = innerThickness + insulationWidth * 2;
    const height = this.cross.crawlerHeight;
    const width = this.demoWith;
    const half = blockLength / 2;
    const duration = 0.2;
    const rows = Math.ceil(height / blockHeight);
    const cols = Math.ceil(width / blockLength);
    const top = this.cross.elevations[Elevation.crawlerCeiling];
    const bottom = top - height;

    const concreteEdge =
      this.crossDepth[Thicknesses.groundFloorEdge] - innerThickness;
    const total = Number(`${rows}${cols + 1}`);

    const concrete = this.threeService.createCube({
      material: Material.concrete,
      whd: [this.demoWith, height, innerThickness],
    });
    this.translate(concrete, 0, top - height, concreteEdge);
    this.scene.add(concrete);
    this.animations[key].to(concrete.scale, {
      y: 0,
      duration: 1,
      ease: "Back.easeIn",
    });
    this.animations[key].to(
      concrete.position,
      {
        y: bottom,
        ease: "Back.easeIn",
        duration: 1,
      },
      "<"
    );
    this.animations[key].to(concrete.scale, {
      z: 0,
    });
    this.animations[key].to(concrete, {
      visible: false,
      duration: 0,
    });

    for (let row of [...Array(rows).keys()]) {
      row = rows - 1 - row;
      for (let col of [...Array(cols + 1).keys()]) {
        col = cols - col;
        const id = Number(`${row}${col}`);

        const oddRow = row % 2;
        let x = col * blockLength + (oddRow ? -half : 0);
        let y = bottom + row * blockHeight;

        let w = blockLength;
        let h = blockHeight;
        if (x < 0) {
          w = half;
          x += half;
        }
        if (x + w > width) {
          const corr = width - x;
          w = corr;
        }
        if (y + h > top) {
          const corr = top - y;
          h = corr;
          // y += 1;
        }
        if (w === 0 || h === 0) {
          continue;
        }
        const mesh = this.createIFCblock(innerThickness, w, h, insulationWidth);
        this.translate(mesh, x, y, concreteEdge - insulationWidth);
        this.subModels[key].push(mesh);
        const ratio = (total - id) / total;
        const durationStep = round(
          0.02 + Math.pow(ratio, 4) * 0.2 + Math.pow(ratio, 16) * 0.4
        );

        this.animations[key].to(mesh.position, {
          y: 0,
          x: 0,
          duration: durationStep,
          ease: "power3",
        });
        this.animations[key].to(mesh.children[0].position, {
          x: blockLength / 2 + innerThickness,
          z: innerThickness,
          duration: durationStep,
          ease: "power3",
        });
        this.animations[key].to(mesh.scale, {
          z: 0,
          x: 0,
          // delay: 0.2,
          duration: durationStep,
        });
      }
    }
  }

  buildTapes() {
    const key = ConstructionParts.tapes;
    const w = 0.07;
    const t = 0.01;

    const osbHeight = 1.2;
    const osbWidth = 2.4;
    const duration = 0.05;
    const depth = this.crossDepth[Thicknesses.serviceBeams] - t;
    const rows = Math.ceil(this.cross.innerWallHeight / osbHeight);
    const cols = Math.ceil(this.demoWith / osbWidth);

    // <==== corners ====>
    const corner1 = this.createCornerTape(
      w,
      w * 1,
      t,
      this.window.roughWidth - this.window.gap + w
    );
    corner1.scale.set(1, 1, -1);
    this.translate(
      corner1,
      0,
      this.window.roughBottom + t,
      this.crossDepth[Thicknesses.serviceBeams]
    );
    this.subModels[key].push(corner1);
    this.scaleXInOut(key, corner1, duration);

    const corner2 = this.createCornerTape(
      w,
      w * 1,
      t,
      this.window.roughWidth - this.window.gap + w
    );
    corner2.scale.set(1, -1, -1);
    this.translate(
      corner2,
      0,
      this.window.roughTop - t,
      this.crossDepth[Thicknesses.serviceBeams]
    );
    this.subModels[key].push(corner2);
    this.scaleXInOut(key, corner2, duration);

    const corner3 = this.createCornerTape(
      w,
      w * 1,
      t,
      this.window.roughTop - this.window.roughBottom + w * 2 - t * 2
    );
    corner3.rotateZ(degToRad(90));
    corner3.scale.set(1, 1, -1);
    this.translate(
      corner3,
      this.window.roughWidth - this.window.gap - t,
      this.window.roughBottom - w + t,
      this.crossDepth[Thicknesses.serviceBeams]
    );
    this.subModels[key].push(corner3);
    this.scaleXInOut(key, corner3, duration);

    const corner4 = this.createCornerTape(
      w,
      w * 1,
      t,
      this.thickness[Thicknesses.joists] + this.thickness[Thicknesses.osb]
    );
    corner4.rotateY(degToRad(-90));
    corner4.scale.set(1, -1, -1);
    this.translate(
      corner4,
      this.window.roughWidth - this.window.gap - t,
      this.window.roughBottom,
      this.crossDepth[Thicknesses.serviceBeams]
    );
    this.subModels[key].push(corner4);
    this.scaleXInOut(key, corner4, duration);

    const corner5 = this.createCornerTape(
      w,
      w * 1,
      t,
      this.thickness[Thicknesses.joists] + this.thickness[Thicknesses.osb]
    );
    corner5.rotateY(degToRad(-90));
    corner5.scale.set(1, 1, -1);
    this.translate(
      corner5,
      this.window.roughWidth - this.window.gap - t,
      this.window.roughTop,
      this.crossDepth[Thicknesses.serviceBeams]
    );
    this.subModels[key].push(corner5);
    this.scaleXInOut(key, corner5, duration);
    // <==== corners ====>

    for (let row of [...Array(rows).keys()]) {
      const y = osbHeight * row;
      const mesh = this.clip(
        this.threeService.createCube({
          material: Material.tape,
          whd: [this.demoWith, w, t],
          xyz: [0, y, depth],
        }),
        this.windowRoughOSBClip
      );
      this.subModels[key].push(mesh);
      this.scaleXInOut(key, mesh, duration);

      for (let col of [...Array(cols).keys()]) {
        const x = row % 2 ? osbWidth * col : osbWidth * 0.5 + osbWidth * col;
        if (x + w > this.demoWith) continue;
        let l = osbHeight;
        if (y + osbHeight > this.cross.innerWallHeight)
          l = this.cross.innerWallHeight - y;
        const mesh = this.clip(
          this.threeService.createCube({
            material: Material.tape,
            whd: [w, l, t],
            xyz: [x, y, depth],
          }),
          this.windowRoughOSBClip
        );
        this.subModels[key].push(mesh);
        this.scaleYInOut(key, mesh, duration);
      }
    }
  }

  buildRoofTapes() {}

  buildInsulation() {
    const key = ConstructionParts.insulation;

    const floor = [0, this.solePlateThickness * 2];
    const wall = [0, this.innerWallHeight - this.solePlateThickness * 2, 0];

    let w = this.studDistance - this.joistFlangeWidth / 2;
    const t = this.thickness[Thicknesses.roofJoists] * 0.95;

    const clips = this.threeService.createCube({
      material: Material.concrete,
      whd: [
        this.window.roughWidth + this.window.thicknessOSB,
        this.window.roughHeight + this.window.thicknessOSB * 2,
        0.5,
      ],
      xyz: [0, this.window.roughBottomOSB, -0.1],
    });

    const clips2 = this.threeService.createCube({
      material: Material.concrete,
      whd: [
        this.window.roughWidth + this.window.thicknessOSB,
        this.window.roughHeight + this.window.thicknessOSB * 2,
        0.5,
      ],
      xyz: [0, this.window.roughBottomOSB, -0.1],
    });

    const insulation = (t, spacing, first, second, origin, clips) => {
      const mesh = this.threeService.createCube({
        material: Material.insulation,
        whd: [this.demoWith, wall[1], 3],
        xyz: [0, 0, -1.5],
      });

      let rotation = new THREE.Matrix4().makeRotationX(
        degToRad(angleBetween(first, second) - 90)
      );
      mesh.applyMatrix4(
        rotation.setPosition(new THREE.Vector3(spacing, origin[1], -origin[0]))
      );

      // mesh.rotateX(degToRad(-angleBetween(first, second) + 90));
      // this.translate(mesh, spacing, first[1], -first[0]);

      this.subModels[key].push(this.clip(mesh, clips));
    };

    for (let i of [...Array(this.amountOfStuds).keys()]) {
      let spacing =
        i * this.studDistance -
        this.joistFlangeWidth / 2 +
        this.joistFlangeWidth;
      if (i === 0) {
        spacing = this.joistFlangeWidth;
        w -= this.joistFlangeWidth / 2;
      }
      insulation(
        this.thickness[Thicknesses.roofJoists] * 0.95,
        spacing,
        this.construction.getRoofPoint(RoofPoint.bendOutside),
        this.construction.getRoofPoint(RoofPoint.topOutside),
        this.construction.getRoofPoint(RoofPoint.bendOutside),
        clips
      );
      insulation(
        this.thickness[Thicknesses.roofJoists] * 0.95,
        spacing,
        this.construction.getRoofPoint(RoofPoint.lowestOutside),
        this.construction.getRoofPoint(RoofPoint.bendOutside),
        this.construction.getRoofPoint(RoofPoint.lowestOutside),
        clips
      );
      insulation(
        this.thickness[Thicknesses.joists] * 0.95,
        spacing,
        floor,
        wall,
        [-this.thickness[Thicknesses.joists], this.solePlateThickness * 2],
        clips
      );
    }

    // <======== animation  ========> //
    this.animations[key].to(
      this.subModels[key].map((x) => x.position),
      {
        z: 2,
        ease: "power3",
        stagger: { each: 0.4 },
      }
    );
    this.animations[key].to(
      this.subModels[key].map((x) => x.scale),
      {
        x: 0,
        z: 0,
        ease: "power3",
        stagger: { each: 0.4 },
        delay: 0.5,
      },
      "<"
    );
    this.animations[key].to(
      this.subModels[key].map((x) => x),
      {
        visible: false,
        duration: 0,
      }
    );
  }

  scaleZInOut(key, mesh, duration = 0.3, ease = "power3") {
    this.animations[key].to(mesh.position, {
      z: 0,
      duration,
      ease,
    });
    this.animations[key].to(
      mesh.scale,
      {
        z: 0,
        x: 0,
        duration,
        ease,
      },
      `<`
    );
    this.animations[key].to(mesh, {
      visible: false,
      duration: 0,
    });
  }
  scaleYInOut(key, mesh, duration = 0.3, ease = "power3") {
    this.animations[key].to(mesh.position, {
      y: 0,
      duration,
      ease,
    });
    this.animations[key].to(
      mesh.scale,
      {
        y: 0,
        z: 0,
        duration,
        ease,
      },
      `<`
    );
    this.animations[key].to(mesh, {
      visible: false,
      duration: 0,
    });
  }
  scaleXInOut(key, mesh, duration = 0.3, ease = "power3") {
    this.animations[key].to(mesh.position, {
      x: 0,
      duration,
      ease,
    });
    this.animations[key].to(
      mesh.scale,
      {
        z: 0,
        x: 0,
        duration,
        ease,
      },
      `<`
    );
    this.animations[key].to(mesh, {
      visible: false,
      duration: 0,
    });
  }
  buildJoist() {
    const key = ConstructionParts.joists;

    const duration = 0.8;
    const thickness = this.thickness[Thicknesses.joists];

    const bottom =
      this.cross.elevations[Elevation.groundFloor] + this.solePlateThickness;
    const top = this.construction.getRoofPoint(RoofPoint.wallInside)[1];

    const group = new THREE.Group();
    this.translate(group, 0, bottom, this.crossDepth[Thicknesses.joists]);
    this.subModels[key].push(group);
    this.animations[key].to(group.rotation, {
      x: degToRad(-90),
      duration,
    });
    const osbThickness = this.thickness[Thicknesses.osb];
    const joistHeight = this.construction.thickness[Thicknesses.joists];

    const amount = this.amountOfStuds + 2;
    // <====== JOISTS  ======> //
    for (let i of [...Array(amount).keys()]) {
      let length = top - bottom - this.solePlateThickness * 2;
      let elevation = this.solePlateThickness;
      let spacing = i * this.studDistance - this.joistFlangeWidth / 2;
      if (i === amount - 1)
        spacing =
          this.window.roughWidth - this.window.gap + this.window.thicknessOSB;
      if (i === 0) spacing = 0;

      if (spacing < this.window.roughWidth - this.window.gap) {
        // top stud
        elevation =
          joistHeight + this.window.roughTopOSB - this.solePlateThickness;
        length = length + this.solePlateThickness - elevation;
        const mesh = this.createJoist(
          length,
          this.construction.thickness[Thicknesses.joists]
        );
        this.translate(mesh, spacing, elevation, 0);
        group.add(mesh);
        this.scaleZInOut(key, mesh, 0.2);
        // top stud

        // reset
        elevation = this.solePlateThickness;
        length =
          this.window.roughBottom - this.solePlateThickness * 2 - osbThickness;
      }

      const mesh = this.createJoist(length, joistHeight);
      this.translate(mesh, spacing, elevation, 0);
      group.add(mesh);
      this.scaleZInOut(key, mesh, 0.2);
    }
    for (let i of [...Array(2).keys()]) {
      let length =
        this.window.roughWidth - this.window.gap + this.window.thicknessOSB;

      let elevation =
        joistHeight + this.window.roughTopOSB - this.solePlateThickness;
      let z = this.joistFlangeWidth;
      if (i === 0) z = joistHeight;

      const mesh = this.createJoist(length, joistHeight);
      mesh.rotation.set(degToRad(90), 0, degToRad(-90));
      this.translate(mesh, 0, elevation, z);
      group.add(mesh);
      this.scaleZInOut(key, mesh, 0.2);
    }

    // <====== Soleplates  ======> //
    for (let i of [0, 1]) {
      const mesh = this.threeService.createCube({
        material: Material.pine,
        whd: [this.demoWith, this.solePlateThickness, thickness],
      });
      this.translate(
        mesh,
        0,
        i === 0 ? 0 : top - this.solePlateThickness * 2,
        0
      );
      group.add(mesh);
      this.scaleZInOut(key, mesh, 0.2);
    }
  }
  buildTopFloor() {
    const key = ConstructionParts.topFloorJoists;

    const group = new THREE.Group();
    const h = this.floorThickness;
    const wallEnd =
      this.crossDepth[Thicknesses.serviceBeams] - this.floorLVLThickness;
    const l = this.demoDepth + wallEnd;
    const farEnd = l + wallEnd;
    for (let i of [...Array(this.amountOfStuds + 1).keys()]) {
      let spacing = i * this.studDistance - this.joistFlangeWidth / 2;
      if (i === 0) spacing = 0;
      const joist = this.createJoist(l, h);
      joist.rotateX(degToRad(-90));
      this.translate(joist, spacing, this.ceilingHeight, wallEnd);
      group.add(joist);

      this.animations[key].to(
        joist.position,
        {
          z: -farEnd,
          duration: 0.2,
          ease: "power3",
        },
        `>`
      );
      this.animations[key].to(
        joist.scale,
        {
          z: 0,
          x: 0,
          duration: 0.2,
        },
        `<`
      );
      this.animations[key].to(joist, {
        visible: false,
        duration: 0,
      });
    }

    this.subModels[key].push(group);
  }
  buildTopFloorOSB() {
    this.buildRoofTapes();
    const key = ConstructionParts.topFloorOSB;

    const length = 2.4;
    const width = 1.2;
    const totalWidth = this.demoDepth;
    const totalLength = this.demoWith;
    const thickness = this.thickness[Thicknesses.osb];

    const origin = [
      0,
      this.cross.elevations[Elevation.topFloor],
      this.crossDepth[Thicknesses.serviceBeams],
    ];

    const rotation = [-90, 0, 0];
    this.brickPattern(
      key,
      origin,
      length,
      width,
      thickness,
      totalWidth,
      totalLength,
      rotation,
      Material.osb,
      (osbPlate, i, j, l, w, total) => {
        const duration = 0.3 + ((i + j) / total) * 0.2;

        this.scaleZInOut(key, osbPlate, duration);
      }
    );
  }

  brickPattern(
    key,
    origin,
    length,
    width,
    thickness,
    totalWidth,
    totalLength,
    rotation,
    material: Material,
    callback,
    clips?
  ) {
    const group = new THREE.Group();

    const lRows = Math.ceil(totalLength / length);
    const wRows = Math.ceil(totalWidth / width);

    const half = length / 2;

    for (let wRow of [...Array(wRows + 1).keys()]) {
      for (let lRow of [...Array(lRows + 1).keys()]) {
        const oddRow = wRow % 2;
        let x = (lRows - lRow) * length + (oddRow ? -half : 0);
        let y = (wRows - wRow) * width;
        let z = 0;
        let w = width;
        let l = length;
        let isLeftOver = false;
        const total = Number(`${wRow + 1}${lRow + 1}`);

        if (x < 0) {
          // start odd rows with a half
          l = half;
          x = 0;
        }
        if (y + width > totalWidth) {
          w = totalWidth - y;
          isLeftOver = true;
        }
        if (x + length >= totalLength) {
          l = totalLength - x;
          isLeftOver = true;
        }

        if (y >= totalWidth || x >= totalLength) {
          continue;
        }

        let osbPlate = this.threeService.createCube({
          material,
          whd: [l, w, thickness],
        });
        this.translate(osbPlate, x, y, z);

        if (clips) {
          osbPlate = this.clip(osbPlate, clips);
        }
        group.add(osbPlate);
        callback(osbPlate, wRow, lRow, l, w, total, isLeftOver);
      }
    }

    group.rotation.set(
      degToRad(rotation[0]),
      degToRad(rotation[1]),
      degToRad(rotation[2])
    );

    this.translate(group, origin[0], origin[1], origin[2]);
    this.subModels[key].push(group);
  }

  clip(mesh, clip) {
    mesh.updateMatrix();
    clip.updateMatrix();
    return CSG.subtract(mesh, clip) as THREE.Mesh<
      THREE.BoxGeometry,
      MeshLambertMaterial[]
    >;
  }
  buildRoofTiles() {
    const key = ConstructionParts.roofTiles;
    const h = 308 / 1000;
    const w = 204 / 1000;
    const scale = 1;
    const thickness = 0.3;
    const overlapAngle = -4;
    const overlapHeight = 0.01;

    const crossDepth =
      this.thickness[Thicknesses.outerSheet] +
      this.thickness[Thicknesses.space] +
      0.02;
    const roof = this.getRoofAndOffsetPoints(crossDepth);

    this.threeService.importGLTF("rooftile.glb", (mainMesh: THREE.Mesh) => {
      mainMesh.scale.set(scale, scale, scale);

      // @ts-ignore
      const mat: MeshStandardMaterial = mainMesh.children[0].material;
      // mat.emission = new THREE.Color(0xffffff);

      [
        // [RoofPoint.groundOutside, RoofPoint.wallOutside],
        [RoofPoint.lowestOutside, RoofPoint.bendOutside],
        [RoofPoint.bendOutside, RoofPoint.topOutside],
      ].map((coords, i) => {
        const { totalWidth, origin, rotation, angle } =
          this.getAngledProperties(coords[0], coords[1], crossDepth);

        const cols = Math.ceil(totalWidth / h);
        for (let col of [...Array(cols).keys()]) {
          const rows = Math.ceil(this.demoWith / w);
          for (let row of [...Array(rows).keys()]) {
            const spacingW = row * w;
            const spacingH = col * h;
            const mesh = mainMesh.clone();
            mesh.rotateX(degToRad(rotation[0] + 90 + overlapAngle));
            this.subModels[key].push(mesh);
            // mesh.position.set(origin[0], origin[1], origin[2]);
            const [x, y] = angleXY(angle, spacingH, roof[`${coords[0]}Offset`]);
            mesh.position.set(spacingW, y + overlapHeight, -x);
          }
        }
      });

      // <======== animation  ========> //
      this.animations[key].to(
        this.subModels[key].map((x) => x.position),
        {
          z: 2,
          ease: "power3",
          stagger: { amount: 1 },
        }
      );
      this.animations[key].to(
        this.subModels[key].map((x) => x.scale),
        {
          z: 0,
          x: 0,
          stagger: { amount: 1 },
        },
        `<+=0.3`
      );
      this.subModels[key].forEach((x) => this.scene.add(x));
      this.animations[key].progress(
        this.appService.states$.value[key] === true ? 0 : 1
      );
    }); // loader
  }
  buildOSBRoof() {
    const key = ConstructionParts.roofOSB;

    const length = 2.4;
    const width = 1.2;
    const totalLength = this.demoWith;
    const thickness = this.thickness[Thicknesses.osb];
    const callback = (osbPlate, i, j, l, w, total) => {
      this.animations[key].to(osbPlate.scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.3,
      });
      this.animations[key].to(osbPlate, {
        visible: false,
        duration: 0,
      });
    };

    const bottom1 = this.construction.getRoofPoint(RoofPoint.bendInside);
    const top1 = this.construction.getRoofPoint(RoofPoint.topInside);
    const origin1 = [
      0,
      bottom1[1],
      -bottom1[0] - this.crossDepth[Thicknesses.osb] - thickness,
    ];
    const totalWidth1 = getDiagonal(bottom1, top1);
    const rotation1 = [angleBetween(bottom1, top1) - 90, 0, 0];
    this.brickPattern(
      key,
      origin1,
      length,
      width,
      thickness,
      totalWidth1,
      totalLength,
      rotation1,
      Material.osb,
      callback
    );
    const bottom2 = this.construction.getRoofPoint(RoofPoint.wallInside);
    const top2 = this.construction.getRoofPoint(RoofPoint.bendInside);
    const origin2 = [
      0,
      bottom2[1],
      -bottom2[0] - this.crossDepth[Thicknesses.osb] - thickness,
    ];
    const totalWidth2 = getDiagonal(bottom2, top2);
    const rotation2 = [angleBetween(bottom2, top2) - 90, 0, 0];
    this.brickPattern(
      key,
      origin2,
      length,
      width,
      thickness,
      totalWidth2,
      totalLength,
      rotation2,
      Material.osb,
      callback
    );
  }
  buildOSB() {
    const key = ConstructionParts.osbWall;

    const length = 2.4;
    const width = 1.2;
    const totalWidth = this.construction.getRoofPoint(RoofPoint.wallInside)[1];
    const totalLength = this.demoWith;
    const thickness = this.thickness[Thicknesses.osb];
    const bottom = this.cross.elevations[Elevation.groundFloor];
    const origin = [0, bottom, this.crossDepth[Thicknesses.osb] - thickness];
    const rotation = [0, 0, 0];

    let stackFull = 0;
    let stackWidthLeftovers = 0;
    let stackLengthLeftovers = 0;

    this.brickPattern(
      key,
      origin,
      length,
      width,
      thickness,
      totalWidth,
      totalLength,
      rotation,
      Material.osb,
      (osbPlate, i, j, l, w, total) => {
        const duration = 0.3 + ((i + j) / total) * 0.2;
        this.animations[key].to(osbPlate.rotation, {
          x: degToRad(90),
          duration,
        });
        const lengthLeftOver = l * 1.05 < length;
        const widthLeftOver = w * 1.05 < width;

        this.animations[key].to(
          osbPlate.position,
          {
            x: (lengthLeftOver ? length : 0) + l / 2,
            y: thickness * stackFull,
            z: -((widthLeftOver ? width : 0) + width * 0.5 + w / 2),
            duration,
          },
          "<"
        );
        if (lengthLeftOver) {
          stackLengthLeftovers += 1;
        } else if (widthLeftOver) {
          stackWidthLeftovers += 1;
        } else {
          stackFull += 1;
        }
      },
      this.windowRoughOSBClip
    );

    this.animations[key].to(
      this.subModels[key].flatMap((x) => x.position),
      {
        y: -0.5,
      }
    );
    this.animations[key].to(this.subModels[key], {
      visible: false,
      duration: 0,
    });
  }
  debugMeasureBlock() {
    // this.scene.add(this.windowRoughOSBClip);
    // this.scene.add(this.windowRoughClip);
    // const mesh = this.threeService.createCube({
    //   material: Material.concrete,
    //   whd: [this.window.roughWidthOSB, this.window.roughHeightOSB, 0.6],
    //   xyz: [0, this.window.roughBottomOSB, -0.1],
    // });
    // this.scene.add(mesh);
  }

  buildWindowOSB() {
    const key = ConstructionParts.osbWall;
    const t = this.thickness[Thicknesses.osb];
    const inside = this.crossDepth[Thicknesses.serviceBeams];
    const wallDepth = this.crossDepth[Thicknesses.outerSheet] - inside;

    //bottom
    const mesh1 = this.threeService.createCube({
      material: Material.osb,
      whd: [this.window.roughWidth - this.window.gap + t, t, wallDepth],
      xyz: [0, this.window.roughBottomOSB, inside],
    });
    this.subModels[key].push(mesh1);

    //top
    const mesh2 = this.threeService.createCube({
      material: Material.osb,
      whd: [this.window.roughWidth - this.window.gap + t, t, wallDepth],
      xyz: [0, this.window.roughTop, inside],
    });
    this.subModels[key].push(mesh2);

    //right
    const mesh3 = this.threeService.createCube({
      material: Material.osb,
      whd: [t, this.window.roughHeight, wallDepth],
      xyz: [
        this.window.roughWidth - this.window.gap,
        this.window.roughBottom,
        inside,
      ],
    });
    this.subModels[key].push(mesh3);

    [mesh1, mesh2, mesh3].forEach((mesh) => {
      this.animations[key].to(mesh.position, {
        z: -1,
        duration: 0.6,
      });
      this.animations[key].to(mesh.scale, {
        x: 0,
        z: 0,
        duration: 0.6,
      });
      this.animations[key].to(mesh, {
        visible: false,
        duration: 0,
      });
    });
  }

  buildServiceBeams() {
    const key = ConstructionParts.serviceBeams;
    const t = this.thickness[Thicknesses.serviceBeams];
    for (let i of [...Array(this.amountOfStuds + 1).keys()]) {
      let spacing = i * this.studDistance - this.joistFlangeWidth / 2;
      if (i === 0) spacing = 0;

      const mesh = this.threeService.createCube({
        material: Material.osb,
        whd: [this.joistFlangeWidth, this.ceilingHeight, t],
      });
      this.translate(
        mesh,
        spacing,
        0,
        this.crossDepth[Thicknesses.serviceBeams] - t
      );
      this.subModels[key].push(mesh);
    }

    // <======== animation  ========> //
    this.animations[key].to(
      this.subModels[key].map((x) => x.position),
      {
        z: -1,
        duration: 0.7,
        ease: "power3",
        stagger: { each: 0.4 },
      }
    );
    this.animations[key].to(
      this.subModels[key].map((x) => x.scale),
      {
        z: 0,
        x: 0,
        stagger: { each: 0.4 },
      },
      `<+=0.3`
    );
  }

  buildServiceInsulation() {
    const key = ConstructionParts.serviceInsulation;
    const t = this.thickness[Thicknesses.serviceBeams];

    for (let i of [...Array(this.amountOfStuds).keys()]) {
      let w = this.studDistance - this.joistFlangeWidth;
      let spacing =
        i * this.studDistance -
        this.joistFlangeWidth / 2 +
        this.joistFlangeWidth;
      if (i === 0) {
        spacing = this.joistFlangeWidth;
        w -= this.joistFlangeWidth / 2;
      }

      const mesh = this.threeService.createCube({
        material: Material.insulation,
        whd: [w, this.ceilingHeight, t],
      });

      this.translate(
        mesh,
        spacing,
        0,
        this.crossDepth[Thicknesses.serviceBeams] - t
      );
      this.subModels[key].push(mesh);
    }

    // <======== animation  ========> //
    this.animations[ConstructionParts.serviceBeams].to(
      this.subModels[key].map((x) => x.position),
      {
        y: 0,
        duration: 0.7,
        ease: "power3",
        stagger: { each: 0.4 },
      }
    );
    this.animations[ConstructionParts.serviceBeams].to(
      this.subModels[key].map((x) => x.scale),
      {
        z: 0,
        y: 0,
        duration: 0.7,
        ease: "power3",
        stagger: { each: 0.4 },
      },
      "<"
    );

    this.animations[ConstructionParts.serviceBeams].to(
      this.subModels[key].map((x) => x),
      {
        visible: false,
        duration: 0,
      }
    );
  }
  buildGroundFloor() {
    const key = ConstructionParts.groundFloor;
    const h = this.cross.groundFloorThickness;
    const w = 1.2;
    const top = this.cross.elevations[Elevation.groundFloor] - h;
    const offset = this.crossDepth[Thicknesses.groundFloorEdge];
    const d = this.demoDepth + offset;

    const rows = Math.ceil(this.demoWith / w);
    for (let row of [...Array(rows).keys()]) {
      row = rows - 1 - row;
      const mesh = this.threeService.createCube({
        material: Material.hollowCoreSlap,
        whd: [w, h, d],
      });

      this.translate(
        mesh,
        row * w,
        top,
        this.crossDepth[Thicknesses.groundFloorEdge] - d
      );
      this.subModels[key].push(mesh);
      this.animations[key].to(mesh.position, {
        y: 0.5,
        duration: 0.3,
      });
      this.animations[key].to(mesh.scale, {
        z: 0,
        duration: 0.3,
      });
      this.animations[key].to(
        mesh.position,
        {
          z: this.demoDepth,
          duration: 0.3,
        },
        "<"
      );
      this.animations[key].to(mesh.scale, {
        y: 0,
        duration: 0.1,
      });
      this.animations[key].to(mesh, {
        visible: false,
        duration: 0,
      });
    }
  }
  buildSole() {
    const key = ConstructionParts.sole;

    const bottom = this.cross.elevations[Elevation.groundFloor];

    const threatedFloorLVL = this.threeService.createCube({
      material: Material.pine,
      whd: [
        this.demoWith,
        this.solePlateThickness,
        this.thickness[Thicknesses.joists],
      ],
    });
    this.translate(
      threatedFloorLVL,
      0,
      bottom,
      this.crossDepth[Thicknesses.joists]
    );
    threatedFloorLVL.material[0].color = new THREE.Color(0x8a9b61);
    this.subModels[key].push(threatedFloorLVL);

    // <======== animation  ========> //
    this.animations[key].to(
      this.subModels[key].map((x) => x.position),
      {
        y: 0.5,
        duration: 0.6,
        ease: "power3",
      }
    );
    this.animations[key].to(
      // @ts-ignore
      this.subModels[key].map((x) => x.material),
      {
        opacity: 0,
        duration: 0.4,
        ease: "power3",
      },
      `-=0.6`
    );
    this.animations[key].to(
      // @ts-ignore
      this.subModels[key].map((x) => x),
      {
        visible: false,
        duration: 0,
      }
    );
  }
  buildRoofLVL() {
    const key = ConstructionParts.roofRidge;
    const h = this.cross.roofRidgeHight;
    const w = this.cross.roofRidgeWidth;
    const point = this.construction.getRoofPoint(RoofPoint.topOutside);
    const mesh = this.threeService.createCube({
      material: Material.pine,
      whd: [this.demoWith, h, w],
      xyz: [0, point[1] - h, -point[0] - w / 2],
    });

    this.subModels[key].push(mesh);

    // // <======== animation  ========> //
    this.animations[key].to(
      this.subModels[key].map((x) => x.position),
      {
        y: 0,
        duration: 0.6,
      }
    );
    this.animations[key].to(
      this.subModels[key].map((x) => x.scale),
      {
        x: 0,
        y: 0,
        duration: 0.4,
      }
    );
    this.animations[key].to(
      this.subModels[key].map((x) => x),
      {
        visible: false,
        duration: 0,
      }
    );
  }
  buildFloorLVL() {
    const key = ConstructionParts.floorLVL;

    const mesh = this.threeService.createCube({
      material: Material.pine,
      whd: [this.demoWith, this.floorThickness, this.floorLVLThickness],
    });
    this.translate(
      mesh,
      0,
      this.ceilingHeight,
      this.crossDepth[Thicknesses.serviceBeams] - this.floorLVLThickness
    );

    this.subModels[key].push(mesh);

    // <======== animation  ========> //
    this.animations[key].to(
      this.subModels[key].map((x) => x.position),
      {
        z: -1,
        duration: 0.6,
      }
    );
    this.animations[key].to(
      this.subModels[key].map((x) => x.scale),
      {
        x: 0,
        y: 0,
        duration: 0.4,
      }
    );
    this.animations[key].to(
      this.subModels[key].map((x) => x),
      {
        visible: false,
        duration: 0,
      }
    );
  }
  buildGips() {
    const key = ConstructionParts.gips;
    const t = this.thickness[Thicknesses.gips];

    for (let i of [...Array(this.amountOfStuds / 2).keys()]) {
      const gripsPlate = this.threeService.createCube({
        material: Material.gips,
        whd: [1.2, this.ceilingHeight, t],
      });
      this.translate(
        gripsPlate,
        i * this.studDistance * 2,
        0,
        this.crossDepth[Thicknesses.gips] - t
      );
      this.subModels[key].push(gripsPlate);
    }

    // <======== animation  ========> //
    this.animations[key].to(
      this.subModels[key].map((x) => x.position),
      {
        z: -2,
        duration: 0.7,
        ease: "power3",
        stagger: { each: 0.4 },
      }
    );
    this.animations[key].to(
      // @ts-ignore
      this.subModels[key].map((x) => x.material),
      {
        opacity: 0,
        duration: 0.4,
        ease: "power3",
        stagger: { each: 0.4 },
      },
      `-=0.8`
    );
    this.animations[key].to(
      // @ts-ignore
      this.subModels[key].map((x) => x),
      {
        visible: false,
        duration: 0,
      }
    );
  }

  getAngledProperties(low: RoofPoint, high: RoofPoint, thickness) {
    const roof = this.getRoofAndOffsetPoints(thickness);
    const totalWidth = getDiagonal(roof[`${low}Offset`], roof[`${high}Offset`]);
    const angle = angleBetween(roof[low], roof[high]);
    const origin = this.useOppositeCorner(
      roof[`${low}Offset`],
      thickness,
      angle
    );
    const rotation = [angle - 90, 0, 0];
    return {
      totalWidth,
      angle,
      origin,
      rotation,
    };
  }

  buildOuterSheet() {
    const key = ConstructionParts.outerSheet;
    const totalLength = this.demoWith;
    const thickness = this.thickness[Thicknesses.outerSheet];
    let stackFull = 0;
    let stackWidthLeftovers = 0;
    let stackLengthLeftovers = 0;

    const length = 2.4;
    const width = 1.2;

    const floor = [0, this.solePlateThickness];
    const wall = [0, this.innerWallHeight - this.solePlateThickness * 3, 0];

    const wallCallback = (osbPlate, i, j, l, w, total) => {
      const duration = 0.3 + ((i + j) / total) * 0.2;
      this.animations[key].to(osbPlate.rotation, {
        x: degToRad(90),
        duration,
      });
      const lengthLeftOver = l * 1.05 < length;
      const widthLeftOver = w * 1.05 < width;

      this.animations[key].to(
        osbPlate.position,
        {
          x: (lengthLeftOver ? length : 0) + l / 2,
          y: thickness * stackFull,
          z: (widthLeftOver ? width : 0) + width * 0.5 + w / 2,
          duration,
        },
        "<"
      );
      if (lengthLeftOver) {
        stackLengthLeftovers += 1;
      } else if (widthLeftOver) {
        stackWidthLeftovers += 1;
      } else {
        stackFull += 1;
      }
    };

    // <====== loop =====> //
    [
      [RoofPoint.groundFloorOutside, RoofPoint.wallOutside],
      [RoofPoint.lowestOutside, RoofPoint.bendOutside],
      [RoofPoint.bendOutside, RoofPoint.topOutside],
    ].map((coords, i) => {
      const { totalWidth, origin, rotation } = this.getAngledProperties(
        coords[0],
        coords[1],
        thickness
      );

      this.brickPattern(
        key,
        origin,
        length,
        width,
        thickness,
        totalWidth,
        totalLength,
        rotation,
        Material.outerSheet,
        i === 0
          ? wallCallback
          : (mesh, i, j, l, w, total) => {
              this.scaleZInOut(key, mesh, 0.1);
            },
        i === 0 ? this.windowRoughOSBClip : undefined
      );
    });

    this.animations[key].to(
      this.subModels[key].flatMap((x) => x.position),
      {
        y: -0.5,
      }
    );
    this.animations[key].to(this.subModels[key], {
      visible: false,
      duration: 0,
    });
  }
  buildSpace() {
    const key = ConstructionParts.space;
    const w = this.joistFlangeWidth;

    const t = this.thickness[Thicknesses.space] / 2;
    for (let i of [...Array(4).keys()]) {
      let spacing = (i / 3) * (this.outerWallHeight - w);
      // if (i === 0) spacing = 0;

      const mesh = this.clip(
        this.threeService.createCube({
          material: Material.osb,
          whd: [this.demoWith, w, t],
          xyz: [0, spacing, this.crossDepth[Thicknesses.space] + t],
        }),
        this.windowRoughOSBClip
      );
      this.subModels[key].push(mesh);
    }
    for (let i of [...Array(this.amountOfStuds + 1).keys()]) {
      let spacing = i * this.studDistance - w / 2;
      if (i === 0) spacing = 0;

      const mesh = this.clip(
        this.threeService.createCube({
          material: Material.pine,
          whd: [w, this.outerWallHeight, t],
          xyz: [spacing, 0, this.crossDepth[Thicknesses.space]],
        }),
        this.windowRoughOSBClip
      );
      this.subModels[key].push(mesh);
    }
    // <======== Around Window  ========> //
    this.subModels[key].push(
      this.threeService.createCube({
        material: Material.osb,
        whd: [this.window.roughWidth + w, w, t],
        xyz: [
          0,
          this.window.roughBottom - w,
          this.crossDepth[Thicknesses.space] + t,
        ],
      })
    );
    this.subModels[key].push(
      this.threeService.createCube({
        material: Material.osb,
        whd: [this.window.roughWidth + w, w, t],
        xyz: [
          0,
          this.window.roughTop + w / 2,
          this.crossDepth[Thicknesses.space] + t,
        ],
      })
    );
    this.subModels[key].push(
      this.threeService.createCube({
        material: Material.osb,
        whd: [w, this.window.roughHeight + w * 2, t],
        xyz: [
          this.window.roughWidth,
          this.window.roughBottom - w,
          this.crossDepth[Thicknesses.space],
        ],
      })
    );
    // <======== Around Window  ========> //

    // <======== animation  ========> //
    this.animations[key].to(
      this.subModels[key].map((x) => x.position),
      {
        z: 1,
        duration: 0.7,
        ease: "power3",
        stagger: { each: 0.4 },
      }
    );
    this.animations[key].to(
      this.subModels[key].map((x) => x.scale),
      {
        z: 0,
        x: 0,
        stagger: { each: 0.4 },
      },
      `<+=0.3`
    );
  }
  useOppositeCorner(origin, d, angle): xyz {
    const [x, y] = angleXY(angle - 90, d, origin);
    return [0, y, -x];
  }
  buildRoofSpace() {
    const key = ConstructionParts.roofSpace;

    const thickness = this.thickness[Thicknesses.space] / 2;
    const crossDepth = this.thickness[Thicknesses.outerSheet] + thickness;
    const roof = this.getRoofAndOffsetPoints(crossDepth);

    [
      [RoofPoint.lowestOutside, RoofPoint.bendOutside],
      [RoofPoint.bendOutside, RoofPoint.topOutside],
    ].map(([first, second]) => {
      const length = getDiagonal(
        roof[`${first}Offset`],
        roof[`${second}Offset`]
      );
      const angle = angleBetween(roof[first], roof[second]);
      const origin = this.useOppositeCorner(
        roof[`${first}Offset`],
        thickness,
        angle
      );
      const spacer = 204 / 1000;
      const cols = Math.ceil(length / spacer);
      // Horizontal
      for (let i of [...Array(cols).keys()]) {
        let spacing = spacer * i - this.joistFlangeWidth / 2;
        // if (i === 0) spacing = 0;

        const mesh = this.threeService.createCube({
          material: Material.osb,
          whd: [this.demoWith, this.joistFlangeWidth / 2, thickness],
          xyz: [0, spacing, thickness],
        });

        let rotation = new THREE.Matrix4().makeRotationX(degToRad(angle - 90));
        mesh.applyMatrix4(rotation.setPosition(new THREE.Vector3(...origin)));

        this.subModels[key].push(mesh);
      }

      // Vertical
      for (let i of [...Array(this.amountOfStuds + 1).keys()]) {
        let spacing = i * this.studDistance - this.joistFlangeWidth / 2;
        if (i === 0) spacing = 0;

        const mesh = this.threeService.createCube({
          material: Material.pine,
          whd: [this.joistFlangeWidth, length, thickness],
          xyz: [spacing, 0, 0],
        });
        let rotation = new THREE.Matrix4().makeRotationX(degToRad(angle - 90));
        mesh.applyMatrix4(rotation.setPosition(new THREE.Vector3(...origin)));

        this.subModels[key].push(mesh);
      }
    });

    // <======== animation  ========> //
    this.animations[key].to(
      this.subModels[key].map((x) => x.position),
      {
        z: 1,
        duration: 0.7,
        ease: "power3",
        stagger: { amount: 1 },
      }
    );
    this.animations[key].to(
      this.subModels[key].map((x) => x.scale),
      {
        z: 0,
        x: 0,
        stagger: { amount: 1 },
      },
      `<+=0.3`
    );
  }
  buildFacade() {
    const key = ConstructionParts.facade;

    const w = 0.3;
    const gap = 0.02;
    const w2 = 0.05;
    const wWindow = 150 / 1000;

    const windowFrameClip = this.threeService.createCube({
      material: Material.concrete,
      whd: [
        this.window.roughWidth - this.window.gap + wWindow,
        this.window.roughHeight + wWindow * 2,
        2,
      ],
      xyz: [0, this.window.roughBottom - wWindow, -1],
    });

    const t = this.thickness[Thicknesses.facade];
    let planks = Math.ceil(this.demoWith / (w + gap));
    for (let i of [...Array(planks).keys()]) {
      // upper thinner
      if (i === 0) continue;
      const spacing = i * (w + gap) - w2 / 2 - gap / 2;
      const meshSmall = this.clip(
        this.threeService.createCube({
          material: Material.facade,
          whd: [w2, this.outerWallHeight, t],
          xyz: [spacing, 0, this.crossDepth[Thicknesses.facade] + t],
        }),
        windowFrameClip
      );
      this.subModels[key].push(meshSmall);
    }
    for (let i of [...Array(planks).keys()]) {
      // lower broader
      let spacing = i * w + i * gap;
      if (i === 0) spacing = 0;

      const mesh = this.clip(
        this.threeService.createCube({
          material: Material.facade,
          whd: [w, this.outerWallHeight, t],
          xyz: [spacing, 0, this.crossDepth[Thicknesses.facade]],
        }),
        this.windowRoughClip
      );
      this.subModels[key].push(mesh);
    }

    // <======== Around Window  ========> //
    // bottom
    this.subModels[key].push(
      this.threeService.createCube({
        material: Material.whiteWood,
        whd: [this.window.roughWidth - this.window.gap, wWindow, t * 1.1],
        xyz: [
          0,
          this.window.roughBottom - wWindow,
          this.crossDepth[Thicknesses.facade] + t,
        ],
      })
    );
    // top
    this.subModels[key].push(
      this.threeService.createCube({
        material: Material.whiteWood,
        whd: [
          this.window.roughWidth - this.window.gap + wWindow * 1.2,
          wWindow,
          t * 1.1,
        ],
        xyz: [0, this.window.roughTop, this.crossDepth[Thicknesses.facade] + t],
      })
    );
    // right
    this.subModels[key].push(
      this.threeService.createCube({
        material: Material.whiteWood,
        whd: [wWindow, this.window.roughHeight + wWindow * 1.2, t * 1.1],
        xyz: [
          this.window.roughWidth - this.window.gap,
          this.window.roughBottom - wWindow * 1.2,
          this.crossDepth[Thicknesses.facade] + t,
        ],
      })
    );
    // <======== Around Window  ========> //
    // <======== animation  ========> //
    this.animations[key].to(
      this.subModels[key].map((x) => x.position),
      {
        z: this.crossDepth[Thicknesses.facade] + w / 2,
        ease: "power3",
        stagger: { amount: 1.2 },
      }
    );
    this.animations[key].to(
      this.subModels[key].map((x) => x.rotation),
      {
        // x: degToRad(90),
        y: degToRad(90),
        // z: degToRad(90),
        stagger: { amount: 1.2 },
      },
      `<+=0.3`
    );
    this.animations[key].to(
      this.subModels[key].map((x) => x.scale),
      {
        z: 0,
        x: 0,
        stagger: { amount: 1.2 },
      },
      `<+=0.3`
    );
  }
}
