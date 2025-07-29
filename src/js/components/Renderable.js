import { Component } from '../core/Component.js';

export class Renderable extends Component {
  constructor(element = null, visible = true) {
    super();
    this.element = element;
    this.visible = visible;
    this.zIndex = 0;
  }

  show() {
    this.visible = true;
    if (this.element) {
      this.element.style.display = '';
    }
  }

  hide() {
    this.visible = false;
    if (this.element) {
      this.element.style.display = 'none';
    }
  }
}