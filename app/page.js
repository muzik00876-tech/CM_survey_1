'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function SurveyPage() {
    const [formData, setFormData] = useState({
        department: '',
        rank: '',
        q1_hasInterview: '', // 'yes' or 'no'
        q2_time: '',
        q3_method: '',
        q3_method_other: '',
        q4_guidance: '',
        q5_reason: [], // array for multiple choice
        q5_reason_other: '',
        q6_satisfaction: '',
        q7_scores: {
            items: [0, 0, 0, 0, 0] // 5 items
        },
        q8_suggestions: '',
        q3_no_suggestions: '' // Suggestions for 'No' branch
    });

    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const departments = ['기획실', '구매실', '지원실', '영업실', '공장장 직속', '생산담당', '관리담당', '기술연구소'];
    const ranks = ['부장', '부부장', '차장', '과장', '대리', '사원'];

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleScoreChange = (index, value) => {
        setFormData(prev => {
            const newScores = [...prev.q7_scores.items];
            newScores[index] = parseInt(value);
            return { ...prev, q7_scores: { items: newScores } };
        });
    };

    const handleCheckboxChange = (value, checked) => {
        setFormData(prev => {
            let newReasons = [...prev.q5_reason];
            if (checked) {
                newReasons.push(value);
            } else {
                newReasons = newReasons.filter(r => r !== value);
            }
            return { ...prev, q5_reason: newReasons };
        });
    };

    useEffect(() => {
        const hasSubmitted = localStorage.getItem('survey_submitted');
        if (hasSubmitted) {
            setSubmitted(true);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setSubmitted(true);
                localStorage.setItem('survey_submitted', 'true');
            } else {
                alert('저장에 실패했습니다. 다시 시도해주세요.');
            }
        } catch (error) {
            console.error(error);
            alert('오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <main className={styles.container}>
                <div className={styles.card} style={{ textAlign: 'center' }}>
                    <h1 className={styles.title}>제출 완료</h1>
                    <p className={styles.description}>설문에 참여해 주셔서 감사합니다.</p>
                    <p className={styles.description} style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                        이미 응답을 제출하셨습니다.
                    </p>
                    <button
                        onClick={() => {
                            localStorage.removeItem('survey_submitted');
                            window.location.reload();
                        }}
                        style={{
                            marginTop: '2rem',
                            padding: '0.5rem 1rem',
                            background: '#f0f0f0',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            color: '#666'
                        }}
                    >
                        [개발자용] 다시 참여하기 (초기화)
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.container}>
            <form className={styles.card} onSubmit={handleSubmit}>
                <header className={styles.header}>
                    <h1 className={styles.title}>팀원용: 목표수립 설문</h1>
                    <p className={styles.description}>
                        본 설문은 목표수립 단계에 대한 현황을 파악하기 위한 것입니다.
                    </p>
                </header>

                {/* 1. Respondent Info */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>응답자 정보</h2>
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.label}>소속</label>
                            <select
                                required
                                className={styles.select}
                                value={formData.department}
                                onChange={(e) => handleChange('department', e.target.value)}
                            >
                                <option value="">선택하세요</option>
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>직급</label>
                            <select
                                required
                                className={styles.select}
                                value={formData.rank}
                                onChange={(e) => handleChange('rank', e.target.value)}
                            >
                                <option value="">선택하세요</option>
                                {ranks.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>
                </section>

                {/* Q1 */}
                <div className={styles.questionGroup}>
                    <p className={styles.questionText}>1. 목표수립 단계에서 팀장과 목표 관련 면담을 진행했나요?</p>
                    <div className={styles.options}>
                        <label className={styles.radioLabel}>
                            <input
                                type="radio"
                                name="q1"
                                required
                                className={styles.radioInput}
                                value="yes"
                                onChange={(e) => handleChange('q1_hasInterview', e.target.value)}
                            />
                            <span className="radioSpan">예 (2번 문항으로)</span>
                        </label>
                        <label className={styles.radioLabel}>
                            <input
                                type="radio"
                                name="q1"
                                required
                                className={styles.radioInput}
                                value="no"
                                onChange={(e) => handleChange('q1_hasInterview', e.target.value)}
                            />
                            <span className="radioSpan">아니오 (5번 문항으로)</span>
                        </label>
                    </div>
                </div>

                {/* Flow A: Interview Done (Q1=Yes) */}
                {formData.q1_hasInterview === 'yes' && (
                    <>
                        <div className={styles.questionGroup}>
                            <p className={styles.questionText}>2. 1회 평균 면담 시간은?</p>
                            <div className={styles.options}>
                                {['10분 미만', '10~20분', '20~40분', '40분 이상'].map(opt => (
                                    <label key={opt} className={styles.radioLabel}>
                                        <input type="radio" name="q2" required className={styles.radioInput} value={opt} onChange={(e) => handleChange('q2_time', e.target.value)} />
                                        <span>{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className={styles.questionGroup}>
                            <p className={styles.questionText}>3. 면담 방식은?</p>
                            <div className={styles.options}>
                                {['대면', '화상', '전화'].map(opt => (
                                    <label key={opt} className={styles.radioLabel}>
                                        <input type="radio" name="q3" required className={styles.radioInput} value={opt} onChange={(e) => handleChange('q3_method', e.target.value)} />
                                        <span>{opt}</span>
                                    </label>
                                ))}
                                <label className={styles.radioLabel}>
                                    <input type="radio" name="q3" required className={styles.radioInput} value="other" onChange={(e) => handleChange('q3_method', e.target.value)} />
                                    <span>기타</span>
                                </label>
                            </div>
                            {formData.q3_method === 'other' && (
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="작성해주세요"
                                    style={{ marginTop: '0.5rem' }}
                                    onChange={(e) => handleChange('q3_method_other', e.target.value)}
                                />
                            )}
                        </div>

                        <div className={styles.questionGroup}>
                            <p className={styles.questionText}>4. 면담 전에 목표수립 관련 안내(일정/준비자료/기대수준 등)를 받았나요?</p>
                            <div className={styles.options}>
                                {['전혀 받지 못했다', '충분하지 않게 받았다'].map(opt => (
                                    <label key={opt} className={styles.radioLabel}>
                                        <input type="radio" name="q4" required className={styles.radioInput} value={opt} onChange={(e) => handleChange('q4_guidance', e.target.value)} />
                                        <span>{opt}</span>
                                    </label>
                                ))}
                            </div>
                            <div className={styles.options} style={{ marginTop: '0.5rem' }}>
                                {['어느 정도 받았다', '충분히 받았다'].map(opt => (
                                    <label key={opt} className={styles.radioLabel}>
                                        <input type="radio" name="q4" required className={styles.radioInput} value={opt} onChange={(e) => handleChange('q4_guidance', e.target.value)} />
                                        <span>{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className={styles.questionGroup}>
                            <p className={styles.questionText}>6. 면담의 종합 만족도는?</p>
                            <div className={styles.options}>
                                {['만족', '불만족'].map(opt => (
                                    <label key={opt} className={styles.radioLabel}>
                                        <input type="radio" name="q6" required className={styles.radioInput} value={opt} onChange={(e) => handleChange('q6_satisfaction', e.target.value)} />
                                        <span>{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className={styles.questionGroup}>
                            <p className={styles.questionText}>7. 면담 품질에 대해 아래 문항별 수준을 선택해주세요.</p>
                            <table className={styles.matrixTable}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left' }}>항목</th>
                                        <th><span style={{ whiteSpace: 'nowrap' }}>다뤄지지</span><br />않음<br />(0)</th>
                                        <th>전혀<br />아니다<br />(1)</th>
                                        <th>아니다<br />(2)</th>
                                        <th>약간<br />아니다<br />(3)</th>
                                        <th>약간<br />그렇다<br />(4)</th>
                                        <th>그렇다<br />(5)</th>
                                        <th>매우<br />그렇다<br />(6)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        <>팀장은 조직/팀 방향과 <br />목표를 설명했다.</>,
                                        <>과제의 우선순위와 <br />목표가 명확해졌다.</>,
                                        <>과제 목표의 구체화로 <br />평가 기준이 명확해졌다.</>,
                                        <>팀장은 내 의견을 <br />충분히 경청하고 존중했다.</>,
                                        <>면담 후 내가 해야 할 <br />다음 액션이 명확해졌다.</>
                                    ].map((item, idx) => (
                                        <tr key={idx}>
                                            <td style={{ textAlign: 'left' }}>{item}</td>
                                            {[0, 1, 2, 3, 4, 5, 6].map(score => (
                                                <td key={score}>
                                                    <input
                                                        type="radio"
                                                        name={`q7_${idx}`}
                                                        required
                                                        className={styles.radioInput}
                                                        value={score}
                                                        onChange={(e) => handleScoreChange(idx, e.target.value)}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className={styles.questionGroup}>
                            <p className={styles.questionText}>8. 기타 건의사항</p>
                            <textarea
                                className={styles.textarea}
                                rows={4}
                                onChange={(e) => handleChange('q8_suggestions', e.target.value)}
                            />
                        </div>
                    </>
                )}

                {/* Flow B: No Interview (Q1=No) */}
                {formData.q1_hasInterview === 'no' && (
                    <div className={`${styles.questionGroup} ${styles.wideSpacing}`}>
                        <p className={styles.questionText}>5. 미실시 사유는 무엇이었나요? (복수선택)</p>
                        <div className={styles.options} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            {[
                                '일정상 어려움',
                                '메신저/문서 등 다른 방식으로 대체',
                                '팀장 측에서 진행하지 않음'
                            ].map(opt => (
                                <label key={opt} className={styles.radioLabel} style={{ width: '100%' }}>
                                    <input
                                        type="checkbox"
                                        className={styles.radioInput}
                                        onChange={(e) => handleCheckboxChange(opt, e.target.checked)}
                                    />
                                    <span>{opt}</span>
                                </label>
                            ))}
                            <label className={styles.radioLabel} style={{ width: '100%' }}>
                                <input
                                    type="checkbox"
                                    className={styles.radioInput}
                                    onChange={(e) => handleCheckboxChange('other', e.target.checked)}
                                />
                                <span>기타 (직접입력)</span>
                            </label>
                            {formData.q5_reason.includes('other') && (
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="사유를 입력해주세요"
                                    onChange={(e) => handleChange('q5_reason_other', e.target.value)}
                                />
                            )}
                        </div>
                        <div className={styles.questionGroup} style={{ marginTop: '3rem' }}>
                            <p className={styles.questionText}>8. 기타 건의사항</p>
                            <textarea
                                className={styles.textarea}
                                rows={4}
                                onChange={(e) => handleChange('q3_no_suggestions', e.target.value)}
                            />
                        </div>
                    </div>
                )}

                <button type="submit" className={styles.submitBtn} disabled={loading || !formData.q1_hasInterview}>
                    {loading ? '제출 중...' : '설문 제출하기'}
                </button>
                <p style={{ marginTop: '1rem', textAlign: 'center', color: '#999', fontSize: '0.9rem' }}>
                    * 제출 후에는 수정이 불가합니다.
                </p>

            </form>
        </main>
    );
}
