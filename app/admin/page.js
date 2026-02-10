'use client';

import { useState, useEffect, useMemo } from 'react';
import styles from './page.module.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AdminPage() {
    const [data, setData] = useState({
        responses: [],
        analytics: {
            sentiment: [],
            keywords: { overall: [], positive: [], negative: [] }
        }
    });
    const [filters, setFilters] = useState({
        department: 'all',
        rank: 'all'
    });

    const departments = ['기획실', '구매실', '지원실', '영업실', '공장장 직속', '생산담당', '관리담당', '기술연구소'];
    const ranks = ['부장', '부부장', '차장', '과장', '대리', '사원'];

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetch('/api/results')
            .then(res => res.json())
            .then(resData => {
                // Handle backward compatibility if API returns array (though we just changed it)
                if (Array.isArray(resData)) {
                    setData({ responses: resData, analytics: { sentiment: [], keywords: { overall: [], positive: [], negative: [] } } });
                } else {
                    setData(resData);
                }
            })
            .catch(console.error);
    }, []);

    const filteredData = useMemo(() => {
        return data.responses.filter(item => {
            if (filters.department !== 'all' && item.department !== filters.department) return false;
            if (filters.rank !== 'all' && item.rank !== filters.rank) return false;
            return true;
        });
    }, [data.responses, filters]);

    // Stats
    const totalCount = filteredData.length;
    const interviewCount = filteredData.filter(d => d.q1_hasInterview === 'yes').length;
    const noInterviewCount = filteredData.filter(d => d.q1_hasInterview === 'no').length;

    const interviewRatio = totalCount > 0 ? ((interviewCount / totalCount) * 100).toFixed(1) : 0;
    const noInterviewRatio = totalCount > 0 ? ((noInterviewCount / totalCount) * 100).toFixed(1) : 0;

    // Q6 Satisfaction Data
    const satisfactionData = useMemo(() => {
        const counts = { '만족': 0, '불만족': 0 };
        filteredData.forEach(d => {
            if (d.q1_hasInterview === 'yes' && d.q6_satisfaction) {
                counts[d.q6_satisfaction] = (counts[d.q6_satisfaction] || 0) + 1;
            }
        });
        return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
    }, [filteredData]);

    // Q2-Q4 Data
    const q2Data = useMemo(() => {
        const counts = {};
        filteredData.filter(d => d.q1_hasInterview === 'yes').forEach(d => {
            if (d.q2_time) counts[d.q2_time] = (counts[d.q2_time] || 0) + 1;
        });
        return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
    }, [filteredData]);

    const q3Data = useMemo(() => {
        const counts = {};
        filteredData.filter(d => d.q1_hasInterview === 'yes').forEach(d => {
            if (d.q3_method) {
                const method = d.q3_method === 'other' ? `기타(${d.q3_method_other || ''})` : d.q3_method;
                counts[method] = (counts[method] || 0) + 1;
            }
        });
        return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
    }, [filteredData]);

    const q4Data = useMemo(() => {
        const counts = {};
        filteredData.filter(d => d.q1_hasInterview === 'yes').forEach(d => {
            if (d.q4_guidance) counts[d.q4_guidance] = (counts[d.q4_guidance] || 0) + 1;
        });
        return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
    }, [filteredData]);

    // Q7 Average Scores & Distribution
    const QUESTIONS_Q7 = [
        '팀장은 조직/팀 방향과 목표를 설명했다.',
        '과제의 우선순위와 목표가 명확해졌다.',
        '과제 목표의 구체화로 평가 기준이 명확해졌다.',
        '팀장은 내 의견을 충분히 경청하고 존중했다.',
        '면담 후 내가 해야 할 다음 액션이 명확해졌다.'
    ];

    const q7Stats = useMemo(() => {
        const results = QUESTIONS_Q7.map(() => ({
            sums: 0,
            count: 0,
            distribution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
        }));

        filteredData.forEach(d => {
            if (d.q1_hasInterview === 'yes' && d.q7_scores) {
                d.q7_scores.items.forEach((score, idx) => {
                    if (typeof score === 'number') {
                        results[idx].sums += score;
                        results[idx].count++;
                        results[idx].distribution[score]++;
                    }
                });
            }
        });

        return results.map((r, idx) => ({
            name: QUESTIONS_Q7[idx].split(' ').slice(0, 2).join(' ') + '...', // Short name for chart
            fullName: QUESTIONS_Q7[idx],
            avg: r.count > 0 ? parseFloat((r.sums / r.count).toFixed(2)) : 0,
            distribution: r.distribution
        }));
    }, [filteredData]);

    // Server-side XLSX Export
    const handleDownload = () => {
        const queryParams = new URLSearchParams({
            department: filters.department,
            rank: filters.rank
        }).toString();

        // Use direct window location for download to ensure it bypasses blob-URL security blocks
        window.location.href = `/api/export/xlsx?${queryParams}`;
    };

    if (!mounted) return null;

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>설문 결과 대시보드</h1>
                <div className={styles.controls}>
                    <button className={styles.downloadBtn} onClick={handleDownload}>
                        데이터 다운로드 (XLSX)
                    </button>
                    <select
                        className={styles.select}
                        value={filters.department}
                        onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                    >
                        <option value="all">전체 소속</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select
                        className={styles.select}
                        value={filters.rank}
                        onChange={(e) => setFilters(prev => ({ ...prev, rank: e.target.value }))}
                    >
                        <option value="all">전체 직급</option>
                        {ranks.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
            </header>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>응답 현황</h2>
                    <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                        <div>
                            <div className={styles.statValue}>{totalCount}</div>
                            <div className={styles.statLabel}>전체 응답</div>
                        </div>
                        <div>
                            <div className={styles.statValue}>{interviewCount}</div>
                            <div className={styles.statLabel}>면담 실시 ({interviewRatio}%)</div>
                        </div>
                        <div>
                            <div className={styles.statValue} style={{ color: '#e74c3c' }}>{noInterviewCount}</div>
                            <div className={styles.statLabel}>미실시 ({noInterviewRatio}%)</div>
                        </div>
                    </div>
                </div>

                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>종합 만족도 (Q6)</h2>
                    <div style={{ height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={satisfactionData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {satisfactionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>평균 면담 시간 (Q2)</h2>
                    <div style={{ height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={q2Data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#3498db" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>면담 방식 (Q3)</h2>
                    <div style={{ height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={q3Data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#2ecc71" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={`${styles.card} ${styles.fullWidth}`}>
                    <h2 className={styles.cardTitle}>면담 안내 수신 여부 (Q4)</h2>
                    <div style={{ height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={q4Data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#f1c40f" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={`${styles.card} ${styles.fullWidth}`}>
                    <h2 className={styles.cardTitle}>면담 품질 진단 (Q7 평균 점수)</h2>
                    <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={q7Stats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 6]} />
                                <Tooltip formatter={(value, name, props) => [value, props.payload.fullName]} />
                                <Bar dataKey="avg" fill="#34495e" name="평균 점수" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={`${styles.card} ${styles.fullWidth}`}>
                    <h2 className={styles.cardTitle}>Q7 문항별 점수 분포</h2>
                    <div className={styles.scrollTable}>
                        <table className={styles.distTable}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left' }}>항목</th>
                                    <th>평균</th>
                                    <th>0점</th>
                                    <th>1점</th>
                                    <th>2점</th>
                                    <th>3점</th>
                                    <th>4점</th>
                                    <th>5점</th>
                                    <th>6점</th>
                                </tr>
                            </thead>
                            <tbody>
                                {q7Stats.map((stat, idx) => (
                                    <tr key={idx}>
                                        <td style={{ textAlign: 'left', fontWeight: 'bold' }}>{stat.fullName}</td>
                                        <td style={{ color: '#3498db', fontWeight: 'bold' }}>{stat.avg}</td>
                                        {Object.keys(stat.distribution).map(score => (
                                            <td key={score}>{stat.distribution[score]}명</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className={`${styles.card} ${styles.fullWidth}`} style={{ marginTop: '2rem' }}>
                <h2 className={styles.cardTitle}>8. 기타 건의사항 상세 분석 (정서 & 키워드)</h2>
                <div className={styles.grid} style={{ marginTop: '1rem', gridTemplateColumns: '1fr 2fr' }}>
                    {/* Sentiment Chart */}
                    <div style={{ paddingRight: '1rem', borderRight: '1px solid #eee' }}>
                        <h3 className={styles.cardTitle} style={{ fontSize: '1rem' }}>긍정/부정 분포</h3>
                        <div style={{ height: 250 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.analytics.sentiment}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        dataKey="value"
                                    >
                                        {data.analytics.sentiment.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Keywords Tables */}
                    <div>
                        <h3 className={styles.cardTitle} style={{ fontSize: '1rem', marginBottom: '1rem' }}>주요 키워드 (Top 10)</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            {/* Overall */}
                            <div>
                                <h4 style={{ fontSize: '0.9rem', textAlign: 'center', marginBottom: '0.5rem', color: '#666' }}>전체</h4>
                                <table className={styles.distTable} style={{ fontSize: '0.8rem' }}>
                                    <tbody>
                                        {data.analytics.keywords.overall.map((k, i) => (
                                            <tr key={i}>
                                                <td>{k.word}</td>
                                                <td>{k.count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Positive */}
                            <div>
                                <h4 style={{ fontSize: '0.9rem', textAlign: 'center', marginBottom: '0.5rem', color: '#00C49F' }}>긍정 리뷰</h4>
                                <table className={styles.distTable} style={{ fontSize: '0.8rem' }}>
                                    <tbody>
                                        {data.analytics.keywords.positive.map((k, i) => (
                                            <tr key={i}>
                                                <td>{k.word}</td>
                                                <td>{k.count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Negative */}
                            <div>
                                <h4 style={{ fontSize: '0.9rem', textAlign: 'center', marginBottom: '0.5rem', color: '#FF8042' }}>부정 리뷰</h4>
                                <table className={styles.distTable} style={{ fontSize: '0.8rem' }}>
                                    <tbody>
                                        {data.analytics.keywords.negative.map((k, i) => (
                                            <tr key={i}>
                                                <td>{k.word}</td>
                                                <td>{k.count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.tableSection}>
                <h2 className={styles.cardTitle}>기타 의견 및 건의사항</h2>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>소속/직급</th>
                            <th>면담 방식 (기타)</th>
                            <th>미실시 사유</th>
                            <th>미실시 건의사항</th>
                            <th>면담참여 건의사항</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((row) => (
                            <tr key={row.id}>
                                <td>{row.department} / {row.rank}</td>
                                <td>{row.q3_method === 'other' ? row.q3_method_other : (row.q3_method || '-')}</td>
                                <td>
                                    {row.q1_hasInterview === 'no'
                                        ? (row.q5_reason || []).map(r => r === 'other' ? `기타(${row.q5_reason_other})` : r).join(', ')
                                        : '-'
                                    }
                                </td>
                                <td>{row.q3_no_suggestions || '-'}</td>
                                <td>{row.q8_suggestions || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </main>
    );
}
