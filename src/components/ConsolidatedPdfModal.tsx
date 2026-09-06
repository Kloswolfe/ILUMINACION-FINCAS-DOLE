import { useState, useEffect } from 'react';
import { Supervisor, FarmMapRecord, GeneratedPdfFile } from '../types';
import { generateConsolidatedPdf } from '../services/pdfGenerator';
import { 
  X, 
  FileText, 
  Download, 
  Share2, 
  Calendar, 
  User, 
  CheckSquare, 
  Square, 
  Sparkles, 
  Loader2, 
  Check, 
  Eye
} from 'lucide-react';

interface ConsolidatedPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  supervisors: Supervisor[];
  farmMaps: FarmMapRecord[];
  initialSupervisor?: Supervisor | null;
  onSavePdfToArchive?: (pdf: GeneratedPdfFile) => void;
}

export function ConsolidatedPdfModal({
  isOpen,
  onClose,
  supervisors,
  farmMaps,
  initialSupervisor,
  onSavePdfToArchive,
}: ConsolidatedPdfModalProps) {
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>(
    initialSupervisor?.id || supervisors[0]?.id || ''
  );

  const currentSupervisor = supervisors.find((s) => s.id === selectedSupervisorId) || supervisors[0];

  // Available dates for this supervisor
  const supervisorMaps = farmMaps.filter((m) => m.supervisorId === selectedSupervisorId);
  const uniqueDates = Array.from(new Set(supervisorMaps.map((m) => m.inspectionDate))).sort().reverse();

  const [selectedDate, setSelectedDate] = useState<string>(
    uniqueDates[0] || new Date().toISOString().split('T')[0]
  );

  // Filtered maps
  const dateMaps = supervisorMaps.filter((m) => m.inspectionDate === selectedDate);
  const [selectedMapIds, setSelectedMapIds] = useState<string[]>([]);

  // Notes to add
  const [reportNotes, setReportNotes] = useState('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [generatedFilename, setGeneratedFilename] = useState<string>('');
  const [shareSuccess, setShareSuccess] = useState(false);

  // Sync selected map IDs whenever supervisor or date changes
  useEffect(() => {
    if (dateMaps.length > 0) {
      setSelectedMapIds(dateMaps.map((m) => m.id));
    } else {
      // If no maps for this date, select all maps for this supervisor
      setSelectedMapIds(supervisorMaps.map((m) => m.id));
    }
    setGeneratedPdfUrl(null);
  }, [selectedSupervisorId, selectedDate, farmMaps]);

  if (!isOpen) return null;

  const toggleSelectMap = (id: string) => {
    if (selectedMapIds.includes(id)) {
      setSelectedMapIds(selectedMapIds.filter((mid) => mid !== id));
    } else {
      setSelectedMapIds([...selectedMapIds, id]);
    }
  };

  const selectAll = () => {
    const targetMaps = dateMaps.length > 0 ? dateMaps : supervisorMaps;
    setSelectedMapIds(targetMaps.map((m) => m.id));
  };

  const deselectAll = () => {
    setSelectedMapIds([]);
  };

  const mapsToInclude = farmMaps.filter((m) => selectedMapIds.includes(m.id));

  const handleGeneratePdf = async () => {
    if (!currentSupervisor || mapsToInclude.length === 0) return;

    setIsGenerating(true);
    try {
      const result = await generateConsolidatedPdf({
        supervisor: currentSupervisor,
        date: selectedDate,
        maps: mapsToInclude,
        notes: reportNotes.trim() || undefined,
      });

      setGeneratedPdfUrl(result.url);
      setGeneratedFilename(result.filename);

      // Save to PDF Archive module
      if (onSavePdfToArchive) {
        const nowTime = new Date().toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', hour12: true });
        onSavePdfToArchive({
          id: `pdf-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: mapsToInclude.length === 1 
            ? `Reporte Iluminación - ${mapsToInclude[0].farmName}` 
            : `Consolidado Iluminación (${mapsToInclude.length} fincas)`,
          farmName: mapsToInclude.length === 1 ? mapsToInclude[0].farmName : `${mapsToInclude.length} Fincas`,
          supervisorId: currentSupervisor.id,
          supervisorName: currentSupervisor.name,
          cropCategory: currentSupervisor.category,
          date: selectedDate,
          time: nowTime,
          filename: result.filename,
          pdfDataUrl: result.dataUrl,
          fileSizeBytes: result.blob.size,
          damagedLightsCount: result.totalDamaged,
          createdAt: Date.now(),
        });
      }

      // Auto download for instant 1-click outcome without bureaucracy
      const a = document.createElement('a');
      a.href = result.url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error generating consolidated PDF:', err);
      alert('Error al generar el PDF consolidado. Por favor intenta de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedPdfUrl) return;
    const a = document.createElement('a');
    a.href = generatedPdfUrl;
    a.download = generatedFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    const title = `Reporte Consolidado de Iluminación DOLE - ${currentSupervisor.name}`;
    const text = `Reporte de iluminación consolidado para ${currentSupervisor.name} (${currentSupervisor.category}) con fecha ${selectedDate}. Total fincas auditadas: ${mapsToInclude.length}.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: window.location.href,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } catch (err) {
        // user dismissed
      }
    } else {
      // Fallback: Mailto link for sending PDF report info
      const mailto = `mailto:gerencia.agricola@dole.com?subject=${encodeURIComponent(
        title
      )}&body=${encodeURIComponent(text + '\n\nGenerado desde la plataforma de Control de Iluminación DOLE.')}`;
      window.open(mailto, '_blank');
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-modal-title"
        className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 id="pdf-modal-title" className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
                Generador de Reporte PDF Consolidado
              </h3>
              <p className="text-xs text-slate-500">
                Consolida el cúmulo de mapas por supervisor y fecha para revisión gerencial.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal de reporte consolidado"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Controls: Supervisor and Date Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Supervisor a Reportar *
              </label>
              <select
                value={selectedSupervisorId}
                onChange={(e) => {
                  setSelectedSupervisorId(e.target.value);
                  setGeneratedPdfUrl(null);
                }}
                className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-600 outline-none"
              >
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.category} ({s.employeeCode})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {currentSupervisor?.category} • {supervisorMaps.length} mapas registrados
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Fecha de Inspección Consolidada *
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setGeneratedPdfUrl(null);
                }}
                className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-600 outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                {dateMaps.length} mapas encontrados exactamente para esta fecha.
              </span>
            </div>
          </div>

          {/* Selection of Maps */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Cúmulo de Mapas a Incluir en el PDF ({mapsToInclude.length} seleccionados):
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-[11px] font-bold text-[#003865] hover:underline"
                >
                  Seleccionar Todos
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-[11px] font-bold text-slate-500 hover:underline"
                >
                  Deseleccionar
                </button>
              </div>
            </div>

            {supervisorMaps.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                Este supervisor no tiene mapas registrados todavía. Sube un mapa primero.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto p-1">
                {supervisorMaps.map((mapItem) => {
                  const isChecked = selectedMapIds.includes(mapItem.id);
                  const isSameDate = mapItem.inspectionDate === selectedDate;

                  return (
                    <div
                      key={mapItem.id}
                      onClick={() => toggleSelectMap(mapItem.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-400/30'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          className="text-blue-700"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-blue-700" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-blue-900 truncate">
                              {mapItem.farmName}
                            </span>
                            {isSameDate && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                                Fecha coincidente
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block">
                            {mapItem.cropCategory} • {mapItem.inspectionDate}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 text-[11px]">
                        <span className="font-bold text-emerald-700">
                          {mapItem.nightInspection.coveragePercentage}%
                        </span>
                        <span className="text-slate-400 block text-[10px]">
                          {mapItem.nightInspection.totalActiveLights} operativas
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes for Management */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Directrices u Observaciones para la Revisión Gerencial (Opcional):
            </label>
            <textarea
              rows={2}
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              placeholder="Ej: Se solicita aprobación para compra de 15 bombillas LED de 150W para sustitución prioritaria en empacadoras..."
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-[#003865]/20 placeholder:text-slate-400"
            />
          </div>

          {/* Professional Format Note */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Estructura del PDF Generado:</span> Carátula con resumen ejecutivo gerencial, seguido de fichas técnicas individuales por finca con{' '}
              <strong>dos cuadros de información intercalados entre Día y Noche</strong> y espacios para firmas oficiales.
            </div>
          </div>

          {/* Live PDF Preview if Generated */}
          {generatedPdfUrl && (
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-extrabold text-emerald-900">
                    PDF Generado con Éxito: {generatedFilename}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {mapsToInclude.length + 1} páginas en formato A4
                </span>
              </div>

              {/* Embedded PDF iframe */}
              <div className="w-full h-80 rounded-xl border border-slate-300 overflow-hidden bg-slate-100 shadow-inner">
                <iframe
                  src={`${generatedPdfUrl}#toolbar=0`}
                  title="Vista Previa PDF Consolidado"
                  className="w-full h-full border-none"
                />
              </div>

              {/* Action Buttons for Download and Share */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    Descargar Archivo PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="px-4 py-2 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Share2 className="w-4 h-4 text-slate-600" />
                    {shareSuccess ? '¡Enlace Listo!' : 'Compartir / Enviar'}
                  </button>
                </div>

                <a
                  href={generatedPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Abrir en pestaña completa
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
          >
            Cerrar
          </button>

          <button
            type="button"
            disabled={isGenerating || mapsToInclude.length === 0}
            onClick={handleGeneratePdf}
            className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-200" />
                <span>Generando Documento Consolidado...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-blue-200" />
                <span>
                  {generatedPdfUrl ? 'Volver a Descargar PDF' : 'Generar y Descargar PDF (1 Clic)'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
