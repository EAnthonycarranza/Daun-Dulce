/**
 * Lightweight, dependency-free SVG chart for monthly trends.
 * Modes:
 *  - "bar"  : grouped bars (default)
 *  - "line" : single line with area fill
 *  - "stacked" : stacked bars from `stacks` array of keys
 */

const COLORS = {
  primary: '#6A1620',
  primaryLight: 'rgba(106,22,32,0.18)',
  gold: '#C9A876',
  cream: '#F6E8D4',
  text: '#2A1A1D',
  muted: '#7A6B6B',
  grid: '#E5D7C2',
  success: '#4A7C59',
  danger: '#9C2A20',
  blue: '#3B82F6',
};

const MonthlyChart = ({
  data = [],
  valueKey = 'count',
  stacks = null,
  stackColors = {
    pending: COLORS.gold,
    confirmed: COLORS.success,
    completed: COLORS.muted,
    cancelled: COLORS.danger,
    quoted: COLORS.blue,
    accepted: COLORS.success,
    declined: COLORS.danger,
  },
  mode = 'bar',
  height = 220,
  yLabel = '',
  formatValue = (v) => v,
  accentColor = COLORS.primary,
}) => {
  if (!data.length) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: COLORS.muted, fontSize: 14 }}>
        No data to display.
      </div>
    );
  }

  const W = 720;
  const H = height;
  const padL = 44;
  const padR = 16;
  const padT = 16;
  const padB = 36;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  // Compute max value depending on mode
  let max = 0;
  data.forEach((d) => {
    if (stacks && mode === 'stacked') {
      const sum = stacks.reduce((acc, k) => acc + (d[k] || 0), 0);
      if (sum > max) max = sum;
    } else {
      if ((d[valueKey] || 0) > max) max = d[valueKey] || 0;
    }
  });
  if (max < 4) max = 4;
  const niceMax = Math.ceil(max / 4) * 4;
  const yToPx = (v) => padT + innerH - (v / niceMax) * innerH;

  const bandW = innerW / data.length;
  const xCenter = (i) => padL + bandW * i + bandW / 2;

  // Y-axis ticks (5 lines)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((p) => Math.round(niceMax * p));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      {/* Grid */}
      {ticks.map((t, i) => {
        const y = yToPx(t);
        return (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={y} y2={y} stroke={COLORS.grid} strokeDasharray="3,4" />
            <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill={COLORS.muted}>
              {formatValue(t)}
            </text>
          </g>
        );
      })}
      {yLabel && (
        <text
          x={12}
          y={padT + innerH / 2}
          fontSize="10"
          fill={COLORS.muted}
          transform={`rotate(-90 12 ${padT + innerH / 2})`}
          textAnchor="middle"
        >
          {yLabel.toUpperCase()}
        </text>
      )}

      {/* X axis labels */}
      {data.map((d, i) => (
        <text
          key={i}
          x={xCenter(i)}
          y={H - padB + 18}
          textAnchor="middle"
          fontSize="11"
          fill={COLORS.muted}
        >
          {d.label}
        </text>
      ))}

      {/* Render mode */}
      {mode === 'line' ? (
        <>
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.28" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Area */}
          <path
            d={`M ${xCenter(0)},${yToPx(data[0][valueKey] || 0)} ` +
              data.map((d, i) => `L ${xCenter(i)},${yToPx(d[valueKey] || 0)}`).join(' ') +
              ` L ${xCenter(data.length - 1)},${padT + innerH} L ${xCenter(0)},${padT + innerH} Z`}
            fill="url(#areaFill)"
          />
          {/* Line */}
          <polyline
            fill="none"
            stroke={accentColor}
            strokeWidth="2"
            points={data.map((d, i) => `${xCenter(i)},${yToPx(d[valueKey] || 0)}`).join(' ')}
          />
          {/* Points */}
          {data.map((d, i) => (
            <g key={i}>
              <circle cx={xCenter(i)} cy={yToPx(d[valueKey] || 0)} r="3.5" fill={accentColor} />
              {(d[valueKey] || 0) > 0 && (
                <text x={xCenter(i)} y={yToPx(d[valueKey] || 0) - 8} textAnchor="middle" fontSize="10" fill={accentColor} fontWeight="700">
                  {formatValue(d[valueKey] || 0)}
                </text>
              )}
            </g>
          ))}
        </>
      ) : mode === 'stacked' && stacks ? (
        data.map((d, i) => {
          const barW = Math.min(38, bandW * 0.6);
          const x = xCenter(i) - barW / 2;
          let yCursor = padT + innerH;
          return (
            <g key={i}>
              {stacks.map((key) => {
                const v = d[key] || 0;
                if (!v) return null;
                const segH = (v / niceMax) * innerH;
                yCursor -= segH;
                return (
                  <rect
                    key={key}
                    x={x}
                    y={yCursor}
                    width={barW}
                    height={segH}
                    fill={stackColors[key] || accentColor}
                    rx="2"
                  >
                    <title>{`${d.label} · ${key}: ${v}`}</title>
                  </rect>
                );
              })}
            </g>
          );
        })
      ) : (
        // Default: simple bar
        data.map((d, i) => {
          const v = d[valueKey] || 0;
          const barW = Math.min(38, bandW * 0.6);
          const x = xCenter(i) - barW / 2;
          const y = yToPx(v);
          const h = padT + innerH - y;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={h} fill={accentColor} rx="3">
                <title>{`${d.label}: ${formatValue(v)}`}</title>
              </rect>
              {v > 0 && (
                <text x={xCenter(i)} y={y - 6} textAnchor="middle" fontSize="10" fill={accentColor} fontWeight="700">
                  {formatValue(v)}
                </text>
              )}
            </g>
          );
        })
      )}
    </svg>
  );
};

export default MonthlyChart;
