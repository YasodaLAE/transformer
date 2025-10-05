import { useEffect, useState } from "react";

export default function Toast({ message, type="info", duration=2500, onClose }) {
  // State controls the visibility of the toast. Initialized based on message existence.
  const [show, setShow] = useState(Boolean(message));

  /**
   * Effect handles the auto-closing timer whenever a new message is received.
   */
  useEffect(() => {
    if (!message) return;

    setShow(true); // Ensure visibility is set to true when a message is received

    // Set a timeout to hide the toast and run the parent's cleanup function (onClose)
    const t = setTimeout(() => {
        setShow(false);
        onClose?.();
    }, duration);

    // Cleanup function: clears the timeout if the component unmounts or the message changes
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  // Do not render anything if the 'show' state is false
  if (!show) return null;

  // Determine background and text colors based on the 'type' prop for quick visual feedback
  const bg = type==="error" ? "#fee2e2" : type==="success" ? "#dcfce7" : "#e0f2fe";
  const color = type==="error" ? "#b91c1c" : type==="success" ? "#166534" : "#075985";

  return (
    <div style={{
      position:"fixed", right:16, bottom:16, padding:"10px 14px",
      background:bg, color, borderRadius:8, boxShadow:"0 6px 20px rgba(0,0,0,.15)",
      zIndex:9999 // Ensure toast appears above all other elements
    }}>
      {message}
    </div>
  );
}