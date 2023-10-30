import { IRemovable, lerp, scoped, vevet } from '@anton.bobrov/vevet-init';
import { Mesh, PlaneGeometry, ShaderMaterial, Vector2 } from 'three';
import { addEventListener } from 'vevet-dom';
import { ILerpedValue, IProps, ISize } from './types';

import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';
import snoise from './shaders/snoise.glsl';
import { settings } from './settings';

export class GhostPlane {
  get props() {
    return this._props;
  }

  get manager() {
    return this._props.manager;
  }

  private _material: ShaderMaterial;

  private _geometry: PlaneGeometry;

  private _mesh: Mesh;

  private _startSize: ISize;

  private _events: IRemovable[] = [];

  private _mouse: ILerpedValue<Vector2> = {
    current: new Vector2(0.5, 0.5),
    target: new Vector2(0.5, 0.5),
  };

  private _angle: ILerpedValue<number> = {
    current: 0,
    target: 0,
  };

  private _mouthSize: ILerpedValue<number> = {
    current: settings.mouthSize,
    target: settings.mouthSize,
  };

  private _eyeSize: ILerpedValue<number> = {
    current: settings.eyeSize,
    target: settings.eyeSize,
  };

  private _radius: ILerpedValue<number> = {
    current: settings.radius,
    target: settings.radius,
  };

  private _gradient: ILerpedValue<number> = {
    current: settings.gradient,
    target: settings.gradient,
  };

  constructor(private _props: IProps) {
    const { manager } = _props;
    const { width, height } = manager;

    this._material = new ShaderMaterial({
      vertexShader,
      fragmentShader: `${snoise} ${fragmentShader}`,
      uniforms: {
        u_aspect: { value: width / height },
        u_time: { value: 0 },
        u_mouse: { value: new Vector2(0.5, 0.5) },
        u_radius: { value: this._radius.current },
        u_angle: { value: 0 },
        u_eyeSize: { value: this._eyeSize.current },
        u_mouthSize: { value: this._mouthSize.current },
        u_gradient: { value: this._gradient.current },
      },
    });

    this._geometry = new PlaneGeometry(width, height);
    this._startSize = { width, height };

    this._mesh = new Mesh(this._geometry, this._material);
    manager.scene.add(this._mesh);

    this._setEvents();
  }

  private _setEvents() {
    this._events.push(
      this.manager.callbacks.add('resize', () => this._resize())
    );

    this._events.push(
      addEventListener(window, 'mousemove', (event) =>
        this._handleMouseMove(event)
      )
    );

    this._events.push(
      this.manager.callbacks.add('render', () => this._render())
    );

    this._events.push(
      addEventListener(window, 'mousedown', () => this._toggleSize(true))
    );

    this._events.push(
      addEventListener(window, 'mouseup', () => this._toggleSize(false))
    );
  }

  private _resize() {
    const { width, height } = this.manager;

    const widthScale = width / this._startSize.width;
    const heightScale = height / this._startSize.height;

    this._mesh.scale.set(widthScale, heightScale, 1);

    this._material.uniforms.u_aspect.value = width / height;
  }

  private _handleMouseMove(event: MouseEvent) {
    const x = scoped(event.clientX, [0, vevet.viewport.width]);
    const y = 1 - scoped(event.clientY, [0, vevet.viewport.height]);

    const prevAngleX = scoped(this._mouse.target.x, [0.5, 1]);
    const currentAngleX = scoped(x, [0.5, 1]);

    this._angle.target += prevAngleX - currentAngleX;

    this._mouse.target.set(x, y);
  }

  private _toggleSize(isActive: boolean) {
    this._eyeSize.target = settings.eyeSize * (isActive ? 0.5 : 1);
    this._mouthSize.target = settings.mouthSize * (isActive ? 0 : 1);

    this._radius.target = settings.radius * (isActive ? 3 : 1);

    this._gradient.target = settings.gradient * (isActive ? 3.5 : 1);
  }

  private _render() {
    const { uniforms } = this._material;
    const { easeMultiplier } = this.manager;

    this._mouse.current = this._mouse.current.lerp(
      this._mouse.target,
      settings.mouseEase * easeMultiplier
    );

    this._angle.current = lerp(
      this._angle.current,
      this._angle.target,
      settings.mouseEase * easeMultiplier
    );

    this._angle.target = lerp(
      this._angle.target,
      0,
      settings.mouseEase * easeMultiplier
    );

    this._eyeSize.current = lerp(
      this._eyeSize.current,
      this._eyeSize.target,
      settings.sizeEase * easeMultiplier
    );

    this._mouthSize.current = lerp(
      this._mouthSize.current,
      this._mouthSize.target,
      settings.sizeEase * easeMultiplier
    );

    this._radius.current = lerp(
      this._radius.current,
      this._radius.target,
      settings.sizeEase * easeMultiplier
    );

    this._gradient.current = lerp(
      this._gradient.current,
      this._gradient.target,
      settings.sizeEase * easeMultiplier
    );

    uniforms.u_time.value += settings.timeSpeed * easeMultiplier;
    uniforms.u_radius.value = this._radius.current;
    uniforms.u_mouse.value = this._mouse.current;
    uniforms.u_angle.value = this._angle.current;
    uniforms.u_eyeSize.value = this._eyeSize.current;
    uniforms.u_mouthSize.value = this._mouthSize.current;
    uniforms.u_gradient.value = this._gradient.current;
  }

  public destroy() {
    this.manager.scene.remove(this._mesh);

    this._material.dispose();
    this._geometry.dispose();

    this._events.forEach((event) => event.remove());
  }
}
