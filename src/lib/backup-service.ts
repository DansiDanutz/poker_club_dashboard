import { createClient } from '@supabase/supabase-js';
import { Player, Session, Promotion, Penalty, Addon, Achievement, ClubSettings } from '@/types';

export interface BackupSettings {
  autoBackup: boolean;
  maxBackups: number;
  password?: string;
}

const supabase = createClient(
  "https://pewwxyyxcepvluowvaxh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBld3d4eXl4Y2Vwdmx1b3d2YXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxOTA2MjgsImV4cCI6MjA3Mjc2NjYyOH0.nVln959hYDI4mDhdR_4K2FQ_vX9gtiSJMe4yiiqU0qs"
);

export interface BackupData {
  timestamp: string;
  version: string;
  appVersion: string;
  data: {
    players: Player[];
    sessions: Session[];
    promotions: Promotion[];
    penalties: Penalty[];
    addons: Addon[];
    achievements: Achievement[];
    settings: ClubSettings | null;
  };
  localStorage: Record<string, string>;
}

export class BackupService {
  private static readonly BACKUP_PREFIX = 'poker_backup_';
  private static readonly SETTINGS_KEY = 'backup_settings';
  private static readonly APP_VERSION = '1.0.0';

  // Get all available backups
  static getAvailableBackups(): BackupData[] {
    try {
      const backups: BackupData[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.BACKUP_PREFIX)) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              backups.push(JSON.parse(data));
            } catch (e) {
              console.warn(`Failed to parse backup ${key}:`, e);
            }
          }
        }
      }
      return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error getting available backups:', error);
      return [];
    }
  }

  // Create a complete backup of app and database
  static async createBackup(): Promise<BackupData> {
    try {
      const timestamp = new Date().toISOString();
      const backupKey = `${this.BACKUP_PREFIX}${timestamp}`;

      console.log('🔄 Creating backup...');

      // Fetch all data from Supabase
      const [
        playersResult,
        sessionsResult,
        promotionsResult,
        penaltiesResult,
        addonsResult,
        achievementsResult
      ] = await Promise.all([
        supabase.from('players').select('*').order('id'),
        supabase.from('sessions').select('*').order('id'),
        supabase.from('promotions').select('*').order('id'),
        supabase.from('penalties').select('*').order('id'),
        supabase.from('addons').select('*').order('id'),
        supabase.from('achievements').select('*').order('id')
      ]);

      // Handle errors
      if (playersResult.error) throw playersResult.error;
      if (sessionsResult.error) throw sessionsResult.error;
      if (promotionsResult.error) throw promotionsResult.error;

      // Collect localStorage data
      const localStorageData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith(this.BACKUP_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value !== null) {
            localStorageData[key] = value;
          }
        }
      }

      // Try to get club settings
      const clubSettingsString = localStorage.getItem('clubSettings');
      let clubSettings: ClubSettings | null = null;
      if (clubSettingsString) {
        try {
          clubSettings = JSON.parse(clubSettingsString);
        } catch (error) {
          console.error('Error parsing club settings:', error);
        }
      }

      const backupData: BackupData = {
        timestamp,
        version: this.APP_VERSION,
        appVersion: this.APP_VERSION,
        data: {
          players: playersResult.data || [],
          sessions: sessionsResult.data || [],
          promotions: promotionsResult.data || [],
          penalties: penaltiesResult.data || [],
          addons: addonsResult.data || [],
          achievements: achievementsResult.data || [],
          settings: clubSettings
        },
        localStorage: localStorageData
      };

      // Save backup to localStorage
      localStorage.setItem(backupKey, JSON.stringify(backupData));

      // Clean up old backups (keep last 10)
      this.cleanupOldBackups();

      console.log('✅ Backup created successfully:', backupKey);
      return backupData;
    } catch (error) {
      console.error('❌ Backup creation failed:', error);
      throw new Error(`Backup failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Restore from backup
  static async restoreFromBackup(backup: BackupData, password?: string): Promise<void> {
    try {
      console.log('🔄 Restoring from backup:', backup.timestamp);

      // Password protection for restore
      const RESTORE_PASSWORD = 'Seme0504';
      if (!password) {
        password = prompt('Enter password to restore backup:') || undefined;
      }
      
      if (password !== RESTORE_PASSWORD) {
        alert('Invalid password. Restore cancelled.');
        console.log('Restore cancelled - invalid password');
        return;
      }

      // Confirm with user
      const confirmed = confirm(
        `Are you sure you want to restore from backup created on ${new Date(backup.timestamp).toLocaleString()}?\n\n` +
        `This will:\n` +
        `• Replace ALL current database data\n` +
        `• Replace ALL localStorage settings\n` +
        `• This action CANNOT be undone\n\n` +
        `Current data will be lost!`
      );

      if (!confirmed) {
        console.log('Restore cancelled by user');
        return;
      }

      // Create a backup of current state before restore
      await this.createBackup();
      console.log('📦 Current state backed up before restore');

      // Clear existing data (optional - comment out if you want to merge)
      // await this.clearAllData();

      // Restore database data
      await this.restoreSupabaseData(backup.data);

      // Restore localStorage
      this.restoreLocalStorage(backup.localStorage);

      console.log('✅ Restore completed successfully');
      
      // Refresh the page to reflect changes
      if (confirm('Restore completed! Refresh the page to see changes?')) {
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Restore failed:', error);
      throw new Error(`Restore failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Restore Supabase data
  private static async restoreSupabaseData(data: BackupData['data']): Promise<void> {
    try {
      // Restore players
      if (data.players.length > 0) {
        for (const player of data.players) {
          await supabase.from('players').upsert(player, { onConflict: 'id' });
        }
        console.log(`📊 Restored ${data.players.length} players`);
      }

      // Restore sessions
      if (data.sessions.length > 0) {
        for (const session of data.sessions) {
          await supabase.from('sessions').upsert(session, { onConflict: 'id' });
        }
        console.log(`📊 Restored ${data.sessions.length} sessions`);
      }

      // Restore promotions
      if (data.promotions.length > 0) {
        for (const promotion of data.promotions) {
          await supabase.from('promotions').upsert(promotion, { onConflict: 'id' });
        }
        console.log(`📊 Restored ${data.promotions.length} promotions`);
      }

      // Restore penalties
      if (data.penalties.length > 0) {
        for (const penalty of data.penalties) {
          await supabase.from('penalties').upsert(penalty, { onConflict: 'id' });
        }
        console.log(`📊 Restored ${data.penalties.length} penalties`);
      }

      // Restore addons
      if (data.addons.length > 0) {
        for (const addon of data.addons) {
          await supabase.from('addons').upsert(addon, { onConflict: 'id' });
        }
        console.log(`📊 Restored ${data.addons.length} addons`);
      }

      // Restore achievements
      if (data.achievements.length > 0) {
        for (const achievement of data.achievements) {
          await supabase.from('achievements').upsert(achievement, { onConflict: 'id' });
        }
        console.log(`📊 Restored ${data.achievements.length} achievements`);
      }
    } catch (error) {
      console.error('Error restoring Supabase data:', error);
      throw error;
    }
  }

  // Restore localStorage
  private static restoreLocalStorage(localStorageData: Record<string, any>): void {
    try {
      // Clear current localStorage (except backups)
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith(this.BACKUP_PREFIX) && key !== this.SETTINGS_KEY) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Restore localStorage data
      Object.entries(localStorageData).forEach(([key, value]) => {
        if (!key.startsWith(this.BACKUP_PREFIX)) {
          try {
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
          } catch (error) {
            console.warn(`Failed to restore localStorage key ${key}:`, error);
          }
        }
      });

      console.log('📊 localStorage restored');
    } catch (error) {
      console.error('Error restoring localStorage:', error);
      throw error;
    }
  }

  // Delete a specific backup
  static deleteBackup(timestamp: string): boolean {
    try {
      const backupKey = `${this.BACKUP_PREFIX}${timestamp}`;
      localStorage.removeItem(backupKey);
      console.log('🗑️ Backup deleted:', backupKey);
      return true;
    } catch (error) {
      console.error('Error deleting backup:', error);
      return false;
    }
  }

  // Clean up old backups (keep only the last 10)
  private static cleanupOldBackups(): void {
    try {
      const backups = this.getAvailableBackups();
      if (backups.length > 10) {
        const toDelete = backups.slice(10);
        toDelete.forEach(backup => {
          this.deleteBackup(backup.timestamp);
        });
        console.log(`🧹 Cleaned up ${toDelete.length} old backups`);
      }
    } catch (error) {
      console.error('Error cleaning up backups:', error);
    }
  }

  // Export backup as file
  static exportBackup(backup: BackupData): void {
    try {
      const dataStr = JSON.stringify(backup, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `poker-club-backup-${backup.timestamp.split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      console.log('📥 Backup exported:', exportFileDefaultName);
    } catch (error) {
      console.error('Error exporting backup:', error);
      throw error;
    }
  }

  // Import backup from file
  static importBackup(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const backup = JSON.parse(event.target?.result as string);
          
          // Validate backup structure
          if (!backup.timestamp || !backup.data) {
            throw new Error('Invalid backup file format');
          }
          
          // Save imported backup to localStorage
          const backupKey = `${this.BACKUP_PREFIX}${backup.timestamp}`;
          localStorage.setItem(backupKey, JSON.stringify(backup));
          
          console.log('📤 Backup imported:', backupKey);
          resolve(backup);
        } catch (error) {
          reject(new Error(`Failed to import backup: ${error instanceof Error ? error.message : error}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read backup file'));
      reader.readAsText(file);
    });
  }

  // Setup automatic daily backups
  static setupAutomaticBackups(): void {
    try {
      const settings = this.getBackupSettings();
      
      if (settings.automaticBackups) {
        // Check if we need to create a backup today
        const lastBackup = settings.lastAutomaticBackup;
        const today = new Date().toDateString();
        
        if (!lastBackup || new Date(lastBackup).toDateString() !== today) {
          this.createBackup().then(() => {
            settings.lastAutomaticBackup = new Date().toISOString();
            this.saveBackupSettings(settings);
            console.log('✅ Automatic daily backup completed');
          }).catch(error => {
            console.error('❌ Automatic backup failed:', error);
          });
        }
      }
      
      // Set up interval to check daily (check every hour)
      setInterval(() => {
        this.setupAutomaticBackups();
      }, 60 * 60 * 1000); // 1 hour
      
    } catch (error) {
      console.error('Error setting up automatic backups:', error);
    }
  }

  // Backup settings management
  private static getBackupSettings() {
    try {
      const settings = localStorage.getItem(this.SETTINGS_KEY);
      return settings ? JSON.parse(settings) : {
        automaticBackups: true,
        lastAutomaticBackup: null,
        maxBackups: 10
      };
    } catch {
      return {
        automaticBackups: true,
        lastAutomaticBackup: null,
        maxBackups: 10
      };
    }
  }

  private static saveBackupSettings(settings: BackupSettings): void {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving backup settings:', error);
    }
  }

  // Get backup statistics
  static getBackupStats() {
    try {
      const backups = this.getAvailableBackups();
      const settings = this.getBackupSettings();
      
      return {
        totalBackups: backups.length,
        latestBackup: backups[0]?.timestamp || null,
        automaticBackupsEnabled: settings.automaticBackups,
        lastAutomaticBackup: settings.lastAutomaticBackup,
        oldestBackup: backups[backups.length - 1]?.timestamp || null,
        totalSize: this.calculateBackupSize(backups)
      };
    } catch (error) {
      console.error('Error getting backup stats:', error);
      return {
        totalBackups: 0,
        latestBackup: null,
        automaticBackupsEnabled: false,
        lastAutomaticBackup: null,
        oldestBackup: null,
        totalSize: 0
      };
    }
  }

  private static calculateBackupSize(backups: BackupData[]): number {
    return backups.reduce((total, backup) => {
      return total + JSON.stringify(backup).length;
    }, 0);
  }
}