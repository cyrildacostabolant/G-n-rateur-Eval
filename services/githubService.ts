
import { BackupData } from '../types.ts';

export interface GitHubConfig {
  token: string;
  repo: string;
  branch: string;
  path: string;
}

const STORAGE_KEY = 'eval_gen_github_config';
const DEFAULT_REPO = 'cyrildacostabolant/G-n-rateur-Eval';

class GitHubService {
  getConfig(): GitHubConfig {
    const stored = localStorage.getItem(STORAGE_KEY);
    const defaultConfig: GitHubConfig = {
      token: '',
      repo: DEFAULT_REPO,
      branch: 'main',
      path: 'backups'
    };

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...defaultConfig,
          ...parsed,
          repo: parsed.repo || DEFAULT_REPO
        };
      } catch (e) {
        console.error("Erreur lors du parsing de la config GitHub");
      }
    }
    return defaultConfig;
  }

  saveConfig(config: GitHubConfig) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }

  async uploadToGitHub(data: BackupData): Promise<string> {
    const config = this.getConfig();
    
    if (!config.token || !config.repo) {
      throw new Error("Configuration GitHub incomplète.");
    }

    const date = new Date().toISOString().split('T')[0];
    const fileName = `evaluation_backup_${date}.json`;
    const fullPath = `${config.path}/${fileName}`.replace(/\/+/g, '/');
    const url = `https://api.github.com/repos/${config.repo}/contents/${fullPath}`;
    
    const content = JSON.stringify(data, null, 2);
    const base64Content = btoa(unescape(encodeURIComponent(content)));

    let sha: string | null = null;
    try {
      const getRes = await fetch(url, {
        headers: { 'Authorization': `token ${config.token}` }
      });
      if (getRes.ok) {
        const fileData = await getRes.json();
        sha = fileData.sha;
      }
    } catch (e) {
      // Le fichier n'existe pas encore
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Sauvegarde automatique Evaluation - ${date}`,
        content: base64Content,
        branch: config.branch,
        sha: sha || undefined
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erreur lors de l'envoi vers GitHub");
    }

    const result = await response.json();
    return result.content.html_url;
  }

  async getLatestBackup(): Promise<BackupData> {
    const config = this.getConfig();
    if (!config.token || !config.repo) {
      throw new Error("Configuration GitHub incomplète.");
    }

    const url = `https://api.github.com/repos/${config.repo}/contents/${config.path}`;
    
    // 1. Lister les fichiers dans le dossier
    const response = await fetch(url, {
      headers: { 'Authorization': `token ${config.token}` }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Impossible d'accéder au dossier de sauvegarde sur GitHub.");
    }
    
    const files = await response.json();
    if (!Array.isArray(files)) throw new Error("Format de réponse GitHub invalide (attendu: liste de fichiers).");
    
    // 2. Trouver le fichier JSON le plus récent (trié par nom YYYY-MM-DD)
    const backupFiles = files
      .filter(f => f.type === 'file' && f.name.startsWith('evaluation_backup_') && f.name.endsWith('.json'))
      .sort((a, b) => b.name.localeCompare(a.name));
      
    if (backupFiles.length === 0) {
      throw new Error("Aucune sauvegarde trouvée dans le dossier GitHub.");
    }
    
    const latestFile = backupFiles[0];
    
    // 3. Récupérer le contenu du fichier sélectionné
    const fileResponse = await fetch(latestFile.url, {
      headers: { 'Authorization': `token ${config.token}` }
    });
    
    if (!fileResponse.ok) throw new Error("Erreur lors du téléchargement de la sauvegarde.");
    
    const fileData = await fileResponse.json();
    
    // Décodage Base64 sécurisé pour l'UTF-8
    const decodedContent = decodeURIComponent(escape(atob(fileData.content.replace(/\s/g, ''))));
    return JSON.parse(decodedContent);
  }
}

export const githubService = new GitHubService();
