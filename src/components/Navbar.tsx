import { useState } from 'react';
import { 
  Users, 
  MapPin, 
  PlusCircle, 
  Download,
  Loader2, 
  Menu, 
  X,
  Layers,
  UserCheck,
  FileText
} from 'lucide-react';
import { ThemeConfig } from '../utils/theme';
import { Supervisor } from '../types';

interface NavbarProps {
  activeTab: 'all' | 'supervisors' | 'maps' | 'pdf';
  setActiveTab: (tab: 'all' | 'supervisors' | 'maps' | 'pdf') => void;
  theme: ThemeConfig;
  supervisors?: Supervisor[];
  selectedSupervisorId?: string | null;
  onSelectSupervisor?: (id: string) => void;
  selectedSupervisorName?: string | null;
  onOpenAddMap: () => void;
  onOpenBatchUpload: () => void;
  onOpenAddSupervisor: () => void;
  onOpenConsolidatedPdf: () => void;
  onQuickDownloadPdf?: () => void;
  isQuickDownloading?: boolean;
  totalMapsCount: number;
  totalSupervisorsCount: number;
  savedPdfsCount?: number;
  onOpenPdfArchive?: () => void;
}

export function Navbar({
  activeTab,
  setActiveTab,
  theme,
  supervisors = [],
  selectedSupervisorId,
  onSelectSupervisor,
  selectedSupervisorName,
  onOpenAddMap,
  onOpenBatchUpload,
  onOpenAddSupervisor,
  onOpenConsolidatedPdf,
  onQuickDownloadPdf,
  isQuickDownloading = false,
  totalMapsCount,
  totalSupervisorsCount,
  savedPdfsCount = 0,
  onOpenPdfArchive,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string, tab?: 'all' | 'supervisors' | 'maps' | 'pdf') => {
    if (tab) setActiveTab(tab);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Logo y marca DOLE con color dinámico según el supervisor */}
          <div 
            onClick={() => scrollToSection('supervisores-section', 'supervisors')}
            className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
          >
            <div className={`w-8 h-8 rounded-md flex items-center justify-center text-white font-black text-xs shadow-xs transition-colors duration-300 ${theme.primaryBg}`}>
              DOLE
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none">
                  Control de Iluminación
                </h1>
                {selectedSupervisorName && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors ${theme.badgeBg}`}>
                    {selectedSupervisorName}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Interfaces Separadas • Banano & Piña
              </span>
            </div>
          </div>

          {/* Selector de Interfaz Rápido en la Barra Superior (Ronnie vs Jason) */}
          <div className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200/80">
            {supervisors.map((sup) => {
              const isActive = sup.id === selectedSupervisorId;
              const isPineapple = sup.category.includes('Piña');

              return (
                <button
                  key={sup.id}
                  id={`nav-btn-interface-${sup.id}`}
                  onClick={() => onSelectSupervisor && onSelectSupervisor(sup.id)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isActive 
                      ? isPineapple 
                        ? 'bg-amber-600 text-white shadow-xs' 
                        : 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <span>{isPineapple ? '🍍' : '🍌'}</span>
                  <span>Interfaz {sup.name.split(' ')[0]}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Acciones directas */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              id="header-btn-upload-maps"
              onClick={onOpenBatchUpload}
              className={`px-3 py-1.5 rounded-md text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 ${theme.buttonBg}`}
              title="Subir imágenes de mapas (individual o grupo)"
            >
              <Layers className="w-3.5 h-3.5 text-white" />
              <span>Subir Mapas</span>
            </button>

            {/* Botón Módulo de Archivos PDF */}
            <button
              id="header-btn-archive-pdfs"
              onClick={() => {
                if (onOpenPdfArchive) {
                  onOpenPdfArchive();
                } else {
                  document.getElementById('pdf-archive-module')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="px-2.5 py-1.5 rounded-md border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-900 text-xs font-semibold transition-colors flex items-center gap-1.5"
              title="Ir al módulo de archivos PDF generados"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Módulo PDFs</span>
              {savedPdfsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                  {savedPdfsCount}
                </span>
              )}
            </button>

            {/* Descarga en 1 clic */}
            <button
              id="header-btn-consolidated-pdf"
              disabled={isQuickDownloading}
              onClick={() => {
                if (onQuickDownloadPdf) {
                  onQuickDownloadPdf();
                } else {
                  onOpenConsolidatedPdf();
                }
              }}
              className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-md shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              title="Descargar reporte consolidado en PDF de este supervisor"
            >
              {isQuickDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-300" />
                  <span>Generando...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-slate-300" />
                  <span>PDF Consolidado</span>
                </>
              )}
            </button>
          </div>

          {/* Menú móvil */}
          <div className="flex sm:hidden items-center gap-1.5">
            <button
              onClick={() => {
                if (onOpenPdfArchive) {
                  onOpenPdfArchive();
                } else {
                  document.getElementById('pdf-archive-module')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="p-1.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-xs relative"
              title="Módulo PDFs"
            >
              <FileText className="w-4 h-4" />
              {savedPdfsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {savedPdfsCount}
                </span>
              )}
            </button>
            <button
              onClick={onOpenBatchUpload}
              className={`p-1.5 rounded-md text-white text-xs ${theme.primaryBg}`}
              title="Subir Grupo"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (onQuickDownloadPdf) onQuickDownloadPdf();
                else onOpenConsolidatedPdf();
              }}
              className="p-1.5 rounded-md bg-slate-900 text-white text-xs"
              title="Descargar PDF"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú desplegable móvil */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Cambiar de Interfaz de Supervisor:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {supervisors.map((sup) => {
                const isActive = sup.id === selectedSupervisorId;
                const isPineapple = sup.category.includes('Piña');
                return (
                  <button
                    key={sup.id}
                    onClick={() => {
                      if (onSelectSupervisor) onSelectSupervisor(sup.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold text-left flex items-center gap-2 border ${
                      isActive 
                        ? isPineapple ? 'bg-amber-600 text-white border-amber-700' : 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{isPineapple ? '🍍' : '🍌'}</span>
                    <span className="truncate">{sup.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBatchUpload();
              }}
              className={`flex-1 py-2 text-white text-xs font-semibold rounded ${theme.buttonBg}`}
            >
              + Subir Grupo
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onQuickDownloadPdf) onQuickDownloadPdf();
                else onOpenConsolidatedPdf();
              }}
              className="flex-1 py-2 bg-slate-900 text-white text-xs font-semibold rounded"
            >
              PDF Consolidado
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

