'use client';

import { useState } from 'react';
import styles from '../page.module.css'; // Reuse main styles

export default function LeaderSurveyPage() {
    const [department, setDepartment] = useState('');
    const [feedback, setFeedback] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/leader/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ department, feedback })
            });

            if (res.ok) {
                setSubmitted(true);
            } else {
                alert('제출에 실패했습니다.');
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
                    <p className={styles.description}>
                        소중한 의견 감사합니다.<br />
                        팀장의 피드백이 더 나은 면담 문화를 만듭니다.
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.container}>
            <form className={styles.card} onSubmit={handleSubmit}>
                <header className={styles.header}>
                    <h1 className={styles.title}>팀장용: 목표수립 면담 피드백</h1>
                    <p className={styles.description}>
                        면담 과정에서 겪은 어려움을 솔직하게 작성해 주세요.
                    </p>
                </header>

                <div className={styles.questionGroup}>
                    <p className={styles.questionText}>소속을 선택해 주세요.</p>
                    <select
                        className={styles.select}
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        required
                        style={{ width: '100%' }}
                    >
                        <option value="">선택하세요</option>
                        <option value="본사">본사</option>
                        <option value="부산공장 및 기술연구소">부산공장 및 기술연구소</option>
                    </select>
                </div>

                <div className={styles.questionGroup}>
                    <p className={styles.questionText}>
                        면담 과정 중 팀원들에게 가장 힘들었던 점은 무엇인가요?<br />
                        <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: '#666' }}>
                            (예: 면담 준비 상태 미흡, 과도한 요구, 무반응 등)
                        </span>
                    </p>
                    <textarea
                        className={styles.textarea}
                        rows={6}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        required
                        placeholder="자유롭게 작성해 주세요."
                    />
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                    {loading ? '제출 중...' : '제출하기'}
                </button>
            </form>
        </main>
    );
}
