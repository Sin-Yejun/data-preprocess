const express = require('express');
const { Firestore, FieldValue } = require('@google-cloud/firestore'); // Firestore 모듈 추가
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// --- Firestore 클라이언트 초기화 ---
// Cloud Run 환경에서는 자동으로 인증 정보를 가져옵니다.
// 로컬에서 테스트할 때는 'gcloud auth application-default login' 명령어로 인증해야 합니다.
const db = new Firestore();

// --- 데이터 구조 안내 ---
// 1. 전체 투표 집계: 'votes' 컬렉션 -> 'aggregate' 문서에 모든 언어/질문/모델별 투표 수 저장
// 2. 사용자별 투표 기록: 'user_votes' 컬렉션 -> 각 문서의 ID는 userId, 필드에 투표 내용 저장

app.use(express.json());
app.use(express.static(__dirname));

// GET /votes - Firestore에서 전체 투표 현황 반환
app.get('/votes', async (req, res) => {
    try {
        const votesDoc = await db.collection('votes').doc('aggregate').get();
        if (!votesDoc.exists) {
            res.json({}); // 아직 데이터가 없으면 빈 객체 반환
        } else {
            res.json(votesDoc.data());
        }
    } catch (error) {
        console.error('Error reading aggregate votes:', error);
        res.status(500).send('Error reading votes data');
    }
});

// GET /my-votes/:userId - Firestore에서 특정 사용자의 투표 현황 반환
app.get('/my-votes/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const userVotesDoc = await db.collection('user_votes').doc(userId).get();
        if (!userVotesDoc.exists) {
            res.json({}); // 아직 투표한 적 없으면 빈 객체 반환
        } else {
            res.json(userVotesDoc.data());
        }
    } catch (error) {
        console.error('Error reading user votes:', error);
        res.status(500).send('Error reading user votes data');
    }
});

// GET /user-status/:userId - 사용자의 투표 완료 여부 확인
app.get('/user-status/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const userVotesDoc = await db.collection('user_votes').doc(userId).get();
        // 해당 userId 문서가 존재하고, 그 안에 language 필드가 있는지 확인
        const hasVoted = userVotesDoc.exists && userVotesDoc.data().language;
        res.json({ hasVoted });
    } catch (error) {
        console.error('Error reading user status:', error);
        res.status(500).json({ success: false, message: 'Error reading user status' });
    }
});


// POST /submit-votes - 투표 결과를 Firestore에 일괄 저장 (트랜잭션 사용)
app.post('/submit-votes', async (req, res) => {
    const { userId, language, votes: newVotes } = req.body;

    if (!userId || !language || !newVotes) {
        return res.status(400).json({ success: false, message: 'userId, language, and votes are required.' });
    }

    const userVotesRef = db.collection('user_votes').doc(userId);
    const totalVotesRef = db.collection('votes').doc('aggregate');

    try {
        await db.runTransaction(async (transaction) => {
            const userVotesDoc = await transaction.get(userVotesRef);
            const totalVotesDoc = await transaction.get(totalVotesRef);

            const oldVotes = userVotesDoc.exists ? userVotesDoc.data()[language] || {} : {};
            const totalVotes = totalVotesDoc.exists ? totalVotesDoc.data() : {};

            if (!totalVotes[language]) totalVotes[language] = {};

            const allQuestionIds = new Set([...Object.keys(oldVotes), ...Object.keys(newVotes)]);

            allQuestionIds.forEach(questionId => {
                const oldModel = oldVotes[questionId];
                const newModel = newVotes[questionId];

                if (oldModel !== newModel) {
                    // 이전 투표가 있었다면, 전체 집계에서 1 감소
                    if (oldModel) {
                        const oldModelPath = `${language}.${questionId}.${oldModel}`;
                        if (totalVotes[language]?.[questionId]?.[oldModel]) {
                             transaction.update(totalVotesRef, { [oldModelPath]: FieldValue.increment(-1) });
                        }
                    }
                    // 새 투표가 있다면, 전체 집계에서 1 증가
                    if (newModel) {
                         const newModelPath = `${language}.${questionId}.${newModel}`;
                         if (totalVotes[language]?.[questionId]?.[newModel]) {
                            transaction.update(totalVotesRef, { [newModelPath]: FieldValue.increment(1) });
                         } else {
                            // 모델에 대한 첫 투표라면 필드를 생성하고 1로 설정
                            if (!totalVotes[language][questionId]) totalVotes[language][questionId] = {};
                            totalVotes[language][questionId][newModel] = 1;
                            transaction.set(totalVotesRef, totalVotes, { merge: true });
                         }
                    }
                }
            });

            // 사용자의 최종 투표 내용 업데이트
            const userData = {
                [language]: newVotes,
                // language 필드를 추가하여 투표 완료 여부를 명확히 함
                language: language,
                lastUpdated: FieldValue.serverTimestamp() // 업데이트 시간 기록
            };
            transaction.set(userVotesRef, userData, { merge: true });
        });

        res.status(200).json({ success: true, message: 'Votes submitted successfully.' });

    } catch (error) {
        console.error('Error saving batch votes:', error);
        res.status(500).json({ success: false, message: 'Error saving votes' });
    }
});


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});