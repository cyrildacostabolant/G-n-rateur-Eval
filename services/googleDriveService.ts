
import { BackupData } from '../types.ts';

// Note: Pour une exécution locale réelle, l'utilisateur devrait configurer son propre Client ID.
// Nous utilisons ici une approche par jeton d'accès via Google Identity Services.
const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // Placeholder - L'utilisateur devra le configurer ou le passer via env
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

class GoogleDriveService {
  private tokenClient: any = null;
  private accessToken: string | null = null;

  async init() {
    return new Promise<void>((resolve) => {
      const checkGapi = () => {
        // Fix: Use type casting to access the globally injected 'google' object from Google Identity Services scripts
        if ((window as any).google && (window as any).google.accounts) {
          // Fix: Access initTokenClient via casted window object to avoid TypeScript property existence errors
          this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (response: any) => {
              if (response.error !== undefined) {
                throw response;
              }
              this.accessToken = response.access_token;
              resolve();
            },
          });
          resolve();
        } else {
          setTimeout(checkGapi, 100);
        }
      };
      checkGapi();
    });
  }

  async authenticate(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject('Google Drive Client non initialisé');
        return;
      }
      this.tokenClient.callback = (response: any) => {
        if (response.error !== undefined) {
          reject(response.error);
        }
        this.accessToken = response.access_token;
        resolve(this.accessToken!);
      };
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  async uploadBackup(data: BackupData): Promise<void> {
    if (!this.accessToken) throw new Error('Non authentifié');

    const fileName = `evalgen_backup_${new Date().toISOString().split('T')[0]}.json`;
    const metadata = {
      name: fileName,
      mimeType: 'application/json',
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }));

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'envoi vers Google Drive');
    }
  }

  async listBackups(): Promise<{ id: string; name: string; createdTime: string }[]> {
    if (!this.accessToken) throw new Error('Non authentifié');

    const response = await fetch(
      'https://www.googleapis.com/drive/v3/files?q=name contains "evalgen_backup" and mimeType = "application/json"&fields=files(id, name, createdTime)&orderBy=createdTime desc',
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des fichiers');
    }

    const data = await response.json();
    return data.files || [];
  }

  async downloadBackup(fileId: string): Promise<BackupData> {
    if (!this.accessToken) throw new Error('Non authentifié');

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors du téléchargement du fichier');
    }

    return await response.json();
  }

  isAuthenticated() {
    return !!this.accessToken;
  }
}

export const googleDriveService = new GoogleDriveService();
