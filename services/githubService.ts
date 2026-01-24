
import { BackupData } from '../types.ts';

export interface GitHubConfig {
  token: string;
  repo: string;
  branch: string;
  path: string;
}

const STORAGE_KEY = 'eval_gen_github_config';

class GitHubService {
  getConfig(): GitHubConfig {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Erreur lors du parsing de la config GitHub");
      }
    }
    return {
      token: '',
      repo: '',
      branch: 'main',
      path: 'backups'
    };
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

    // 1. On vérifie si le fichier existe déjà pour récupérer son SHA
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
      // Le fichier n'existe probablement pas encore
    }

    // 2. Envoi du fichier (PUT)
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
}

export const githubService = new GitHubService();
