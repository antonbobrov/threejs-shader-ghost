import '../styles/index.scss';
import { GhostPlane } from './GhostPlane';
import { WebglManager } from './webgl/Manager';

const manager = new WebglManager('#scene', {});
manager.play();

// eslint-disable-next-line no-new
new GhostPlane({ manager });
