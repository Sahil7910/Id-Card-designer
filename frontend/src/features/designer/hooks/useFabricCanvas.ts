import { useEffect, useRef, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { designerActions } from "../designerSlice";
import type { CardField } from "../../../shared/types";

interface HistorySnapshot {
  frontFields: CardField[];
  backFields: CardField[];
}

const MAX_HISTORY = 50;

export function useFabricCanvas() {
  const dispatch = useAppDispatch();
  const frontFields = useAppSelector(s => s.designer.frontFields);
  const backFields = useAppSelector(s => s.designer.backFields);

  const history = useRef<HistorySnapshot[]>([]);
  const future = useRef<HistorySnapshot[]>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isApplying = useRef(false);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateFlags = useCallback(() => {
    setCanUndo(history.current.length > 0);
    setCanRedo(future.current.length > 0);
  }, []);

  // Push snapshot (debounced 300ms)
  useEffect(() => {
    if (isApplying.current) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const snap: HistorySnapshot = {
        frontFields: JSON.parse(JSON.stringify(frontFields)) as CardField[],
        backFields: JSON.parse(JSON.stringify(backFields)) as CardField[],
      };
      // Avoid pushing duplicate snapshots
      const last = history.current[history.current.length - 1];
      if (last && JSON.stringify(last) === JSON.stringify(snap)) return;
      history.current.push(snap);
      if (history.current.length > MAX_HISTORY) history.current.shift();
      future.current = []; // Clear redo stack on new action
      updateFlags();
    }, 300);
  }, [frontFields, backFields, updateFlags]);

  const undo = useCallback(() => {
    if (history.current.length < 2) return; // need at least current + one prior
    // Pop the current state (top of stack is current)
    const _current = history.current.pop();
    void _current;
    const prev = history.current[history.current.length - 1];
    if (!prev) return;
    future.current.push({
      frontFields: JSON.parse(JSON.stringify(frontFields)) as CardField[],
      backFields: JSON.parse(JSON.stringify(backFields)) as CardField[],
    });
    isApplying.current = true;
    dispatch(designerActions.loadDesign({ frontFields: prev.frontFields, backFields: prev.backFields }));
    setTimeout(() => { isApplying.current = false; }, 50);
    updateFlags();
  }, [dispatch, frontFields, backFields, updateFlags]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    history.current.push({
      frontFields: JSON.parse(JSON.stringify(frontFields)) as CardField[],
      backFields: JSON.parse(JSON.stringify(backFields)) as CardField[],
    });
    isApplying.current = true;
    dispatch(designerActions.loadDesign({ frontFields: next.frontFields, backFields: next.backFields }));
    setTimeout(() => { isApplying.current = false; }, 50);
    updateFlags();
  }, [dispatch, frontFields, backFields, updateFlags]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isInput = ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName ?? "");
      if (isInput) return;
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "z") { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "z"))) { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  return { canUndo, canRedo, undo, redo, historyLength: history.current.length };
}
