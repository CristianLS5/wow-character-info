import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  effect,
  signal,
} from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

@Component({
  selector: 'app-character-model',
  standalone: true,
  templateUrl: './character-model.component.html',
  styleUrl: './character-model.component.sass',
})
export class CharacterModelComponent {
  @ViewChild('rendererCanvas', { static: true })
  rendererCanvas!: ElementRef<HTMLCanvasElement>;

  private modelUrlSignal = signal<string>('');
  @Input() set modelUrl(value: string) {
    this.modelUrlSignal.set(value);
  }

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private model: THREE.Object3D | null = null;

  constructor() {
    effect(() => {
      if (this.modelUrlSignal()) {
        this.loadModel();
      }
    });
  }

  ngOnInit(): void {
    this.initThree();
  }

  private initThree(): void {
    const canvas = this.rendererCanvas.nativeElement;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xcccccc);

    this.camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    this.animate();
  }

  private loadModel(): void {
    const loader = new GLTFLoader();
    loader.load(
      this.modelUrlSignal(),
      (gltf) => {
        if (this.model) {
          this.scene.remove(this.model);
        }
        this.model = gltf.scene;
        this.scene.add(this.model);

        // Center the model
        const box = new THREE.Box3().setFromObject(this.model);
        const center = box.getCenter(new THREE.Vector3());
        this.model.position.sub(center);

        // Adjust camera and controls to fit the model
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 1.5; // Zoom out a little so object fits in view
        this.camera.position.z = cameraZ;
        this.camera.updateProjectionMatrix();

        this.controls.target.set(0, 0, 0);
        this.controls.update();
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
      },
      (error) => {
        console.error('An error happened', error);
      }
    );
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
