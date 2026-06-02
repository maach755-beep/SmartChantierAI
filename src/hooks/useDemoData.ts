import { useMemo, useCallback, useState } from 'react';
import { dataStore } from '@/services/dataStore';

export function useDemoData() {
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  return useMemo(() => {
    dataStore.init();
    void version;
    return {
      chantiers: dataStore.getChantiers(),
      rooms: dataStore.getRooms(),
      tasks: dataStore.getTasks(),
      workers: dataStore.getWorkers(),
      team: dataStore.getTeam(),
      risks: dataStore.getRisks(),
      modifications: dataStore.getModifications(),
      suppliers: dataStore.getSuppliers(),
      materials: dataStore.getMaterials(),
      materialRequests: dataStore.getMaterialRequests(),
      photos: dataStore.getPhotos(),
      albums: dataStore.getPhotoAlbums(),
      photoComparisons: dataStore.getPhotoComparisons(),
      documents: dataStore.getDocuments(),
      notifications: dataStore.getNotifications(),
      timeline: dataStore.getTimeline(),
      planRooms: dataStore.getPlanRooms(),
      flooring: dataStore.getFlooring(),
      attendance: dataStore.getAttendance(),
      fieldUpdates: dataStore.getFieldUpdates(),
      planning: dataStore.getPlanning(),
      refresh,
    };
  }, [version, refresh]);
}
