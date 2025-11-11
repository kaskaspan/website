import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { UserProfile } from "@/types";

export type UserStatusState = "idle" | "loading" | "ready" | "error";

export interface UserState {
  profile: UserProfile | null;
  status: UserStatusState;
  error?: string;
}

const initialState: UserState = {
  profile: null,
  status: "idle",
  error: undefined,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserProfile(state, action: PayloadAction<UserProfile | null>) {
      state.profile = action.payload;
      state.status = action.payload ? "ready" : "idle";
      state.error = undefined;
    },
    setUserStatus(state, action: PayloadAction<UserStatusState>) {
      state.status = action.payload;
    },
    setUserError(state, action: PayloadAction<string | undefined>) {
      state.error = action.payload;
      if (action.payload) {
        state.status = "error";
      }
    },
  },
});

export const { setUserProfile, setUserStatus, setUserError } = userSlice.actions;

export default userSlice.reducer;

