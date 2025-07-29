/**
 * Base Component class
 */
export class Component {
  constructor() {
    this.entity = null;
  }

  onAttach(entity) {
    this.entity = entity;
  }

  onDetach() {
    this.entity = null;
  }
}