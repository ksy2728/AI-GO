import { PrismaClient, Model, Provider, Pricing } from '@prisma/client';
import { logger } from '@/utils/logger';

export class DataService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async ensureProvider(providerData: any): Promise<Provider> {
    try {
      // Try to find by slug first
      const existing = await this.prisma.provider.findUnique({
        where: { slug: providerData.id.toLowerCase() },
      });

      if (existing) {
        return existing;
      }

      return await this.prisma.provider.create({
        data: {
          id: providerData.id,
          slug: providerData.id.toLowerCase(),
          name: providerData.name || providerData.id,
          logoUrl: providerData.logoUrl || null,
          websiteUrl: providerData.website || providerData.websiteUrl || null,
          statusPageUrl: providerData.statusPageUrl || null,
          documentationUrl: providerData.documentation_url || providerData.documentationUrl || null,
          regions: JSON.stringify(['global']),
          metadata: JSON.stringify({ status: providerData.status || 'active' }),
        },
      });
    } catch (error) {
      logger.error('Error ensuring provider:', error);
      throw error;
    }
  }

  async upsertModel(modelData: any): Promise<Model> {
    try {
      const slug = `${modelData.provider_id}-${modelData.model_id}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      
      return await this.prisma.model.upsert({
        where: {
          slug: slug,
        },
        update: {
          name: modelData.name,
          description: modelData.description || null,
          foundationModel: modelData.model_id,
          deprecatedAt: modelData.status === 'deprecated' ? new Date() : null,
          modalities: JSON.stringify(['text']),
          capabilities: JSON.stringify(modelData.capabilities || []),
          contextWindow: modelData.context_window,
          maxOutputTokens: modelData.max_tokens || modelData.max_output_tokens,
          trainingCutoff: modelData.training_cutoff,
          apiVersion: modelData.api_version || 'v1',
          isActive: modelData.status === 'active',
          metadata: JSON.stringify({
            supports_functions: modelData.supports_functions,
            supports_vision: modelData.supports_vision,
            parameters: modelData.parameters,
            tags: modelData.tags,
          }),
        },
        create: {
          providerId: modelData.provider_id,
          slug: slug,
          name: modelData.name,
          description: modelData.description || null,
          foundationModel: modelData.model_id,
          releasedAt: new Date(),
          deprecatedAt: modelData.status === 'deprecated' ? new Date() : null,
          modalities: JSON.stringify(['text']),
          capabilities: JSON.stringify(modelData.capabilities || []),
          contextWindow: modelData.context_window,
          maxOutputTokens: modelData.max_tokens || modelData.max_output_tokens,
          trainingCutoff: modelData.training_cutoff,
          apiVersion: modelData.api_version || 'v1',
          isActive: modelData.status === 'active',
          metadata: JSON.stringify({
            supports_functions: modelData.supports_functions,
            supports_vision: modelData.supports_vision,
            parameters: modelData.parameters,
            tags: modelData.tags,
          }),
        },
      });
    } catch (error) {
      logger.error('Error upserting model:', error);
      throw error;
    }
  }

  async upsertPricing(pricingData: any): Promise<Pricing> {
    try {
      // First get the model to get its ID
      const modelSlug = `${pricingData.provider_id}-${pricingData.model_id}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const model = await this.prisma.model.findUnique({
        where: { slug: modelSlug },
      });
      
      if (!model) {
        throw new Error(`Model not found: ${modelSlug}`);
      }

      // Convert per 1K tokens to per million tokens
      const inputPerMillion = (pricingData.input_price || 0) * 1000;
      const outputPerMillion = (pricingData.output_price || 0) * 1000;
      
      // Check if pricing exists
      const existing = await this.prisma.pricing.findFirst({
        where: {
          modelId: model.id,
          tier: 'standard',
          region: pricingData.region || 'global',
        },
      });

      if (existing) {
        return await this.prisma.pricing.update({
          where: { id: existing.id },
          data: {
            inputPerMillion: inputPerMillion,
            outputPerMillion: outputPerMillion,
            currency: pricingData.currency || 'USD',
            metadata: JSON.stringify({
              context_window: pricingData.context_window,
              max_output_tokens: pricingData.max_output_tokens,
              unit: pricingData.unit,
            }),
          },
        });
      }

      return await this.prisma.pricing.create({
        data: {
          modelId: model.id,
          tier: 'standard',
          region: pricingData.region || 'global',
          currency: pricingData.currency || 'USD',
          inputPerMillion: inputPerMillion,
          outputPerMillion: outputPerMillion,
          effectiveFrom: pricingData.effective_date || new Date(),
          metadata: JSON.stringify({
            context_window: pricingData.context_window,
            max_output_tokens: pricingData.max_output_tokens,
            unit: pricingData.unit,
          }),
        },
      });
    } catch (error) {
      logger.error('Error upserting pricing:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}