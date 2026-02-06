import { describe, it, expect, beforeEach } from "vitest";
import { ModelMapMemStorage } from "./modelMapStorage";

describe("ModelMapMemStorage", () => {
  let storage: ModelMapMemStorage;
  const testUserId = "test-user-123";

  beforeEach(() => {
    storage = new ModelMapMemStorage();
  });

  describe("AI Models", () => {
    it("should seed default models on construction", async () => {
      const models = await storage.getAiModels();
      expect(models.length).toBeGreaterThan(0);
    });

    it("should get a model by id", async () => {
      const models = await storage.getAiModels();
      const model = await storage.getAiModel(models[0].id);
      expect(model).toBeDefined();
      expect(model!.name).toBe(models[0].name);
    });

    it("should return undefined for non-existent model", async () => {
      const model = await storage.getAiModel("non-existent");
      expect(model).toBeUndefined();
    });

    it("should create a new model", async () => {
      const model = await storage.createAiModel({
        name: "Test Model",
        shortName: "TM",
        provider: "TestProvider",
        modelId: "test-model-1",
        description: "A test model",
        capabilities: ["text"],
        isFavorite: false,
        isActive: true,
      });
      expect(model.id).toBeDefined();
      expect(model.name).toBe("Test Model");
      expect(model.provider).toBe("TestProvider");

      const fetched = await storage.getAiModel(model.id);
      expect(fetched).toBeDefined();
    });

    it("should update an existing model", async () => {
      const models = await storage.getAiModels();
      const updated = await storage.updateAiModel(models[0].id, { description: "Updated" });
      expect(updated).toBeDefined();
      expect(updated!.description).toBe("Updated");
    });
  });

  describe("AI Tools", () => {
    it("should seed default tools on construction", async () => {
      const tools = await storage.getAiTools();
      expect(tools.length).toBeGreaterThan(0);
    });

    it("should get a tool by id", async () => {
      const tools = await storage.getAiTools();
      const tool = await storage.getAiTool(tools[0].id);
      expect(tool).toBeDefined();
      expect(tool!.name).toBe(tools[0].name);
    });

    it("should create a new tool", async () => {
      const tool = await storage.createAiTool({
        name: "Test Tool",
        shortName: "TT",
        provider: "TestProvider",
        description: "A test tool",
        category: "IDE",
        capabilities: ["code"],
        isFavorite: false,
        isActive: true,
      });
      expect(tool.id).toBeDefined();
      expect(tool.name).toBe("Test Tool");
    });
  });

  describe("User Models", () => {
    it("should add a model to user collection", async () => {
      const models = await storage.getAiModels();
      const userModel = await storage.addUserModel({
        userId: testUserId,
        modelId: models[0].id,
        notes: "My favorite",
      });
      expect(userModel.userId).toBe(testUserId);
      expect(userModel.modelId).toBe(models[0].id);
    });

    it("should list user models with model data", async () => {
      const models = await storage.getAiModels();
      await storage.addUserModel({ userId: testUserId, modelId: models[0].id });
      await storage.addUserModel({ userId: testUserId, modelId: models[1].id });

      const userModels = await storage.getUserModels(testUserId);
      expect(userModels).toHaveLength(2);
      expect(userModels[0].model).toBeDefined();
      expect(userModels[0].model.name).toBeTruthy();
    });

    it("should not duplicate user models", async () => {
      const models = await storage.getAiModels();
      await storage.addUserModel({ userId: testUserId, modelId: models[0].id });
      await storage.addUserModel({ userId: testUserId, modelId: models[0].id });

      const userModels = await storage.getUserModels(testUserId);
      expect(userModels).toHaveLength(1);
    });

    it("should remove a user model", async () => {
      const models = await storage.getAiModels();
      await storage.addUserModel({ userId: testUserId, modelId: models[0].id });

      const removed = await storage.removeUserModel(testUserId, models[0].id);
      expect(removed).toBe(true);

      const userModels = await storage.getUserModels(testUserId);
      expect(userModels).toHaveLength(0);
    });

    it("should return false when removing non-existent user model", async () => {
      const removed = await storage.removeUserModel(testUserId, "non-existent");
      expect(removed).toBe(false);
    });
  });

  describe("User Tools", () => {
    it("should add and list user tools", async () => {
      const tools = await storage.getAiTools();
      await storage.addUserTool({ userId: testUserId, toolId: tools[0].id });

      const userTools = await storage.getUserTools(testUserId);
      expect(userTools).toHaveLength(1);
      expect(userTools[0].tool).toBeDefined();
    });

    it("should remove a user tool", async () => {
      const tools = await storage.getAiTools();
      await storage.addUserTool({ userId: testUserId, toolId: tools[0].id });

      const removed = await storage.removeUserTool(testUserId, tools[0].id);
      expect(removed).toBe(true);

      const userTools = await storage.getUserTools(testUserId);
      expect(userTools).toHaveLength(0);
    });
  });

  describe("Use Cases", () => {
    it("should seed default use cases on construction", async () => {
      const useCases = await storage.getUseCases();
      expect(useCases.length).toBeGreaterThan(0);
    });

    it("should filter use cases by category", async () => {
      const allUseCases = await storage.getUseCases();
      const category = allUseCases[0].category;

      const filtered = await storage.getUseCases({ category });
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every(uc => uc.category === category)).toBe(true);
    });

    it("should filter use cases by isCurated", async () => {
      const curated = await storage.getUseCases({ isCurated: true });
      expect(curated.every(uc => uc.isCurated === true)).toBe(true);
    });

    it("should create a use case", async () => {
      const useCase = await storage.createUseCase({
        title: "Test Use Case",
        description: "Testing",
        category: "Writing",
        promptTemplate: "Write about {{topic}}",
        authorId: testUserId,
        isCurated: false,
        isPublic: true,
      });
      expect(useCase.id).toBeDefined();
      expect(useCase.title).toBe("Test Use Case");
    });

    it("should update a use case", async () => {
      const useCase = await storage.createUseCase({
        title: "Original",
        description: "Desc",
        category: "Writing",
        promptTemplate: "Prompt",
        authorId: testUserId,
        isCurated: false,
        isPublic: true,
      });

      const updated = await storage.updateUseCase(useCase.id, { title: "Updated Title" });
      expect(updated).toBeDefined();
      expect(updated!.title).toBe("Updated Title");
    });

    it("should delete a use case by author", async () => {
      const useCase = await storage.createUseCase({
        title: "To Delete",
        description: "Desc",
        category: "Writing",
        promptTemplate: "Prompt",
        authorId: testUserId,
        isCurated: false,
        isPublic: true,
      });

      const deleted = await storage.deleteUseCase(useCase.id, testUserId);
      expect(deleted).toBe(true);

      const fetched = await storage.getUseCase(useCase.id);
      expect(fetched).toBeUndefined();
    });

    it("should not delete a use case by non-author", async () => {
      const useCase = await storage.createUseCase({
        title: "Protected",
        description: "Desc",
        category: "Writing",
        promptTemplate: "Prompt",
        authorId: testUserId,
        isCurated: false,
        isPublic: true,
      });

      const deleted = await storage.deleteUseCase(useCase.id, "other-user");
      expect(deleted).toBe(false);
    });
  });

  describe("Model Tests", () => {
    it("should create and retrieve a test", async () => {
      const test = await storage.createModelTest({
        userId: testUserId,
        title: "My Test",
        useCaseId: null,
        prompt: "Test prompt",
        systemPrompt: null,
        status: "pending",
      });
      expect(test.id).toBeDefined();
      expect(test.title).toBe("My Test");

      const fetched = await storage.getModelTest(test.id, testUserId);
      expect(fetched).toBeDefined();
      expect(fetched!.title).toBe("My Test");
    });

    it("should list tests for a user", async () => {
      await storage.createModelTest({
        userId: testUserId,
        title: "Test 1",
        useCaseId: null,
        prompt: "Prompt 1",
        systemPrompt: null,
        status: "pending",
      });
      await storage.createModelTest({
        userId: testUserId,
        title: "Test 2",
        useCaseId: null,
        prompt: "Prompt 2",
        systemPrompt: null,
        status: "pending",
      });

      const tests = await storage.getModelTests(testUserId);
      expect(tests).toHaveLength(2);
    });

    it("should not return tests for a different user", async () => {
      await storage.createModelTest({
        userId: "other-user",
        title: "Other's Test",
        useCaseId: null,
        prompt: "Prompt",
        systemPrompt: null,
        status: "pending",
      });

      const tests = await storage.getModelTests(testUserId);
      expect(tests).toHaveLength(0);
    });

    it("should delete a test and its results", async () => {
      const test = await storage.createModelTest({
        userId: testUserId,
        title: "Delete Me",
        useCaseId: null,
        prompt: "Prompt",
        systemPrompt: null,
        status: "pending",
      });

      const models = await storage.getAiModels();
      await storage.createModelTestResult({
        testId: test.id,
        modelId: models[0].id,
        status: "completed",
      });

      const deleted = await storage.deleteModelTest(test.id, testUserId);
      expect(deleted).toBe(true);

      const results = await storage.getModelTestResults(test.id);
      expect(results).toHaveLength(0);
    });
  });

  describe("Model Test Results", () => {
    it("should create and retrieve test results with model data", async () => {
      const test = await storage.createModelTest({
        userId: testUserId,
        title: "Test",
        useCaseId: null,
        prompt: "Prompt",
        systemPrompt: null,
        status: "pending",
      });

      const models = await storage.getAiModels();
      await storage.createModelTestResult({
        testId: test.id,
        modelId: models[0].id,
        status: "completed",
        output: "Test output",
        userRating: 4,
      });

      const results = await storage.getModelTestResults(test.id);
      expect(results).toHaveLength(1);
      expect(results[0].model).toBeDefined();
      expect(results[0].model.name).toBe(models[0].name);
      expect(results[0].output).toBe("Test output");
    });

    it("should include tool data for tool-based results", async () => {
      const test = await storage.createModelTest({
        userId: testUserId,
        title: "Tool Test",
        useCaseId: null,
        prompt: "Prompt",
        systemPrompt: null,
        status: "pending",
      });

      const models = await storage.getAiModels();
      const tools = await storage.getAiTools();
      await storage.createModelTestResult({
        testId: test.id,
        modelId: models[0].id,
        toolId: tools[0].id,
        status: "completed",
      });

      const results = await storage.getModelTestResults(test.id);
      expect(results).toHaveLength(1);
      expect(results[0].tool).toBeDefined();
      expect(results[0].tool!.name).toBe(tools[0].name);
    });

    it("should return null tool when no toolId is set", async () => {
      const test = await storage.createModelTest({
        userId: testUserId,
        title: "No Tool",
        useCaseId: null,
        prompt: "Prompt",
        systemPrompt: null,
        status: "pending",
      });

      const models = await storage.getAiModels();
      await storage.createModelTestResult({
        testId: test.id,
        modelId: models[0].id,
        status: "completed",
      });

      const results = await storage.getModelTestResults(test.id);
      expect(results[0].tool).toBeNull();
    });

    it("should update a test result", async () => {
      const test = await storage.createModelTest({
        userId: testUserId,
        title: "Test",
        useCaseId: null,
        prompt: "Prompt",
        systemPrompt: null,
        status: "pending",
      });

      const models = await storage.getAiModels();
      const result = await storage.createModelTestResult({
        testId: test.id,
        modelId: models[0].id,
        status: "completed",
      });

      const updated = await storage.updateModelTestResult(result.id, {
        userRating: 5,
        userNotes: "Excellent",
      });
      expect(updated).toBeDefined();
      expect(updated!.userRating).toBe(5);
      expect(updated!.userNotes).toBe("Excellent");
    });
  });

  describe("Recommendations", () => {
    it("should create a recommendation", async () => {
      const models = await storage.getAiModels();
      const rec = await storage.updateRecommendation(
        testUserId,
        "Writing",
        models[0].id,
        4,
      );
      expect(rec.userId).toBe(testUserId);
      expect(rec.category).toBe("Writing");
      expect(rec.recommendedModelId).toBe(models[0].id);
    });

    it("should update existing recommendation with averaged rating", async () => {
      const models = await storage.getAiModels();
      await storage.updateRecommendation(testUserId, "Writing", models[0].id, 4);
      const updated = await storage.updateRecommendation(testUserId, "Writing", models[1].id, 2);

      expect(updated.totalTests).toBe(2);
      expect(updated.recommendedModelId).toBe(models[1].id);
    });

    it("should list user recommendations with model data", async () => {
      const models = await storage.getAiModels();
      await storage.updateRecommendation(testUserId, "Writing", models[0].id, 4);
      await storage.updateRecommendation(testUserId, "Coding", models[1].id, 5);

      const recs = await storage.getUserRecommendations(testUserId);
      expect(recs).toHaveLength(2);
      expect(recs[0].model).toBeDefined();
    });
  });
});
