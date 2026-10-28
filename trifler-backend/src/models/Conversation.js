//! one model for both direct chats and groups

import mongoose from "mongoose";

// One model for BOTH private chats and groups:
//   type "direct" -> exactly 2 members, no name
//   type "group"  -> 2+ members, has a name and admins
const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // --- group-only fields ---
    name: {
      type: String,
      trim: true,
      maxlength: [60, "Group name must be at most 60 characters"],
      required: [
        function () {
          return this.type === "group";
        },
        "Group name is required",
      ],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // --- direct-only field ---
    // "userIdA_userIdB" with the ids sorted, so the same two people can never
    // end up with two separate private chats. Left undefined for groups.
    directKey: {
      type: String,
      unique: true,
      sparse: true, // only enforce uniqueness where the field exists
    },

    // Shown in the conversation list (sidebar preview)
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
        delete ret.directKey;
        return ret;
      },
    },
  },
);

// Fast "all my conversations, newest activity first"
conversationSchema.index({ members: 1, updatedAt: -1 });

// Builds the directKey for two user ids (order does not matter)
conversationSchema.statics.buildDirectKey = function (userIdA, userIdB) {
  return [String(userIdA), String(userIdB)].sort().join("_");
};

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
