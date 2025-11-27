import { useRef, useState } from "react";

export default function ZoomableImage({ src, alt, style }) {
  // State manages the image's current transformation parameters.
  const [state, setState] = useState({
    scale:1,    // Current zoom level (1 = original size)
    x:0,        // Horizontal translation offset (for panning)
    y:0,        // Vertical translation offset (for panning)
    dragging:false, // True when the mouse button is down and ready to pan
    lastX:0,    // Last known mouse X position
    lastY:0     // Last known mouse Y position
  });

  /**
   * Handles zooming via the mouse scroll wheel.
   */
  const onWheel = (e) => {
    e.preventDefault();
    const d = e.deltaY > 0 ? -0.1 : 0.1; // Determine zoom direction and step
    // Update scale, enforcing limits between 1x and 5x.
    setState(s => ({...s, scale: Math.min(5, Math.max(1, s.scale + d))}));
  };

  /**
   * Starts the panning operation when the mouse button is pressed down on the image.
   */
  const onDown = (e) => setState(s => ({...s, dragging: true, lastX: e.clientX, lastY: e.clientY}));

  /**
   * Ends the panning operation when the mouse button is released.
   */
  const onUp   = () => setState(s => ({...s, dragging: false}));

  /**
   * Moves (pans) the image by updating the x and y offsets while dragging is active.
   */
  const onMove = (e) => {
    if(!state.dragging) return;

    // Calculate difference since last position
    const dx = e.clientX - state.lastX;
    const dy = e.clientY - state.lastY;

    // Update position and save current mouse coordinates for the next frame
    setState(s => ({...s, x: s.x + dx, y: s.y + dy, lastX: e.clientX, lastY: e.clientY}));
  };

  /**
   * Resets the image back to its initial state (1x zoom, no offset).
   */
  const reset = () => setState({ scale:1, x:0, y:0, dragging:false, lastX:0, lastY:0 });

  return (
    <div
      // Outer container handles mouse events for zoom (wheel) and pan tracking
      style={{ position:"relative", border:"1px solid #e5e7eb", borderRadius:8, overflow:"hidden", ...style }}
      onWheel={onWheel}
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp} // Stop dragging if mouse leaves the element
    >
      <img
        src={src}
        alt={alt}
        onMouseDown={onDown} // Initiate drag when mouse is pressed on the image
        draggable={false} // Prevent browser's default drag behavior
        style={{
          // CRITICAL: Applies position and scale using CSS transform for smooth rendering
          transform:`translate(${state.x}px,${state.y}px) scale(${state.scale})`,
          transformOrigin:"0 0", // Ensure zooming is relative to the top-left corner
          userSelect:"none",
          display:"block",
          width:"100%"
        }}
      />

      {/* Reset Button Control */}
      <button onClick={reset}
        style={{
          position:"absolute", top:8, right:8, padding:"6px 10px", fontSize:12,
          background:"#0ea5e9", color:"#fff", border:"0", borderRadius:6, cursor:"pointer"
        }}
      >
        Reset
      </button>
    </div>
  );
}