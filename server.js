const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const votesFilePath = path.join(__dirname, 'votes.json');
const userVotesFilePath = path.join(__dirname, 'user_votes.json');

// JSON 요청 본문을 파싱하기 위한 미들웨어
app.use(express.json());
// 정적 파일을 제공하기 위한 미들웨어 (index.html, script.js, style.css)
app.use(express.static(__dirname));

// Helper function to read JSON files
async function readJsonFile(filePath, defaultValue = {}) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return defaultValue;
        }
        throw error;
    }
}

// GET /votes - 현재 ���체 투표 현황 반환
app.get('/votes', async (req, res) => {
    try {
        const votes = await readJsonFile(votesFilePath);
        res.json(votes);
    } catch (error) {
        console.error('Error reading aggregate votes:', error);
        res.status(500).send('Error reading votes data');
    }
});

// GET /my-votes/:userId - 특정 사용자의 투표 현황 반환
app.get('/my-votes/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const userVotes = await readJsonFile(userVotesFilePath);
        res.json(userVotes[userId] || {});
    } catch (error) {
        console.error('Error reading user votes:', error);
        res.status(500).send('Error reading user votes data');
    }
});

// POST /vote - 투표 기록 (New simplified logic)
app.post('/vote', async (req, res) => {
    const { questionId, model: newModel, userId, language } = req.body;

    if (!questionId || !newModel || !userId || !language) {
        return res.status(400).json({ success: false, message: 'QuestionId, model, userId, and language are required.' });
    }

    try {
        const totalVotes = await readJsonFile(votesFilePath, {});
        const userVotes = await readJsonFile(userVotesFilePath, {});

        // Initialize data structures
        if (!totalVotes[language]) totalVotes[language] = {};
        if (!totalVotes[language][questionId]) totalVotes[language][questionId] = {};
        if (!userVotes[userId]) userVotes[userId] = {};
        if (!userVotes[userId][language]) userVotes[userId][language] = {};

        const oldModel = userVotes[userId][language][questionId];

        if (oldModel === newModel) { // Unvoting
            if (totalVotes[language][questionId][oldModel]) {
                totalVotes[language][questionId][oldModel]--;
                if (totalVotes[language][questionId][oldModel] === 0) {
                    delete totalVotes[language][questionId][oldModel];
                }
            }
            delete userVotes[userId][language][questionId];
        } else { // New vote or changing vote
            if (oldModel) { // Decrement old model count if changing vote
                if (totalVotes[language][questionId][oldModel]) {
                    totalVotes[language][questionId][oldModel]--;
                    if (totalVotes[language][questionId][oldModel] === 0) {
                        delete totalVotes[language][questionId][oldModel];
                    }
                }
            }
            // Increment new model count
            if (!totalVotes[language][questionId][newModel]) {
                totalVotes[language][questionId][newModel] = 0;
            }
            totalVotes[language][questionId][newModel]++;
            // Set user's vote
            userVotes[userId][language][questionId] = newModel;
        }

        await fs.writeFile(votesFilePath, JSON.stringify(totalVotes, null, 2), 'utf8');
        await fs.writeFile(userVotesFilePath, JSON.stringify(userVotes, null, 2), 'utf8');

        res.status(200).json({
            success: true,
            votes: totalVotes[language][questionId] || {},
            userVote: userVotes[userId]?.[language]?.[questionId] || null
        });
    } catch (error) {
        console.error('Error saving vote:', error);
        res.status(500).json({ success: false, message: 'Error saving vote' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
