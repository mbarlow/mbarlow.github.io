import { Component } from '../core/Component.js';

export class Transform extends Component {
  constructor(x = 0, y = 0, rotation = 0, scale = 1) {
    super();
    this.x = x;
    this.y = y;
    this.rotation = rotation;
    this.scale = scale;
  }

  translate(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  rotate(angle) {
    this.rotation += angle;
  }
}