// Model Configuration API Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { JWTManager } from '@/lib/auth/jwt';
import fs from 'fs/promises';
import path from 'path';

const CONFIG_FILE_PATH = path.join(process.cwd(), 'config', 'model-defaults.json');

// Validation schema for model configuration
interface ModelConfig {
  [provider: string]: {
    lastUpdated: string;
    source: 'manual' | 'api' | 'estimated';
    models: {
      [modelName: string]: {
        name?: string;
        description?: string;
        inputPrice: number;
        outputPrice: number;
        contextWindow: number;
        maxTokens?: number;
        maxOutputTokens?: number;
        capabilities?: string[];
      };
    };
  };
}

function validateConfig(config: any): config is ModelConfig {
  if (!config || typeof config !== 'object') return false;

  for (const [provider, providerData] of Object.entries(config)) {
    if (!providerData || typeof providerData !== 'object') return false;

    const data = providerData as any;
    if (!data.lastUpdated || !data.source || !data.models) return false;
    if (!['manual', 'api', 'estimated'].includes(data.source)) return false;

    for (const [modelName, modelData] of Object.entries(data.models)) {
      const model = modelData as any;
      if (
        typeof model.inputPrice !== 'number' ||
        typeof model.outputPrice !== 'number' ||
        typeof model.contextWindow !== 'number'
      ) {
        return false;
      }
    }
  }

  return true;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get('admin-token')?.value;
    if (!token || !JWTManager.verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Read configuration file
    const configContent = await fs.readFile(CONFIG_FILE_PATH, 'utf-8');
    const config = JSON.parse(configContent);

    return NextResponse.json({
      success: true,
      config,
      metadata: {
        filePath: 'config/model-defaults.json',
        lastModified: (await fs.stat(CONFIG_FILE_PATH)).mtime,
        size: configContent.length
      }
    });

  } catch (error) {
    console.error('Config read error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to read configuration',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get('admin-token')?.value;
    if (!token || !JWTManager.verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { config, validateOnly = false } = body;

    // Validate configuration structure
    if (!validateConfig(config)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid configuration structure',
          details: 'Configuration does not match expected schema'
        },
        { status: 400 }
      );
    }

    // If validation only, return success
    if (validateOnly) {
      return NextResponse.json({
        success: true,
        message: 'Configuration is valid',
        validated: true
      });
    }

    // Create backup of current config
    const currentConfig = await fs.readFile(CONFIG_FILE_PATH, 'utf-8');
    const backupPath = path.join(
      process.cwd(),
      'config',
      `model-defaults.backup.${Date.now()}.json`
    );
    await fs.writeFile(backupPath, currentConfig);

    // Write new configuration
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));

    // Get file metadata
    const stats = await fs.stat(CONFIG_FILE_PATH);

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      metadata: {
        filePath: 'config/model-defaults.json',
        lastModified: stats.mtime,
        size: JSON.stringify(config, null, 2).length,
        backupCreated: backupPath
      }
    });

  } catch (error) {
    console.error('Config update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update configuration',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get('admin-token')?.value;
    if (!token || !JWTManager.verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'backup-list':
        // List available backups
        const configDir = path.join(process.cwd(), 'config');
        const files = await fs.readdir(configDir);
        const backups = files
          .filter(file => file.startsWith('model-defaults.backup.'))
          .map(async (file) => {
            const filePath = path.join(configDir, file);
            const stats = await fs.stat(filePath);
            return {
              filename: file,
              timestamp: file.match(/\d+/)?.[0],
              created: stats.birthtime,
              size: stats.size
            };
          });

        const backupList = await Promise.all(backups);
        backupList.sort((a, b) => b.created.getTime() - a.created.getTime());

        return NextResponse.json({
          success: true,
          backups: backupList.slice(0, 10) // Last 10 backups
        });

      case 'restore-backup':
        const { filename } = body;
        if (!filename || !filename.startsWith('model-defaults.backup.')) {
          return NextResponse.json(
            { success: false, error: 'Invalid backup filename' },
            { status: 400 }
          );
        }

        const backupFilePath = path.join(process.cwd(), 'config', filename);
        const backupContent = await fs.readFile(backupFilePath, 'utf-8');

        // Validate backup content
        const backupConfig = JSON.parse(backupContent);
        if (!validateConfig(backupConfig)) {
          return NextResponse.json(
            { success: false, error: 'Backup file contains invalid configuration' },
            { status: 400 }
          );
        }

        // Create backup of current config before restore
        const currentConfig = await fs.readFile(CONFIG_FILE_PATH, 'utf-8');
        const restoreBackupPath = path.join(
          process.cwd(),
          'config',
          `model-defaults.pre-restore.${Date.now()}.json`
        );
        await fs.writeFile(restoreBackupPath, currentConfig);

        // Restore backup
        await fs.writeFile(CONFIG_FILE_PATH, backupContent);

        return NextResponse.json({
          success: true,
          message: 'Configuration restored from backup',
          restoredFrom: filename,
          backupCreated: restoreBackupPath
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Config action error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute configuration action',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

// Preflight for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, PUT, POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}