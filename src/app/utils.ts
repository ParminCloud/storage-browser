import { ChangeEvent, InputHTMLAttributes } from "react";

export function setValueFromEvent(
  ev: ChangeEvent<HTMLInputElement>,
  setter: (ev: any) => void
) {
  setter(ev.target.value);
}

export function readablizeBytes(bytes: number) {
  if (bytes === 0 || Number.isNaN(bytes)) {
    return NaN;
  }
  const s = ["bytes", "kB", "MB", "GB", "TB", "PB"];
  const e = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, e)).toFixed(2) + " " + s[e];
}
