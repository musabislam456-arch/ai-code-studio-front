import React from "react";

function getPreview(step){
  if(step?.type==="command_output") return step.data || "";
  if(step?.tool==="write_file") return step.args?.content || "";
  if(step?.tool==="read_file") return step.result?.content || "";
  if(step?.tool==="run_command") return (step.output || []).map(x=>x.data).join("");
  return step?.result ? JSON.stringify(step.result,null,2) : "";
}
export default function AgentPanel({events=[],selected,onSelect,onOpenInEditor}){
 return <div className="agent-view">
   <div className="agent-list">
     <div className="agent-title">Live Agent</div>
     <div className="agent-events">
       {events.length===0 && <div className="agent-empty">Agent activity yahan live nazar aayegi.</div>}
       {events.map((e,i)=>{
         const clickable=["tool_call","tool_result","web_search","command_output"].includes(e.type);
         return <button key={i} className={`agent-event ${selected===e?"selected":""}`} onClick={()=>clickable&&onSelect?.(e)}>
           <span className="agent-icon">{e.type==="web_search"?"⌕":e.type==="command_output"?"$":e.type==="tool_call"?"▶":"●"}</span>
           <span>{e.type==="tool_call"?e.tool+" — "+(e.args?.path||e.args?.command||"") : e.type==="web_search"?"Google Search — "+e.query : e.type==="command_output"?e.data : e.type}</span>
         </button>
       })}
     </div>
   </div>
   <div className="agent-preview">
     <div className="agent-preview-head">
       <span>{selected?.tool ? `${selected.tool} · ${selected.args?.path||selected.args?.command||""}` : selected?.type==="web_search" ? `Google Search · ${selected.query}` : selected?.type==="command_output" ? "Terminal output" : "Select an agent step"}</span>
       {selected?.tool && (selected.tool==="write_file"||selected.tool==="read_file") && <button onClick={()=>onOpenInEditor?.(selected)}>Open in Editor</button>}
     </div>
     <pre>{getPreview(selected)}</pre>
   </div>
 </div>;
}
