import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name must be at most 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned in queries by default
    },
    avatar: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },

    // ─── Email Verification ──────────────────────────────────────────────────
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationTokenExpiry: {
      type: Date,
      select: false,
    },

    // ─── Password Reset ──────────────────────────────────────────────────────
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetTokenExpiry: {
      type: Date,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },

    // ─── Refresh Tokens (allow multiple devices) ─────────────────────────────
    refreshTokens: {
      type: [
        {
          token: { type: String, required: true },
          deviceInfo: { type: String, default: 'Unknown device' },
          createdAt: { type: Date, default: Date.now },
          expiresAt: { type: Date, required: true },
        },
      ],
      select: false,
      default: [],
    },

    // ─── Extended Profile ─────────────────────────────────────────────────────
    bio: {
      type: String,
      trim: true,
      maxlength: [200, 'Bio must be at most 200 characters'],
      default: null,
    },
    jobTitle: {
      type: String,
      trim: true,
      maxlength: [100, 'Job title must be at most 100 characters'],
      default: null,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },

    // ─── Notification Preferences ─────────────────────────────────────────────
    notificationPreferences: {
      email: {
        taskAssigned:     { type: Boolean, default: true },
        taskUpdated:      { type: Boolean, default: false },
        taskDueSoon:      { type: Boolean, default: true },
        commentMentioned: { type: Boolean, default: true },
        workspaceInvite:  { type: Boolean, default: true },
      },
      inApp: {
        taskAssigned:     { type: Boolean, default: true },
        taskUpdated:      { type: Boolean, default: true },
        taskDueSoon:      { type: Boolean, default: true },
        commentMentioned: { type: Boolean, default: true },
        workspaceInvite:  { type: Boolean, default: true },
      },
    },

    // ─── Account State ───────────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationTokenExpiry;
        delete ret.passwordResetToken;
        delete ret.passwordResetTokenExpiry;
        delete ret.passwordChangedAt;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });
userSchema.index({ createdAt: -1 });

// ─── Pre-save: Hash password ──────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000); // Ensure token issued before this
  }
  next();
});

// ─── Instance Methods ─────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.wasPasswordChangedAfter = function (jwtIssuedAt) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtIssuedAt < changedTimestamp;
  }
  return false;
};

userSchema.methods.addRefreshToken = function (token, deviceInfo, expiresAt) {
  // Remove expired tokens first
  this.refreshTokens = this.refreshTokens.filter((t) => t.expiresAt > new Date());
  // Limit to 5 active sessions per user
  if (this.refreshTokens.length >= 5) {
    this.refreshTokens.shift(); // remove oldest
  }
  this.refreshTokens.push({ token, deviceInfo, expiresAt });
};

userSchema.methods.removeRefreshToken = function (token) {
  this.refreshTokens = this.refreshTokens.filter((t) => t.token !== token);
};

userSchema.methods.removeAllRefreshTokens = function () {
  this.refreshTokens = [];
};

// ─── Virtual: avatar url fallback ────────────────────────────────────────────
userSchema.virtual('avatarUrl').get(function () {
  return this.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=f59e0b&color=fff`;
});

const User = mongoose.model('User', userSchema);
export default User;