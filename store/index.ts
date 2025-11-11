import { configureStore } from "@reduxjs/toolkit";

import preferencesReducer from "./slices/preferencesSlice";
import sessionsReducer from "./slices/sessionsSlice";
import userReducer from "./slices/userSlice";
import curriculumReducer from "./slices/curriculumSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    preferences: preferencesReducer,
    sessions: sessionsReducer,
    curriculum: curriculumReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

