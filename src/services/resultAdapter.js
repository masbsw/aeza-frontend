import { websocketService } from "./websocketService";
import { adaptFromCheckHost } from '../adapters/CheckHostAdapter';

export const adaptWebSocketData = (wsData, checkType) => {
  if (wsData.result) {
    return adaptFromCheckHost(wsData.result, checkType, wsData.target);
  }
  return null;
};

export const calculateProgress = (update) => {
  if (update.progress !== undefined) {
    return update.progress;
  }
  return update.status === 'completed' ? 100 : 50;
};



