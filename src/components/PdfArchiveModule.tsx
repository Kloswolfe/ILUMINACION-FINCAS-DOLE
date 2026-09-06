import { useState } from 'react';
import { GeneratedPdfFile, Supervisor } from '../types';
import { 
  FileText, 
  Share2, 
  Download, 
  Trash2, 
  Calendar, 
  Clock, 
  User, 
  AlertTriangle, 
  Archive, 
  Loader2, 
  CheckCircle2, 
  Send,
  ExternalLink,
  PackageCheck,
  X
} from 'lucide-react';
import JSZip from 'jszip';
import { ThemeConfig } from '../utils/theme';

interface PdfArchiveModuleProps {
  savedPdfs: GeneratedPdfFile[];
  supervisors: Supervisor[];
  selectedSupervisorId?: string;
  theme?: ThemeConfig;
  onDeletePdf: (id: string) => void;
  onRefreshPdfs?: () => void;
}

export function PdfArchiveModule({
  savedPdfs,
  supervisors,
  selectedSupervisorId,
  theme,
  onDeletePdf,
}: PdfArchiveModuleProps) {
  const [isSharingAll, setIsSharingAll] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>(selectedSupervisorId || 'all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filter PDFs according to selected supervisor tab if not 'all'
  const filteredPdfs = savedPdfs.filter((pdf) => {
    if (activeFilter === 'all') return true;
    return pdf.supervisorId === activeFilter;
  });

  // Convert Base64/DataURL to Blob
  const dataUrlToBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // Descarga directa de todos los PDFs juntos en un solo archivo comprimido
  const handleDownloadAllTogether = async () => {
    const pdfsToDownload = filteredPdfs.length > 0 ? filteredPdfs : savedPdfs;

    if (pdfsToDownload.length === 0) {
      alert('No hay archivos PDF generados todavía para descargar.');
      return;
    }

    setIsDownloadingAll(true);
    setShareStatus('Empaquetando todos los archivos PDF en un archivo de descarga...');

    try {
      const zip = new JSZip();

      for (const item of pdfsToDownload) {
        const blob = dataUrlToBlob(item.pdfDataUrl);
        zip.file(item.filename, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const todayStr = new Date().toISOString().split('T')[0];
      const zipFilename = `Reportes_Iluminacion_DOLE_${todayStr}.zip`;

      const zipUrl = URL.createObjectURL(zipBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = zipUrl;
      downloadLink.download = zipFilename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(zipUrl);

      setShareStatus(`¡Se descargaron con éxito los ${pdfsToDownload.length} reportes PDF juntos (${zipFilename})!`);
      setTimeout(() => setShareStatus(null), 4000);
    } catch (err: any) {
      console.error('Error al descargar todos los PDFs:', err);
      setShareStatus('Error al descargar los reportes: ' + (err.message || 'Error'));
      setTimeout(() => setShareStatus(null), 4000);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // Helper: Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'PDF Oficial';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 1. Single Download Action
  const handleDownloadSingle = (pdf: GeneratedPdfFile) => {
    const link = document.createElement('a');
    link.href = pdf.pdfDataUrl;
    link.download = pdf.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Single Share Action
  const handleShareSingle = async (pdf: GeneratedPdfFile) => {
    try {
      const blob = dataUrlToBlob(pdf.pdfDataUrl);
      const file = new File([blob], pdf.filename, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: pdf.title,
          text: `Reporte de iluminación de ${pdf.farmName} (${pdf.supervisorName})`,
          files: [file],
        });
      } else if (navigator.share) {
        await navigator.share({
          title: pdf.title,
          text: `Reporte de iluminación: ${pdf.title} - Supervisor: ${pdf.supervisorName}, Lámparas dañadas: ${pdf.damagedLightsCount}`,
        });
      } else {
        handleDownloadSingle(pdf);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error al compartir archivo PDF:', err);
        handleDownloadSingle(pdf);
      }
    }
  };

  // 3. "ENVIAR TODOS JUNTOS" (Native Share Menu on Phone / Computer)
  const handleSendAllTogether = async () => {
    const pdfsToSend = filteredPdfs.length > 0 ? filteredPdfs : savedPdfs;

    if (pdfsToSend.length === 0) {
      alert('No hay archivos PDF generados todavía. Genere un reporte para poder enviarlo.');
      return;
    }

    setIsSharingAll(true);
    setShareStatus('Preparando archivos para el menú de envío...');

    try {
      const files: File[] = [];

      for (const item of pdfsToSend) {
        const blob = dataUrlToBlob(item.pdfDataUrl);
        const file = new File([blob], item.filename, { type: 'application/pdf' });
        files.push(file);
      }

      // Check if the device / browser supports native file sharing
      const canShareFiles = typeof navigator !== 'undefined' && 
                            navigator.canShare && 
                            navigator.canShare({ files });

      if (canShareFiles) {
        setShareStatus('Abriendo menú de envío del dispositivo...');
        await navigator.share({
          title: 'Reportes de Iluminación - Fincas DOLE',
          text: `Adjunto ${files.length} reporte(s) oficial(es) de inspección de iluminación DOLE.`,
          files: files,
        });
        setShareStatus('¡Archivos compartidos con éxito!');
        setTimeout(() => setShareStatus(null), 3000);
      } else {
        // Fallback: Si el navegador de la computadora no soporta compartir múltiples archivos directamente,
        // empaquetamos todos en un ZIP descargable y ofrecemos el menú nativo de texto o descarga directa.
        setShareStatus('Empaquetando PDFs en archivo ZIP para su envío...');
        const zip = new JSZip();
        
        for (const item of pdfsToSend) {
          const blob = dataUrlToBlob(item.pdfDataUrl);
          zip.file(item.filename, blob);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const zipFile = new File([zipBlob], `Reportes_Iluminacion_DOLE_${new Date().toISOString().split('T')[0]}.zip`, {
          type: 'application/zip',
        });

        // Intentar compartir el archivo ZIP si es soportado
        if (navigator.canShare && navigator.canShare({ files: [zipFile] })) {
          await navigator.share({
            title: 'Reportes de Iluminación DOLE (ZIP)',
            text: `Paquete con ${files.length} reportes PDF de iluminación de fincas.`,
            files: [zipFile],
          });
          setShareStatus('¡Paquete compartido con éxito!');
        } else if (navigator.share) {
          // Compartir texto y descargar zip
          const zipUrl = URL.createObjectURL(zipBlob);
          const downloadLink = document.createElement('a');
          downloadLink.href = zipUrl;
          downloadLink.download = zipFile.name;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);

          await navigator.share({
            title: 'Reportes de Iluminación DOLE',
            text: `Se han generado ${files.length} reportes de iluminación de fincas.`,
          });
          setShareStatus('Descarga completada y menú de envío abierto.');
        } else {
          // Descarga directa del zip
          const zipUrl = URL.createObjectURL(zipBlob);
          const downloadLink = document.createElement('a');
          downloadLink.href = zipUrl;
          downloadLink.download = zipFile.name;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          setShareStatus(`Se han descargado los ${files.length} reportes en un solo archivo ZIP.`);
        }

        setTimeout(() => setShareStatus(null), 4000);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error al enviar los archivos:', err);
        setShareStatus('No se pudo abrir el menú de envío: ' + (err.message || 'error desconocido'));
        setTimeout(() => setShareStatus(null), 4000);
      } else {
        setShareStatus(null);
      }
    } finally {
      setIsSharingAll(false);
    }
  };

  return (
    <section 
      id="pdf-archive-module"
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4"
    >
      {/* Cabecera del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Módulo de Archivos PDF Generados
              </h2>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {savedPdfs.length} {savedPdfs.length === 1 ? 'Reporte' : 'Reportes'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Historial de reportes PDF listos para descarga y envío por celular o computadora
            </p>
          </div>
        </div>

        {/* BOTONES PRINCIPALES: DESCARGAR TODOS JUNTOS Y ENVIAR TODOS JUNTOS */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="btn-download-all-pdfs"
            disabled={isDownloadingAll || filteredPdfs.length === 0}
            onClick={handleDownloadAllTogether}
            className="px-4 py-2 rounded-xl text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
            title="Descargar todos los reportes PDF generados juntos en un solo archivo"
          >
            {isDownloadingAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Descargando...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-white" />
                <span>Descargar Todos los PDF Juntos ({filteredPdfs.length})</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="btn-send-all-pdfs"
            disabled={isSharingAll || filteredPdfs.length === 0}
            onClick={handleSendAllTogether}
            className={`px-4 py-2 rounded-xl text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 ${
              theme?.buttonBg || 'bg-blue-600 hover:bg-blue-700'
            }`}
            title="Abre el menú de envío nativo de su celular o computadora para compartir todos los PDFs generados"
          >
            {isSharingAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-white" />
                <span>Enviar Todos Juntos ({filteredPdfs.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mensaje de estado al compartir */}
      {shareStatus && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{shareStatus}</span>
        </div>
      )}

      {/* Filtro por Supervisor */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold text-slate-500 mr-1">Filtrar por:</span>
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todos ({savedPdfs.length})
          </button>

          {supervisors.map((sup) => {
            const count = savedPdfs.filter((p) => p.supervisorId === sup.id).length;
            const isActive = activeFilter === sup.id;
            return (
              <button
                key={sup.id}
                type="button"
                onClick={() => setActiveFilter(sup.id)}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{sup.name.split(' ')[0]}</span>
                <span className="opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          Muestra título, fecha, hora, supervisor y mapa de la finca
        </span>
      </div>

      {/* Listado de Archivos PDF */}
      {filteredPdfs.length === 0 ? (
        <div className="p-8 rounded-xl border border-dashed border-slate-200 text-center space-y-2 bg-slate-50/50">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No hay archivos PDF en este módulo todavía</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Haga clic en <strong>"Generar PDF"</strong> o <strong>"Descargar PDF"</strong> en las tarjetas de mapa para que se guarden automáticamente aquí y pueda enviarlos todos juntos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPdfs.map((pdf) => (
            <div
              key={pdf.id}
              id={`pdf-file-card-${pdf.id}`}
              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                {/* Cabecera de la tarjeta con icono de PDF y botón eliminar */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1" title={pdf.title}>
                        {pdf.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatFileSize(pdf.fileSizeBytes)}
                      </span>
                    </div>
                  </div>

                  {confirmDeleteId === pdf.id ? (
                    <div className="flex items-center gap-1 animate-in fade-in">
                      <button
                        type="button"
                        onClick={() => {
                          onDeletePdf(pdf.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded shadow-xs transition-colors"
                        title="Confirmar eliminación"
                      >
                        ¿Eliminar?
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="p-1 text-slate-400 hover:text-slate-600 text-[10px]"
                        title="Cancelar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(pdf.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Eliminar PDF del archivo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Metadatos: Supervisor, Fecha, Hora */}
                <div className="space-y-1 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">{pdf.supervisorName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                      {pdf.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      {pdf.time}
                    </span>
                  </div>
                </div>

                {/* Finca y Categoría */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-slate-700 truncate max-w-[170px]" title={pdf.farmName}>
                    {pdf.farmName}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {pdf.cropCategory.includes('Piña') ? 'Piña & Banano' : 'Banano'}
                  </span>
                </div>
              </div>

              {/* Botones de acción individual */}
              <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDownloadSingle(pdf)}
                  className="px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  title="Descargar archivo PDF"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Descargar</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShareSingle(pdf)}
                  className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  title="Abrir menú de envío de este archivo"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-300" />
                  <span>Compartir</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
