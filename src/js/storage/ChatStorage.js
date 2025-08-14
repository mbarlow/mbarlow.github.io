import { Message } from "../components/Message.js";
import { Channel } from "../components/Channel.js";
import { EntityData } from "../components/EntityData.js";
import { generateUUID } from "../utils/UUID.js";

/**
 * Simple IndexedDB storage for messages and channels
 */
export class ChatStorage {
  constructor() {
    this.dbName = "ChatDB";
    this.version = 3; // Increment version to force entities store creation
    this.db = null;
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.warn("IndexedDB failed, falling back to localStorage");
        this.db = null;
        resolve();
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log("✅ ChatStorage IndexedDB initialized");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Messages store
        if (!db.objectStoreNames.contains("messages")) {
          const messagesStore = db.createObjectStore("messages", {
            keyPath: "id",
          });
          messagesStore.createIndex("type", "type", { unique: false });
          messagesStore.createIndex("targetId", "targetId", { unique: false });
          messagesStore.createIndex("author", "author", { unique: false });
          messagesStore.createIndex("created", "created", { unique: false });
        }

        // Channels store
        if (!db.objectStoreNames.contains("channels")) {
          const channelsStore = db.createObjectStore("channels", {
            keyPath: "id",
          });
          channelsStore.createIndex("name", "name", { unique: true });
        }

        // Entities store
        if (!db.objectStoreNames.contains("entities")) {
          const entitiesStore = db.createObjectStore("entities", {
            keyPath: "uuid",
          });
          entitiesStore.createIndex("name", "name", { unique: false });
          entitiesStore.createIndex("tag", "tag", { unique: false });
          entitiesStore.createIndex("type", "type", { unique: false });
        }

        console.log("📦 ChatStorage database schema created");
      };
    });
  }

  /**
   * Save a message
   */
  async saveMessage(message) {
    if (!this.db) {
      // Fallback to localStorage
      const messages = this.getLocalStorageMessages();
      messages.push(message.toObject());
      localStorage.setItem("chat_messages", JSON.stringify(messages));
      return;
    }

    const transaction = this.db.transaction(["messages"], "readwrite");
    const store = transaction.objectStore("messages");
    await store.put(message.toObject());
  }

  /**
   * Get messages for a target (channel or DM)
   */
  async getMessages(type, targetId, limit = 100) {
    if (!this.db) {
      // Fallback to localStorage
      const messages = this.getLocalStorageMessages();
      return messages
        .filter((msg) => msg.type === type && msg.targetId === targetId)
        .sort((a, b) => new Date(a.created) - new Date(b.created))
        .slice(-limit)
        .map((msg) => Message.fromObject(msg));
    }

    const transaction = this.db.transaction(["messages"], "readonly");
    const store = transaction.objectStore("messages");
    const index = store.index("targetId");

    const messages = [];
    const request = index.openCursor(IDBKeyRange.only(targetId));

    return new Promise((resolve) => {
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && cursor.value.type === type) {
          messages.push(Message.fromObject(cursor.value));
          cursor.continue();
        } else if (cursor) {
          cursor.continue();
        } else {
          // Sort by created time and limit
          messages.sort((a, b) => new Date(a.created) - new Date(b.created));
          resolve(messages.slice(-limit));
        }
      };
    });
  }

  /**
   * Get ALL messages of a specific type (for better filtering)
   */
  async getAllMessages(type) {
    if (!this.db) {
      // Fallback to localStorage
      const messagesData = JSON.parse(
        localStorage.getItem("chat_messages") || "[]",
      );
      return messagesData
        .filter((msg) => msg.type === type)
        .map((msg) => Message.fromObject(msg));
    }

    const transaction = this.db.transaction(["messages"], "readonly");
    const store = transaction.objectStore("messages");
    const typeIndex = store.index("type");

    const messages = [];
    const request = typeIndex.openCursor(IDBKeyRange.only(type));

    return new Promise((resolve) => {
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          messages.push(Message.fromObject(cursor.value));
          cursor.continue();
        } else {
          // Sort by created time
          messages.sort((a, b) => new Date(a.created) - new Date(b.created));
          resolve(messages);
        }
      };
    });
  }

  /**
   * Get recent messages for context (last N messages in a target)
   */
  async getRecentMessages(type, targetId, count = 5) {
    const messages = await this.getMessages(type, targetId, count);
    return messages.slice(-count);
  }

  /**
   * Save a channel
   */
  async saveChannel(channel) {
    if (!this.db) {
      // Fallback to localStorage
      const channels = this.getLocalStorageChannels();
      const index = channels.findIndex((c) => c.id === channel.id);
      if (index >= 0) {
        channels[index] = channel.toObject();
      } else {
        channels.push(channel.toObject());
      }
      localStorage.setItem("chat_channels", JSON.stringify(channels));
      return;
    }

    const transaction = this.db.transaction(["channels"], "readwrite");
    const store = transaction.objectStore("channels");
    await store.put(channel.toObject());
  }

  /**
   * Get all channels
   */
  async getAllChannels() {
    if (!this.db) {
      // Fallback to localStorage
      const channels = this.getLocalStorageChannels();
      return channels.map((c) => Channel.fromObject(c));
    }

    const transaction = this.db.transaction(["channels"], "readonly");
    const store = transaction.objectStore("channels");
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const channels = request.result.map((c) => Channel.fromObject(c));
        resolve(channels);
      };
    });
  }

  /**
   * Get channel by name
   */
  async getChannelByName(name) {
    if (!this.db) {
      // Fallback to localStorage
      const channels = this.getLocalStorageChannels();
      const channel = channels.find((c) => c.name === name);
      return channel ? Channel.fromObject(channel) : null;
    }

    const transaction = this.db.transaction(["channels"], "readonly");
    const store = transaction.objectStore("channels");
    const index = store.index("name");
    const request = index.get(name);

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? Channel.fromObject(result) : null);
      };
    });
  }

  /**
   * Get entities that have DM history
   */
  async getDMEntities() {
    if (!this.db) {
      // Fallback to localStorage
      const messages = this.getLocalStorageMessages();
      const entityIds = new Set();
      messages
        .filter((msg) => msg.type === "dm")
        .forEach((msg) => {
          entityIds.add(msg.targetId);
          entityIds.add(msg.author);
        });
      return Array.from(entityIds);
    }

    const transaction = this.db.transaction(["messages"], "readonly");
    const store = transaction.objectStore("messages");
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const entityIds = new Set();
        request.result
          .filter((msg) => msg.type === "dm")
          .forEach((msg) => {
            entityIds.add(msg.targetId);
            entityIds.add(msg.author);
          });
        resolve(Array.from(entityIds));
      };
    });
  }

  // LocalStorage fallback methods
  getLocalStorageMessages() {
    const stored = localStorage.getItem("chat_messages");
    return stored ? JSON.parse(stored) : [];
  }

  getLocalStorageChannels() {
    const stored = localStorage.getItem("chat_channels");
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Clear all data (for testing)
   */
  async clearAll() {
    if (this.db) {
      try {
        const storeNames = ["messages", "channels"];
        // Only include entities store if it exists
        if (this.db.objectStoreNames.contains("entities")) {
          storeNames.push("entities");
        }
        const transaction = this.db.transaction(storeNames, "readwrite");
        await transaction.objectStore("messages").clear();
        await transaction.objectStore("channels").clear();
        if (this.db.objectStoreNames.contains("entities")) {
          await transaction.objectStore("entities").clear();
        }
      } catch (error) {
        console.warn("Error clearing IndexedDB stores:", error);
      }
    }

    localStorage.removeItem("chat_messages");
    localStorage.removeItem("chat_channels");
    localStorage.removeItem("chat_entities");
    console.log("🗑️ All chat data cleared");
  }

  /**
   * Delete the entire database and start fresh
   */
  async deleteDatabase() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    return new Promise((resolve, reject) => {
      const deleteReq = indexedDB.deleteDatabase(this.dbName);
      deleteReq.onerror = () => reject(deleteReq.error);
      deleteReq.onsuccess = () => {
        console.log("🗑️ Database completely deleted");
        localStorage.removeItem("chat_messages");
        localStorage.removeItem("chat_channels");
        localStorage.removeItem("chat_entities");
        resolve();
      };
    });
  }

  /**
   * Force database upgrade if needed
   */
  async forceUpgrade() {
    if (this.db && !this.db.objectStoreNames.contains("entities")) {
      console.log("🔄 Database needs upgrade for entities store");
      this.db.close();
      this.db = null;
      // Re-initialize with new version
      await this.init();
      console.log("✅ Database upgraded to version", this.version);
    }
  }

  /**
   * Save or update an entity
   */
  async saveEntity(entityData) {
    if (!this.db) {
      // Fallback to localStorage
      const entities = JSON.parse(
        localStorage.getItem("chat_entities") || "[]",
      );
      const index = entities.findIndex((e) => e.uuid === entityData.uuid);
      if (index >= 0) {
        entities[index] = entityData.toObject();
      } else {
        entities.push(entityData.toObject());
      }
      localStorage.setItem("chat_entities", JSON.stringify(entities));
      return;
    }

    try {
      // Check if entities store exists
      if (!this.db.objectStoreNames.contains("entities")) {
        console.warn("Entities store not found, using localStorage fallback");
        const entities = JSON.parse(
          localStorage.getItem("chat_entities") || "[]",
        );
        const index = entities.findIndex((e) => e.uuid === entityData.uuid);
        if (index >= 0) {
          entities[index] = entityData.toObject();
        } else {
          entities.push(entityData.toObject());
        }
        localStorage.setItem("chat_entities", JSON.stringify(entities));
        return;
      }

      const transaction = this.db.transaction(["entities"], "readwrite");
      const store = transaction.objectStore("entities");
      await store.put(entityData.toObject());
    } catch (error) {
      console.warn(
        "Error saving entity to IndexedDB, using localStorage:",
        error,
      );
      const entities = JSON.parse(
        localStorage.getItem("chat_entities") || "[]",
      );
      const index = entities.findIndex((e) => e.uuid === entityData.uuid);
      if (index >= 0) {
        entities[index] = entityData.toObject();
      } else {
        entities.push(entityData.toObject());
      }
      localStorage.setItem("chat_entities", JSON.stringify(entities));
    }
  }

  /**
   * Get entity by UUID
   */
  async getEntityByUuid(uuid) {
    if (!this.db) {
      // Fallback to localStorage
      const entities = JSON.parse(
        localStorage.getItem("chat_entities") || "[]",
      );
      const entityData = entities.find((e) => e.uuid === uuid);
      return entityData ? EntityData.fromObject(entityData) : null;
    }

    try {
      // Check if entities store exists
      if (!this.db.objectStoreNames.contains("entities")) {
        console.warn("Entities store not found, using localStorage fallback");
        const entities = JSON.parse(
          localStorage.getItem("chat_entities") || "[]",
        );
        const entityData = entities.find((e) => e.uuid === uuid);
        return entityData ? EntityData.fromObject(entityData) : null;
      }

      const transaction = this.db.transaction(["entities"], "readonly");
      const store = transaction.objectStore("entities");
      const result = await store.get(uuid);
      return result ? EntityData.fromObject(result) : null;
    } catch (error) {
      console.warn(
        "Error accessing entities store, using localStorage:",
        error,
      );
      const entities = JSON.parse(
        localStorage.getItem("chat_entities") || "[]",
      );
      const entityData = entities.find((e) => e.uuid === uuid);
      return entityData ? EntityData.fromObject(entityData) : null;
    }
  }

  /**
   * Get entity by name/tag (for lookup when creating)
   */
  async getEntityByName(name) {
    if (!this.db) {
      // Fallback to localStorage
      const entities = JSON.parse(
        localStorage.getItem("chat_entities") || "[]",
      );
      const entityData = entities.find(
        (e) => e.name === name || e.tag === name,
      );
      return entityData ? EntityData.fromObject(entityData) : null;
    }

    try {
      // Check if entities store exists
      if (!this.db.objectStoreNames.contains("entities")) {
        console.warn("Entities store not found, using localStorage fallback");
        const entities = JSON.parse(
          localStorage.getItem("chat_entities") || "[]",
        );
        const entityData = entities.find(
          (e) => e.name === name || e.tag === name,
        );
        return entityData ? EntityData.fromObject(entityData) : null;
      }

      const transaction = this.db.transaction(["entities"], "readonly");
      const store = transaction.objectStore("entities");
      const nameIndex = store.index("name");

      // Try by name first
      let result = await nameIndex.get(name);
      if (!result) {
        // Try by tag
        const tagIndex = store.index("tag");
        result = await tagIndex.get(name);
      }

      return result ? EntityData.fromObject(result) : null;
    } catch (error) {
      console.warn(
        "Error accessing entities store, using localStorage:",
        error,
      );
      const entities = JSON.parse(
        localStorage.getItem("chat_entities") || "[]",
      );
      const entityData = entities.find(
        (e) => e.name === name || e.tag === name,
      );
      return entityData ? EntityData.fromObject(entityData) : null;
    }
  }

  /**
   * Get or create entity by name (simple proper implementation)
   */
  async getOrCreateEntity(name, type = "entity") {
    console.log(`🔍 Looking for entity: "${name}"`);

    // First try to find existing entity by name
    let entity = await this.getEntityByName(name);

    if (entity) {
      // Found existing entity - update last seen and return it
      entity.updateLastSeen();
      await this.saveEntity(entity);
      console.log(
        `♻️ Found existing entity: ${name} -> ${entity.uuid.substring(0, 8)}...`,
      );
      return entity;
    }

    // Entity doesn't exist - create new one with regular UUID
    entity = EntityData.createFromName(name, type);
    await this.saveEntity(entity);
    console.log(
      `✨ Created new entity: ${name} -> ${entity.uuid.substring(0, 8)}...`,
    );
    return entity;
  }
}
