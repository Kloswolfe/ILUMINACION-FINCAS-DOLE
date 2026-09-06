import { get, set } from 'idb-keyval';
import { Supervisor, FarmMapRecord, GeneratedPdfFile } from '../types';
import { createFarmMapSvg } from './mapTemplates';

const SUPERVISORS_KEY = 'dole_supervisors_v1';
const FARM_MAPS_KEY = 'dole_farm_maps_v1';
const FARM_MAPS_BACKUP_KEY = 'dole_farm_maps_backup_v1';
const FARM_MAPS_INITIALIZED_KEY = 'dole_farm_maps_initialized_v1';
const GENERATED_PDFS_KEY = 'dole_generated_pdfs_v1';

// Default initial supervisors requested by user:
// Ronnie Flores: Fincas de banano
// Jason Cruz: Fincas de banano y Piña
const INITIAL_SUPERVISORS: Supervisor[] = [
  {
    id: 'sup-ronnie-flores',
    name: 'Ronnie Flores',
    category: 'Fincas de Banano',
    employeeCode: 'DOL-SUP-0142',
    email: 'rflores@dole.com',
    phone: '+504 9876-1234',
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'sup-jason-cruz',
    name: 'Jason Cruz',
    category: 'Fincas de Piñas y banano',
    employeeCode: 'DOL-SUP-0189',
    email: 'jcruz@dole.com',
    phone: '+504 9543-7890',
    createdAt: Date.now() - 86400000 * 8,
  },
];

const INITIAL_MAPS: FarmMapRecord[] = [
  {
    id: 'map-santa-ines',
    supervisorId: 'sup-ronnie-flores',
    supervisorName: 'Ronnie Flores',
    farmName: 'Finca Santa Inés',
    extractedRawText: 'FINCA SANTA INÉS (AZUL)',
    cropCategory: 'Fincas de Banano',
    inspectionDate: '2026-09-04',
    imageDataUrl: createFarmMapSvg('Finca Santa Inés', 'Banano', 28, 4),
    imageFileName: 'mapa_finca_santa_ines.png',
    zones: ['Empacadora Central', 'Lotes Banano 01-14', 'Área de Cablevía', 'Andén de Desembarque'],
    dayInspection: {
      totalInspectedPoles: 32,
      physicalCondition: 'Bueno',
      photocellsStatus: 'Operativas',
      daytimeLightsOnAnomaly: 1,
      wiringCondition: 'Óptimo',
      observations: 'Postes en buen estado estructural. Se detectó 1 fotocelda atascada en el andén secundario que mantiene la luz encendida de día.',
    },
    nightInspection: {
      totalActiveLights: 28,
      totalDamagedLights: 4,
      coveragePercentage: 87.5,
      darkZonesDetected: ['Extremo Sur Cablevía 3', 'Bodega de Materiales'],
      urgencyLevel: 'Media',
      observations: 'Iluminación adecuada en planta empacadora. Urge sustituir 4 bombillas LED de 150W en cablevía sur para seguridad en jornada nocturna.',
    },
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'map-monterrey',
    supervisorId: 'sup-ronnie-flores',
    supervisorName: 'Ronnie Flores',
    farmName: 'Finca Monterrey',
    extractedRawText: 'FINCA MONTERREY (AZUL)',
    cropCategory: 'Fincas de Banano',
    inspectionDate: '2026-09-04',
    imageDataUrl: createFarmMapSvg('Finca Monterrey', 'Banano', 35, 2),
    imageFileName: 'mapa_finca_monterrey.png',
    zones: ['Dársena Principal', 'Planta Clúster', 'Taller Mecánico', 'Lotes Banano Sector Norte'],
    dayInspection: {
      totalInspectedPoles: 37,
      physicalCondition: 'Excelente',
      photocellsStatus: 'Operativas',
      daytimeLightsOnAnomaly: 0,
      wiringCondition: 'Óptimo',
      observations: 'Revisión física completa. Fotoceldas calibradas correctamente y cableado subterráneo sin anomalías.',
    },
    nightInspection: {
      totalActiveLights: 35,
      totalDamagedLights: 2,
      coveragePercentage: 94.6,
      darkZonesDetected: ['Perímetro Taller Posterior'],
      urgencyLevel: 'Baja',
      observations: 'Excelente nivel de lux en áreas de empaque y báscula. 2 luminarias por sustitución preventiva en taller.',
    },
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'map-los-diamantes',
    supervisorId: 'sup-jason-cruz',
    supervisorName: 'Jason Cruz',
    farmName: 'Finca Los Diamantes',
    extractedRawText: 'FINCA LOS DIAMANTES (AZUL)',
    cropCategory: 'Fincas de Piñas y banano',
    inspectionDate: '2026-09-04',
    imageDataUrl: createFarmMapSvg('Finca Los Diamantes', 'Piña y Banano', 42, 6),
    imageFileName: 'mapa_finca_diamantes.png',
    zones: ['Empacadora de Piña', 'Bloque Bananero', 'Hangar de Riego', 'Control de Acceso'],
    dayInspection: {
      totalInspectedPoles: 48,
      physicalCondition: 'Bueno',
      photocellsStatus: 'Con Fallas',
      daytimeLightsOnAnomaly: 3,
      wiringCondition: 'Mantenimiento Requerido',
      observations: 'Se observó sulfatación en dos cajas de registro en el hangar de riego y tres reflectores encendidos en horas del mediodía.',
    },
    nightInspection: {
      totalActiveLights: 42,
      totalDamagedLights: 6,
      coveragePercentage: 87.5,
      darkZonesDetected: ['Báscula de Camiones de Piña', 'Perímetro Este Bloque Banano'],
      urgencyLevel: 'Alta',
      observations: 'Requiere atención urgente en báscula de camiones; la visibilidad es crítica para maniobras de carga nocturna de fruta.',
    },
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'map-el-paraiso',
    supervisorId: 'sup-jason-cruz',
    supervisorName: 'Jason Cruz',
    farmName: 'Finca El Paraíso',
    extractedRawText: 'FINCA EL PARAÍSO (AZUL)',
    cropCategory: 'Fincas de Piñas y banano',
    inspectionDate: '2026-09-04',
    imageDataUrl: createFarmMapSvg('Finca El Paraíso', 'Piña y Banano', 38, 3),
    imageFileName: 'mapa_finca_paraiso.png',
    zones: ['Patios de Carga Piña', 'Área de Lavado', 'Lotes Banano A y B', 'Oficina Técnica'],
    dayInspection: {
      totalInspectedPoles: 41,
      physicalCondition: 'Excelente',
      photocellsStatus: 'Operativas',
      daytimeLightsOnAnomaly: 0,
      wiringCondition: 'Óptimo',
      observations: 'Todos los postes pintados y numerados. Sin cables expuestos. Sensores automáticos calibrados a 50 lux.',
    },
    nightInspection: {
      totalActiveLights: 38,
      totalDamagedLights: 3,
      coveragePercentage: 92.7,
      darkZonesDetected: ['Zona de Compostaje'],
      urgencyLevel: 'Baja',
      observations: 'Condiciones óptimas en áreas operativas clave. Se programó cambio de 3 reflectores en zona secundaria.',
    },
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1,
  },
];

export async function getSupervisors(): Promise<Supervisor[]> {
  try {
    const stored = await get<Supervisor[]>(SUPERVISORS_KEY);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    // Fallback to localStorage check
    const local = localStorage.getItem(SUPERVISORS_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        await set(SUPERVISORS_KEY, parsed);
        return parsed;
      }
    }
    // Initialize with default supervisors
    await set(SUPERVISORS_KEY, INITIAL_SUPERVISORS);
    localStorage.setItem(SUPERVISORS_KEY, JSON.stringify(INITIAL_SUPERVISORS));
    return INITIAL_SUPERVISORS;
  } catch (err) {
    console.error('Error fetching supervisors from storage:', err);
    return INITIAL_SUPERVISORS;
  }
}

export async function saveSupervisor(supervisor: Supervisor): Promise<Supervisor[]> {
  const current = await getSupervisors();
  const existingIdx = current.findIndex((s) => s.id === supervisor.id);
  let updated: Supervisor[];

  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = supervisor;
  } else {
    updated = [...current, supervisor];
  }

  await set(SUPERVISORS_KEY, updated);
  try {
    localStorage.setItem(SUPERVISORS_KEY, JSON.stringify(updated));
  } catch (e) {
    // ignore quota exceeded if any
  }
  return updated;
}

export async function deleteSupervisor(id: string): Promise<Supervisor[]> {
  const current = await getSupervisors();
  const updated = current.filter((s) => s.id !== id);
  await set(SUPERVISORS_KEY, updated);
  try {
    localStorage.setItem(SUPERVISORS_KEY, JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

function saveMapsBackupToLocalStorage(maps: FarmMapRecord[]) {
  try {
    localStorage.setItem(FARM_MAPS_INITIALIZED_KEY, 'true');
    localStorage.setItem(FARM_MAPS_BACKUP_KEY, JSON.stringify(maps));
  } catch (e) {
    // If full data exceeds localStorage quota, save without heavy base64 as safety mirror
    try {
      const lightweight = maps.map((m) => ({
        ...m,
        imageDataUrl: m.imageDataUrl.startsWith('data:image/svg') ? m.imageDataUrl : '',
      }));
      localStorage.setItem(FARM_MAPS_BACKUP_KEY, JSON.stringify(lightweight));
    } catch (e2) {}
  }
}

export async function getFarmMaps(): Promise<FarmMapRecord[]> {
  try {
    // 1. Check primary persistent IndexedDB storage
    const stored = await get<FarmMapRecord[]>(FARM_MAPS_KEY);
    if (stored !== undefined && Array.isArray(stored)) {
      // If found in IndexedDB, ensure backup is also updated
      saveMapsBackupToLocalStorage(stored);
      return stored;
    }

    // 2. Check localStorage backup if IndexedDB returned undefined
    try {
      const local = localStorage.getItem(FARM_MAPS_BACKUP_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          // Re-sync to IndexedDB
          await set(FARM_MAPS_KEY, parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.warn('LocalStorage backup read error:', e);
    }

    // 3. Check if previously initialized (never wipe user changes on reload)
    const isInitialized = localStorage.getItem(FARM_MAPS_INITIALIZED_KEY);
    if (isInitialized) {
      // The user had an active session and might have deleted demo maps or cleared them. Do not restore demo maps!
      return [];
    }

    // 4. First time initialization
    await set(FARM_MAPS_KEY, INITIAL_MAPS);
    saveMapsBackupToLocalStorage(INITIAL_MAPS);
    return INITIAL_MAPS;
  } catch (err) {
    console.error('Error fetching farm maps:', err);
    try {
      const local = localStorage.getItem(FARM_MAPS_BACKUP_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return INITIAL_MAPS;
  }
}

export async function saveFarmMap(mapRecord: FarmMapRecord): Promise<FarmMapRecord[]> {
  const current = await getFarmMaps();
  const existingIdx = current.findIndex((m) => m.id === mapRecord.id);
  let updated: FarmMapRecord[];

  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = { ...mapRecord, updatedAt: Date.now() };
  } else {
    updated = [mapRecord, ...current];
  }

  await set(FARM_MAPS_KEY, updated);
  saveMapsBackupToLocalStorage(updated);
  return updated;
}

export async function saveFarmMapsBulk(newRecords: FarmMapRecord[]): Promise<FarmMapRecord[]> {
  const current = await getFarmMaps();
  let updated = [...current];

  for (const rec of newRecords) {
    const existingIdx = updated.findIndex((m) => m.id === rec.id);
    if (existingIdx >= 0) {
      updated[existingIdx] = { ...rec, updatedAt: Date.now() };
    } else {
      updated.unshift(rec);
    }
  }

  await set(FARM_MAPS_KEY, updated);
  saveMapsBackupToLocalStorage(updated);
  return updated;
}

export async function deleteFarmMap(id: string): Promise<FarmMapRecord[]> {
  const current = await getFarmMaps();
  const updated = current.filter((m) => m.id !== id);
  await set(FARM_MAPS_KEY, updated);
  saveMapsBackupToLocalStorage(updated);
  return updated;
}

export async function getGeneratedPdfs(): Promise<GeneratedPdfFile[]> {
  try {
    const stored = await get<GeneratedPdfFile[]>(GENERATED_PDFS_KEY);
    if (stored && Array.isArray(stored)) {
      return stored;
    }
    return [];
  } catch (err) {
    console.error('Error fetching generated pdfs:', err);
    return [];
  }
}

export async function saveGeneratedPdf(pdfFile: GeneratedPdfFile): Promise<GeneratedPdfFile[]> {
  const current = await getGeneratedPdfs();
  const existingIdx = current.findIndex((p) => p.id === pdfFile.id);
  let updated: GeneratedPdfFile[];

  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = pdfFile;
  } else {
    updated = [pdfFile, ...current];
  }

  await set(GENERATED_PDFS_KEY, updated);
  return updated;
}

export async function deleteGeneratedPdf(id: string): Promise<GeneratedPdfFile[]> {
  const current = await getGeneratedPdfs();
  const updated = current.filter((p) => p.id !== id);
  await set(GENERATED_PDFS_KEY, updated);
  return updated;
}

