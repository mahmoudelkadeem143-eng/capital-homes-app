import { useState } from "react";

const Card = ({ children, style = {} }) => (
  <div style={{ background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 1px 6px rgba(0,0,0,0.09)", marginBottom: 12, ...style }}>{children}</div>
);
const SecTitle = ({ children }) => (
  <div style={{ fontSize: 13, fontWeight: 800, color: "#1B2A4A", borderRight: "3px solid #B8923C", paddingRight: 10, marginBottom: 10, marginTop: 4 }}>{children}</div>
);
const RiskBadge = ({ level }) => {
  const c = level === "عالي" ? "#EF4444" : level === "متوسط" ? "#F59E0B" : "#10B981";
  return <span style={{ background: c + "22", color: c, border: `1px solid ${c}44`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{level}</span>;
};

export const AIAnalysis = ({ sites, reports, attendance, requests }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const calcLocal = () => {
    const today = new Date().toISOString().split("T")[0];
    const last7 = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    const attR = attendance.filter(a => a.date >= last7);
    const totalW = attR.reduce((s, a) => s + (+a.totalWorkers || 0), 0);
    const totalAbs = attR.reduce((s, a) => s + (+a.absentWorkers || 0), 0);
    const absenceRate = totalW > 0 ? Math.round((totalAbs / totalW) * 100) : 0;
    const engAbsent = attR.filter(a => !a.engineerPresent).length;
    const recentIds = new Set(reports.filter(r => r.date >= last7).map(r => r.siteId));
    const silentSites = sites.filter(s => s.status === "جارٍ التنفيذ" && !recentIds.has(s.id));
    const avgProgress = sites.length ? Math.round(sites.reduce((a, s) => a + s.progress, 0) / sites.length) : 0;
    const pendingReqs = requests.filter(r => r.phase === "طلب").length;
    const stuckReqs = requests.filter(r => ["عرض سعر", "اعتماد"].includes(r.phase)).length;
    const atRisk = sites.filter(s => s.status === "متوقف" || (s.status === "جارٍ التنفيذ" && s.progress < 20));
    const todayReports = reports.filter(r => r.date === today).length;
    return { absenceRate, totalAbs, totalW, engAbsent, silentSites, avgProgress, pendingReqs, stuckReqs, atRisk, todayReports };
  };

  const buildFallback = (l) => ({
    overall_score: Math.max(10, 100 - l.absenceRate * 2 - l.silentSites.length * 5 - l.pendingReqs * 2 - l.atRisk.length * 8),
    risk_level: l.atRisk.length > 3 || l.absenceRate > 20 ? "عالي" : l.atRisk.length > 0 || l.silentSites.length > 2 ? "متوسط" : "منخفض",
    summary: `متوسط الإنجاز ${l.avgProgress}%، غياب ${l.absenceRate}%، ${l.silentSites.length} موقع بدون تقارير.`,
    kpis: [
      { label: "متوسط الإنجاز", value: `${l.avgProgress}%`, status: l.avgProgress > 50 ? "جيد" : l.avgProgress > 25 ? "تحذير" : "خطر", icon: "📈" },
      { label: "نسبة الغياب", value: `${l.absenceRate}%`, status: l.absenceRate < 10 ? "جيد" : l.absenceRate < 20 ? "تحذير" : "خطر", icon: "👷" },
      { label: "طلبات معلقة", value: String(l.pendingReqs), status: l.pendingReqs < 3 ? "جيد" : l.pendingReqs < 7 ? "تحذير" : "خطر", icon: "📦" },
      { label: "تقارير اليوم", value: String(l.todayReports), status: l.todayReports > 0 ? "جيد" : "تحذير", icon: "📋" },
    ],
    deviations: [
      ...l.silentSites.map(s => ({ site: s.name, issue: "لا توجد تقارير منذ أكثر من 7 أيام", risk: "متوسط", action: "التواصل مع المهندس المسؤول فوراً" })),
      ...l.atRisk.map(s => ({ site: s.name, issue: s.status === "متوقف" ? "الموقع متوقف" : `إنجاز منخفض (${s.progress}%)`, risk: "عالي", action: "مراجعة أسباب التأخير وإعداد خطة تعافي" })),
    ],
    recommendations: [
      l.absenceRate > 15 ? { priority: "عاجل", text: `نسبة الغياب ${l.absenceRate}% — مراجعة سياسة الحضور وتوفير بديل للعمالة` } : null,
      l.silentSites.length > 0 ? { priority: "عاجل", text: `${l.silentSites.length} موقع بدون تقارير — متابعة فورية مع المهندسين` } : null,
      l.pendingReqs > 3 ? { priority: "مهم", text: `${l.pendingReqs} طلب مواد معلق — تسريع دورة المشتريات` } : null,
      l.stuckReqs > 0 ? { priority: "مهم", text: `${l.stuckReqs} طلب متأخر في مرحلة عرض السعر أو الاعتماد` } : null,
      { priority: "اقتراح", text: "تفعيل التقارير اليومية لجميع المواقع النشطة لتحسين دقة التحليل" },
    ].filter(Boolean),
    forecast: `بناءً على المعدل الحالي، يُتوقع الوصول إلى ${Math.min(100, l.avgProgress + 5)}% إنجاز خلال الأسبوع القادم.`,
  });

  const runAI = async () => {
    setLoading(true); setError(""); setResult(null);
    const l = calcLocal();
    const prompt = `أنت محلل إدارة مشاريع إنشائية. حلل هذه البيانات لمشاريع Capital Homes في DAMAC Hills 2 دبي.

البيانات:
- إجمالي المواقع: ${sites.length}
- متوسط الإنجاز: ${l.avgProgress}%
- مواقع نشطة: ${sites.filter(s => s.status === "جارٍ التنفيذ").length}
- مواقع متوقفة: ${sites.filter(s => s.status === "متوقف").length}
- نسبة غياب العمال (7 أيام): ${l.absenceRate}%
- غياب المهندسين: ${l.engAbsent} حالة
- مواقع بدون تقارير: ${l.silentSites.length} (${l.silentSites.map(s => s.name).slice(0, 5).join("، ")})
- تقارير اليوم: ${l.todayReports}
- طلبات معلقة: ${l.pendingReqs}
- طلبات متأخرة: ${l.stuckReqs}
- مواقع في خطر: ${l.atRisk.map(s => `${s.name}(${s.progress}%)`).join("، ") || "لا"}
- آخر الأعمال: ${reports.slice(-5).map(r => r.works?.slice(0, 60)).join(" | ")}

أعطني JSON فقط بهذا الشكل، بدون أي نص خارجه:
{"overall_score":رقم0-100,"risk_level":"عالي أو متوسط أو منخفض","summary":"جملة واحدة","kpis":[{"label":"","value":"","status":"جيد أو تحذير أو خطر","icon":"إيموجي"}],"deviations":[{"site":"","issue":"","risk":"عالي أو متوسط","action":""}],"recommendations":[{"priority":"عاجل أو مهم أو اقتراح","text":""}],"forecast":""}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }] })
      });
      const data = await res.json();
      const text = data.content?.map(c => c.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      setResult(JSON.parse(clean));
    } catch {
      setError("تعذر الاتصال بالذكاء الاصطناعي — عرض التحليل المحلي");
      setResult(buildFallback(l));
    }
    setLoading(false);
  };

  const sc = { "جيد": "#10B981", "تحذير": "#F59E0B", "خطر": "#EF4444" };
  const pc = { "عاجل": "#EF4444", "مهم": "#F59E0B", "اقتراح": "#3B82F6" };
  const scoreColor = result ? result.overall_score >= 70 ? "#10B981" : result.overall_score >= 40 ? "#F59E0B" : "#EF4444" : "#B8923C";

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#1B2A4A", marginBottom: 4 }}>🤖 تحليل الذكاء الاصطناعي</div>
      <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 16 }}>تحليل شامل للأداء والانحرافات والتوقعات</div>

      {!result && !loading && (
        <Card style={{ textAlign: "center", padding: 36 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🤖</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1B2A4A", marginBottom: 8 }}>تحليل ذكي لمشاريعك</div>
          <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20, lineHeight: 1.8 }}>
            سيقرأ كل التقارير والبيانات<br/>ويعطيك تحليل كامل وتوصيات فورية
          </div>
          <button onClick={runAI} style={{ background: "#1B2A4A", color: "#B8923C", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
            🚀 ابدأ التحليل
          </button>
          {sites.length === 0 && <div style={{ fontSize: 12, color: "#F59E0B", marginTop: 12 }}>⚠️ أضف مواقع أولاً للحصول على تحليل دقيق</div>}
        </Card>
      )}

      {loading && (
        <Card style={{ textAlign: "center", padding: 44 }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>⚙️</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1B2A4A", marginBottom: 6 }}>جاري التحليل...</div>
          <div style={{ fontSize: 12, color: "#9CA3AF" }}>{reports.length} تقرير • {attendance.length} سجل حضور • {sites.length} موقع</div>
          <div style={{ marginTop: 14, background: "#E5E7EB", borderRadius: 99, height: 6 }}>
            <div style={{ width: "70%", background: "#B8923C", height: 6, borderRadius: 99 }} />
          </div>
        </Card>
      )}

      {error && <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#92400E", marginBottom: 12 }}>⚠️ {error}</div>}

      {result && (
        <div>
          <Card style={{ background: "linear-gradient(135deg,#1B2A4A,#0f1a2e)", color: "#fff", textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#B8923C", fontWeight: 700, marginBottom: 8 }}>🤖 التقييم الإجمالي</div>
            <div style={{ fontSize: 60, fontWeight: 900, color: scoreColor }}>{result.overall_score}</div>
            <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 10 }}>نقطة من 100</div>
            <div style={{ display: "inline-block", background: (result.risk_level === "عالي" ? "#EF4444" : result.risk_level === "متوسط" ? "#F59E0B" : "#10B981") + "33", color: result.risk_level === "عالي" ? "#FCA5A5" : result.risk_level === "متوسط" ? "#FCD34D" : "#6EE7B7", borderRadius: 20, padding: "4px 18px", fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
              مستوى الخطر: {result.risk_level}
            </div>
            <div style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.7 }}>{result.summary}</div>
          </Card>

          {result.kpis?.length > 0 && <>
            <SecTitle>📊 مؤشرات الأداء الرئيسية</SecTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {result.kpis.map((k, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderTop: `3px solid ${sc[k.status] || "#6B7280"}` }}>
                  <div style={{ fontSize: 22 }}>{k.icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: sc[k.status] || "#1B2A4A", marginTop: 4 }}>{k.value}</div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{k.label}</div>
                  <div style={{ fontSize: 10, color: sc[k.status], fontWeight: 700, marginTop: 3 }}>{k.status}</div>
                </div>
              ))}
            </div>
          </>}

          {result.deviations?.length > 0 && <>
            <SecTitle>⚠️ الانحرافات والمخاطر</SecTitle>
            {result.deviations.map((d, i) => (
              <Card key={i} style={{ borderRight: `4px solid ${d.risk === "عالي" ? "#EF4444" : "#F59E0B"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{d.site}</div>
                  <RiskBadge level={d.risk} />
                </div>
                <div style={{ fontSize: 12, color: "#374151", marginBottom: 6 }}>🔴 {d.issue}</div>
                <div style={{ fontSize: 12, color: "#10B981", background: "#F0FDF4", padding: "6px 10px", borderRadius: 6 }}>✅ {d.action}</div>
              </Card>
            ))}
          </>}

          {result.recommendations?.length > 0 && <>
            <SecTitle>💡 التوصيات</SecTitle>
            {result.recommendations.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#fff", borderRadius: 12, padding: "12px 14px", marginBottom: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                <span style={{ background: (pc[r.priority] || "#6B7280") + "22", color: pc[r.priority] || "#6B7280", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", marginTop: 2 }}>{r.priority}</span>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{r.text}</div>
              </div>
            ))}
          </>}

          {result.forecast && (
            <Card style={{ background: "linear-gradient(135deg,#EFF6FF,#F0FDF4)", border: "1px solid #BFDBFE" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1D4ED8", marginBottom: 6 }}>🔮 توقعات الأسبوع القادم</div>
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{result.forecast}</div>
            </Card>
          )}

          <button onClick={runAI} style={{ width: "100%", padding: 13, background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: "#374151", marginTop: 4 }}>
            🔄 تحديث التحليل
          </button>
        </div>
      )}
    </div>
  );
};
