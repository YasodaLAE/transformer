export default function Spinner({ label="Loading..." }) {
  return (
    <div style={{ display:"flex", gap:8, alignItems:"center", padding:12 }}>
      <div style={{
        width:16, height:16, border:"2px solid #cbd5e1", borderTopColor:"#0ea5e9",
        borderRadius:"50%", animation:"spin 1s linear infinite"
      }} />
      <span style={{ color:"#334155", fontSize:14 }}>{label}</span>
      <style>{`@keyframes spin {to {transform: rotate(360deg);} }`}</style>
    </div>
  );
}
