import { useState, useEffect } from 'react';
import { FarmMapRecord } from '../types';
import { 
  Calendar, 
  User, 
  FileDown, 
  Trash2, 
  Maximize2, 
  X, 
  Check, 
  Save,
  FileText,
  FileEdit
} from 'lucide-react';
import { ThemeConfig } from '../utils/theme';

interface FarmMapCardProps {
  key?: string;
  mapRecord: FarmMapRecord;
  theme?: ThemeConfig;
  isPdfSentOrDownloaded?: boolean;
  onDownloadSinglePdf: (mapRecord: FarmMapRecord) => void;
  onDelete: (id: string) => void;
  onUpdateMap?: (updatedRecord: FarmMapRecord) => void;
}

export function FarmMapCard({
  mapRecord,
  theme,
  isPdfSentOrDownloaded = false,
  onDownloadSinglePdf,
  onDelete,
  onUpdateMap,
}: FarmMapCardProps) {
  const [showFullImage, setShowFullImage] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [localPdfSent, setLocalPdfSent] = useState(false);
  const isPineapple = mapRecord.cropCategory.includes('Piña');

  // Strip predefined "Operación nocturna en" if present
  const getCleanInitialNotes = (rawNotes?: string) => {
    if (!rawNotes) return '';
    if (rawNotes.trim().startsWith('Operación nocturna')) return '';
    return rawNotes;
  };

  // Inspection notes written by the user
  const [lampNotes, setLampNotes] = useState<string>(() =>
    getCleanInitialNotes(mapRecord.nightInspection?.observations)
  );
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // Sync state if mapRecord changes from storage
  useEffect(() => {
    setLampNotes(getCleanInitialNotes(mapRecord.nightInspection?.observations));
  }, [mapRecord]);

  // Auto-cancel confirmation after 4 seconds
  useEffect(() => {
    if (!isConfirmingDelete) return;
    const timer = setTimeout(() => setIsConfirmingDelete(false), 4000);
    return () => clearTimeout(timer);
  }, [isConfirmingDelete]);

  // Display the sanitized renamed filename based on photo title
  const displayFileName = mapRecord.imageFileName || `${mapRecord.farmName.replace(/\s+/g, '_')}.png`;

  // Save inspection notes to parent & storage
  const handleSaveNotes = () => {
    const updated: FarmMapRecord = {
      ...mapRecord,
      nightInspection: {
        ...mapRecord.nightInspection,
        observations: lampNotes.trim(),
      },
      dayInspection: {
        ...mapRecord.dayInspection,
        observations: lampNotes.trim(),
      },
      updatedAt: Date.now(),
    };
    if (onUpdateMap) {
      onUpdateMap(updated);
    }
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2200);
  };

  return (
    <>
      <div 
        id={`farm-map-card-${mapRecord.id}`}
        className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between"
      >
        <div>
          {/* Header con nombre de finca y categoría */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide truncate" title={mapRecord.farmName}>
              {mapRecord.farmName}
            </h3>
            <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
              isPineapple 
                ? 'bg-amber-100 text-amber-800' 
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {isPineapple ? 'Piña & Banano' : 'Banano'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium mb-3">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {mapRecord.supervisorName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {mapRecord.inspectionDate}
            </span>
          </div>

          {/* Vista previa del Mapa (Imagen) */}
          <div 
            onClick={() => setShowFullImage(true)}
            className="aspect-video bg-slate-100 rounded-lg border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer"
          >
            <img
              src={mapRecord.imageDataUrl}
              alt={`Mapa de ${mapRecord.farmName}`}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-slate-900/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="px-2.5 py-1 rounded-md bg-white/95 text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-xs">
                <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                Ver Foto Completa
              </span>
            </div>

            {/* Badge de archivo tomado de la foto */}
            <span className="absolute bottom-2 left-2 text-[10px] text-slate-700 font-mono bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded border border-slate-200 shadow-2xs truncate max-w-[85%] flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{displayFileName}</span>
            </span>
          </div>

          {/* CUADRO DE ANOTACIONES DE INSPECCIÓN DEBAJO DE LA IMAGEN */}
          <div className="mt-3 p-3 rounded-lg bg-slate-50/90 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <FileEdit className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Anotaciones de la Inspección</span>
              </label>
              {lampNotes.trim().length > 0 && (
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                  Con nota
                </span>
              )}
            </div>

            <textarea
              rows={2}
              value={lampNotes}
              onChange={(e) => setLampNotes(e.target.value)}
              placeholder="Escriba aquí."
              className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-md p-2 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none transition-colors"
            />

            <div className="flex items-center justify-end pt-0.5">
              <button
                type="button"
                onClick={handleSaveNotes}
                className={`w-full py-1.5 rounded-md text-xs font-semibold text-white transition-all flex items-center justify-center gap-1 shadow-2xs ${
                  isSavedFeedback 
                    ? 'bg-emerald-600 hover:bg-emerald-600' 
                    : (theme?.buttonBg || 'bg-blue-600 hover:bg-blue-700')
                }`}
              >
                {isSavedFeedback ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>✓ Almacenado en la memoria</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-white" />
                    <span>Almacenar en la memoria</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Acciones de la Tarjeta (Descargar Ficha PDF y Eliminar con Confirmación en Pantalla) */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            id={`btn-download-pdf-map-${mapRecord.id}`}
            onClick={() => {
              setLocalPdfSent(true);
              onDownloadSinglePdf(mapRecord);
            }}
            className={`flex-1 py-1.5 px-3 rounded-md text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 ${
              (isPdfSentOrDownloaded || localPdfSent)
                ? 'bg-rose-600 hover:bg-rose-700'
                : (theme?.buttonBg || 'bg-blue-600 hover:bg-blue-700')
            }`}
            title={(isPdfSentOrDownloaded || localPdfSent) ? 'PDF enviado / descargado' : 'Crear PDF de esta finca'}
          >
            <FileDown className="w-3.5 h-3.5 text-white" />
            <span>{(isPdfSentOrDownloaded || localPdfSent) ? 'PDF ENVIADO' : 'Crear PDF'}</span>
          </button>

          {isConfirmingDelete ? (
            <div className="flex items-center gap-1 animate-in fade-in duration-100">
              <button
                id={`btn-confirm-delete-${mapRecord.id}`}
                onClick={() => {
                  onDelete(mapRecord.id);
                  setIsConfirmingDelete(false);
                }}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-md shadow-xs transition-colors flex items-center gap-1"
                title="Confirmar eliminación permanente"
              >
                <Trash2 className="w-3.5 h-3.5 text-white" />
                <span>¿Eliminar?</span>
              </button>
              <button
                onClick={() => setIsConfirmingDelete(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Cancelar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id={`btn-delete-map-${mapRecord.id}`}
              onClick={() => setIsConfirmingDelete(true)}
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Eliminar Mapa de la Finca"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Modal de Imagen Completa */}
      {showFullImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowFullImage(false)}
        >
          <div 
            className="bg-white rounded-xl max-w-4xl w-full p-4 space-y-3 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{mapRecord.farmName}</h3>
                <p className="text-xs text-slate-500 font-mono">Archivo: {displayFileName}</p>
              </div>
              <button 
                onClick={() => setShowFullImage(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
              <img 
                src={mapRecord.imageDataUrl} 
                alt={mapRecord.farmName}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

