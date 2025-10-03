import { combineReducers, configureStore } from '@reduxjs/toolkit';
import partyReducer from './features/partySlice';
import userReducer from './features/userSlice';
import {
  persistStore,
  persistReducer,
  FLUSH,
  PAUSE,
  REGISTER,
  PERSIST,
  PURGE,
  REHYDRATE,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import autoMergeLevel1 from 'redux-persist/lib/stateReconciler/autoMergeLevel1';

// Create a noop storage for server-side rendering
const createNoopStorage = () => {
  return {
    getItem() {
      return Promise.resolve(null);
    },
    setItem() {
      return Promise.resolve();
    },
    removeItem() {
      return Promise.resolve();
    },
  };
};

// Use localStorage if available (client-side), otherwise use noop storage (server-side)
const persistStorage =
  typeof window !== 'undefined' ? storage : createNoopStorage();

const persistConfig = {
  key: 'root',
  storage: persistStorage,
  stateReconciler: autoMergeLevel1,
};

export const rootReducer = combineReducers({
  party: partyReducer,
  user: userReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

const persistedReducer = persistReducer<RootState>(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
