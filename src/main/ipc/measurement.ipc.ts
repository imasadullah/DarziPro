import { ipcMain } from 'electron';
import { MeasurementService } from '../services/measurement.service';
import { MeasurementType } from '../database/entities/measurement.entity';

export function registerMeasurementIPCHandlers(): void {
  ipcMain.handle('measurement:getAll', async (_event, params?: any) => {
    try {
      const data = await MeasurementService.getAll(params);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('measurement:create', async (_event, data) => {
    try {
      const measurement = await MeasurementService.create(data);
      return { success: true, data: measurement };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(
    'measurement:update',
    async (_event, payload: { id: number; data: any }) => {
      try {
        const measurement = await MeasurementService.update(payload.id, payload.data);
        return { success: true, data: measurement };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle('measurement:delete', async (_event, id: number) => {
    try {
      await MeasurementService.delete(id);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('measurement:get', async (_event, id: number) => {
    try {
      const data = await MeasurementService.getById(id);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(
    'measurement:getByCustomer',
    async (_event, payload: { customerId: number; params?: any }) => {
      try {
        const data = await MeasurementService.getByCustomer(
          payload.customerId,
          payload.params
        );
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle('measurement:copy', async (_event, measurementId: number) => {
    try {
      const data = await MeasurementService.copy(measurementId);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(
    'measurement:getLatest',
    async (
      _event,
      payload: { customerId: number; measurementType?: MeasurementType }
    ) => {
      try {
        const data = await MeasurementService.getLatest(
          payload.customerId,
          payload.measurementType
        );
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  );
}
