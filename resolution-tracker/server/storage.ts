import { 
  type User, 
  type InsertUser,
  type Resolution,
  type InsertResolution,
  type Milestone,
  type InsertMilestone,
  type CheckIn,
  type InsertCheckIn,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Resolutions
  getResolutions(): Promise<Resolution[]>;
  getResolution(id: string): Promise<Resolution | undefined>;
  createResolution(resolution: InsertResolution): Promise<Resolution>;
  updateResolution(id: string, resolution: Partial<InsertResolution>): Promise<Resolution | undefined>;
  deleteResolution(id: string): Promise<boolean>;
  
  // Milestones
  getMilestones(resolutionId: string): Promise<Milestone[]>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: string, milestone: Partial<InsertMilestone>): Promise<Milestone | undefined>;
  deleteMilestone(id: string): Promise<boolean>;
  
  // Check-ins
  getCheckIns(): Promise<CheckIn[]>;
  getCheckInsByResolution(resolutionId: string): Promise<CheckIn[]>;
  createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private resolutions: Map<string, Resolution>;
  private milestones: Map<string, Milestone>;
  private checkIns: Map<string, CheckIn>;

  constructor() {
    this.users = new Map();
    this.resolutions = new Map();
    this.milestones = new Map();
    this.checkIns = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Resolutions
  async getResolutions(): Promise<Resolution[]> {
    return Array.from(this.resolutions.values());
  }

  async getResolution(id: string): Promise<Resolution | undefined> {
    return this.resolutions.get(id);
  }

  async createResolution(insertResolution: InsertResolution): Promise<Resolution> {
    const id = randomUUID();
    const resolution: Resolution = { 
      ...insertResolution, 
      id,
      progress: insertResolution.progress ?? 0,
      status: insertResolution.status ?? "not_started",
      description: insertResolution.description ?? null,
      targetDate: insertResolution.targetDate ?? null,
    };
    this.resolutions.set(id, resolution);
    return resolution;
  }

  async updateResolution(id: string, updates: Partial<InsertResolution>): Promise<Resolution | undefined> {
    const existing = this.resolutions.get(id);
    if (!existing) return undefined;
    
    const updated: Resolution = { ...existing, ...updates };
    this.resolutions.set(id, updated);
    return updated;
  }

  async deleteResolution(id: string): Promise<boolean> {
    // Also delete related milestones and check-ins
    for (const [milestoneId, milestone] of this.milestones.entries()) {
      if (milestone.resolutionId === id) {
        this.milestones.delete(milestoneId);
      }
    }
    for (const [checkInId, checkIn] of this.checkIns.entries()) {
      if (checkIn.resolutionId === id) {
        this.checkIns.delete(checkInId);
      }
    }
    return this.resolutions.delete(id);
  }

  // Milestones
  async getMilestones(resolutionId: string): Promise<Milestone[]> {
    return Array.from(this.milestones.values()).filter(
      (m) => m.resolutionId === resolutionId
    );
  }

  async createMilestone(insertMilestone: InsertMilestone): Promise<Milestone> {
    const id = randomUUID();
    const milestone: Milestone = { 
      ...insertMilestone, 
      id,
      completed: insertMilestone.completed ?? false,
      targetDate: insertMilestone.targetDate ?? null,
    };
    this.milestones.set(id, milestone);
    return milestone;
  }

  async updateMilestone(id: string, updates: Partial<InsertMilestone>): Promise<Milestone | undefined> {
    const existing = this.milestones.get(id);
    if (!existing) return undefined;
    
    const updated: Milestone = { ...existing, ...updates };
    this.milestones.set(id, updated);
    return updated;
  }

  async deleteMilestone(id: string): Promise<boolean> {
    return this.milestones.delete(id);
  }

  // Check-ins
  async getCheckIns(): Promise<CheckIn[]> {
    return Array.from(this.checkIns.values());
  }

  async getCheckInsByResolution(resolutionId: string): Promise<CheckIn[]> {
    return Array.from(this.checkIns.values()).filter(
      (c) => c.resolutionId === resolutionId
    );
  }

  async createCheckIn(insertCheckIn: InsertCheckIn): Promise<CheckIn> {
    const id = randomUUID();
    const checkIn: CheckIn = { ...insertCheckIn, id };
    this.checkIns.set(id, checkIn);
    return checkIn;
  }
}

export const storage = new MemStorage();
