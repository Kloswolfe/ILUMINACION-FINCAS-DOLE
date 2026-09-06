import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { Supervisor, FarmMapRecord, CropCategory, GeneratedPdfFile } from './types';
import { 
  getSupervisors, 
  saveSupervisor, 
  getFarmMaps, 
  saveFarmMap, 
  saveFarmMapsBulk,
  deleteFarmMap,
  getGeneratedPdfs,
  saveGeneratedPdf,
  deleteGeneratedPdf
} from './services/storage';
import { generateConsolidatedPdf } from './services/pdfGenerator';
import { createFarmMapSvg } from './services/mapTemplates';
import { Navbar } from './components/Navbar';
import { SupervisorModule } from './components/SupervisorModule';
import { FarmMapCard } from './components/FarmMapCard';
import { PdfArchiveModule } from './components/PdfArchiveModule';
import { AddMapModal } from './components/AddMapModal';
import { BatchUploadModal } from './components/BatchUploadModal';
import { AddSupervisorModal } from './components/AddSupervisorModal';
import { ConsolidatedPdfModal } from './components/ConsolidatedPdfModal';
import { getSupervisorTheme } from './utils/theme';
import { 
  UploadCloud, 
  Search, 
  Download, 
  Loader2, 
  MapPin, 
  CheckCircle2,
  Plus,
  Layers,
  FileText
} from 'lucide-react';

export default function App() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [farmMaps, setFarmMaps] = useState<FarmMapRecord[]>([]);
  const [savedPdfs, setSavedPdfs] = useState<GeneratedPdfFile[]>([]);
  const [loading, setLoading] = useState(true);

  // Active filters and views
  const [activeTab, setActiveTab] = useState<'all' | 'supervisors' | 'maps' | 'pdf'>('all');
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | CropCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddMapOpen, setIsAddMapOpen] = useState(false);
  const [isBatchUploadOpen, setIsBatchUploadOpen] = useState(false);
  const [batchPreloadedFiles, setBatchPreloadedFiles] = useState<File[]>([]);
  const [isAddSupervisorOpen, setIsAddSupervisorOpen] = useState(false);
  const [isConsolidatedPdfOpen, setIsConsolidatedPdfOpen] = useState(false);
  const [modalInitialSupervisor, setModalInitialSupervisor] = useState<Supervisor | null>(null);

  // Quick 1-click PDF download loading state
  const [isQuickDownloading, setIsQuickDownloading] = useState(false);
  const [quickNotification, setQuickNotification] = useState<string | null>(null);
  // Track maps whose PDF has been generated/sent during this session (resets to initial state on app exit)
  const [sentPdfMapIds, setSentPdfMapIds] = useState<Set<string>>(new Set());
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const groupDropInputRef = useRef<HTMLInputElement>(null);

  // Active supervisor and dynamic theme (Strict interface separation)
  const activeSupervisorId = selectedSupervisorId || (supervisors.length > 0 ? supervisors[0].id : null);
  const selectedSupervisor = supervisors.find((s) => s.id === activeSupervisorId) || (supervisors.length > 0 ? supervisors[0] : null);
  const currentTheme = getSupervisorTheme(selectedSupervisor?.category);

  // Load persistent data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [loadedSupervisors, loadedMaps, loadedPdfs] = await Promise.all([
          getSupervisors(),
          getFarmMaps(),
          getGeneratedPdfs(),
        ]);
        setSupervisors(loadedSupervisors);
        setFarmMaps(loadedMaps);
        setSavedPdfs(loadedPdfs);
        if (loadedSupervisors.length > 0) {
          setSelectedSupervisorId((prev) => prev || loadedSupervisors[0].id);
        }
      } catch (err) {
        console.error('Error loading initial app data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const notify = (msg: string) => {
    setQuickNotification(msg);
    setTimeout(() => setQuickNotification(null), 3500);
  };

  const handleSaveSupervisor = async (newSup: Supervisor) => {
    const updated = await saveSupervisor(newSup);
    setSupervisors(updated);
    notify(`Supervisor ${newSup.name} añadido con éxito.`);
  };

  const handleSaveFarmMap = async (newMap: FarmMapRecord) => {
    const updated = await saveFarmMap(newMap);
    setFarmMaps(updated);
    notify(`Finca "${newMap.farmName}" guardada y renombrada.`);
  };

  const handleSaveBatchMaps = async (newRecords: FarmMapRecord[]) => {
    const updated = await saveFarmMapsBulk(newRecords);
    setFarmMaps(updated);
    notify(`Grupo de ${newRecords.length} fincas guardadas y renombradas.`);
  };

  const handleDeleteFarmMap = async (id: string) => {
    const updated = await deleteFarmMap(id);
    setFarmMaps(updated);
    notify('Mapa eliminado.');
  };

  const handleDeletePdf = async (id: string) => {
    const updated = await deleteGeneratedPdf(id);
    setSavedPdfs(updated);
    notify('Archivo PDF eliminado del módulo.');
  };

  // 1-Click Fast PDF generation (Zero bureaucracy)
  const handleQuickConsolidatedPdf = async (supervisorId?: string) => {
    const targetSupervisor = supervisorId 
      ? supervisors.find((s) => s.id === supervisorId) 
      : (selectedSupervisorId ? supervisors.find((s) => s.id === selectedSupervisorId) : supervisors[0]);

    if (!targetSupervisor) {
      alert('No se encontró ningún supervisor.');
      return;
    }

    const targetMaps = farmMaps.filter((m) => m.supervisorId === targetSupervisor.id);
    if (targetMaps.length === 0) {
      alert(`No hay mapas registrados para ${targetSupervisor.name}. Sube al menos un mapa.`);
      return;
    }

    setIsQuickDownloading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const nowTime = new Date().toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', hour12: true });
      const result = await generateConsolidatedPdf({
        supervisor: targetSupervisor,
        date: targetMaps[0]?.inspectionDate || today,
        maps: targetMaps,
        notes: `Reporte de iluminación consolidado DOLE - ${targetSupervisor.name}.`,
      });

      // Save to PDF Archive module
      const newPdfFile: GeneratedPdfFile = {
        id: `pdf-quick-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: targetMaps.length === 1 
          ? `Reporte Iluminación - ${targetMaps[0].farmName}` 
          : `Consolidado Iluminación (${targetMaps.length} fincas)`,
        farmName: targetMaps.length === 1 ? targetMaps[0].farmName : `${targetMaps.length} Fincas`,
        supervisorId: targetSupervisor.id,
        supervisorName: targetSupervisor.name,
        cropCategory: targetSupervisor.category,
        date: targetMaps[0]?.inspectionDate || today,
        time: nowTime,
        filename: result.filename,
        pdfDataUrl: result.dataUrl,
        fileSizeBytes: result.blob.size,
        damagedLightsCount: result.totalDamaged,
        createdAt: Date.now(),
      };
      const updatedPdfs = await saveGeneratedPdf(newPdfFile);
      setSavedPdfs(updatedPdfs);

      const a = document.createElement('a');
      a.href = result.url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      notify(`PDF descargado y guardado en el Módulo de Archivos PDF.`);
    } catch (e) {
      console.error('Error generando PDF rápido:', e);
      alert('No se pudo generar el reporte PDF. Por favor intenta de nuevo.');
    } finally {
      setIsQuickDownloading(false);
    }
  };

  // 1-Click Individual farm sheet PDF
  const handleDownloadSinglePdf = async (mapRecord: FarmMapRecord) => {
    const supervisor = supervisors.find((s) => s.id === mapRecord.supervisorId) || {
      id: mapRecord.supervisorId,
      name: mapRecord.supervisorName,
      category: mapRecord.cropCategory,
      employeeCode: 'DOL-SUP-AUTO',
      email: 'supervision@dole.com',
      createdAt: Date.now(),
    };

    try {
      const today = new Date().toISOString().split('T')[0];
      const nowTime = new Date().toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', hour12: true });
      const result = await generateConsolidatedPdf({
        supervisor,
        date: mapRecord.inspectionDate,
        maps: [mapRecord],
        notes: `Ficha técnica de iluminación para ${mapRecord.farmName}.`,
      });

      // Save to PDF Archive module
      const newPdfFile: GeneratedPdfFile = {
        id: `pdf-single-${Date.now()}-${mapRecord.id}`,
        title: `Reporte Iluminación - ${mapRecord.farmName}`,
        farmName: mapRecord.farmName,
        supervisorId: supervisor.id,
        supervisorName: supervisor.name,
        cropCategory: supervisor.category,
        date: mapRecord.inspectionDate || today,
        time: nowTime,
        filename: `Ficha_${mapRecord.farmName.replace(/\s+/g, '_')}_${mapRecord.inspectionDate}.pdf`,
        pdfDataUrl: result.dataUrl,
        fileSizeBytes: result.blob.size,
        damagedLightsCount: mapRecord.nightInspection?.totalDamagedLights ?? 0,
        createdAt: Date.now(),
      };
      const updatedPdfs = await saveGeneratedPdf(newPdfFile);
      setSavedPdfs(updatedPdfs);
      // Mark as sent/downloaded for this session
      setSentPdfMapIds((prev) => new Set(prev).add(mapRecord.id));

      const a = document.createElement('a');
      a.href = result.url;
      a.download = `Ficha_${mapRecord.farmName.replace(/\s+/g, '_')}_${mapRecord.inspectionDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      notify(`Ficha de ${mapRecord.farmName} descargada y guardada en el Módulo de PDFs.`);
    } catch (e) {
      console.error('Error generating single PDF:', e);
      alert('No se pudo generar la ficha técnica.');
    }
  };

  // Group file input handler
  const handleGroupFilesSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length === 1) {
      setModalInitialSupervisor(selectedSupervisor);
      setIsAddMapOpen(true);
    } else {
      setBatchPreloadedFiles(Array.from(files));
      setModalInitialSupervisor(selectedSupervisor);
      setIsBatchUploadOpen(true);
    }
  };

  const handleDropFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const validImages = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (validImages.length === 0) return;

    if (validImages.length === 1) {
      setModalInitialSupervisor(selectedSupervisor);
      setIsAddMapOpen(true);
    } else {
      setBatchPreloadedFiles(validImages);
      setModalInitialSupervisor(selectedSupervisor);
      setIsBatchUploadOpen(true);
    }
  };

  // Open modals with pre-selected supervisor
  const openAddMapForSupervisor = (supervisor: Supervisor) => {
    setModalInitialSupervisor(supervisor);
    setIsAddMapOpen(true);
  };

  const openConsolidatedPdfForSupervisor = (supervisor: Supervisor) => {
    setModalInitialSupervisor(supervisor);
    setIsConsolidatedPdfOpen(true);
  };

  // Filter farm maps: Strictly separated by active supervisor interface!
  const filteredMaps = farmMaps.filter((map) => {
    // STRICT SEPARATION: Only display maps belonging to the active supervisor
    const matchesSupervisor = activeSupervisorId ? map.supervisorId === activeSupervisorId : false;
    const matchesCategory = categoryFilter === 'ALL' ? true : map.cropCategory === categoryFilter;
    const matchesSearch = searchQuery.trim()
      ? map.farmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (map.imageFileName && map.imageFileName.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    return matchesSupervisor && matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-slate-200 transition-colors duration-300">
      {/* Notificación rápida flotante */}
      {quickNotification && (
        <div className="fixed top-16 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{quickNotification}</span>
        </div>
      )}

      {/* Top Fixed Navigation con selector de interfaz y color reactivo */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={currentTheme}
        supervisors={supervisors}
        selectedSupervisorId={activeSupervisorId}
        onSelectSupervisor={(id) => setSelectedSupervisorId(id)}
        selectedSupervisorName={selectedSupervisor?.name}
        onOpenAddMap={() => {
          setModalInitialSupervisor(selectedSupervisor);
          setIsAddMapOpen(true);
        }}
        onOpenBatchUpload={() => {
          setBatchPreloadedFiles([]);
          setModalInitialSupervisor(selectedSupervisor);
          setIsBatchUploadOpen(true);
        }}
        onOpenAddSupervisor={() => setIsAddSupervisorOpen(true)}
        onOpenConsolidatedPdf={() => {
          setModalInitialSupervisor(selectedSupervisor);
          setIsConsolidatedPdfOpen(true);
        }}
        onQuickDownloadPdf={() => handleQuickConsolidatedPdf()}
        isQuickDownloading={isQuickDownloading}
        totalMapsCount={filteredMaps.length}
        totalSupervisorsCount={supervisors.length}
        savedPdfsCount={savedPdfs.length}
        onOpenPdfArchive={() => document.getElementById('pdf-archive-module')?.scrollIntoView({ behavior: 'smooth' })}
      />

      {/* Banner de Interfaz de Supervisor Activo */}
      <section id="hero-section" className={`border-b transition-colors duration-300 py-5 ${currentTheme.primaryLightBg} ${currentTheme.primaryBorder}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${currentTheme.badgeBg}`}>
                  {selectedSupervisor ? `Interfaz de ${selectedSupervisor.name}` : 'División Agrícola DOLE'}
                </span>
                {selectedSupervisor && (
                  <span className="text-xs text-slate-500 font-medium">
                    (Especialidad: {selectedSupervisor.category})
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {selectedSupervisor ? `Interfaz de ${selectedSupervisor.name}` : 'Control de Iluminación de Fincas'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedSupervisor 
                  ? `Gestión exclusiva de luminarias y fincas de ${selectedSupervisor.name}. Cuadros de estatus por foto y consolidación en 1 clic.`
                  : 'Subida de mapas por grupo, estatus de lámparas por foto y consolidación.'}
              </p>
            </div>

            {/* Indicadores clave del Supervisor Activo */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 rounded-lg border border-slate-200/80 shadow-2xs text-xs font-semibold text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{filteredMaps.length} {filteredMaps.length === 1 ? 'Finca asignada' : 'Fincas asignadas'}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 rounded-lg border border-slate-200/80 shadow-2xs text-xs font-semibold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>
                  {filteredMaps.reduce((acc, m) => acc + (m.nightInspection?.totalActiveLights || 0), 0)} Lámparas Activas
                </span>
              </div>
            </div>
          </div>

          {/* Opción compacta y profesional para arrastrar grupo de imágenes */}
          <div
            id="dropzone-group-upload"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingOver(true);
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingOver(false);
              handleDropFiles(e.dataTransfer.files);
            }}
            onClick={() => groupDropInputRef.current?.click()}
            className={`mt-3 py-2 px-3.5 sm:px-4 rounded-xl border border-dashed cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 select-none ${
              isDraggingOver
                ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-400/30'
                : 'bg-white/85 hover:bg-white border-slate-300/90 hover:border-slate-400 shadow-2xs'
            }`}
            title="Haga clic o arrastre aquí archivos de imagen"
          >
            <input
              ref={groupDropInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleGroupFilesSelected}
              className="hidden"
            />
            
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                isDraggingOver ? 'bg-blue-600 text-white' : currentTheme.badgeBg
              }`}>
                <UploadCloud className={`w-3.5 h-3.5 ${isDraggingOver ? 'text-white' : currentTheme.primaryText}`} />
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-xs font-bold text-slate-800 tracking-tight whitespace-nowrap">
                  Arrastra aquí el grupo de imágenes
                </span>
                <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                  • Renombrado automático a partir del nombre de archivo
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-colors ${currentTheme.badgeBg}`}>
                Examinar archivos
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-6 py-6">
        {/* Módulo de Supervisores: cambia el color de la app al seleccionar */}
        <SupervisorModule
          supervisors={supervisors}
          farmMaps={farmMaps}
          selectedSupervisorId={selectedSupervisorId}
          currentTheme={currentTheme}
          onSelectSupervisor={(id) => setSelectedSupervisorId(id)}
          onOpenAddMapForSupervisor={openAddMapForSupervisor}
          onOpenConsolidatedPdfForSupervisor={openConsolidatedPdfForSupervisor}
          onQuickDownloadPdf={handleQuickConsolidatedPdf}
          onOpenAddSupervisor={() => setIsAddSupervisorOpen(true)}
        />

        {/* Sección de Fincas */}
        <section id="mapas-section" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Fincas Registradas ({filteredMaps.length})
              </h2>
              {selectedSupervisor && (
                <p className={`text-xs font-semibold ${currentTheme.primaryText}`}>
                  Filtrado por: {selectedSupervisor.name} ({selectedSupervisor.category})
                </p>
              )}
            </div>

            {/* Filtros simples */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar finca o archivo..."
                  className="pl-7 pr-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                />
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCategoryFilter('ALL')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    categoryFilter === 'ALL'
                      ? `${currentTheme.primaryBg} text-white`
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setCategoryFilter('Fincas de Banano')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    categoryFilter === 'Fincas de Banano'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Banano
                </button>
                <button
                  onClick={() => setCategoryFilter('Fincas de Piñas y banano')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    categoryFilter === 'Fincas de Piñas y banano'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Piña y Banano
                </button>
              </div>
            </div>
          </div>

          {/* Grid de Fincas (Completamente eliminadas las secciones de día/noche y zonas identificadas) */}
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Cargando mapas...
            </div>
          ) : filteredMaps.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2">
              <MapPin className="w-6 h-6 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">
                No hay fincas para mostrar en la interfaz de {selectedSupervisor?.name || 'este supervisor'}
              </p>
              <button
                onClick={() => {
                  setCategoryFilter('ALL');
                  setSearchQuery('');
                }}
                className="px-3 py-1.5 rounded bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Limpiar Búsqueda
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMaps.map((mapRecord) => (
                <FarmMapCard
                  key={mapRecord.id}
                  mapRecord={mapRecord}
                  theme={currentTheme}
                  isPdfSentOrDownloaded={sentPdfMapIds.has(mapRecord.id)}
                  onDownloadSinglePdf={handleDownloadSinglePdf}
                  onDelete={handleDeleteFarmMap}
                  onUpdateMap={handleSaveFarmMap}
                />
              ))}
            </div>
          )}
        </section>

        {/* MÓDULO DE ARCHIVOS PDF GENERADOS CON BOTÓN PARA ENVIAR TODOS JUNTOS */}
        <PdfArchiveModule
          savedPdfs={savedPdfs}
          supervisors={supervisors}
          selectedSupervisorId={activeSupervisorId || undefined}
          theme={currentTheme}
          onDeletePdf={handleDeletePdf}
        />
      </main>

      {/* Footer Minimalista */}
      <footer className="bg-white border-t border-slate-200 py-3 text-slate-400 text-[11px] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DOLE • Control de Iluminación de Fincas</span>
          <span className="flex items-center gap-1 text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Nombre tomado del archivo de cada foto
          </span>
        </div>
      </footer>

      {/* Modales */}
      <AddMapModal
        isOpen={isAddMapOpen}
        onClose={() => setIsAddMapOpen(false)}
        supervisors={supervisors}
        initialSupervisor={modalInitialSupervisor}
        theme={currentTheme}
        onSave={handleSaveFarmMap}
        onSaveBatch={handleSaveBatchMaps}
      />

      <BatchUploadModal
        isOpen={isBatchUploadOpen}
        onClose={() => {
          setIsBatchUploadOpen(false);
          setBatchPreloadedFiles([]);
        }}
        supervisors={supervisors}
        initialSupervisor={modalInitialSupervisor}
        theme={currentTheme}
        preloadedFiles={batchPreloadedFiles}
        onSaveBatch={handleSaveBatchMaps}
      />

      <AddSupervisorModal
        isOpen={isAddSupervisorOpen}
        onClose={() => setIsAddSupervisorOpen(false)}
        onSave={handleSaveSupervisor}
      />

      <ConsolidatedPdfModal
        isOpen={isConsolidatedPdfOpen}
        onClose={() => setIsConsolidatedPdfOpen(false)}
        supervisors={supervisors}
        farmMaps={farmMaps}
        initialSupervisor={modalInitialSupervisor}
        onSavePdfToArchive={async (newPdf) => {
          const updated = await saveGeneratedPdf(newPdf);
          setSavedPdfs(updated);
          notify('Reporte PDF guardado en el módulo de archivos.');
        }}
      />
    </div>
  );
}
