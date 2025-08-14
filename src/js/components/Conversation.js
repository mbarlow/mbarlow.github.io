import { Component } from "../core/Component.js";
import { generateUUID } from "../utils/UUID.js";

/**
 * Conversation Component - Unified component for DMs and Channels
 * Replaces the Session paradigm with persistent conversations
 */
export class Conversation extends Component {
  constructor(type = "dm", options = {}) {
    super();

    // Core conversation data
    this.id = options.id || generateUUID();
    this.type = type; // 'dm' or 'channel'
    this.createdAt = options.createdAt || Date.now();
    this.lastActivityAt = options.lastActivityAt || Date.now();
    this.createdBy = options.createdBy || null;

    // Participants (Set for efficient lookup)
    this.participants = new Set(options.participants || []);

    // Messages
    this.messageIds = options.messageIds || [];
    this.lastMessageId = options.lastMessageId || null;
    this.messageCount = options.messageCount || 0;

    // Type-specific properties
    if (type === "channel") {
      this.name = options.name || "Untitled Channel";
      this.description = options.description || "";
      this.isPrivate = options.isPrivate || false;
      this.members = new Set(options.members || []); // Channels can have different member sets
    } else if (type === "dm") {
      this.name = null; // DMs don't have names
      this.description = null;
      this.isPrivate = true; // DMs are always private
      // For DMs, participants and members are the same
      this.members = this.participants;

      // Quick lookup array for DM pairs
      this.dmPair = Array.from(this.participants).sort();
    }

    // UI state
    this.isActive = false;
    this.unreadCount = options.unreadCount || 0;
  }

  // Participant management
  addParticipant(entityId) {
    if (this.type === "dm" && this.participants.size >= 2) {
      throw new Error("DMs can only have 2 participants");
    }

    this.participants.add(entityId);
    if (this.type === "channel") {
      this.members.add(entityId);
    } else {
      // Update DM pair for efficient lookups
      this.dmPair = Array.from(this.participants).sort();
    }
  }

  removeParticipant(entityId) {
    if (this.type === "dm") {
      throw new Error("Cannot remove participants from DMs");
    }

    this.participants.delete(entityId);
    this.members.delete(entityId);
  }

  hasParticipant(entityId) {
    return this.participants.has(entityId);
  }

  // Message management
  addMessage(messageId) {
    this.messageIds.push(messageId);
    this.lastMessageId = messageId;
    this.messageCount++;
    this.lastActivityAt = Date.now();
  }

  // DM-specific methods
  isDMWith(entityId1, entityId2) {
    if (this.type !== "dm") return false;
    const pair = [entityId1, entityId2].sort();
    return this.dmPair[0] === pair[0] && this.dmPair[1] === pair[1];
  }

  getOtherParticipant(currentEntityId) {
    if (this.type !== "dm") return null;
    return Array.from(this.participants).find((id) => id !== currentEntityId);
  }

  // Channel-specific methods
  updateChannelInfo(name, description) {
    if (this.type !== "channel") {
      throw new Error("Cannot update channel info for DMs");
    }
    this.name = name;
    this.description = description;
  }

  // Serialization for persistence
  toJSON() {
    const base = {
      id: this.id,
      type: this.type,
      createdAt: this.createdAt,
      lastActivityAt: this.lastActivityAt,
      createdBy: this.createdBy,
      participants: Array.from(this.participants),
      messageIds: this.messageIds,
      lastMessageId: this.lastMessageId,
      messageCount: this.messageCount,
      unreadCount: this.unreadCount,
    };

    if (this.type === "channel") {
      return {
        ...base,
        name: this.name,
        description: this.description,
        isPrivate: this.isPrivate,
        members: Array.from(this.members),
      };
    } else {
      return {
        ...base,
        dmPair: this.dmPair,
      };
    }
  }

  // Create from persisted data
  static fromJSON(data) {
    const conversation = new Conversation(data.type, {
      id: data.id,
      createdAt: data.createdAt,
      lastActivityAt: data.lastActivityAt,
      createdBy: data.createdBy,
      participants: data.participants,
      messageIds: data.messageIds,
      lastMessageId: data.lastMessageId,
      messageCount: data.messageCount,
      unreadCount: data.unreadCount,

      // Channel-specific
      name: data.name,
      description: data.description,
      isPrivate: data.isPrivate,
      members: data.members,
    });

    return conversation;
  }

  // Helper methods for UI
  getDisplayName(currentEntityId = null) {
    if (this.type === "channel") {
      return this.name;
    } else {
      // For DMs, return the name of the other participant
      if (currentEntityId) {
        const otherId = this.getOtherParticipant(currentEntityId);
        // This would need to be resolved by the caller with entity data
        return `DM with ${otherId}`;
      }
      return "Direct Message";
    }
  }

  getIcon() {
    return this.type === "channel" ? "#" : "@";
  }

  // Debug info
  getDebugInfo() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      participantCount: this.participants.size,
      messageCount: this.messageCount,
      lastActivity: new Date(this.lastActivityAt).toLocaleString(),
    };
  }
}
