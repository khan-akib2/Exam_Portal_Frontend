"use client";

import React, { createContext, useContext, useState } from "react";
import { AlertTriangle, Info, X } from "lucide-react";

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const [dialogs, setDialogs] = useState([]);

  const showDialog = ({ type = "info", title = "Notification", message, onConfirm, onCancel }) => {
    return new Promise((resolve) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newDialog = {
        id,
        type,
        title,
        message,
        resolve,
        onConfirm: () => {
          if (onConfirm) onConfirm();
          closeDialog(id);
          resolve(true);
        },
        onCancel: () => {
          if (onCancel) onCancel();
          closeDialog(id);
          resolve(false);
        }
      };
      setDialogs((prev) => [...prev, newDialog]);
    });
  };

  const showAlert = (message, title = "Notification") => {
    return showDialog({ type: "info", title, message });
  };

  const showConfirm = (message, title = "Confirm Action") => {
    return showDialog({ type: "confirm", title, message });
  };

  const closeDialog = (id) => {
    setDialogs((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <DialogContext.Provider value={{ showDialog, showAlert, showConfirm }}>
      {children}
      
      {/* Dialog Overlay & Portal */}
      {dialogs.map((dialog) => (
        <div
          key={dialog.id}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div
            className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-slide-up"
          >
            {/* Header / Content */}
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                dialog.type === 'confirm' ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-600'
              }`}>
                {dialog.type === 'confirm' ? (
                  <AlertTriangle className="h-6 w-6" />
                ) : (
                  <Info className="h-6 w-6" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-950 truncate">
                  {dialog.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                  {dialog.message}
                </p>
              </div>

              <button 
                onClick={dialog.onCancel}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end gap-3">
              {dialog.type === "confirm" && (
                <button
                  onClick={dialog.onCancel}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={dialog.onConfirm}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all ${
                  dialog.type === 'confirm' 
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/10' 
                    : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/10'
                }`}
              >
                {dialog.type === 'confirm' ? 'Confirm' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}
