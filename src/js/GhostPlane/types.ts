import { WebglManager } from '../webgl/Manager';

export interface IProps {
  manager: WebglManager;
}

export interface ISize {
  width: number;
  height: number;
}

export interface ILerpedValue<T> {
  current: T;
  target: T;
}
