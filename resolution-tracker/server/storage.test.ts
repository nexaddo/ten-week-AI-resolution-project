import { describe, it, expect, beforeEach } from "vitest";
import { MemStorage } from "../server/storage";
import type { InsertResolution } from "../shared/schema";

describe("Analytics Storage", () => {
  let storage: MemStorage;
  const testUserId = "test-user-123";

  beforeEach(() => {
    storage = new MemStorage();
  });

  describe("Activity Logging", () => {
    it("should log user activity", async () => {
      const activity = await storage.logUserActivity({
        userId: testUserId,
        action: "resolution_created",
        entityType: "resolution",
        entityId: "res-123",
        metadata: JSON.stringify({ title: "Test Resolution" }),
      });

      expect(activity).toMatchObject({
        userId: testUserId,
        action: "resolution_created",
        entityType: "resolution",
        entityId: "res-123",
      });
      expect(activity.id).toBeDefined();
      expect(activity.createdAt).toBeInstanceOf(Date);
    });

    it("should retrieve user activity log", async () => {
      // Log multiple activities
      await storage.logUserActivity({
        userId: testUserId,
        action: "resolution_created",
        entityType: "resolution",
        entityId: "res-1",
        metadata: null,
      });

      // Add a small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 5));

      await storage.logUserActivity({
        userId: testUserId,
        action: "check_in_added",
        entityType: "check_in",
        entityId: "check-1",
        metadata: null,
      });

      const activities = await storage.getUserActivityLog(testUserId, 10);

      expect(activities).toHaveLength(2);
      // Most recent activity should be first
      expect(activities[0].action).toBe("check_in_added");
      expect(activities[1].action).toBe("resolution_created");
    });

    it("should limit activity log results", async () => {
      // Log 5 activities
      for (let i = 0; i < 5; i++) {
        await storage.logUserActivity({
          userId: testUserId,
          action: `action_${i}`,
          entityType: null,
          entityId: null,
          metadata: null,
        });
      }

      const activities = await storage.getUserActivityLog(testUserId, 3);
      expect(activities).toHaveLength(3);
    });
  });

  describe("Analytics Stats", () => {
    it("should return empty stats for user with no data", async () => {
      const stats = await storage.getAnalyticsStats(testUserId);

      expect(stats).toMatchObject({
        totalResolutions: 0,
        completedResolutions: 0,
        inProgressResolutions: 0,
        totalCheckIns: 0,
        totalMilestones: 0,
        completedMilestones: 0,
      });
      expect(stats.recentActivities).toEqual([]);
    });

    it("should calculate resolution stats correctly", async () => {
      // Create resolutions with different statuses
      const resolution1 = await storage.createResolution({
        userId: testUserId,
        title: "Resolution 1",
        category: "Health & Fitness",
        status: "completed",
        description: null,
        targetDate: null,
        progress: 100,
      } as InsertResolution & { userId: string });

      const resolution2 = await storage.createResolution({
        userId: testUserId,
        title: "Resolution 2",
        category: "Career",
        status: "in_progress",
        description: null,
        targetDate: null,
        progress: 50,
      } as InsertResolution & { userId: string });

      const resolution3 = await storage.createResolution({
        userId: testUserId,
        title: "Resolution 3",
        category: "Learning",
        status: "not_started",
        description: null,
        targetDate: null,
        progress: 0,
      } as InsertResolution & { userId: string });

      const stats = await storage.getAnalyticsStats(testUserId);

      expect(stats.totalResolutions).toBe(3);
      expect(stats.completedResolutions).toBe(1);
      expect(stats.inProgressResolutions).toBe(1);
    });

    it("should count check-ins correctly", async () => {
      const resolution = await storage.createResolution({
        userId: testUserId,
        title: "Test Resolution",
        category: "Health & Fitness",
        description: null,
        targetDate: null,
        status: "in_progress",
        progress: 0,
      } as InsertResolution & { userId: string });

      // Add check-ins
      await storage.createCheckIn({
        resolutionId: resolution.id,
        note: "Check-in 1",
        date: "2024-01-01",
      });

      await storage.createCheckIn({
        resolutionId: resolution.id,
        note: "Check-in 2",
        date: "2024-01-02",
      });

      const stats = await storage.getAnalyticsStats(testUserId);

      expect(stats.totalCheckIns).toBe(2);
    });

    it("should count milestones correctly", async () => {
      const resolution = await storage.createResolution({
        userId: testUserId,
        title: "Test Resolution",
        category: "Health & Fitness",
        description: null,
        targetDate: null,
        status: "in_progress",
        progress: 0,
      } as InsertResolution & { userId: string });

      // Add milestones
      await storage.createMilestone({
        resolutionId: resolution.id,
        title: "Milestone 1",
        completed: true,
        targetDate: null,
      });

      await storage.createMilestone({
        resolutionId: resolution.id,
        title: "Milestone 2",
        completed: false,
        targetDate: null,
      });

      const stats = await storage.getAnalyticsStats(testUserId);

      expect(stats.totalMilestones).toBe(2);
      expect(stats.completedMilestones).toBe(1);
    });

    it("should include recent activities in stats", async () => {
      await storage.logUserActivity({
        userId: testUserId,
        action: "resolution_created",
        entityType: "resolution",
        entityId: "res-1",
        metadata: null,
      });

      const stats = await storage.getAnalyticsStats(testUserId);

      expect(stats.recentActivities).toHaveLength(1);
      expect(stats.recentActivities[0].action).toBe("resolution_created");
    });

    it("should filter stats by user when userId provided", async () => {
      const user1 = "user-1";
      const user2 = "user-2";

      // Create resolutions for both users
      await storage.createResolution({
        userId: user1,
        title: "User 1 Resolution",
        category: "Health & Fitness",
        description: null,
        targetDate: null,
        status: "in_progress",
        progress: 0,
      } as InsertResolution & { userId: string });

      await storage.createResolution({
        userId: user2,
        title: "User 2 Resolution",
        category: "Career",
        description: null,
        targetDate: null,
        status: "completed",
        progress: 100,
      } as InsertResolution & { userId: string });

      const user1Stats = await storage.getAnalyticsStats(user1);
      const user2Stats = await storage.getAnalyticsStats(user2);

      expect(user1Stats.totalResolutions).toBe(1);
      expect(user2Stats.totalResolutions).toBe(1);
      expect(user1Stats.completedResolutions).toBe(0);
      expect(user2Stats.completedResolutions).toBe(1);
    });

    it("should return global stats when no userId provided", async () => {
      // Create resolutions for multiple users
      await storage.createResolution({
        userId: "user-1",
        title: "Resolution 1",
        category: "Health & Fitness",
        description: null,
        targetDate: null,
        status: "completed",
        progress: 100,
      } as InsertResolution & { userId: string });

      await storage.createResolution({
        userId: "user-2",
        title: "Resolution 2",
        category: "Career",
        description: null,
        targetDate: null,
        status: "in_progress",
        progress: 50,
      } as InsertResolution & { userId: string });

      const globalStats = await storage.getAnalyticsStats();

      expect(globalStats.totalResolutions).toBe(2);
      expect(globalStats.completedResolutions).toBe(1);
      expect(globalStats.inProgressResolutions).toBe(1);
    });
  });
});
