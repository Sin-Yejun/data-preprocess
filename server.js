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
    const { question, model: newModel, userId } = req.body;

    if (!question || !newModel || !userId) {
        return res.status(400).json({ success: false, message: 'Question, model, and userId are required.' });
    }

    try {
        const totalVotes = await readJsonFile(votesFilePath);
        const userVotes = await readJsonFile(userVotesFilePath);

        // Initialize data structures if they don't exist
        if (!totalVotes[question]) totalVotes[question] = {};
        if (!totalVotes[question][newModel]) totalVotes[question][newModel] = 0;
        if (!userVotes[userId]) userVotes[userId] = {};

        const oldModel = userVotes[userId][question];

        if (oldModel === newModel) {
            // Case 1: Unvoting (clicking the same model again)
            if (totalVotes[question][oldModel] > 0) {
                totalVotes[question][oldModel]--;
            }
            delete userVotes[userId][question];
        } else {
            // Case 2: Changing vote
            if (oldModel) {
                if (totalVotes[question][oldModel] > 0) {
                    totalVotes[question][oldModel]--;
                }
            }
            // Case 3: New vote (or finishing a changed vote)
            totalVotes[question][newModel]++;
            userVotes[userId][question] = newModel;
        }

        // Write updated data back to files
        await fs.writeFile(votesFilePath, JSON.stringify(totalVotes, null, 2), 'utf8');
        await fs.writeFile(userVotesFilePath, JSON.stringify(userVotes, null, 2), 'utf8');

        res.status(200).json({ success: true, votes: totalVotes[question], userVote: userVotes[userId][question] || null });
    } catch (error) {
        console.error('Error saving vote:', error);
        res.status(500).json({ success: false, message: 'Error saving vote' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
