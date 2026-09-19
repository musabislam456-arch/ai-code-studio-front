import React,{useEffect,useState} from "react";
import Sidebar from "./components/Sidebar";
import CodeEditor from "./components/CodeEditor";
import TerminalPanel from "./components/Terminal";
import ChatPanel from "./components/ChatPanel";
import AgentPanel from "./components/AgentPanel";
import ModelPicker from "./components/ModelPicker";
import GitPanel from "./components/GitPanel";
import {api,setAccessToken} from "./lib/api";

export default function App(){
 const [projects,setProjects]=useState([]);
 const [projectId,setProjectId]=useState("");
 const [tree,setTree]=useState([]);
 const [activePath,setActivePath]=useState(null);
 const [content,setContent]=useState("");
 const [modelId,setModelId]=useState("gemini-3.8-flash");
 const [autoMode,setAutoMode]=useState(true);
 const [panelTab,setPanelTab]=useState("files");
 const [events,setEvents]=useState([]);
 const [selectedStep,setSelectedStep]=useState(null);

 const currentProject=projects.find(p=>p.id===projectId)||projects[0];
 const workspace=projectId||"my-project";

 const refreshTree=()=>api.tree(workspace).then(r=>setTree(r.tree)).catch(()=>{});
 const loadProjects=async()=>{
   const r=await api.projects();
   let list=r.projects||[];
   if(list.length===0){const n=await api.createProject("my-project");list=[n.project];}
   setProjects(list);
   setProjectId(id=>id||list[0].id);
 };
 useEffect(()=>{loadProjects()},[]);
 useEffect(()=>{if(projectId){setActivePath(null);setContent("");setEvents([]);setSelectedStep(null);refreshTree()}},[projectId]);

 const openFile=async path=>{setActivePath(path);setPanelTab("files");setContent((await api.readFile(workspace,path)).content)};
 const saveFile=async()=>{if(!activePath)return;await api.writeFile(workspace,activePath,content);refreshTree()};
 const uploadZip=async file=>{const form=new FormData();form.append("file",file);const token=localStorage.getItem("acs_token")||"";await fetch(`${import.meta.env.VITE_API_URL||""}/api/workspace/${workspace}/upload-zip`,{method:"POST",headers:token?{Authorization:`Bearer ${token}`}:undefined,body:form});refreshTree()};
 const newProject=async()=>{const name=window.prompt("New project name","Untitled project");if(!name?.trim())return;const r=await api.createProject(name.trim());setProjects(p=>[r.project,...p]);setProjectId(r.project.id)};
 const signOut=async()=>{try{await api.signOut()}catch{} setAccessToken("");location.reload()};
 const selectStep=s=>{setSelectedStep(s);setPanelTab("agent")};
 const openStepInEditor=s=>{
   const path=s?.args?.path;
   const next=s?.tool==="write_file"?s.args?.content:s?.tool==="read_file"?s.result?.content:null;
   if(!path||typeof next!=="string")return;
   setActivePath(path);setContent(next);setPanelTab("files");
 };

 return <div className="app">
  <header className="topbar">
   <div className="brand"><span className="brand-dot"/>AI Code Studio</div>
   <div className="project-bar">
    <select value={projectId} onChange={e=>setProjectId(e.target.value)} disabled={!projects.length} title="Project">
     {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
    <button className="project-new" onClick={newProject}>＋ New</button>
   </div>
   <ModelPicker selectedModel={modelId} onChange={setModelId} autoMode={autoMode} onToggleAuto={setAutoMode}/>
   <button className="signout-btn" onClick={signOut}>Sign out</button>
  </header>

  <div className="workspace">
   <div className="chat-col">
    <ChatPanel key={projectId} modelId={modelId} autoMode={autoMode} workspace={workspace}
      onAgentEvent={e=>setEvents(x=>[...x,e])} onSelectStep={selectStep}/>
   </div>
   <div className="panel-col">
    <div className="panel-tabs">
     <button className={panelTab==="files"?"active":""} onClick={()=>setPanelTab("files")}>Files{activePath?<span className="tab-hint">· {activePath.split("/").pop()}</span>:null}</button>
     <button className={panelTab==="agent"?"active":""} onClick={()=>setPanelTab("agent")}>Agent</button>
     <button className={panelTab==="terminal"?"active":""} onClick={()=>setPanelTab("terminal")}>Terminal</button>
     <button className={panelTab==="git"?"active":""} onClick={()=>setPanelTab("git")}>Git</button>
    </div>
    <div className="panel-body">
     {panelTab==="files"&&<div className="files-view"><Sidebar tree={tree} onOpenFile={openFile} onRefresh={refreshTree} onUploadZip={uploadZip} onDownloadZip={()=>window.open(api.downloadZipUrl(workspace),"_blank")}/><CodeEditor activePath={activePath} content={content} onChange={setContent} onSave={saveFile}/></div>}
     {panelTab==="agent"&&<AgentPanel events={events} selected={selectedStep} onSelect={selectStep} onOpenInEditor={openStepInEditor}/>}
     {panelTab==="terminal"&&<TerminalPanel cwd={workspace}/>}
     {panelTab==="git"&&<GitPanel workspace={workspace}/>}
    </div>
   </div>
  </div>
 </div>;
}
