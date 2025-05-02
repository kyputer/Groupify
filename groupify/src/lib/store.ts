import { combineReducers, configureStore } from '@reduxjs/toolkit';
import partyReducer from './features/partySlice';
import userReducer from './features/userSlice';
import { persistStore, persistReducer, FLUSH, PAUSE, REGISTER, PERSIST, PURGE, REHYDRATE } from 'redux-persist'
import storage from 'redux-persist/lib/storage' // defaults to localStorage for web
import autoMergeLevel1 from 'redux-persist/lib/stateReconciler/autoMergeLevel1'

const persistConfig = {
    key: 'root',
    storage,
    stateReconciler: autoMergeLevel1,
  }

export const rootReducer = combineReducers({
  party: partyReducer,
  user: userReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

const persistedReducer = persistReducer<RootState>(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;