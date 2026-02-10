'use client';

import { useState, useEffect, useMemo } from 'react';
import styles from '../../admin/page.module.css'; // Reuse admin styles

export default function LeaderResultPage() {
    const [data, setData] = useState({ responses: [], analytics: { keywords: [] } });
    const [filterDepartment, setFilterDepartment] = useState('all');

    useEffect(() => {
        fetch('/api/leader/results')
            .then(res => res.json())
            .then(setData)
            .catch(console.error);
    }, []);

    const filteredResponses = useMemo(() => {
        if (filterDepartment === 'all') return data.responses;
        return data.responses.filter(r => r.department === filterDepartment);
    }, [data, filterDepartment]);

    // Recalculate keywords for filtered data (Frontend-side calculation for responsiveness)
    const filteredKeywords = useMemo(() => {
        if (filterDepartment === 'all') return data.analytics.keywords;

        // Simple client-side recalc logic mirroring server
        const allText = filteredResponses.map(d => d.feedback).join(' ');
        const words = allText.split(/[^a-zA-Z0-9가-힣]+/).filter(w => w.length >= 2);
        const freq = {};
        let total = 0;
        words.forEach(w => {
            freq[w] = (freq[w] || 0) + 1;
            total++;
        });
        return Object.keys(freq)
            .map(word => ({
                word,
                count: freq[word],
                ratio: total > 0 ? ((freq[word] / total) * 100).toFixed(1) : 0
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);
    }, [filteredResponses, data.analytics.keywords, filterDepartment]);

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>팀장 피드백 결과 대시보드</h1>
                <div className={styles.controls}>
                    <select
                        className={styles.select}
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                    >
                        <option value="all">전체 소속</option>
                        <option value="본사">본사</option>
                        <option value="부산공장 및 기술연구소">부산공장 및 기술연구소</option>
                    </select>
                </div>
            </header>

            <div className={styles.grid}>
                {/* Keyword Analysis (Left) */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>🔥 주요 키워드 분석 (Top 20)</h2>
                    <div className={styles.scrollTable} style={{ maxHeight: '400px' }}>
                        <table className={styles.distTable}>
                            <thead>
                                <tr>
                                    <th>순위</th>
                                    <th>키워드</th>
                                    <th>횟수</th>
                                    <th>비율</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredKeywords.length > 0 ? filteredKeywords.map((k, idx) => (
                                    <tr key={idx}>
                                        <td>{idx + 1}</td>
                                        <td style={{ fontWeight: 'bold', color: '#34495e' }}>{k.word}</td>
                                        <td>{k.count}</td>
                                        <td>{k.ratio}%</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4">데이터가 충분하지 않습니다.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Raw Responses (Right) */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>📝 작성 내용 ({filteredResponses.length}건)</h2>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {filteredResponses.length > 0 ? filteredResponses.slice().reverse().map((res) => (
                            <div key={res.id} style={{
                                padding: '1rem',
                                background: '#f8f9fa',
                                borderRadius: '8px',
                                borderLeft: '4px solid #3498db'
                            }}>
                                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: 'bold', color: '#2980b9' }}>{res.department}</span>
                                    <span>{new Date(res.submittedAt).toLocaleDateString()}</span>
                                </div>
                                <p style={{ margin: 0, lineHeight: '1.5', color: '#2c3e50' }}>{res.feedback}</p>
                            </div>
                        )) : (
                            <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>제출된 의견이 없습니다.</p>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
