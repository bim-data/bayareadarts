import React, { useState, useRef } from 'react';
import {
  X,
  FileCode,
  Download,
  Upload,
  Check,
  Copy,
  RefreshCw,
  AlertCircle,
  Database,
  GitBranch,
  Layers,
  Users,
  Flag,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  Course,
  MemberProfile,
  TeamGroup,
  CompletedRoundRecord,
  FutureRound,
} from '../types';
import {
  exportCoursesYaml,
  exportMembersYaml,
  exportTeamsYaml,
  exportRoundsYaml,
  exportFutureRoundsYaml,
  exportAllClubhouseYaml,
  parseUploadedYamlFile,
  resetClubhouseToBundledYaml,
  YamlDataType,
} from '../services/yamlStorage';

interface YamlBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  members: MemberProfile[];
  teams: TeamGroup[];
  completedRounds: CompletedRoundRecord[];
  futureRounds: FutureRound[];
  onImportSuccess: (type: YamlDataType, importedData: any) => void;
  onResetToDefaults: () => void;
}

export const YamlBackupModal: React.FC<YamlBackupModalProps> = ({
  isOpen,
  onClose,
  courses,
  members,
  teams,
  completedRounds,
  futureRounds,
  onImportSuccess,
  onResetToDefaults,
}) => {
  const [copiedGit, setCopiedGit] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    status: 'idle' | 'parsed' | 'success' | 'error';
    message: string;
    parsedResult?: {
      filename: string;
      type: YamlDataType | 'unknown';
      count: number;
      data: any;
    };
  }>({ status: 'idle', message: '' });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleCopyGitCommands = () => {
    const commands = `git add data/*.yaml\ngit commit -m "Update Bay Area Darts clubhouse records"\ngit push`;
    navigator.clipboard.writeText(commands).then(() => {
      setCopiedGit(true);
      setTimeout(() => setCopiedGit(false), 2500);
    });
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await parseUploadedYamlFile(file);
      if (result.type === 'unknown') {
        setImportStatus({
          status: 'error',
          message: `Could not identify record type from "${file.name}". Please ensure it is one of: courses.yaml, members.yaml, teams.yaml, rounds.yaml, future-rounds.yaml.`,
        });
        return;
      }

      setImportStatus({
        status: 'parsed',
        message: `Parsed "${file.name}": detected ${result.count} ${result.type.replace('_', ' ')} records.`,
        parsedResult: result,
      });
    } catch (err: any) {
      setImportStatus({
        status: 'error',
        message: `Failed to parse YAML file: ${err.message || 'Syntax error'}`,
      });
    }
  };

  const handleApplyImport = () => {
    if (!importStatus.parsedResult || importStatus.parsedResult.type === 'unknown') return;
    const { type, count, data, filename } = importStatus.parsedResult;
    onImportSuccess(type, data);
    setImportStatus({
      status: 'success',
      message: `Successfully updated clubhouse records with ${count} items from ${filename}!`,
    });
    setTimeout(() => {
      setImportStatus({ status: 'idle', message: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 3000);
  };

  const handleDownloadAll = () => {
    exportAllClubhouseYaml({
      courses,
      members,
      teams,
      rounds: completedRounds,
      futureRounds,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-slate-900 border-2 border-emerald-500/40 rounded-2xl shadow-2xl shadow-emerald-950/50 text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-900/40 border border-emerald-400/30">
              <FileCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-white uppercase font-sans">
                  YAML Flat Files & Git Sync
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full">
                  GitHub Pages Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Human-readable club records in <code className="text-emerald-400 font-mono">data/*.yaml</code> for seamless GitHub version control
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Top Banner: Export All */}
          <div className="p-4 bg-gradient-to-r from-emerald-950/50 via-slate-900 to-teal-950/50 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                <Database className="w-4 h-4 text-emerald-400" />
                1-Click Full Clubhouse Backup
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
                Download all 5 flat YAML files. Place them into your repository's <code className="text-slate-300 font-mono">data/</code> directory to keep your GitHub backup and GitHub Pages in perfect sync.
              </p>
            </div>
            <button
              onClick={handleDownloadAll}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export All 5 Files
            </button>
          </div>

          {/* 5 Flat Files Grid */}
          <div>
            <h3 className="text-xs font-black tracking-wider uppercase text-slate-400 mb-2.5 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Clubhouse Flat Data Stores
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {/* courses.yaml */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col justify-between transition-all">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-emerald-400">courses.yaml</span>
                    <Flag className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {courses.length} courses with tee ratings & hole pars
                  </p>
                </div>
                <button
                  onClick={() => exportCoursesYaml(courses)}
                  className="mt-3 w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3 text-emerald-400" />
                  Download courses.yaml
                </button>
              </div>

              {/* members.yaml */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col justify-between transition-all">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-emerald-400">members.yaml</span>
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {members.length} golfer profiles, WHS indexes & stats
                  </p>
                </div>
                <button
                  onClick={() => exportMembersYaml(members)}
                  className="mt-3 w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3 text-emerald-400" />
                  Download members.yaml
                </button>
              </div>

              {/* teams.yaml */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col justify-between transition-all">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-emerald-400">teams.yaml</span>
                    <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {teams.length} scramble squads (1P, 2P, 3P & 4-man)
                  </p>
                </div>
                <button
                  onClick={() => exportTeamsYaml(teams)}
                  className="mt-3 w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3 text-emerald-400" />
                  Download teams.yaml
                </button>
              </div>

              {/* rounds.yaml */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col justify-between transition-all">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-emerald-400">rounds.yaml</span>
                    <Database className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {completedRounds.length} completed scorecards & differentials
                  </p>
                </div>
                <button
                  onClick={() => exportRoundsYaml(completedRounds)}
                  className="mt-3 w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3 text-emerald-400" />
                  Download rounds.yaml
                </button>
              </div>

              {/* future-rounds.yaml */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col justify-between transition-all">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-emerald-400">future-rounds.yaml</span>
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {futureRounds.length} upcoming muni placeholders & RSVPs
                  </p>
                </div>
                <button
                  onClick={() => exportFutureRoundsYaml(futureRounds)}
                  className="mt-3 w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3 text-emerald-400" />
                  Download future-rounds.yaml
                </button>
              </div>

              {/* Reset to Bundled Defaults */}
              <div className="p-3 bg-slate-950/40 border border-dashed border-slate-800 hover:border-slate-700 rounded-xl flex flex-col justify-between transition-all">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-amber-400">Reset Defaults</span>
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Clear local browser cache and reload original repository YAML
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Reset all club data to the bundled repository YAML files? Any unsaved edits in this browser session will be reverted.')) {
                      onResetToDefaults();
                    }
                  }}
                  className="mt-3 w-full py-1.5 px-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 text-rose-400" />
                  Reset to Repo YAML
                </button>
              </div>
            </div>
          </div>

          {/* Import / Restore Section */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Import / Restore YAML File
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Accepts .yaml or .yml files
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="flex-1 w-full py-3 px-4 border border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl bg-slate-900/60 flex items-center justify-center gap-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Select YAML File from Computer</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".yaml,.yml,text/yaml"
                  onChange={handleFileSelected}
                  className="hidden"
                />
              </label>

              {importStatus.status === 'parsed' && (
                <button
                  onClick={handleApplyImport}
                  className="w-full sm:w-auto px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shrink-0 shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Apply {importStatus.parsedResult?.count} Records
                </button>
              )}
            </div>

            {/* Import Status Alert */}
            {importStatus.message && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2.5 ${
                  importStatus.status === 'error'
                    ? 'bg-rose-950/60 border border-rose-800/60 text-rose-300'
                    : importStatus.status === 'success'
                    ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300'
                    : 'bg-teal-950/60 border border-teal-800/60 text-teal-300'
                }`}
              >
                {importStatus.status === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span>{importStatus.message}</span>
              </div>
            )}
          </div>

          {/* Git Sync Instructions Helper */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-teal-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  How to Commit to Your GitHub Repository
                </h4>
              </div>
              <button
                onClick={handleCopyGitCommands}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedGit ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Commands</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
              <code>{`# 1. Move downloaded YAML files to your data/ folder
mv ~/Downloads/*.yaml data/

# 2. Stage, commit, and push to GitHub
git add data/*.yaml
git commit -m "Update Bay Area Darts clubhouse records"
git push`}</code>
            </pre>
            <p className="text-[11px] text-slate-400 leading-normal">
              Because of your automated GitHub Actions workflow (<code className="text-slate-300 font-mono">.github/workflows/deploy.yml</code>), pushing commits to <code className="text-slate-300 font-mono">main</code> will automatically rebuild and deploy the site to GitHub Pages with your latest club records!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
