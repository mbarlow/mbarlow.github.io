import { Component } from "../core/Component.js";
import { generateUUID } from "../utils/UUID.js";

/**
 * EntityData - Persistent entity information
 */
export class EntityData extends Component {
  constructor({
    uuid = null,
    name = "",
    tag = "",
    type = "entity",
    created = null,
    lastSeen = null,
    metadata = {},
  } = {}) {
    super();

    this.uuid = uuid || generateUUID();
    this.name = name;
    this.tag = tag || name;
    this.type = type; // 'player', 'bot', 'origin-marker', 'entity'
    this.created = created || new Date().toISOString();
    this.lastSeen = lastSeen || new Date().toISOString();
    this.metadata = metadata; // Additional data like position, properties, etc.
  }

  /**
   * Convert to plain object for storage
   */
  toObject() {
    return {
      uuid: this.uuid,
      name: this.name,
      tag: this.tag,
      type: this.type,
      created: this.created,
      lastSeen: this.lastSeen,
      metadata: this.metadata,
    };
  }

  /**
   * Create from plain object
   */
  static fromObject(data) {
    return new EntityData(data);
  }

  /**
   * Update last seen timestamp
   */
  updateLastSeen() {
    this.lastSeen = new Date().toISOString();
  }

  /**
   * Create entity with regular UUID
   */
  static createFromName(name, type = "entity") {
    return new EntityData({
      uuid: generateUUID(), // Use regular random UUID
      name,
      tag: name,
      type,
    });
  }
}
