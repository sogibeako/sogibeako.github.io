// ============================================================
//  RegSum Lab — React UI (ui.js)
//  Babel-transformed in-browser. Uses Recharts for plots.
// ============================================================

const { useState, useCallback, useMemo, useRef } = React;
const {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ScatterChart, Scatter, BarChart, Bar, ErrorBar,
    ReferenceLine, Cell
} = Recharts;

// ---- Status Badge ----
function StatusBadge({ status }) {
    return React.createElement('span', { className: `status-${status}` }, status);
}

// ---- Format number to 10 significant digits ----
function fmtVal(v) {
    if (v === null || v === undefined) return '—';
    if (Math.abs(v) < 1e-15) return '0';
    return v.toPrecision(10);
}

// ---- Summary Table ----
function SummaryTable({ results, ensemble }) {
    if (!results) return null;

    const rows = results.map((r, i) =>
        React.createElement('tr', { key: r.method },
            React.createElement('td', { className: 'font-medium' }, r.method),
            React.createElement('td', null, React.createElement(StatusBadge, { status: r.status })),
            React.createElement('td', { className: 'font-mono text-sm' }, fmtVal(r.value)),
            React.createElement('td', null,
                r.stability === 'exact-ish'
                    ? React.createElement('span', { className: 'text-emerald-400 font-semibold text-sm' }, 'exact-ish')
                    : (typeof r.stability === 'number' ? r.stability.toFixed(2) : '—')
            ),
            React.createElement('td', { className: 'text-slate-400 text-sm' },
                (r.notes || []).join('; ')
            )
        )
    );

    // Ensemble row
    if (ensemble && ensemble.mean !== null) {
        rows.push(React.createElement('tr', { key: 'ensemble', className: 'border-t border-slate-600' },
            React.createElement('td', { className: 'font-medium text-blue-400' }, 'Ensemble'),
            React.createElement('td', null, React.createElement(StatusBadge, { status: 'summary' })),
            React.createElement('td', { className: 'font-mono text-sm' },
                `${fmtVal(ensemble.median)} ± ${ensemble.maxDeviation ? ensemble.maxDeviation.toExponential(2) : '?'}`
            ),
            React.createElement('td', null,
                React.createElement('span', {
                    className: ensemble.agreement === 'high' ? 'text-emerald-400 font-semibold text-sm' :
                        ensemble.agreement === 'moderate' ? 'text-yellow-400 text-sm' :
                            'text-red-400 text-sm'
                }, ensemble.agreement)
            ),
            React.createElement('td', { className: 'text-slate-400 text-sm' },
                `${results.filter(r => r.status === 'success').length} methods agree`
            )
        ));
    }

    return React.createElement('div', { className: 'glass p-4' },
        React.createElement('h2', { className: 'text-lg font-semibold mb-3 gradient-text' }, 'Summary Table'),
        React.createElement('div', { className: 'overflow-x-auto' },
            React.createElement('table', { className: 'summary-table' },
                React.createElement('thead', null,
                    React.createElement('tr', null,
                        ['Method', 'Status', 'Value', 'Stability', 'Notes'].map(h =>
                            React.createElement('th', { key: h }, h)
                        )
                    )
                ),
                React.createElement('tbody', null, rows)
            )
        )
    );
}

// ---- Plot Components ----
function SequencePlot({ data }) {
    if (!data || !data.sequence) return null;
    const plotData = data.sequence.slice(0, 500).map((v, i) => ({ n: i + 1, a_n: v }));
    return React.createElement('div', { className: 'h-80' },
        React.createElement(ResponsiveContainer, { width: '100%', height: '100%' },
            React.createElement(ScatterChart, { margin: { top: 10, right: 20, bottom: 20, left: 20 } },
                React.createElement(CartesianGrid, { strokeDasharray: '3 3', stroke: '#334155' }),
                React.createElement(XAxis, { dataKey: 'n', stroke: '#94a3b8', fontSize: 12, label: { value: 'n', position: 'bottom', fill: '#94a3b8' } }),
                React.createElement(YAxis, { stroke: '#94a3b8', fontSize: 12, label: { value: 'a_n', angle: -90, position: 'left', fill: '#94a3b8' } }),
                React.createElement(Tooltip, { contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' } }),
                React.createElement(Scatter, { data: plotData, dataKey: 'a_n', fill: '#22d3ee', r: 2 })
            )
        )
    );
}

function SkeletonPlot({ data }) {
    if (!data || !data.modelDetection || !data.modelDetection.skeleton) {
        return React.createElement('div', { className: 'text-slate-500 p-8 text-center' }, 'No skeleton detected');
    }
    const N = Math.min(500, data.sequence.length);
    const plotData = [];
    for (let i = 0; i < N; i++) {
        plotData.push({
            n: i + 1,
            a_n: data.sequence[i],
            b_n: data.modelDetection.skeleton[i],
            e_n: data.modelDetection.residual[i]
        });
    }
    return React.createElement('div', { className: 'h-80' },
        React.createElement(ResponsiveContainer, { width: '100%', height: '100%' },
            React.createElement(LineChart, { data: plotData, margin: { top: 10, right: 20, bottom: 20, left: 20 } },
                React.createElement(CartesianGrid, { strokeDasharray: '3 3', stroke: '#334155' }),
                React.createElement(XAxis, { dataKey: 'n', stroke: '#94a3b8', fontSize: 12 }),
                React.createElement(YAxis, { stroke: '#94a3b8', fontSize: 12 }),
                React.createElement(Tooltip, { contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' } }),
                React.createElement(Legend, null),
                React.createElement(Line, { type: 'monotone', dataKey: 'a_n', stroke: '#22d3ee', dot: false, strokeWidth: 1.5, name: 'a_n (sequence)' }),
                React.createElement(Line, { type: 'monotone', dataKey: 'b_n', stroke: '#a78bfa', dot: false, strokeWidth: 2, name: 'b_n (skeleton)' }),
                React.createElement(Line, { type: 'monotone', dataKey: 'e_n', stroke: '#f472b6', dot: false, strokeWidth: 1, name: 'e_n (residual)' })
            )
        )
    );
}

function ExpCutoffPlot({ data }) {
    const curve = data?.results?.find(r => r.method === 'expCutoff')?.details?.curve;
    if (!curve) return React.createElement('div', { className: 'text-slate-500 p-8 text-center' }, 'No ExpCutoff data');
    return React.createElement('div', { className: 'h-80' },
        React.createElement(ResponsiveContainer, { width: '100%', height: '100%' },
            React.createElement(LineChart, { data: curve, margin: { top: 10, right: 20, bottom: 20, left: 20 } },
                React.createElement(CartesianGrid, { strokeDasharray: '3 3', stroke: '#334155' }),
                React.createElement(XAxis, { dataKey: 'eps', stroke: '#94a3b8', fontSize: 12, label: { value: 'ε', position: 'bottom', fill: '#94a3b8' } }),
                React.createElement(YAxis, { stroke: '#94a3b8', fontSize: 12 }),
                React.createElement(Tooltip, { contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' } }),
                React.createElement(Legend, null),
                React.createElement(Line, { type: 'monotone', dataKey: 'sEps', stroke: '#22d3ee', dot: false, strokeWidth: 2, name: 'S(ε)' }),
                React.createElement(Line, { type: 'monotone', dataKey: 'fitted', stroke: '#f97316', dot: false, strokeWidth: 1.5, strokeDasharray: '5 3', name: 'Fit' })
            )
        )
    );
}

function ComparePlot({ data }) {
    if (!data || !data.results) return null;
    const successful = data.results.filter(r => r.status === 'success' && r.value !== null);
    if (successful.length === 0) return React.createElement('div', { className: 'text-slate-500 p-8 text-center' }, 'No successful methods to compare');
    const colors = ['#22d3ee', '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#f97316'];
    const barData = successful.map((r, i) => ({ method: r.method, value: r.value, fill: colors[i % colors.length] }));

    return React.createElement('div', { className: 'h-80' },
        React.createElement(ResponsiveContainer, { width: '100%', height: '100%' },
            React.createElement(BarChart, { data: barData, margin: { top: 10, right: 20, bottom: 20, left: 60 } },
                React.createElement(CartesianGrid, { strokeDasharray: '3 3', stroke: '#334155' }),
                React.createElement(XAxis, { dataKey: 'method', stroke: '#94a3b8', fontSize: 12 }),
                React.createElement(YAxis, { stroke: '#94a3b8', fontSize: 12 }),
                React.createElement(Tooltip, { contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' } }),
                React.createElement(Bar, { dataKey: 'value', radius: [4, 4, 0, 0] },
                    barData.map((d, i) => React.createElement(Cell, { key: i, fill: d.fill }))
                )
            )
        )
    );
}

function PlotTabs({ data }) {
    const [tab, setTab] = useState('sequence');
    const tabs = [
        { id: 'sequence', label: 'Sequence' },
        { id: 'skeleton', label: 'Skeleton' },
        { id: 'expcutoff', label: 'Exp Cutoff' },
        { id: 'compare', label: 'Compare' }
    ];

    return React.createElement('div', { className: 'glass p-4' },
        React.createElement('div', { className: 'flex gap-1 mb-4 border-b border-slate-700 pb-1' },
            tabs.map(t =>
                React.createElement('button', {
                    key: t.id, className: `tab-btn ${tab === t.id ? 'active' : ''}`,
                    onClick: () => setTab(t.id)
                }, t.label)
            )
        ),
        React.createElement('div', { className: 'fade-in' },
            tab === 'sequence' ? React.createElement(SequencePlot, { data }) :
                tab === 'skeleton' ? React.createElement(SkeletonPlot, { data }) :
                    tab === 'expcutoff' ? React.createElement(ExpCutoffPlot, { data }) :
                        React.createElement(ComparePlot, { data })
        )
    );
}

// ---- Diagnostics Panel ----
function DiagnosticsPanel({ diagnostics }) {
    const [open, setOpen] = useState(false);
    if (!diagnostics || diagnostics.length === 0) return null;

    return React.createElement('div', { className: 'glass' },
        React.createElement('div', {
            className: 'collapsible-header', onClick: () => setOpen(!open)
        },
            React.createElement('span', { className: 'text-sm' }, open ? '▾' : '▸'),
            React.createElement('span', { className: 'font-semibold text-sm' }, `Diagnostics & Warnings (${diagnostics.length})`),
        ),
        open && React.createElement('div', { className: 'px-4 pb-4 fade-in' },
            diagnostics.map((d, i) =>
                React.createElement('div', { key: i, className: 'text-sm text-amber-300 py-1 border-b border-slate-800' }, d)
            )
        )
    );
}

// ---- Advanced Settings ----
function AdvancedSettings({ settings, onChange }) {
    const [open, setOpen] = useState(false);

    return React.createElement('div', { className: 'glass' },
        React.createElement('div', {
            className: 'collapsible-header', onClick: () => setOpen(!open)
        },
            React.createElement('span', { className: 'text-sm' }, open ? '▾' : '▸'),
            React.createElement('span', { className: 'font-semibold text-sm' }, 'Advanced Settings'),
        ),
        open && React.createElement('div', { className: 'px-4 pb-4 fade-in grid grid-cols-2 md:grid-cols-4 gap-4' },
            React.createElement('label', { className: 'text-xs text-slate-400' }, 'm_max',
                React.createElement('input', {
                    type: 'number', className: 'w-full mt-1', value: settings.mMax,
                    onChange: e => onChange({ ...settings, mMax: parseInt(e.target.value) || 12 })
                })
            ),
            React.createElement('label', { className: 'text-xs text-slate-400' }, 'd_max',
                React.createElement('input', {
                    type: 'number', className: 'w-full mt-1', value: settings.dMax,
                    onChange: e => onChange({ ...settings, dMax: parseInt(e.target.value) || 4 })
                })
            ),
            React.createElement('label', { className: 'text-xs text-slate-400' }, 'epsMin',
                React.createElement('input', {
                    type: 'number', className: 'w-full mt-1', value: settings.epsMin, step: 0.001,
                    onChange: e => onChange({ ...settings, epsMin: parseFloat(e.target.value) || 0.001 })
                })
            ),
            React.createElement('label', { className: 'text-xs text-slate-400' }, 'epsMax',
                React.createElement('input', {
                    type: 'number', className: 'w-full mt-1', value: settings.epsMax, step: 0.01,
                    onChange: e => onChange({ ...settings, epsMax: parseFloat(e.target.value) || 0.5 })
                })
            ),
            React.createElement('label', { className: 'text-xs text-slate-400' }, 'Samples',
                React.createElement('input', {
                    type: 'number', className: 'w-full mt-1', value: settings.samples,
                    onChange: e => onChange({ ...settings, samples: parseInt(e.target.value) || 60 })
                })
            )
        )
    );
}

// ---- Export / Import ----
function ExportImport({ data, onImport }) {
    const handleExport = () => {
        if (!data) return;
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'regsum_analysis.json'; a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const bundle = JSON.parse(ev.target.result);
                onImport(bundle);
            } catch (err) {
                alert('Invalid JSON file: ' + err.message);
            }
        };
        reader.readAsText(file);
    };

    return React.createElement('div', { className: 'flex gap-3' },
        React.createElement('button', { className: 'btn-secondary', onClick: handleExport, disabled: !data }, '↓ Export JSON'),
        React.createElement('label', { className: 'btn-secondary cursor-pointer' },
            '↑ Import JSON',
            React.createElement('input', { type: 'file', accept: '.json', className: 'hidden', onChange: handleImport })
        )
    );
}

// ---- Main App ----
function App() {
    const [expr, setExpr] = useState('1');
    const [paramStr, setParamStr] = useState('');
    const [Nmax, setNmax] = useState(4096);
    const [analysisData, setAnalysisData] = useState(null);
    const [error, setError] = useState(null);
    const [running, setRunning] = useState(false);
    const [settings, setSettings] = useState({ mMax: 12, dMax: 4, epsMin: 0.001, epsMax: 0.5, samples: 60 });

    const handlePreset = (preset) => {
        setExpr(preset.expr);
        setParamStr(preset.params);
        setError(null);
    };

    const handleRun = useCallback(() => {
        setRunning(true);
        setError(null);
        setTimeout(() => {
            try {
                const result = runFullAnalysis(expr, paramStr, Nmax);
                setAnalysisData(result);
            } catch (e) {
                setError(e.message);
                setAnalysisData(null);
            }
            setRunning(false);
        }, 50);
    }, [expr, paramStr, Nmax]);

    const handleImport = (bundle) => {
        setAnalysisData(bundle);
        if (bundle.input) {
            setExpr(bundle.input.expression || '');
            setParamStr(Object.entries(bundle.input.params || {}).map(([k, v]) => `${k}=${v}`).join(', '));
            setNmax(bundle.input.Nmax || 4096);
        }
    };

    return React.createElement('div', { className: 'max-w-6xl mx-auto px-4 py-6 space-y-5' },
        // Header
        React.createElement('header', { className: 'text-center mb-2' },
            React.createElement('h1', { className: 'text-3xl font-bold gradient-text' }, 'RegSum Lab'),
            React.createElement('p', { className: 'text-slate-400 text-sm mt-1' }, 'Regularized Summation Dashboard — Compare multiple methods side by side')
        ),

        // Input Panel
        React.createElement('div', { className: 'glass p-5 space-y-4' },
            // Presets
            React.createElement('div', { className: 'flex flex-wrap gap-2' },
                PRESETS.map(p =>
                    React.createElement('button', {
                        key: p.name, className: 'btn-secondary text-xs',
                        onClick: () => handlePreset(p), title: p.desc
                    }, p.name)
                )
            ),
            // Expression + Params + Nmax
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-12 gap-3 items-end' },
                React.createElement('div', { className: 'md:col-span-5' },
                    React.createElement('label', { className: 'text-xs text-slate-400 block mb-1' }, 'Expression a_n'),
                    React.createElement('input', {
                        type: 'text', className: 'w-full', value: expr, id: 'expr-input',
                        onChange: e => setExpr(e.target.value), placeholder: 'e.g. n^2 + sin(n)'
                    })
                ),
                React.createElement('div', { className: 'md:col-span-3' },
                    React.createElement('label', { className: 'text-xs text-slate-400 block mb-1' }, 'Parameters'),
                    React.createElement('input', {
                        type: 'text', className: 'w-full', value: paramStr, id: 'param-input',
                        onChange: e => setParamStr(e.target.value), placeholder: 'eps=0.001'
                    })
                ),
                React.createElement('div', { className: 'md:col-span-2' },
                    React.createElement('label', { className: 'text-xs text-slate-400 block mb-1' }, `Nmax: ${Nmax}`),
                    React.createElement('input', {
                        type: 'range', className: 'w-full', min: 64, max: 65536, step: 64,
                        value: Nmax, id: 'nmax-slider',
                        onChange: e => setNmax(parseInt(e.target.value))
                    })
                ),
                React.createElement('div', { className: 'md:col-span-2' },
                    React.createElement('button', {
                        className: 'btn-primary w-full', onClick: handleRun, disabled: running, id: 'run-btn'
                    }, running ? '⏳ Running…' : '▶ Run Full Analysis')
                )
            ),
            error && React.createElement('div', { className: 'text-red-400 text-sm bg-red-900/20 p-3 rounded-lg' }, '❌ ' + error)
        ),

        // Model Detection Info
        analysisData && analysisData.modelDetection && React.createElement('div', { className: 'glass-inner p-3 text-sm text-slate-300' },
            React.createElement('span', { className: 'font-semibold text-slate-200' }, 'Skeleton: '),
            analysisData.modelDetection.type === 'quasiPolynomial'
                ? `quasi-polynomial (m=${analysisData.modelDetection.period}, d=${analysisData.modelDetection.degree}), confidence: ${analysisData.modelDetection.confidence}`
                : analysisData.modelDetection.type === 'extended'
                    ? `non-integer power (α=${analysisData.modelDetection.exponent.toFixed(3)}, c=${analysisData.modelDetection.coefficients[0].toFixed(3)}), confidence: ${analysisData.modelDetection.confidence}`
                    : 'none detected',
            analysisData.modelDetection.residualRMS !== null && `, residual RMS: ${analysisData.modelDetection.residualRMS.toExponential(2)}`
        ),

        // Summary Table
        analysisData && React.createElement(SummaryTable, {
            results: analysisData.results, ensemble: analysisData.ensemble
        }),

        // Plots
        analysisData && React.createElement(PlotTabs, { data: analysisData }),

        // Advanced Settings
        React.createElement(AdvancedSettings, { settings, onChange: setSettings }),

        // Diagnostics
        analysisData && React.createElement(DiagnosticsPanel, { diagnostics: analysisData.diagnostics }),

        // Export/Import
        React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement(ExportImport, { data: analysisData, onImport: handleImport }),
            React.createElement('span', { className: 'text-xs text-slate-600' }, 'v1.0.0')
        )
    );
}

// ---- Mount ----
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
