import { useEffect, useState } from "react";

export default function Toast({ message, type="info", duration=2500, onClose }) {
  const [show, setShow] = useState(Boolean(message));
  useEffect(() => {
    if (!message) return;
    setShow(true);
    const t = setTimeout(() => { setShow(false); onClose?.(); }, duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);
  if (!show) return null;
  const bg = type==="error" ? "#fee2e2" : type==="success" ? "#dcfce7" : "#e0f2fe";
  const color = type==="error" ? "#b91c1c" : type==="success" ? "#166534" : "#075985";
  return (
    <div style={{
      position:"fixed", right:16, bottom:16, padding:"10px 14px",
      background:bg, color, borderRadius:8, boxShadow:"0 6px 20px rgba(0,0,0,.15)", zIndex:9999
    }}>
      {message}
    </div>
  );
}
