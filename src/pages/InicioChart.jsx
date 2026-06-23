import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from 'recharts';

const fmtChartVal = (v) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(26,58,92,0.12)',
      borderRadius: '10px',
      padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(26,58,92,0.15)',
      fontFamily: 'var(--font-primary)',
    }}>
      <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', fontSize: '13px', fontWeight: 700, color: p.color }}>
          {p.name}: {fmtChartVal(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function InicioChart({ chartData, loading }) {
  return (
    <>
      {loading || chartData.length === 0 ? (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          {loading ? 'Cargando datos…' : 'Sin certificaciones registradas este año'}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barGap={4} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,58,92,0.07)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-primary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-primary)' }} axisLine={false} tickLine={false} tickFormatter={fmtChartVal} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(26,58,92,0.05)' }} />
            <Bar dataKey="Certificado" fill="#54b3e0" radius={[6,6,0,0]} isAnimationActive animationDuration={1400} animationBegin={200} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </>
  );
}
