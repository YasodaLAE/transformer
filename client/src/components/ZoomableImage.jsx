import { useRef, useState } from "react";

export default function ZoomableImage({ src, alt, style }) {
  const [state, setState] = useState({ scale:1, x:0, y:0, dragging:false, lastX:0, lastY:0 });
  const onWheel = (e) => { e.preventDefault(); const d = e.deltaY>0?-0.1:0.1; setState(s=>({...s, scale:Math.min(5,Math.max(1,s.scale+d))})); };
  const onDown = (e) => setState(s=>({...s, dragging:true, lastX:e.clientX, lastY:e.clientY}));
  const onUp   = () => setState(s=>({...s, dragging:false}));
  const onMove = (e) => { if(!state.dragging) return; const dx=e.clientX-state.lastX, dy=e.clientY-state.lastY;
                          setState(s=>({...s, x:s.x+dx, y:s.y+dy, lastX:e.clientX, lastY:e.clientY})); };
  const reset = () => setState({ scale:1, x:0, y:0, dragging:false, lastX:0, lastY:0 });

  return (
    <div style={{ position:"relative", border:"1px solid #e5e7eb", borderRadius:8, overflow:"hidden", ...style }}
         onWheel={onWheel} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}>
      <img src={src} alt={alt} onMouseDown={onDown} draggable={false}
           style={{ transform:`translate(${state.x}px,${state.y}px) scale(${state.scale})`,
                    transformOrigin:"0 0", userSelect:"none", display:"block", width:"100%" }} />
      <button onClick={reset}
        style={{ position:"absolute", top:8, right:8, padding:"6px 10px", fontSize:12,
                 background:"#0ea5e9", color:"#fff", border:"0", borderRadius:6, cursor:"pointer" }}>
        Reset
      </button>
    </div>
  );
}
