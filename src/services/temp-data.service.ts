// DEPRECATED: This service is no longer used. Use UnifiedModelService instead.
// All hardcoded models have been removed to ensure AA models are loaded from the data file.

import { Model } from '@/types/models'
import { UnifiedModelService } from './unified-models.service'

export class TempDataService {
  // No hardcoded models - all models come from AA data file
  private static models: Model[] = []

  static async getAll(): Promise<Model[]> {
    // Redirect to UnifiedModelService to get AA models
    console.warn('TempDataService.getAll() is deprecated. Use UnifiedModelService instead.');

    try {
      const response = await UnifiedModelService.getAll({}, 1000, 0);
      // Convert UnifiedModel to Model format if needed
      return response.models.map(model => ({
        id: model.id,
        providerId: model.providerId || model.provider.toLowerCase().replace(/\s+/g, '-'),
        slug: model.slug || model.id,
        name: model.name,
        description: model.description,
        foundationModel: model.foundationModel,
        releasedAt: model.releasedAt,
        deprecatedAt: undefined,
        sunsetAt: undefined,
        modalities: model.modalities || ['text'],
        capabilities: model.capabilities || [],
        contextWindow: model.contextWindow,
        maxOutputTokens: 4096,
        trainingCutoff: undefined,
        apiVersion: undefined,
        isActive: model.isActive !== false,
        metadata: {
          aa: model.aa,
          db: model.db,
          intelligence: model.intelligence,
          speed: model.speed,
          priceInput: model.priceInput,
          priceOutput: model.priceOutput
        },
        createdAt: new Date().toISOString(),
        updatedAt: model.lastUpdated || new Date().toISOString(),
        provider: {
          id: model.providerId || model.provider.toLowerCase().replace(/\s+/g, '-'),
          slug: model.provider.toLowerCase().replace(/\s+/g, '-'),
          name: model.provider,
          regions: ['global'],
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error('Failed to fetch models from UnifiedModelService:', error);
      return [];
    }
  }

  static async getById(id: string): Promise<Model | null> {
    // Get models from UnifiedModelService
    const models = await this.getAll();
    return models.find(m => m.id === id) || null;
  }

  static async search(query: string): Promise<Model[]> {
    // Get models from UnifiedModelService and search
    const models = await this.getAll();
    const lowercaseQuery = query.toLowerCase();
    return models.filter(model =>
      model.name.toLowerCase().includes(lowercaseQuery) ||
      model.provider?.name?.toLowerCase().includes(lowercaseQuery) ||
      model.description?.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Add deprecated methods that other routes are using
  static async getProvidersSummary(): Promise<any[]> {
    console.warn('TempDataService.getProvidersSummary() is deprecated.');
    const models = await this.getAll();
    const providers = new Map<string, any>();

    for (const model of models) {
      const providerName = model.provider?.name || 'Unknown';
      if (!providers.has(providerName)) {
        providers.set(providerName, {
          id: providerName.toLowerCase().replace(/\s+/g, '-'),
          name: providerName,
          modelCount: 0,
          operationalCount: 0
        });
      }
      const provider = providers.get(providerName);
      provider.modelCount++;
      const status = Array.isArray(model.status) ? model.status[0]?.status : undefined;
      if (status === 'operational' || model.isActive) {
        provider.operationalCount++;
      }
    }

    return Array.from(providers.values());
  }

  static async getSystemStats(): Promise<any> {
    console.warn('TempDataService.getSystemStats() is deprecated.');
    const models = await this.getAll();

    return {
      totalModels: models.length,
      activeModels: models.filter(m => {
        const status = Array.isArray(m.status) ? m.status[0]?.status : undefined;
        return status === 'operational' || m.isActive;
      }).length,
      totalProviders: new Set(models.map(m => m.provider?.name || 'Unknown')).size,
      lastUpdated: new Date().toISOString()
    };
  }

  static async getPricing(filters?: any): Promise<any[]> {
    console.warn('TempDataService.getPricing() is deprecated.');
    const models = await this.getAll();

    return models.map(model => ({
      modelId: model.id,
      modelName: model.name,
      provider: model.provider?.name || 'Unknown',
      inputPrice: (model.metadata as any)?.priceInput || 0,
      outputPrice: (model.metadata as any)?.priceOutput || 0,
      currency: 'USD',
      unit: 'per 1M tokens'
    }));
  }

  static async searchModels(query: string, filters?: any): Promise<Model[]> {
    console.warn('TempDataService.searchModels() is deprecated.');
    return this.search(query);
  }
}