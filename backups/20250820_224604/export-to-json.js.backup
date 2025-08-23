const { PrismaClient } = require('@prisma/client')
const fs = require('fs').promises
const path = require('path')

const prisma = new PrismaClient()

async function exportToJSON() {
  try {
    console.log('📄 Exporting data to JSON...')
    
    // 데이터 디렉토리 생성
    const dataDir = path.join(process.cwd(), 'data')
    try {
      await fs.access(dataDir)
    } catch {
      await fs.mkdir(dataDir, { recursive: true })
      console.log('📁 Created data directory')
    }
    
    // 모든 모델과 관련 데이터 조회
    const models = await prisma.model.findMany({
      include: {
        provider: true,
        status: true
      },
      orderBy: [
        { provider: { name: 'asc' } },
        { name: 'asc' }
      ]
    })
    
    // Provider별 그룹화
    const providers = await prisma.provider.findMany({
      include: {
        models: {
          include: {
            status: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })
    
    // 통계 계산 (일관성 규칙 적용 전 계산)
    // 활성 모델만 operational/degraded/outage 상태를 가짐
    const activeModels = models.filter(m => m.isActive);
    const statistics = {
      totalModels: models.length,
      activeModels: activeModels.length,
      totalProviders: providers.length,
      operationalModels: activeModels.filter(m => {
        const statusData = m.status?.[0] || m.status;
        const availability = statusData?.availability || 99.5;
        return availability >= 90;
      }).length,
      degradedModels: activeModels.filter(m => {
        const statusData = m.status?.[0] || m.status;
        const availability = statusData?.availability || 99.5;
        return availability < 90 && availability > 0;
      }).length,
      outageModels: activeModels.filter(m => {
        const statusData = m.status?.[0] || m.status;
        const availability = statusData?.availability || 99.5;
        return availability === 0;
      }).length,
      avgAvailability: models.reduce((sum, m) => sum + (m.status?.[0]?.availability || m.status?.availability || 99.5), 0) / models.length,
      lastUpdated: new Date().toISOString()
    }
    
    // 모델 타입별 통계
    const typeStats = models.reduce((acc, model) => {
      acc[model.type] = (acc[model.type] || 0) + 1
      return acc
    }, {})
    
    // Provider별 통계
    const providerStats = providers.map(provider => {
      const activeProviderModels = provider.models.filter(m => m.isActive);
      return {
        id: provider.id,
        name: provider.name,
        website: provider.websiteUrl,
        totalModels: provider.models.length,
        activeModels: activeProviderModels.length,
        operationalModels: activeProviderModels.filter(m => {
          const statusData = m.status?.[0] || m.status;
          const availability = statusData?.availability || 99.5;
          return availability >= 90;
        }).length,
        avgAvailability: provider.models.length > 0 
          ? provider.models.reduce((sum, m) => sum + (m.status?.[0]?.availability || m.status?.availability || 99.5), 0) / provider.models.length 
          : 0
      };
    })
    
    // JSON 데이터 구조
    const jsonData = {
      metadata: {
        version: '1.0',
        generated: new Date().toISOString(),
        source: 'github-actions'
      },
      statistics,
      typeStatistics: typeStats,
      providers: providerStats,
      models: models.map(model => {
        const statusData = model.status?.[0] || model.status;
        const availability = statusData?.availability || 99.5;
        
        // 일관성 규칙 적용
        let finalStatus = {};
        
        if (!model.isActive) {
          // 규칙 1: 비활성 모델은 status를 빈 객체로
          finalStatus = {};
        } else if (statusData) {
          // 활성 모델이고 status 데이터가 있는 경우
          let statusValue = 'operational';
          
          // 규칙 3: availability < 90% → degraded
          if (availability < 90 && availability > 0) {
            statusValue = 'degraded';
          }
          // 규칙 4: availability = 0% → outage
          else if (availability === 0) {
            statusValue = 'outage';
          }
          
          finalStatus = {
            status: statusValue,
            availability: availability,
            responseTime: statusData.latencyP50,
            errorRate: statusData.errorRate,
            lastCheck: statusData.checkedAt
          };
        } else if (model.isActive) {
          // 규칙 2: 활성 모델인데 status가 없으면 기본 operational 상태 부여
          finalStatus = {
            status: 'operational',
            availability: availability,
            responseTime: 100,
            errorRate: 0.01,
            lastCheck: new Date().toISOString()
          };
        }
        
        return {
          id: model.id,
          name: model.name,
          provider: {
            id: model.provider.id,
            name: model.provider.name,
            website: model.provider.websiteUrl
          },
          modalities: JSON.parse(model.modalities || '["text"]'),
          status: finalStatus,
          availability: availability,
          isActive: model.isActive,
          lastUpdate: model.updatedAt,
          createdAt: model.createdAt
        };
      })
    }
    
    // JSON 파일 저장
    const jsonPath = path.join(dataDir, 'models.json')
    await fs.writeFile(jsonPath, JSON.stringify(jsonData, null, 2))
    console.log(`✅ Exported ${models.length} models to ${jsonPath}`)
    
    // 간단한 통계 파일 생성
    const statsPath = path.join(dataDir, 'stats.json')
    await fs.writeFile(statsPath, JSON.stringify({
      ...statistics,
      typeStatistics: typeStats,
      providerCount: providerStats.length
    }, null, 2))
    console.log(`✅ Exported statistics to ${statsPath}`)
    
    // README 파일 생성
    const readmePath = path.join(dataDir, 'README.md')
    const readmeContent = `# AI Server Information - Data Export

## Overview
This directory contains automatically generated data exports from the AI Server Information system.

## Files
- \`models.json\` - Complete model and provider data with real-time status
- \`stats.json\` - Summary statistics and analytics

## Last Updated
${new Date().toISOString()}

## Statistics
- **Total Models**: ${statistics.totalModels}
- **Active Models**: ${statistics.activeModels}
- **Total Providers**: ${statistics.totalProviders}
- **Operational Models**: ${statistics.operationalModels}
- **Average Availability**: ${statistics.avgAvailability.toFixed(1)}%

## Data Structure
The JSON files follow a structured format designed for easy consumption by the frontend application and API endpoints.

## Automated Updates
This data is automatically updated every hour via GitHub Actions workflow.
`
    
    await fs.writeFile(readmePath, readmeContent)
    console.log(`✅ Generated README at ${readmePath}`)
    
    console.log('\n📊 Export Summary:')
    console.log(`   - Models: ${statistics.totalModels}`)
    console.log(`   - Providers: ${statistics.totalProviders}`)
    console.log(`   - Active: ${statistics.activeModels}`)
    console.log(`   - Operational: ${statistics.operationalModels}`)
    console.log(`   - Average availability: ${statistics.avgAvailability.toFixed(1)}%`)
    
  } catch (error) {
    console.error('❌ Export failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트가 직접 실행될 때
if (require.main === module) {
  exportToJSON()
    .then(() => {
      console.log('🎉 Export completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Export failed:', error)
      process.exit(1)
    })
}

module.exports = { exportToJSON }