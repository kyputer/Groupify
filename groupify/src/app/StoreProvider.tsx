"use client";
import { store } from "@/lib/store";
import { setupListeners } from "@reduxjs/toolkit/query";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Provider } from "react-redux";

interface Props {
  readonly children: ReactNode;
}

export const StoreProvider = ({ children }: Props) => {
  useEffect(() => {
    // configure listeners using the provided defaults
    // optional, but required for `refetchOnFocus`/`refetchOnReconnect` behaviors
    const unsubscribe = setupListeners(store.dispatch);
    return unsubscribe;
  }, []);

  return <Provider store={store}>{children}</Provider>;
};