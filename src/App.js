import { useState, useRef } from "react";
import { AIAnalysis } from "./AIAnalysis";

const load = (key, def) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; } };
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };
const TODAY = new Date().toISOString().split("T")[0];
const uid = () => `id-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;

const ENGINEERS_DEFAULT = ["أحمد هارون", "محمد النجار", "محمد موسى", "خالد إبراهيم", "عمر سعيد"];
const PHASES = ["طلب","عرض سعر","اعتماد","أمر شراء","توريد","صرف"];
const PHASE_NEXT = {"طلب":"عرض سعر","عرض سعر":"اعتماد","اعتماد":"أمر شراء","أمر شراء":"توريد","توريد":"صرف"};
const PHASE_COLOR = {"طلب":"#6B7280","عرض سعر":"#F59E0B","اعتماد":"#3B82F6","أمر شراء":"#8B5CF6","توريد":"#10B981","صرف":"#059669","مرفوض":"#EF4444"};
const STATUS_COLOR = {"جارٍ التنفيذ":"#10B981","متوقف":"#EF4444","مكتمل":"#6B7280"};
const ROLE_COLOR = {"مدير":"#10B981","مهندس":"#3B82F6","مشتريات":"#F59E0B"};
const TYPE_ICON = {"رسالة":"✉️","تقرير تقدم":"📊","أمر تغيير":"🔄","رسم هندسي":"📐","محضر اجتماع":"📑","أخرى":"📄"};
const DOC_TYPES = ["رسالة","تقرير تقدم","أمر تغيير","رسم هندسي","محضر اجتماع","أخرى"];
const DOC_CATEGORIES = {
  "رسومات": ["مخطط معماري","مخطط إنشائي","مخطط كهرباء","مخطط ميكانيكا","رسم تفصيلي","أخرى"],
  "رسايل استشاري": ["رسالة واردة","رسالة صادرة","محضر اجتماع","تعليمات موقع","أخرى"],
  "أوراق بلدية": ["رخصة بناء","طلب صب","اعتماد مخطط","تصريح","أخرى"],
  "NOC": ["NOC بلدية","NOC DEWA","NOC اتصالات","NOC دفاع مدني","أخرى"],
  "DEWA": ["طلب توصيل","عداد مؤقت","فحص كهرباء","شهادة إنجاز","أخرى"],
  "صور الموقع": ["صورة موقع"],
};
const UNITS = ["طن","م²","م³","كيس","قطعة","لتر","متر","كجم","طول","رول"];

// ── UI PRIMITIVES ──────────────────────────────────────────
const Badge = ({label,color="#6B7280"}) => (
  <span style={{background:color+"22",color,border:`1px solid ${color}44`,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{label}</span>
);
const Card = ({children,style={},onClick}) => (
  <div onClick={onClick} style={{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 1px 6px rgba(0,0,0,0.09)",marginBottom:12,cursor:onClick?"pointer":"default",...style}}>{children}</div>
);
const Inp = ({label,value,onChange,placeholder,type="text",required,rows,min}) => (
  <div style={{marginBottom:13}}>
    {label&&<div style={{fontSize:13,fontWeight:600,color:"#374151",marginBottom:5}}>{label}{required&&<span style={{color:"#EF4444"}}> *</span>}</div>}
    {rows
      ? <textarea rows={rows} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",padding:"10px 12px",border:"1px solid #D1D5DB",borderRadius:8,fontSize:13,direction:"rtl",fontFamily:"inherit",boxSizing:"border-box",background:"#F9FAFB",resize:"vertical"}}/>
      : <input type={type} min={min} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",padding:"10px 12px",border:"1px solid #D1D5DB",borderRadius:8,fontSize:13,direction:"rtl",fontFamily:"inherit",boxSizing:"border-box",background:"#F9FAFB"}}/>
    }
  </div>
);
const Sel = ({label,value,onChange,options,required}) => (
  <div style={{marginBottom:13}}>
    {label&&<div style={{fontSize:13,fontWeight:600,color:"#374151",marginBottom:5}}>{label}{required&&<span style={{color:"#EF4444"}}> *</span>}</div>}
    <select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",padding:"10px 12px",border:"1px solid #D1D5DB",borderRadius:8,fontSize:13,direction:"rtl",fontFamily:"inherit",background:"#F9FAFB",color:"#111"}}>
      <option value="">اختر...</option>
      {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
    </select>
  </div>
);
const Btn = ({children,onClick,v="primary",style={},disabled=false,full=false}) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding:"10px 16px",border:"none",borderRadius:9,cursor:disabled?"not-allowed":"pointer",
    fontSize:13,fontWeight:700,fontFamily:"inherit",opacity:disabled?.5:1,width:full?"100%":"auto",
    background:v==="primary"?"#1B2A4A":v==="gold"?"#B8923C":v==="red"?"#FEF2F2":v==="green"?"#F0FDF4":"#F3F4F6",
    color:v==="primary"?"#B8923C":v==="gold"?"#fff":v==="red"?"#DC2626":v==="green"?"#166534":"#374151",
    border:v==="red"?"1px solid #FECACA":v==="green"?"1px solid #BBF7D0":v==="secondary"?"1px solid #E5E7EB":"none",
    ...style}}>{children}</button>
);
const Modal = ({title,children,onClose}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:200,display:"flex",alignItems:"flex-end"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxHeight:"93vh",overflowY:"auto",padding:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontWeight:800,fontSize:16,color:"#1B2A4A"}}>{title}</div>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:24,cursor:"pointer",color:"#6B7280",lineHeight:1}}>✕</button>
      </div>
      {children}
    </div>
  </div>
);
const ConfirmModal = ({msg,onYes,onNo}) => (
  <Modal title="تأكيد الحذف" onClose={onNo}>
    <div style={{fontSize:14,color:"#374151",marginBottom:20}}>{msg}</div>
    <div style={{display:"flex",gap:8}}>
      <Btn v="red" full onClick={onYes}>حذف</Btn>
      <Btn v="secondary" full onClick={onNo}>إلغاء</Btn>
    </div>
  </Modal>
);
const Toast = ({msg}) => msg?(
  <div style={{position:"fixed",bottom:88,left:16,right:16,background:"#1B2A4A",color:"#B8923C",borderRadius:12,padding:"12px 16px",fontSize:13,fontWeight:700,zIndex:400,textAlign:"center",boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>{msg}</div>
):null;
const PhaseBar = ({current}) => {
  const idx=PHASES.indexOf(current);
  return (
    <div style={{display:"flex",borderRadius:8,overflow:"hidden",fontSize:9,marginTop:8}}>
      {PHASES.map((p,i)=>(
        <div key={p} style={{flex:1,padding:"4px 1px",textAlign:"center",background:i<idx?"#1B2A4A":i===idx?"#B8923C":"#E5E7EB",color:i<=idx?"#fff":"#9CA3AF",fontWeight:i===idx?800:400,borderRight:i<5?"1px solid #fff":"none"}}>{p}</div>
      ))}
    </div>
  );
};
const SecTitle = ({children}) => <div style={{fontSize:14,fontWeight:800,color:"#1B2A4A",borderRight:"3px solid #B8923C",paddingRight:10,marginBottom:10,marginTop:4}}>{children}</div>;
const EmptyState = ({text}) => <Card><div style={{color:"#9CA3AF",textAlign:"center",padding:"24px 0",fontSize:13}}>{text}</div></Card>;

// ── LOGIN ───────────────────────────────────────────────────
const Login = ({onLogin}) => {
  const [name,setName]=useState("");
  const [role,setRole]=useState("مدير");
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1B2A4A,#0f1a2e)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:"#fff",borderRadius:20,padding:36,width:"100%",maxWidth:380,textAlign:"center"}}>
        <div style={{fontSize:52}}>🏗️</div>
        <div style={{fontSize:22,fontWeight:800,color:"#1B2A4A",marginTop:8}}>Capital Homes</div>
        <div style={{fontSize:13,color:"#B8923C",fontWeight:700,marginBottom:28}}>كابيتال هومز للمقاولات</div>
        <Inp label="الاسم الكامل" value={name} onChange={setName} placeholder="اكتب اسمك" required/>
        <Sel label="الدور الوظيفي" value={role} onChange={setRole} options={["مدير","مهندس","مشتريات"]}/>
        <Btn onClick={()=>name.trim()&&onLogin(role,name.trim())} full style={{padding:13,fontSize:15,marginTop:4}} disabled={!name.trim()}>دخول للنظام</Btn>
        <div style={{marginTop:14,fontSize:11,color:"#9CA3AF"}}>DAMAC Hills 2 — Dubai, UAE</div>
      </div>
    </div>
  );
};

// ── DASHBOARD ───────────────────────────────────────────────
const Dashboard = ({role,sites,requests,attendance,notifs}) => {
  const active=sites.filter(s=>s.status==="جارٍ التنفيذ").length;
  const stopped=sites.filter(s=>s.status==="متوقف").length;
  const pending=requests.filter(r=>r.phase==="طلب").length;
  const avg=sites.length?Math.round(sites.reduce((a,s)=>a+s.progress,0)/sites.length):0;
  const todayAbs=attendance.filter(a=>a.date===TODAY).reduce((s,a)=>s+(+a.absentWorkers||0),0);
  const myNotifs=notifs.filter(n=>!n.read&&(role==="مدير"||n.role===role));

  return (
    <div>
      <div style={{fontSize:18,fontWeight:800,color:"#1B2A4A",marginBottom:2}}>لوحة التحكم</div>
      <div style={{fontSize:12,color:"#9CA3AF",marginBottom:14}}>{TODAY} — DAMAC Hills 2</div>

      {myNotifs.length>0&&(
        <Card style={{background:"#FFF7ED",border:"1px solid #FED7AA",marginBottom:14}}>
          <div style={{fontWeight:700,color:"#92400E",marginBottom:8}}>🔔 {myNotifs.length} إشعار جديد</div>
          {myNotifs.slice(0,3).map(n=><div key={n.id} style={{fontSize:12,color:"#78350F",padding:"4px 0",borderBottom:"1px solid #FDBA74"}}>{n.text}</div>)}
        </Card>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>
        {[["مواقع نشطة",active,"#10B981"],["متوقفة",stopped,"#EF4444"],["طلبات معلقة",pending,"#F59E0B"]].map(([l,v,c])=>(
          <div key={l} style={{background:"#fff",borderRadius:12,padding:"12px 6px",boxShadow:"0 1px 4px rgba(0,0,0,0.08)",textAlign:"center"}}>
            <div style={{fontSize:26,fontWeight:800,color:c}}>{v}</div>
            <div style={{fontSize:10,color:"#6B7280"}}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        <div style={{background:"#fff",borderRadius:12,padding:"12px 8px",boxShadow:"0 1px 4px rgba(0,0,0,0.08)",textAlign:"center"}}>
          <div style={{fontSize:22,fontWeight:800,color:"#B8923C"}}>{avg}%</div>
          <div style={{fontSize:10,color:"#6B7280"}}>متوسط الإنجاز</div>
        </div>
        <div style={{background:"#fff",borderRadius:12,padding:"12px 8px",boxShadow:"0 1px 4px rgba(0,0,0,0.08)",textAlign:"center"}}>
          <div style={{fontSize:22,fontWeight:800,color:"#EF4444"}}>{todayAbs}</div>
          <div style={{fontSize:10,color:"#6B7280"}}>غائب اليوم</div>
        </div>
      </div>

      <Card style={{background:"linear-gradient(135deg,#1B2A4A,#0f1a2e)",color:"#fff"}}>
        <div style={{fontSize:12,color:"#B8923C",fontWeight:700,marginBottom:6}}>التقدم الإجمالي للمشروع</div>
        <div style={{fontSize:30,fontWeight:800}}>{avg}%</div>
        <div style={{background:"rgba(255,255,255,0.15)",borderRadius:99,height:8,marginTop:10}}>
          <div style={{width:`${avg}%`,background:"#B8923C",borderRadius:99,height:8}}/>
        </div>
        <div style={{fontSize:11,color:"#94A3B8",marginTop:8}}>{sites.length} موقع</div>
      </Card>

      {requests.length>0&&<>
        <SecTitle>آخر طلبات المواد</SecTitle>
        {requests.slice(-5).reverse().map(r=>(
          <div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid #F3F4F6"}}>
            <div><div style={{fontSize:13,fontWeight:600}}>{r.material}</div><div style={{fontSize:11,color:"#9CA3AF"}}>{r.site} • {r.date}</div></div>
            <Badge label={r.phase} color={PHASE_COLOR[r.phase]}/>
          </div>
        ))}
      </>}
    </div>
  );
};

// ── SITES ───────────────────────────────────────────────────
const SiteForm = ({initial={},onSave,onClose,engineers}) => {
  const [f,setF]=useState({name:"",plot:"",engineer:"",status:"جارٍ التنفيذ",progress:0,
    licenseNo:"",startDate:"",initialDelivery:"",finalDelivery:"",extensionPeriod:"",
    extendedDelivery:"",stopPeriod:"",stopReason:"",phase:"هيكل",...initial});
  const ok=f.name.trim()&&f.plot.trim()&&f.engineer;
  return (
    <Modal title={initial.id?"تعديل الموقع":"إضافة موقع جديد"} onClose={onClose}>
      <div style={{background:"#F9FAFB",borderRadius:10,padding:12,marginBottom:14}}>
        <div style={{fontSize:12,fontWeight:700,color:"#B8923C",marginBottom:10}}>البيانات الاساسية</div>
        <Inp label="اسم الموقع" value={f.name} onChange={v=>setF({...f,name:v})} placeholder="فيلا 145" required/>
        <Inp label="رقم القطعة" value={f.plot} onChange={v=>setF({...f,plot:v})} placeholder="91412999" required/>
        <Sel label="المهندس" value={f.engineer} onChange={v=>setF({...f,engineer:v})} options={engineers} required/>
        <Sel label="الحالة" value={f.status} onChange={v=>setF({...f,status:v})} options={["جارٍ التنفيذ","متوقف","مكتمل"]}/>
        <Sel label="مرحلة العمل" value={f.phase} onChange={v=>setF({...f,phase:v})} options={["هيكل","تشطيبات","تمديدات","ميكانيكا وكهرباء","تسليم"]}/>
        <Inp label="نسبة الانجاز %" value={String(f.progress)} onChange={v=>setF({...f,progress:Math.min(100,Math.max(0,+v||0))})} type="number" min="0" placeholder="0"/>
      </div>
      <div style={{background:"#F9FAFB",borderRadius:10,padding:12,marginBottom:14}}>
        <div style={{fontSize:12,fontWeight:700,color:"#1B2A4A",marginBottom:10}}>بيانات الرخصة والتسليم</div>
        <Inp label="رقم رخصة البناء" value={f.licenseNo} onChange={v=>setF({...f,licenseNo:v})} placeholder="BL-2025-00123"/>
        <div style={{display:"flex",gap:8}}>
          <div style={{flex:1}}><Inp label="تاريخ البداية" value={f.startDate} onChange={v=>setF({...f,startDate:v})} type="date"/></div>
          <div style={{flex:1}}><Inp label="تسليم ابتدائي" value={f.initialDelivery} onChange={v=>setF({...f,initialDelivery:v})} type="date"/></div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <div style={{flex:1}}><Inp label="تسليم نهائي" value={f.finalDelivery} onChange={v=>setF({...f,finalDelivery:v})} type="date"/></div>
          <div style={{flex:1}}><Inp label="تسليم بعد التمديد" value={f.extendedDelivery} onChange={v=>setF({...f,extendedDelivery:v})} type="date"/></div>
        </div>
        <Inp label="فترة التمديد (ايام)" value={f.extensionPeriod} onChange={v=>setF({...f,extensionPeriod:v})} type="number" placeholder="0"/>
      </div>
      <div style={{background:"#FEF2F2",borderRadius:10,padding:12,marginBottom:14}}>
        <div style={{fontSize:12,fontWeight:700,color:"#EF4444",marginBottom:10}}>بيانات التوقف</div>
        <Inp label="فترة التوقف (ايام)" value={f.stopPeriod} onChange={v=>setF({...f,stopPeriod:v})} type="number" placeholder="0"/>
        <Inp label="اسباب التوقف" value={f.stopReason} onChange={v=>setF({...f,stopReason:v})} placeholder="اكتب اسباب التوقف..." rows={2}/>
      </div>
      <div style={{display:"flex",gap:8}}>
        <Btn full disabled={!ok} onClick={()=>ok&&onSave({...f,name:f.name.trim(),plot:f.plot.trim()})}>حفظ الموقع</Btn>
        <Btn v="secondary" full onClick={onClose}>الغاء</Btn>
      </div>
    </Modal>
  );
};

const SitesList = ({sites,setSites,role,onSelect,engineers,showToast}) => {
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("الكل");
  const [modal,setModal]=useState(null);
  const [confirm,setConfirm]=useState(null);

  const filtered=sites.filter(s=>{
    const ms=s.name.includes(search)||s.engineer.includes(search)||s.plot.includes(search);
    const mf=filter==="الكل"||s.status===filter;
    return ms&&mf;
  });

  const addSite = data => { const upd=[...sites,{...data,id:uid(),createdAt:TODAY}]; setSites(upd); setModal(null); showToast("✓ تم إضافة الموقع"); };
  const editSite = data => { const upd=sites.map(s=>s.id===data.id?data:s); setSites(upd); setModal(null); showToast("✓ تم التعديل"); };
  const deleteSite = id => { const upd=sites.filter(s=>s.id!==id); setSites(upd); setConfirm(null); showToast("تم الحذف"); };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:18,fontWeight:800,color:"#1B2A4A"}}>المواقع ({filtered.length})</div>
        {role==="مدير"&&<Btn v="gold" onClick={()=>setModal("new")} style={{padding:"7px 14px",fontSize:12}}>+ موقع جديد</Btn>}
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 بحث بالاسم أو المهندس أو القطعة..."
        style={{width:"100%",padding:"10px 12px",border:"1px solid #D1D5DB",borderRadius:10,fontSize:13,marginBottom:10,direction:"rtl",boxSizing:"border-box",fontFamily:"inherit"}}/>
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        {["الكل","جارٍ التنفيذ","متوقف","مكتمل"].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} style={{padding:"5px 10px",border:"none",borderRadius:20,cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"inherit",background:filter===s?"#1B2A4A":"#E5E7EB",color:filter===s?"#B8923C":"#374151"}}>{s}</button>
        ))}
      </div>
      {filtered.length===0&&<EmptyState text="لا توجد مواقع"/>}
      {filtered.map(s=>(
        <div key={s.id} style={{background:"#fff",borderRadius:14,padding:"14px 16px",marginBottom:10,boxShadow:"0 1px 4px rgba(0,0,0,0.07)",borderRight:`4px solid ${STATUS_COLOR[s.status]}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1,cursor:"pointer"}} onClick={()=>onSelect(s)}>
              <div style={{fontWeight:700,color:"#1B2A4A",fontSize:15}}>{s.name}</div>
              <div style={{fontSize:12,color:"#6B7280",marginTop:3}}>👷 {s.engineer} | 📌 {s.plot}</div>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <Badge label={s.status} color={STATUS_COLOR[s.status]}/>
              {role==="مدير"&&<>
                <button onClick={()=>setModal(s)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#6B7280"}}>✏️</button>
                <button onClick={()=>setConfirm(s.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#EF4444"}}>🗑️</button>
              </>}
            </div>
          </div>
          <div style={{marginTop:10}} onClick={()=>onSelect(s)} >
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#9CA3AF",marginBottom:3}}><span>التقدم</span><span>{s.progress}%</span></div>
            <div style={{background:"#E5E7EB",borderRadius:99,height:6}}><div style={{width:`${s.progress}%`,background:"#B8923C",borderRadius:99,height:6}}/></div>
          </div>
        </div>
      ))}
      {modal==="new"&&<SiteForm engineers={engineers} onSave={addSite} onClose={()=>setModal(null)}/>}
      {modal&&modal!=="new"&&<SiteForm initial={modal} engineers={engineers} onSave={editSite} onClose={()=>setModal(null)}/>}
      {confirm&&<ConfirmModal msg="هتحذف الموقع ده؟ البيانات مش هترجع." onYes={()=>deleteSite(confirm)} onNo={()=>setConfirm(null)}/>}
    </div>
  );
};

// ── SITE DETAIL ─────────────────────────────────────────────
const DocForm = ({siteId,siteName,userName,onSave,onClose}) => {
  const [title,setTitle]=useState("");
  const [type,setType]=useState("رسالة");
  const [notes,setNotes]=useState("");
  const [num,setNum]=useState("");
  return (
    <Modal title="إضافة وثيقة" onClose={onClose}>
      <Sel label="نوع الوثيقة" value={type} onChange={setType} options={DOC_TYPES} required/>
      <Inp label="عنوان الوثيقة" value={title} onChange={setTitle} placeholder="مثال: تقرير تقدم أسبوع 25" required/>
      <Inp label="رقم المرجع (اختياري)" value={num} onChange={setNum} placeholder="مثال: CH-2026-001"/>
      <Inp label="ملاحظات" value={notes} onChange={setNotes} placeholder="أي تفاصيل إضافية..." rows={3}/>
      <div style={{display:"flex",gap:8}}>
        <Btn full disabled={!title.trim()} onClick={()=>{onSave({id:uid(),siteId,site:siteName,title:title.trim(),type,refNum:num,notes,by:userName,date:TODAY});onClose();}}>حفظ الوثيقة</Btn>
        <Btn v="secondary" full onClick={onClose}>إلغاء</Btn>
      </div>
    </Modal>
  );
};

const ReqForm = ({siteId,siteName,userName,onSave,onClose}) => {
  const [material,setMaterial]=useState("");
  const [qty,setQty]=useState("");
  const [unit,setUnit]=useState("طن");
  const [notes,setNotes]=useState("");
  return (
    <Modal title="طلب مواد جديد" onClose={onClose}>
      <div style={{fontSize:12,color:"#B8923C",fontWeight:700,marginBottom:12}}>📍 {siteName}</div>
      <Inp label="المادة المطلوبة" value={material} onChange={setMaterial} placeholder="مثال: حديد تسليح Ø16" required/>
      <div style={{display:"flex",gap:8}}>
        <div style={{flex:1}}><Inp label="الكمية" value={qty} onChange={setQty} type="number" placeholder="0" required/></div>
        <div style={{flex:1}}><Sel label="الوحدة" value={unit} onChange={setUnit} options={UNITS}/></div>
      </div>
      <Inp label="ملاحظات" value={notes} onChange={setNotes} placeholder="أي تفاصيل..." rows={2}/>
      <div style={{display:"flex",gap:8}}>
        <Btn full disabled={!material.trim()||!qty} onClick={()=>{onSave({id:`MR-${Date.now()}`,siteId,site:siteName,material:material.trim(),qty:+qty,unit,requestedBy:userName,date:TODAY,phase:"طلب",notes,rejectedReason:""});onClose();}}>إرسال الطلب</Btn>
        <Btn v="secondary" full onClick={onClose}>إلغاء</Btn>
      </div>
    </Modal>
  );
};

const DocForm2 = ({siteId,siteName,userName,onSave,onClose}) => {
  const [cat,setCat]=useState("رسومات");
  const [subtype,setSubtype]=useState("");
  const [title,setTitle]=useState("");
  const [refNum,setRefNum]=useState("");
  const [notes,setNotes]=useState("");
  const subtypes=DOC_CATEGORIES[cat]||[];
  return (
    <Modal title="اضافة وثيقة" onClose={onClose}>
      <Sel label="التصنيف" value={cat} onChange={v=>{setCat(v);setSubtype("");}} options={Object.keys(DOC_CATEGORIES)} required/>
      <Sel label="النوع" value={subtype} onChange={setSubtype} options={subtypes} required/>
      <Inp label="العنوان" value={title} onChange={setTitle} placeholder="عنوان الوثيقة" required/>
      <Inp label="رقم المرجع" value={refNum} onChange={setRefNum} placeholder="CH-2026-001"/>
      <Inp label="ملاحظات" value={notes} onChange={setNotes} rows={2}/>
      <div style={{display:"flex",gap:8}}>
        <Btn full disabled={!title.trim()||!subtype} onClick={()=>{onSave({id:uid(),siteId,site:siteName,title:title.trim(),category:cat,type:subtype,refNum,notes,by:userName,date:TODAY});onClose();}}>حفظ</Btn>
        <Btn v="secondary" full onClick={onClose}>الغاء</Btn>
      </div>
    </Modal>
  );
};

const CAT_ICON={"رسومات":"📐","رسايل استشاري":"✉️","أوراق بلدية":"🏛️","NOC":"📋","DEWA":"⚡","صور الموقع":"📸"};
const CAT_COLOR={"رسومات":"#3B82F6","رسايل استشاري":"#8B5CF6","أوراق بلدية":"#F59E0B","NOC":"#EF4444","DEWA":"#F59E0B","صور الموقع":"#10B981"};

const SiteDetail = ({site,role,userName,requests,docs,setRequests,setDocs,addNotif,onBack,showToast,sites,setSites}) => {
  const [tab,setTab]=useState("overview");
  const [modal,setModal]=useState(null);
  const [confirm,setConfirm]=useState(null);
  const [editProgress,setEditProgress]=useState(false);
  const [prog,setProg]=useState(site.progress);
  const [docCat,setDocCat]=useState("الكل");

  const siteReqs=requests.filter(r=>r.siteId===site.id);
  const siteDocs=docs.filter(d=>d.siteId===site.id);
  const currentSite=sites.find(s=>s.id===site.id)||site;

  const saveProgress=()=>{const upd=sites.map(s=>s.id===site.id?{...s,progress:prog}:s);setSites(upd);setEditProgress(false);showToast("✓ تم تحديث التقدم");};
  const delDoc=id=>{setDocs(docs.filter(d=>d.id!==id));setConfirm(null);showToast("تم الحذف");};
  const delReq=id=>{setRequests(requests.filter(r=>r.id!==id));setConfirm(null);showToast("تم الحذف");};

  const filteredDocs=docCat==="الكل"?siteDocs:siteDocs.filter(d=>d.category===docCat);

  const daysLeft=(date)=>{if(!date)return null;const d=Math.ceil((new Date(date)-new Date())/(1000*60*60*24));return d;};
  const dl=daysLeft(currentSite.finalDelivery);
  const dlColor=dl===null?"#6B7280":dl<0?"#EF4444":dl<30?"#F59E0B":"#10B981";

  return (
    <div>
      <button onClick={onBack} style={{background:"none",border:"none",color:"#B8923C",fontWeight:700,cursor:"pointer",fontSize:14,marginBottom:10,padding:0,fontFamily:"inherit"}}>← رجوع</button>
      <div style={{background:"#1B2A4A",borderRadius:16,padding:20,marginBottom:16,color:"#fff"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:20,fontWeight:800}}>{currentSite.name}</div>
            <div style={{fontSize:13,color:"#B8923C",marginTop:4}}>قطعة {currentSite.plot}</div>
            <div style={{fontSize:12,marginTop:5,color:"#94A3B8"}}>👷 {currentSite.engineer}</div>
            {currentSite.phase&&<div style={{marginTop:4}}><Badge label={currentSite.phase} color="#B8923C"/></div>}
          </div>
          {dl!==null&&<div style={{textAlign:"center",background:"rgba(255,255,255,0.1)",borderRadius:10,padding:"8px 12px"}}>
            <div style={{fontSize:20,fontWeight:800,color:dlColor}}>{dl<0?Math.abs(dl):dl}</div>
            <div style={{fontSize:9,color:"#94A3B8"}}>{dl<0?"تأخير (يوم)":"يوم متبقي"}</div>
          </div>}
        </div>
        <div style={{marginTop:14}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#94A3B8",marginBottom:4}}><span>الإنجاز</span><span>{currentSite.progress}%</span></div>
          <div style={{background:"#0f1a2e",borderRadius:99,height:8}}><div style={{width:`${currentSite.progress}%`,background:"#B8923C",borderRadius:99,height:8}}/></div>
        </div>
        {role==="مدير"&&<button onClick={()=>{setProg(currentSite.progress);setEditProgress(true);}} style={{marginTop:10,background:"rgba(184,146,60,0.2)",border:"1px solid #B8923C",color:"#B8923C",borderRadius:8,padding:"5px 14px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>تحديث التقدم</button>}
      </div>

      {editProgress&&(
        <Modal title="تحديث نسبة الانجاز" onClose={()=>setEditProgress(false)}>
          <input type="range" min="0" max="100" value={prog} onChange={e=>setProg(+e.target.value)} style={{width:"100%",marginBottom:8}}/>
          <div style={{textAlign:"center",fontSize:32,fontWeight:800,color:"#1B2A4A",marginBottom:16}}>{prog}%</div>
          <div style={{display:"flex",gap:8}}><Btn full onClick={saveProgress}>حفظ</Btn><Btn v="secondary" full onClick={()=>setEditProgress(false)}>الغاء</Btn></div>
        </Modal>
      )}

      <div style={{display:"flex",gap:5,marginBottom:14,overflowX:"auto"}}>
        {[["overview","عامة"],["license","الرخصة"],["reqs","المواد"],["docs","الوثائق"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"9px 4px",border:"none",borderRadius:8,cursor:"pointer",fontSize:11,fontFamily:"inherit",whiteSpace:"nowrap",background:tab===k?"#1B2A4A":"#E5E7EB",color:tab===k?"#B8923C":"#374151",fontWeight:tab===k?700:400}}>{l}</button>
        ))}
      </div>

      {tab==="overview"&&(
        <Card>
          <SecTitle>معلومات الموقع</SecTitle>
          {[
            ["الحالة",<Badge label={currentSite.status} color={STATUS_COLOR[currentSite.status]}/>],
            ["مرحلة العمل",currentSite.phase||"—"],
            ["المهندس",currentSite.engineer],
            ["رقم القطعة",currentSite.plot],
            ["الانجاز",`${currentSite.progress}%`],
            ["طلبات المواد",siteReqs.length],
            ["الوثائق",siteDocs.length],
          ].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid #F3F4F6",fontSize:13}}>
              <span style={{color:"#6B7280"}}>{k}</span><span style={{fontWeight:600}}>{v}</span>
            </div>
          ))}
          {currentSite.stopReason&&(
            <div style={{marginTop:10,background:"#FEF2F2",borderRadius:8,padding:"8px 12px"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#EF4444",marginBottom:4}}>سبب التوقف</div>
              <div style={{fontSize:12,color:"#374151"}}>{currentSite.stopReason}</div>
            </div>
          )}
        </Card>
      )}

      {tab==="license"&&(
        <div>
          <Card>
            <SecTitle>بيانات الرخصة</SecTitle>
            {[
              ["رقم رخصة البناء",currentSite.licenseNo||"—"],
              ["تاريخ البداية",currentSite.startDate||"—"],
            ].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #F3F4F6",fontSize:13}}>
                <span style={{color:"#6B7280"}}>{k}</span><span style={{fontWeight:600}}>{v}</span>
              </div>
            ))}
          </Card>
          <Card>
            <SecTitle>مواعيد التسليم</SecTitle>
            {[
              ["تسليم ابتدائي",currentSite.initialDelivery||"—"],
              ["تسليم نهائي",currentSite.finalDelivery||"—"],
              ["فترة التمديد",currentSite.extensionPeriod?`${currentSite.extensionPeriod} يوم`:"—"],
              ["تسليم بعد التمديد",currentSite.extendedDelivery||"—"],
            ].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #F3F4F6",fontSize:13}}>
                <span style={{color:"#6B7280"}}>{k}</span>
                <span style={{fontWeight:700,color:k==="تسليم نهائي"?dlColor:"#1B2A4A"}}>{v}</span>
              </div>
            ))}
          </Card>
          {currentSite.stopPeriod&&<Card style={{background:"#FFF7ED",border:"1px solid #FED7AA"}}>
            <SecTitle>بيانات التوقف</SecTitle>
            <div style={{fontSize:13,color:"#374151"}}>فترة التوقف: <b>{currentSite.stopPeriod} يوم</b></div>
            {currentSite.stopReason&&<div style={{fontSize:12,color:"#6B7280",marginTop:6,background:"#FEF2F2",padding:"6px 10px",borderRadius:6}}>{currentSite.stopReason}</div>}
          </Card>}
        </div>
      )}

      {tab==="reqs"&&(
        <div>
          {role==="مهندس"&&<Btn v="gold" full style={{marginBottom:12}} onClick={()=>setModal("req")}>+ طلب مواد جديد</Btn>}
          {siteReqs.length===0?<EmptyState text="لا توجد طلبات مواد"/>:siteReqs.map(r=>(
            <Card key={r.id}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div><div style={{fontWeight:700,fontSize:13}}>{r.material}</div><div style={{fontSize:11,color:"#9CA3AF"}}>{r.qty} {r.unit} • {r.requestedBy} • {r.date}</div></div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <Badge label={r.phase} color={PHASE_COLOR[r.phase]}/>
                  {role==="مدير"&&<button onClick={()=>setConfirm({type:"req",id:r.id})} style={{background:"none",border:"none",cursor:"pointer",color:"#EF4444",fontSize:15}}>🗑️</button>}
                </div>
              </div>
              <PhaseBar current={r.phase}/>
              {r.notes&&<div style={{marginTop:8,fontSize:11,color:"#6B7280",background:"#F9FAFB",padding:"6px 10px",borderRadius:6}}>{r.notes}</div>}
              {r.rejectedReason&&<div style={{marginTop:6,fontSize:11,color:"#DC2626",background:"#FEF2F2",padding:"6px 10px",borderRadius:6}}>سبب الرفض: {r.rejectedReason}</div>}
            </Card>
          ))}
        </div>
      )}

      {tab==="docs"&&(
        <div>
          {(role==="مهندس"||role==="مدير")&&<Btn v="gold" full style={{marginBottom:12}} onClick={()=>setModal("doc")}>+ اضافة وثيقة</Btn>}
          <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:8,marginBottom:12}}>
            {["الكل",...Object.keys(DOC_CATEGORIES)].map(c=>(
              <button key={c} onClick={()=>setDocCat(c)} style={{padding:"5px 10px",border:"none",borderRadius:20,cursor:"pointer",whiteSpace:"nowrap",fontSize:11,fontWeight:600,fontFamily:"inherit",background:docCat===c?"#1B2A4A":"#E5E7EB",color:docCat===c?"#B8923C":"#374151"}}>{CAT_ICON[c]||""} {c}</button>
            ))}
          </div>
          {Object.keys(DOC_CATEGORIES).map(cat=>{
            const catDocs=filteredDocs.filter(d=>d.category===cat||(docCat!=="الكل"&&d.category===docCat));
            const show=docCat==="الكل"?siteDocs.filter(d=>d.category===cat):filteredDocs;
            if(docCat!=="الكل"&&cat!==docCat)return null;
            const displayDocs=docCat==="الكل"?siteDocs.filter(d=>d.category===cat):filteredDocs;
            if(displayDocs.length===0&&docCat!=="الكل")return <EmptyState key={cat} text={`لا توجد وثائق في ${cat}`}/>;
            if(displayDocs.length===0)return null;
            return (
              <div key={cat}>
                <div style={{fontSize:12,fontWeight:700,color:CAT_COLOR[cat]||"#1B2A4A",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                  <span>{CAT_ICON[cat]}</span>{cat} ({displayDocs.length})
                </div>
                {displayDocs.slice().reverse().map(d=>(
                  <Card key={d.id}>
                    <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                      <div style={{width:40,height:40,borderRadius:10,background:(CAT_COLOR[d.category]||"#6B7280")+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{CAT_ICON[d.category]||"📄"}</div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:13}}>{d.title}</div>
                        <div style={{fontSize:11,color:"#9CA3AF",marginTop:2}}>{d.type}{d.refNum&&` • ${d.refNum}`} • {d.date} • {d.by}</div>
                        {d.notes&&<div style={{fontSize:11,color:"#374151",marginTop:4,background:"#F9FAFB",padding:"5px 8px",borderRadius:6}}>{d.notes}</div>}
                      </div>
                      {role==="مدير"&&<button onClick={()=>setConfirm({type:"doc",id:d.id})} style={{background:"none",border:"none",cursor:"pointer",color:"#EF4444",fontSize:16,flexShrink:0}}>🗑️</button>}
                    </div>
                  </Card>
                ))}
              </div>
            );
          })}
          {siteDocs.length===0&&<EmptyState text="لا توجد وثائق"/>}
        </div>
      )}

      {modal==="doc"&&<DocForm2 siteId={site.id} siteName={site.name} userName={userName} onSave={d=>{setDocs([...docs,d]);showToast("✓ تم حفظ الوثيقة");}} onClose={()=>setModal(null)}/>}
      {modal==="req"&&<ReqForm siteId={site.id} siteName={site.name} userName={userName} onSave={r=>{setRequests([...requests,r]);addNotif({id:uid(),text:`📦 طلب مواد: ${r.material} — ${r.site}`,role:"مشتريات",read:false,time:new Date().toLocaleString("ar")});showToast("✓ تم الارسال للمشتريات");}} onClose={()=>setModal(null)}/>}
      {confirm&&<ConfirmModal msg="هتحذف العنصر ده؟" onYes={()=>confirm.type==="doc"?delDoc(confirm.id):delReq(confirm.id)} onNo={()=>setConfirm(null)}/>}
    </div>
  );
};

// ── ATTENDANCE ──────────────────────────────────────────────
const Attendance = ({role,attendance,setAttendance,sites,engineers,showToast,addNotif}) => {
  const [modal,setModal]=useState(false);
  const [confirm,setConfirm]=useState(null);
  const [f,setF]=useState({siteId:"",date:TODAY,engineer:"",engineerPresent:true,totalWorkers:"",absentWorkers:"",absentNames:"",notes:""});

  const todayRecs=attendance.filter(a=>a.date===TODAY);
  const save=()=>{
    if(!f.siteId||!f.engineer)return;
    const site=sites.find(s=>s.id===f.siteId);
    const rec={...f,id:uid(),siteName:site?.name||"",totalWorkers:+f.totalWorkers||0,absentWorkers:+f.absentWorkers||0};
    const upd=[...attendance,rec]; setAttendance(upd);
    if(+f.absentWorkers>5) addNotif({id:uid(),text:`⚠️ غياب ${f.absentWorkers} عمال — ${site?.name}`,role:"مدير",read:false,time:new Date().toLocaleString("ar")});
    if(!f.engineerPresent) addNotif({id:uid(),text:`⚠️ غياب المهندس ${f.engineer} — ${site?.name}`,role:"مدير",read:false,time:new Date().toLocaleString("ar")});
    showToast("✓ تم تسجيل الحضور"); setModal(false);
    setF({siteId:"",date:TODAY,engineer:"",engineerPresent:true,totalWorkers:"",absentWorkers:"",absentNames:"",notes:""});
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:18,fontWeight:800,color:"#1B2A4A"}}>الحضور والغياب</div>
        <Btn v="gold" onClick={()=>setModal(true)} style={{padding:"7px 14px",fontSize:12}}>+ تسجيل</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        <Card style={{margin:0,textAlign:"center"}}>
          <div style={{fontSize:24,fontWeight:800,color:"#10B981"}}>{todayRecs.reduce((s,a)=>s+(a.totalWorkers-a.absentWorkers),0)}</div>
          <div style={{fontSize:11,color:"#6B7280"}}>حاضرين اليوم</div>
        </Card>
        <Card style={{margin:0,textAlign:"center"}}>
          <div style={{fontSize:24,fontWeight:800,color:"#EF4444"}}>{todayRecs.reduce((s,a)=>s+a.absentWorkers,0)}</div>
          <div style={{fontSize:11,color:"#6B7280"}}>غائبين اليوم</div>
        </Card>
      </div>
      {attendance.length===0?<EmptyState text="لا توجد سجلات حضور"/>:attendance.slice().reverse().map(a=>(
        <Card key={a.id} style={{borderRight:`3px solid ${a.engineerPresent?"#10B981":"#EF4444"}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontWeight:700,fontSize:14}}>{a.siteName}</div>
              <div style={{fontSize:12,color:"#6B7280",marginTop:3}}>👷 {a.engineer} • {a.date}</div>
              <div style={{fontSize:12,color:"#374151",marginTop:4}}>
                حاضر: <b style={{color:"#10B981"}}>{a.totalWorkers-a.absentWorkers}</b> &nbsp;|&nbsp; غائب: <b style={{color:"#EF4444"}}>{a.absentWorkers}</b>
              </div>
              {!a.engineerPresent&&<div style={{fontSize:11,color:"#EF4444",marginTop:3}}>⚠️ المهندس غائب</div>}
              {a.absentNames&&<div style={{fontSize:11,color:"#6B7280",marginTop:4,background:"#FEF2F2",padding:"5px 8px",borderRadius:6}}>غائبون: {a.absentNames}</div>}
              {a.notes&&<div style={{fontSize:11,color:"#6B7280",marginTop:4,background:"#F9FAFB",padding:"5px 8px",borderRadius:6}}>ملاحظة: {a.notes}</div>}
            </div>
            {role==="مدير"&&<button onClick={()=>setConfirm(a.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#EF4444",fontSize:16}}>🗑️</button>}
          </div>
        </Card>
      ))}
      {modal&&(
        <Modal title="تسجيل الحضور" onClose={()=>setModal(false)}>
          <Sel label="الموقع" value={f.siteId} onChange={v=>setF({...f,siteId:v})} options={sites.map(s=>({value:s.id,label:s.name}))} required/>
          <Inp label="التاريخ" value={f.date} onChange={v=>setF({...f,date:v})} type="date" required/>
          <Sel label="المهندس المسؤول" value={f.engineer} onChange={v=>setF({...f,engineer:v})} options={engineers} required/>
          <div style={{marginBottom:13}}>
            <div style={{fontSize:13,fontWeight:600,color:"#374151",marginBottom:8}}>حضور المهندس</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setF({...f,engineerPresent:true})} style={{flex:1,padding:10,border:"none",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,background:f.engineerPresent?"#10B981":"#E5E7EB",color:f.engineerPresent?"#fff":"#374151"}}>✓ حاضر</button>
              <button onClick={()=>setF({...f,engineerPresent:false})} style={{flex:1,padding:10,border:"none",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,background:!f.engineerPresent?"#EF4444":"#E5E7EB",color:!f.engineerPresent?"#fff":"#374151"}}>✗ غائب</button>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1}}><Inp label="إجمالي العمال" value={f.totalWorkers} onChange={v=>setF({...f,totalWorkers:v})} type="number" placeholder="0"/></div>
            <div style={{flex:1}}><Inp label="الغائبون" value={f.absentWorkers} onChange={v=>setF({...f,absentWorkers:v})} type="number" placeholder="0"/></div>
          </div>
          <Inp label="أسماء الغائبين (اختياري)" value={f.absentNames} onChange={v=>setF({...f,absentNames:v})} placeholder="مثال: علي، سامي..."/>
          <Inp label="ملاحظات" value={f.notes} onChange={v=>setF({...f,notes:v})} placeholder="أي ملاحظات..." rows={2}/>
          <div style={{display:"flex",gap:8}}>
            <Btn full disabled={!f.siteId||!f.engineer} onClick={save}>حفظ</Btn>
            <Btn v="secondary" full onClick={()=>setModal(false)}>إلغاء</Btn>
          </div>
        </Modal>
      )}
      {confirm&&<ConfirmModal msg="هتحذف سجل الحضور ده؟" onYes={()=>{setAttendance(attendance.filter(a=>a.id!==confirm));setConfirm(null);showToast("تم الحذف");}} onNo={()=>setConfirm(null)}/>}
    </div>
  );
};

// ── DAILY REPORTS ────────────────────────────────────────────
const DailyReports = ({role,reports,setReports,sites,engineers,showToast,addNotif,userName}) => {
  const [modal,setModal]=useState(false);
  const [commentModal,setCommentModal]=useState(null);
  const [comment,setComment]=useState("");
  const [filterSite,setFilterSite]=useState("");
  const [confirm,setConfirm]=useState(null);
  const fileRef=useRef();
  const [f,setF]=useState({siteId:"",date:TODAY,engineer:"",works:"",subContractors:"",issues:"",photos:[],notes:""});

  const handlePhotos=e=>{
    Array.from(e.target.files).forEach(file=>{
      const reader=new FileReader();
      reader.onload=ev=>setF(prev=>({...prev,photos:[...prev.photos,{id:uid(),data:ev.target.result,name:file.name,comments:[]}]}));
      reader.readAsDataURL(file);
    });
  };

  const saveReport=()=>{
    if(!f.siteId||!f.engineer||!f.works.trim())return;
    const site=sites.find(s=>s.id===f.siteId);
    const rep={...f,id:uid(),siteName:site?.name||"",createdBy:userName,createdAt:new Date().toISOString()};
    setReports([...reports,rep]);
    addNotif({id:uid(),text:`📋 تقرير يومي: ${f.engineer} — ${site?.name}`,role:"مدير",read:false,time:new Date().toLocaleString("ar")});
    showToast("✓ تم رفع التقرير"); setModal(false);
    setF({siteId:"",date:TODAY,engineer:"",works:"",subContractors:"",issues:"",photos:[],notes:""});
  };

  const addComment=(repId,photoId)=>{
    if(!comment.trim())return;
    const upd=reports.map(r=>r.id===repId?{...r,photos:r.photos.map(p=>p.id===photoId?{...p,comments:[...p.comments,{text:comment,by:userName,time:new Date().toLocaleString("ar")}]}:p)}:r);
    setReports(upd); setComment(""); setCommentModal(null); showToast("✓ تم إضافة التعليق");
  };

  const filtered=filterSite?reports.filter(r=>r.siteId===filterSite):reports;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:18,fontWeight:800,color:"#1B2A4A"}}>التقارير اليومية</div>
        {role==="مهندس"&&<Btn v="gold" onClick={()=>setModal(true)} style={{padding:"7px 14px",fontSize:12}}>+ تقرير جديد</Btn>}
      </div>
      <select value={filterSite} onChange={e=>setFilterSite(e.target.value)} style={{width:"100%",padding:"10px 12px",border:"1px solid #D1D5DB",borderRadius:10,fontSize:13,direction:"rtl",fontFamily:"inherit",background:"#fff",marginBottom:12,color:"#111"}}>
        <option value="">كل المواقع</option>
        {sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      {filtered.length===0?<EmptyState text="لا توجد تقارير"/>:filtered.slice().reverse().map(rep=>(
        <Card key={rep.id} style={{borderRight:"3px solid #B8923C"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div>
              <div style={{fontWeight:800,fontSize:14,color:"#1B2A4A"}}>{rep.siteName}</div>
              <div style={{fontSize:12,color:"#6B7280"}}>👷 {rep.engineer} • {rep.date}</div>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <Badge label={rep.date===TODAY?"اليوم":"سابق"} color={rep.date===TODAY?"#10B981":"#6B7280"}/>
              {role==="مدير"&&<button onClick={()=>setConfirm(rep.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#EF4444",fontSize:16}}>🗑️</button>}
            </div>
          </div>
          <div style={{background:"#F9FAFB",borderRadius:10,padding:12,marginBottom:8}}>
            <div style={{fontSize:11,fontWeight:700,color:"#B8923C",marginBottom:4}}>🔨 الأعمال المنفذة</div>
            <div style={{fontSize:13,color:"#374151",whiteSpace:"pre-wrap"}}>{rep.works}</div>
          </div>
          {rep.subContractors&&<div style={{background:"#EFF6FF",borderRadius:10,padding:12,marginBottom:8}}><div style={{fontSize:11,fontWeight:700,color:"#3B82F6",marginBottom:4}}>👷 مقاولو الباطن</div><div style={{fontSize:13,color:"#374151",whiteSpace:"pre-wrap"}}>{rep.subContractors}</div></div>}
          {rep.issues&&<div style={{background:"#FEF2F2",borderRadius:10,padding:12,marginBottom:8}}><div style={{fontSize:11,fontWeight:700,color:"#EF4444",marginBottom:4}}>⚠️ مشاكل</div><div style={{fontSize:13,color:"#374151",whiteSpace:"pre-wrap"}}>{rep.issues}</div></div>}
          {rep.photos?.length>0&&(
            <div style={{marginBottom:8}}>
              <div style={{fontSize:11,fontWeight:700,color:"#6B7280",marginBottom:8}}>📸 الصور ({rep.photos.length})</div>
              <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:6}}>
                {rep.photos.map(ph=>(
                  <div key={ph.id} style={{flexShrink:0}}>
                    <img src={ph.data} alt={ph.name} style={{width:110,height:80,objectFit:"cover",borderRadius:8,display:"block"}}/>
                    {ph.comments?.map((c,i)=>(
                      <div key={i} style={{background:"#F0FDF4",borderRadius:6,padding:"4px 8px",fontSize:10,color:"#166534",marginTop:3,width:110,boxSizing:"border-box"}}>💬 {c.by}: {c.text}</div>
                    ))}
                    {role==="مدير"&&<button onClick={()=>setCommentModal({repId:rep.id,photoId:ph.id})} style={{marginTop:4,width:110,padding:"4px",background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:6,fontSize:10,cursor:"pointer",fontFamily:"inherit",color:"#1D4ED8"}}>+ تعليق</button>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {rep.notes&&<div style={{fontSize:12,color:"#6B7280",background:"#F9FAFB",padding:"8px 12px",borderRadius:8}}>📝 {rep.notes}</div>}
        </Card>
      ))}

      {modal&&(
        <Modal title="تقرير يومي جديد" onClose={()=>setModal(false)}>
          <Sel label="الموقع" value={f.siteId} onChange={v=>setF({...f,siteId:v})} options={sites.map(s=>({value:s.id,label:s.name}))} required/>
          <Inp label="التاريخ" value={f.date} onChange={v=>setF({...f,date:v})} type="date" required/>
          <Sel label="المهندس" value={f.engineer} onChange={v=>setF({...f,engineer:v})} options={engineers} required/>
          <Inp label="الأعمال المنفذة اليوم" value={f.works} onChange={v=>setF({...f,works:v})} placeholder="اكتب تفاصيل الأعمال..." rows={4} required/>
          <Inp label="مقاولو الباطن الموجودون" value={f.subContractors} onChange={v=>setF({...f,subContractors:v})} placeholder="مثال: مقاول بلاط - محمد..." rows={2}/>
          <Inp label="مشاكل أو ملاحظات" value={f.issues} onChange={v=>setF({...f,issues:v})} placeholder="أي مشاكل أو عقبات..." rows={2}/>
          <div style={{marginBottom:13}}>
            <div style={{fontSize:13,fontWeight:600,color:"#374151",marginBottom:8}}>📸 صور الموقع</div>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhotos} style={{display:"none"}}/>
            <button onClick={()=>fileRef.current.click()} style={{width:"100%",padding:12,border:"2px dashed #D1D5DB",borderRadius:10,background:"#F9FAFB",color:"#6B7280",cursor:"pointer",fontFamily:"inherit",fontSize:13}}>📷 اختار صور ({f.photos.length} صورة)</button>
            {f.photos.length>0&&(
              <div style={{display:"flex",gap:8,marginTop:8,overflowX:"auto",paddingBottom:4}}>
                {f.photos.map((p,i)=>(
                  <div key={p.id} style={{flexShrink:0,position:"relative"}}>
                    <img src={p.data} alt="" style={{width:72,height:54,objectFit:"cover",borderRadius:6}}/>
                    <button onClick={()=>setF(prev=>({...prev,photos:prev.photos.filter((_,j)=>j!==i)}))} style={{position:"absolute",top:-4,right:-4,background:"#EF4444",color:"#fff",border:"none",borderRadius:99,width:18,height:18,fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Inp label="ملاحظات إضافية" value={f.notes} onChange={v=>setF({...f,notes:v})} placeholder="أي ملاحظات أخرى" rows={2}/>
          <div style={{display:"flex",gap:8}}>
            <Btn full disabled={!f.siteId||!f.engineer||!f.works.trim()} onClick={saveReport}>رفع التقرير</Btn>
            <Btn v="secondary" full onClick={()=>setModal(false)}>إلغاء</Btn>
          </div>
        </Modal>
      )}
      {commentModal&&(
        <Modal title="تعليق على الصورة" onClose={()=>setCommentModal(null)}>
          <Inp label="التعليق" value={comment} onChange={setComment} placeholder="اكتب تعليقك..." rows={3} required/>
          <div style={{display:"flex",gap:8}}>
            <Btn full disabled={!comment.trim()} onClick={()=>addComment(commentModal.repId,commentModal.photoId)}>إرسال</Btn>
            <Btn v="secondary" full onClick={()=>setCommentModal(null)}>إلغاء</Btn>
          </div>
        </Modal>
      )}
      {confirm&&<ConfirmModal msg="هتحذف التقرير ده؟" onYes={()=>{setReports(reports.filter(r=>r.id!==confirm));setConfirm(null);showToast("تم الحذف");}} onNo={()=>setConfirm(null)}/>}
    </div>
  );
};

// ── PROCUREMENT ──────────────────────────────────────────────
const Procurement = ({role,requests,setRequests,addNotif,showToast}) => {
  const [filter,setFilter]=useState("الكل");
  const [rejectModal,setRejectModal]=useState(null);
  const [rejectReason,setRejectReason]=useState("");
  const [confirm,setConfirm]=useState(null);
  const filtered=filter==="الكل"?requests:requests.filter(r=>r.phase===filter);

  const advance=r=>{
    const next=PHASE_NEXT[r.phase]; if(!next)return;
    setRequests(requests.map(x=>x.id===r.id?{...x,phase:next}:x));
    addNotif({id:uid(),text:`✅ "${r.material}" → ${next}`,role:"مهندس",read:false,time:new Date().toLocaleString("ar")});
    showToast(`✓ تم: ${next}`);
  };
  const reject=r=>{
    setRequests(requests.map(x=>x.id===r.id?{...x,phase:"مرفوض",rejectedReason:rejectReason}:x));
    addNotif({id:uid(),text:`❌ رُفض: "${r.material}" — ${rejectReason}`,role:"مهندس",read:false,time:new Date().toLocaleString("ar")});
    setRejectModal(null); setRejectReason(""); showToast("تم الرفض");
  };

  return (
    <div>
      <div style={{fontSize:18,fontWeight:800,color:"#1B2A4A",marginBottom:4}}>المشتريات</div>
      <div style={{fontSize:12,color:"#9CA3AF",marginBottom:12}}>{requests.filter(r=>r.phase==="طلب").length} طلب جديد • {requests.length} إجمالي</div>
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:8,marginBottom:12}}>
        {["الكل",...PHASES,"مرفوض"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{padding:"6px 13px",border:"none",borderRadius:20,cursor:"pointer",whiteSpace:"nowrap",fontSize:11,fontWeight:600,fontFamily:"inherit",background:filter===f?"#1B2A4A":"#E5E7EB",color:filter===f?"#B8923C":"#374151"}}>{f}</button>
        ))}
      </div>
      {filtered.length===0?<EmptyState text="لا توجد طلبات"/>:filtered.map(r=>(
        <Card key={r.id}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div>
              <div style={{fontSize:10,color:"#9CA3AF"}}>{r.id}</div>
              <div style={{fontWeight:700,fontSize:14}}>{r.material}</div>
              <div style={{fontSize:12,color:"#6B7280"}}>{r.site} • {r.qty} {r.unit}</div>
              <div style={{fontSize:11,color:"#9CA3AF"}}>{r.requestedBy} • {r.date}</div>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <Badge label={r.phase} color={PHASE_COLOR[r.phase]||"#6B7280"}/>
              {role==="مدير"&&<button onClick={()=>setConfirm(r.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#EF4444",fontSize:16}}>🗑️</button>}
            </div>
          </div>
          {r.phase!=="مرفوض"&&<PhaseBar current={r.phase}/>}
          {r.rejectedReason&&<div style={{marginTop:8,fontSize:11,color:"#DC2626",background:"#FEF2F2",padding:"6px 10px",borderRadius:6}}>سبب الرفض: {r.rejectedReason}</div>}
          {r.notes&&<div style={{marginTop:6,fontSize:11,color:"#6B7280",background:"#F9FAFB",padding:"6px 10px",borderRadius:6}}>{r.notes}</div>}
          {(role==="مدير"||role==="مشتريات")&&r.phase!=="صرف"&&r.phase!=="مرفوض"&&(
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <Btn full onClick={()=>advance(r)}>✓ {PHASE_NEXT[r.phase]?`→ ${PHASE_NEXT[r.phase]}`:"مكتمل"}</Btn>
              <Btn v="red" onClick={()=>setRejectModal(r)}>رفض</Btn>
            </div>
          )}
        </Card>
      ))}
      {rejectModal&&(
        <Modal title="سبب الرفض" onClose={()=>setRejectModal(null)}>
          <Inp label="السبب" value={rejectReason} onChange={setRejectReason} placeholder="اكتب السبب..." required/>
          <div style={{display:"flex",gap:8}}>
            <Btn v="red" full disabled={!rejectReason.trim()} onClick={()=>reject(rejectModal)}>تأكيد الرفض</Btn>
            <Btn v="secondary" full onClick={()=>setRejectModal(null)}>إلغاء</Btn>
          </div>
        </Modal>
      )}
      {confirm&&<ConfirmModal msg="هتحذف الطلب ده؟" onYes={()=>{setRequests(requests.filter(r=>r.id!==confirm));setConfirm(null);showToast("تم الحذف");}} onNo={()=>setConfirm(null)}/>}
    </div>
  );
};

// ── FORMAL REQUESTS ──────────────────────────────────────────
const FormalRequests = ({role,formalReqs,setFormalReqs,sites,showToast,addNotif,userName}) => {
  const [modal,setModal]=useState(false);
  const [confirm,setConfirm]=useState(null);
  const [f,setF]=useState({siteId:"",date:TODAY,type:"طلب بلدية",subject:"",details:""});
  const statusColor={"جديد":"#3B82F6","قيد المعالجة":"#F59E0B","مكتمل":"#10B981","مرفوض":"#EF4444"};

  const save=()=>{
    if(!f.siteId||!f.subject.trim())return;
    const site=sites.find(s=>s.id===f.siteId);
    const req={...f,id:uid(),siteName:site?.name||"",createdBy:userName,status:"جديد",createdAt:TODAY};
    setFormalReqs([...formalReqs,req]);
    addNotif({id:uid(),text:`📋 ${f.type}: ${f.subject} — ${site?.name}`,role:"مدير",read:false,time:new Date().toLocaleString("ar")});
    showToast("✓ تم إرسال الطلب"); setModal(false);
    setF({siteId:"",date:TODAY,type:"طلب بلدية",subject:"",details:""});
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:18,fontWeight:800,color:"#1B2A4A"}}>الطلبات الرسمية</div>
        {(role==="مهندس"||role==="مدير")&&<Btn v="gold" onClick={()=>setModal(true)} style={{padding:"7px 14px",fontSize:12}}>+ طلب جديد</Btn>}
      </div>
      {formalReqs.length===0?<EmptyState text="لا توجد طلبات رسمية"/>:formalReqs.slice().reverse().map(r=>(
        <Card key={r.id} style={{borderRight:`3px solid ${statusColor[r.status]||"#6B7280"}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div>
              <Badge label={r.type} color="#8B5CF6"/>
              <div style={{fontWeight:700,fontSize:14,marginTop:6}}>{r.subject}</div>
              <div style={{fontSize:12,color:"#6B7280"}}>{r.siteName} • {r.date} • {r.createdBy}</div>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <Badge label={r.status} color={statusColor[r.status]}/>
              {role==="مدير"&&<button onClick={()=>setConfirm(r.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#EF4444",fontSize:16}}>🗑️</button>}
            </div>
          </div>
          {r.details&&<div style={{fontSize:12,color:"#374151",background:"#F9FAFB",padding:"8px 12px",borderRadius:8,marginTop:8}}>{r.details}</div>}
          {role==="مدير"&&r.status!=="مكتمل"&&r.status!=="مرفوض"&&(
            <div style={{display:"flex",gap:8,marginTop:10}}>
              {r.status==="جديد"&&<Btn v="secondary" style={{flex:1,fontSize:12}} onClick={()=>setFormalReqs(formalReqs.map(x=>x.id===r.id?{...x,status:"قيد المعالجة"}:x))}>قيد المعالجة</Btn>}
              <Btn style={{flex:1,fontSize:12}} onClick={()=>{setFormalReqs(formalReqs.map(x=>x.id===r.id?{...x,status:"مكتمل"}:x));showToast("✓ تم الإنجاز");}}>✓ مكتمل</Btn>
              <Btn v="red" style={{flex:1,fontSize:12}} onClick={()=>{setFormalReqs(formalReqs.map(x=>x.id===r.id?{...x,status:"مرفوض"}:x));showToast("تم الرفض");}}>رفض</Btn>
            </div>
          )}
        </Card>
      ))}
      {modal&&(
        <Modal title="طلب رسمي جديد" onClose={()=>setModal(false)}>
          <Sel label="الموقع" value={f.siteId} onChange={v=>setF({...f,siteId:v})} options={sites.map(s=>({value:s.id,label:s.name}))} required/>
          <Sel label="نوع الطلب" value={f.type} onChange={v=>setF({...f,type:v})} options={["طلب بلدية","طلب للاستشاري","مراسلة رسمية","طلب جهة حكومية","أخرى"]} required/>
          <Inp label="التاريخ" value={f.date} onChange={v=>setF({...f,date:v})} type="date"/>
          <Inp label="موضوع الطلب" value={f.subject} onChange={v=>setF({...f,subject:v})} placeholder="مثال: طلب رخصة صب الخرازة" required/>
          <Inp label="التفاصيل" value={f.details} onChange={v=>setF({...f,details:v})} placeholder="تفاصيل الطلب..." rows={4}/>
          <div style={{display:"flex",gap:8}}>
            <Btn full disabled={!f.siteId||!f.subject.trim()} onClick={save}>إرسال الطلب</Btn>
            <Btn v="secondary" full onClick={()=>setModal(false)}>إلغاء</Btn>
          </div>
        </Modal>
      )}
      {confirm&&<ConfirmModal msg="هتحذف الطلب ده؟" onYes={()=>{setFormalReqs(formalReqs.filter(r=>r.id!==confirm));setConfirm(null);showToast("تم الحذف");}} onNo={()=>setConfirm(null)}/>}
    </div>
  );
};

// ── NOTIFICATIONS ────────────────────────────────────────────
const Notifications = ({notifs,setNotifs,role}) => {
  const mine=notifs.filter(n=>role==="مدير"||n.role===role);
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:18,fontWeight:800,color:"#1B2A4A"}}>الإشعارات</div>
        {mine.some(n=>!n.read)&&<Btn v="secondary" onClick={()=>setNotifs(notifs.map(n=>({...n,read:true})))} style={{fontSize:11,padding:"5px 12px"}}>قراءة الكل</Btn>}
      </div>
      {mine.length===0?<EmptyState text="لا توجد إشعارات"/>:mine.slice().reverse().map(n=>(
        <div key={n.id} onClick={()=>setNotifs(notifs.map(x=>x.id===n.id?{...x,read:true}:x))} style={{background:n.read?"#fff":"#FFF7ED",borderRadius:12,padding:"14px 16px",marginBottom:10,boxShadow:"0 1px 4px rgba(0,0,0,0.07)",cursor:"pointer",borderRight:`4px solid ${n.read?"#E5E7EB":"#B8923C"}`}}>
          <div style={{fontSize:13,fontWeight:n.read?400:700,color:"#111"}}>{n.text}</div>
          <div style={{fontSize:11,color:"#9CA3AF",marginTop:4}}>{n.time}</div>
        </div>
      ))}
    </div>
  );
};


// ── DAMAC ISSUES ─────────────────────────────────────────────
const DamacIssues = ({role,damacIssues,setDamacIssues,sites,showToast,addNotif,userName}) => {
  const [modal,setModal]=useState(false);
  const [confirm,setConfirm]=useState(null);
  const [filter,setFilter]=useState("الكل");
  const [f,setF]=useState({siteId:"",date:TODAY,type:"ازالة رمل",title:"",details:"",status:"مفتوح",priority:"متوسط"});
  const issueTypes=["ازالة رمل","سور خارجي","Safety","مخلفات بناء","طريق مسدود","اضرار موقع","شكوى جار","أخرى"];
  const statusColor={"مفتوح":"#EF4444","قيد المعالجة":"#F59E0B","مغلق":"#10B981"};
  const priorityColor={"عالي":"#EF4444","متوسط":"#F59E0B","منخفض":"#10B981"};

  const save=()=>{
    if(!f.title.trim())return;
    const site=sites.find(s=>s.id===f.siteId);
    const issue={...f,id:uid(),siteName:site?.name||"عام",createdBy:userName,createdAt:TODAY};
    const upd=[...damacIssues,issue]; setDamacIssues(upd);
    if(f.priority==="عالي") addNotif({id:uid(),text:`🚨 مشكلة DAMAC عالية الاولوية: ${f.title}`,role:"مدير",read:false,time:new Date().toLocaleString("ar")});
    showToast("✓ تم تسجيل المشكلة"); setModal(false);
    setF({siteId:"",date:TODAY,type:"ازالة رمل",title:"",details:"",status:"مفتوح",priority:"متوسط"});
  };

  const filtered=filter==="الكل"?damacIssues:damacIssues.filter(i=>i.status===filter);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <div style={{fontSize:18,fontWeight:800,color:"#1B2A4A"}}>مشاكل DAMAC</div>
        <Btn v="gold" onClick={()=>setModal(true)} style={{padding:"7px 14px",fontSize:12}}>+ مشكلة جديدة</Btn>
      </div>
      <div style={{fontSize:12,color:"#9CA3AF",marginBottom:14}}>
        {damacIssues.filter(i=>i.status==="مفتوح").length} مفتوح • {damacIssues.filter(i=>i.priority==="عالي"&&i.status==="مفتوح").length} عالي الاولوية
      </div>

      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {["الكل","مفتوح","قيد المعالجة","مغلق"].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} style={{padding:"5px 12px",border:"none",borderRadius:20,cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"inherit",background:filter===s?"#1B2A4A":"#E5E7EB",color:filter===s?"#B8923C":"#374151"}}>{s}</button>
        ))}
      </div>

      {filtered.length===0?<EmptyState text="لا توجد مشاكل مسجلة"/>:filtered.slice().reverse().map(issue=>(
        <Card key={issue.id} style={{borderRight:`4px solid ${statusColor[issue.status]||"#6B7280"}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                <Badge label={issue.type} color="#8B5CF6"/>
                <Badge label={issue.priority} color={priorityColor[issue.priority]}/>
              </div>
              <div style={{fontWeight:700,fontSize:14}}>{issue.title}</div>
              <div style={{fontSize:12,color:"#6B7280",marginTop:2}}>{issue.siteName} • {issue.date} • {issue.createdBy}</div>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <Badge label={issue.status} color={statusColor[issue.status]}/>
              {role==="مدير"&&<button onClick={()=>setConfirm(issue.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#EF4444",fontSize:16}}>🗑️</button>}
            </div>
          </div>
          {issue.details&&<div style={{fontSize:12,color:"#374151",background:"#F9FAFB",padding:"8px 12px",borderRadius:8,marginBottom:10}}>{issue.details}</div>}
          {role==="مدير"&&issue.status!=="مغلق"&&(
            <div style={{display:"flex",gap:8}}>
              {issue.status==="مفتوح"&&<Btn v="secondary" style={{flex:1,fontSize:12}} onClick={()=>setDamacIssues(damacIssues.map(x=>x.id===issue.id?{...x,status:"قيد المعالجة"}:x))}>قيد المعالجة</Btn>}
              <Btn style={{flex:1,fontSize:12}} onClick={()=>{setDamacIssues(damacIssues.map(x=>x.id===issue.id?{...x,status:"مغلق"}:x));showToast("✓ تم الاغلاق");}}>✓ اغلاق</Btn>
            </div>
          )}
        </Card>
      ))}

      {modal&&(
        <Modal title="تسجيل مشكلة DAMAC" onClose={()=>setModal(false)}>
          <Sel label="الموقع (اختياري)" value={f.siteId} onChange={v=>setF({...f,siteId:v})} options={[{value:"",label:"عام - غير مرتبط بموقع"},...sites.map(s=>({value:s.id,label:s.name}))]}/>
          <Inp label="التاريخ" value={f.date} onChange={v=>setF({...f,date:v})} type="date"/>
          <Sel label="نوع المشكلة" value={f.type} onChange={v=>setF({...f,type:v})} options={issueTypes} required/>
          <Inp label="عنوان المشكلة" value={f.title} onChange={v=>setF({...f,title:v})} placeholder="وصف مختصر للمشكلة" required/>
          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1}}><Sel label="الاولوية" value={f.priority} onChange={v=>setF({...f,priority:v})} options={["عالي","متوسط","منخفض"]}/></div>
            <div style={{flex:1}}><Sel label="الحالة" value={f.status} onChange={v=>setF({...f,status:v})} options={["مفتوح","قيد المعالجة","مغلق"]}/></div>
          </div>
          <Inp label="التفاصيل" value={f.details} onChange={v=>setF({...f,details:v})} placeholder="تفاصيل المشكلة والاجراءات المطلوبة..." rows={4}/>
          <div style={{display:"flex",gap:8}}>
            <Btn full disabled={!f.title.trim()} onClick={save}>تسجيل المشكلة</Btn>
            <Btn v="secondary" full onClick={()=>setModal(false)}>الغاء</Btn>
          </div>
        </Modal>
      )}
      {confirm&&<ConfirmModal msg="هتحذف المشكلة دي؟" onYes={()=>{setDamacIssues(damacIssues.filter(i=>i.id!==confirm));setConfirm(null);showToast("تم الحذف");}} onNo={()=>setConfirm(null)}/>}
    </div>
  );
};

// ── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const [user,setUser]=useState(null);
  const [screen,setScreen]=useState("dashboard");
  const [selectedSite,setSelectedSite]=useState(null);

  const [sites,setSitesR]=useState(()=>load("ch_sites",[]));
  const [requests,setRequestsR]=useState(()=>load("ch_requests",[]));
  const [docs,setDocsR]=useState(()=>load("ch_docs",[]));
  const [notifs,setNotifsR]=useState(()=>load("ch_notifs",[]));
  const [attendance,setAttendanceR]=useState(()=>load("ch_att",[]));
  const [reports,setReportsR]=useState(()=>load("ch_reports",[]));
  const [formalReqs,setFormalR]=useState(()=>load("ch_formal",[]));  const [damacIssues,setDamacIssuesR]=useState(()=>load("ch_damac",[]));  const setDamacIssues=v=>{setDamacIssuesR(v);save("ch_damac",v);};

  const setSites=v=>{setSitesR(v);save("ch_sites",v);};
  const setRequests=v=>{setRequestsR(v);save("ch_requests",v);};
  const setDocs=v=>{setDocsR(v);save("ch_docs",v);};
  const setNotifs=v=>{setNotifsR(v);save("ch_notifs",v);};
  const setAttendance=v=>{setAttendanceR(v);save("ch_att",v);};
  const setReports=v=>{setReportsR(v);save("ch_reports",v);};
  const setFormalReqs=v=>{setFormalR(v);save("ch_formal",v);};

  const [toast,setToast]=useState("");
  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(""),2500);};
  const addNotif=n=>{const upd=[n,...notifs];setNotifs(upd);};

  const engineers=ENGINEERS_DEFAULT;
  const unread=notifs.filter(n=>!n.read&&(user?.role==="مدير"||n.role===user?.role)).length;

  if(!user) return <Login onLogin={(role,name)=>setUser({role,name})}/>;

  const nav=[
    {key:"dashboard",label:"الرئيسية",icon:"🏠"},
    {key:"sites",label:"المواقع",icon:"🏗️"},
    {key:"reports",label:"التقارير",icon:"📋"},
    {key:"ai",label:"الذكاء AI",icon:"🤖"},
    {key:"more",label:"المزيد",icon:"⋯"},
  ];

  const moreItems=[
    {key:"ai",label:"تحليل AI",icon:"🤖"},
    {key:"attendance",label:"الحضور والغياب",icon:"👷"},
    {key:"procurement",label:"المشتريات",icon:"📦"},
    {key:"formal",label:"الطلبات الرسمية",icon:"📝"},
    {key:"damac",label:"مشاكل DAMAC",icon:"⚠️"},
    {key:"notifs",label:`الإشعارات${unread>0?` (${unread})`:""}`,icon:"🔔"},
  ];

  return (
    <div style={{fontFamily:"'Cairo','Segoe UI',sans-serif",direction:"rtl",background:"#F3F4F6",minHeight:"100vh"}}>
      <div style={{background:"#1B2A4A",padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:100}}>
        <div style={{color:"#B8923C",fontWeight:800,fontSize:16}}>🏗️ Capital Homes</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:12,color:"#94A3B8"}}>{user.name}</span>
          <Badge label={user.role} color={ROLE_COLOR[user.role]||"#6B7280"}/>
          {unread>0&&<span style={{background:"#EF4444",color:"#fff",borderRadius:99,fontSize:10,fontWeight:800,padding:"2px 7px"}}>{unread}</span>}
          <button onClick={()=>{setUser(null);setScreen("dashboard");setSelectedSite(null);}} style={{background:"none",border:"1px solid #374151",color:"#9CA3AF",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>خروج</button>
        </div>
      </div>

      <div style={{padding:"16px 16px 82px"}}>
        {screen==="dashboard"&&<Dashboard role={user.role} sites={sites} requests={requests} attendance={attendance} notifs={notifs}/>}
        {screen==="sites"&&!selectedSite&&<SitesList sites={sites} setSites={setSites} role={user.role} onSelect={s=>setSelectedSite(s)} engineers={engineers} showToast={showToast}/>}
        {screen==="sites"&&selectedSite&&<SiteDetail site={selectedSite} role={user.role} userName={user.name} requests={requests} docs={docs} setRequests={setRequests} setDocs={setDocs} addNotif={addNotif} onBack={()=>setSelectedSite(null)} showToast={showToast} sites={sites} setSites={setSites}/>}
        {screen==="reports"&&<DailyReports role={user.role} reports={reports} setReports={setReports} sites={sites} engineers={engineers} showToast={showToast} addNotif={addNotif} userName={user.name}/>}
        {screen==="ai"&&<AIAnalysis sites={sites} reports={reports} attendance={attendance} requests={requests} role={user.role}/>}
        {screen==="attendance"&&<Attendance role={user.role} attendance={attendance} setAttendance={setAttendance} sites={sites} engineers={engineers} showToast={showToast} addNotif={addNotif}/>}
        {screen==="procurement"&&<Procurement role={user.role} requests={requests} setRequests={setRequests} addNotif={addNotif} showToast={showToast}/>}
        {screen==="formal"&&<FormalRequests role={user.role} formalReqs={formalReqs} setFormalReqs={setFormalReqs} sites={sites} showToast={showToast} addNotif={addNotif} userName={user.name}/>}
        {screen==="damac"&&<DamacIssues role={user.role} damacIssues={damacIssues} setDamacIssues={setDamacIssues} sites={sites} showToast={showToast} addNotif={addNotif} userName={user.name}/> }
        {screen==="notifs"&&<Notifications notifs={notifs} setNotifs={setNotifs} role={user.role}/>}
        {screen==="more"&&(
          <div>
            <div style={{fontSize:18,fontWeight:800,color:"#1B2A4A",marginBottom:14}}>المزيد</div>
            {moreItems.map(item=>(
              <div key={item.key} onClick={()=>setScreen(item.key)} style={{background:"#fff",borderRadius:12,padding:16,marginBottom:10,boxShadow:"0 1px 4px rgba(0,0,0,0.08)",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:24}}>{item.icon}</span><span style={{fontWeight:700,fontSize:15,color:"#1B2A4A"}}>{item.label}</span></div>
                <span style={{color:"#9CA3AF",fontSize:18}}>←</span>
              </div>
            ))}
            <div style={{marginTop:20,padding:14,background:"#fff",borderRadius:12,textAlign:"center"}}>
              <div style={{fontSize:11,color:"#9CA3AF"}}>Capital Homes Contracting</div>
              <div style={{fontSize:11,color:"#9CA3AF"}}>DAMAC Hills 2 — Dubai, UAE</div>
              <div style={{fontSize:12,color:"#B8923C",marginTop:4,fontWeight:700}}>v3.0</div>
            </div>
          </div>
        )}
      </div>
      <Toast msg={toast}/>
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:"1px solid #E5E7EB",display:"flex",zIndex:100}}>
        {nav.map(item=>(
          <button key={item.key} onClick={()=>{setScreen(item.key);setSelectedSite(null);}} style={{flex:1,padding:"10px 4px 8px",border:"none",background:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontFamily:"inherit",position:"relative"}}>
            <span style={{fontSize:20}}>{item.icon}</span>
            <span style={{fontSize:10,fontWeight:600,color:screen===item.key?"#1B2A4A":"#9CA3AF"}}>{item.label}</span>
            {screen===item.key&&<div style={{width:20,height:3,background:"#B8923C",borderRadius:99}}/>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── AI ANALYSIS SCREEN ───────────────────────────────────────
