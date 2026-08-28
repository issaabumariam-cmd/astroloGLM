"use client";

import { useState, useEffect, useRef } from "react";

export function useStreamText(text: string, enabled: boolean, speed = 20) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const idxRef = useRef(0);

  useEffect(() => {
    if (!enabled || !text) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayed(text);
       
      setDone(true);
      return;
    }
     
    setDisplayed("");
     
    setDone(false);
    idxRef.current = 0;

    const interval = setInterval(() => {
      idxRef.current += Math.max(1, Math.floor(text.length / 200));
      if (idxRef.current >= text.length) {
        setDisplayed(text);
        setDone(true);
        clearInterval(interval);
      } else {
        setDisplayed(text.substring(0, idxRef.current));
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, enabled, speed]);

  return { displayed, done };
}