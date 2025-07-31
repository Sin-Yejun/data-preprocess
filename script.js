const translations = {
    en: {
        title: "Model Answer Correctness Comparison",
        h1: "Evaluation of Model's Answer",
        prev: "Previous",
        next: "Next",
        submit: "Submit",
        submit_confirm: "Are you sure you want to submit? You cannot return to the evaluation page after submission.",
        submitted_title: "Submission Complete",
        submitted_h1: "Your submission is complete.",
        submitted_p: "Thank you for your participation!",
    },
    ko: {
        title: "모델 답변 정확도 비교",
        h1: "모델의 답변 평가",
        prev: "이전",
        next: "다음",
        submit: "제출",
        submit_confirm: "제출하시겠습니까? 제출 후에는 평가 페이지로 돌아올 수 없습니다.",
        submitted_title: "제출 완료",
        submitted_h1: "제출이 완료되었습니다.",
        submitted_p: "참여해주셔서 감사합니다!",
    },
    ja: {
        title: "モデル回答の正解率比較",
        h1: "モデルの回答評価",
        prev: "前へ",
        next: "次へ",
        submit: "提出",
        submit_confirm: "提出しますか？提出後は評価ページに戻れません。",
        submitted_title: "提出完了",
        submitted_h1: "提出が完了しました。",
        submitted_p: "ご協力いただきありがとうございます！",
    },
    'zh-Hant': {
        title: "模型答案正確性比較",
        h1: "模型的答案評估",
        prev: "上一頁",
        next: "下一頁",
        submit: "提交",
        submit_confirm: "確定要提交嗎？提交後將無法返回評估頁面。",
        submitted_title: "提交完成",
        submitted_h1: "您的提交已完成。",
        submitted_p: "感謝您的參與！",
    }
};

async function loadQAData() {
    const models = ['gemma_vote', 'qwen3_no_thinking_vote'];
    const qaData = {};

    for (const model of models) {
        const response = await fetch(`vote/questions_${model}.json`);
        const data = await response.json();
        data.forEach(item => {
            const { language, id, question, model_answer, is_correct } = item;
            const category = 'Exercise';                 // 고정 카테고리
            const questionNumber = parseInt(id.split('_')[1], 10);
            const questionId = `q${String(questionNumber).padStart(3, '0')}`;

            // ① 언어·카테고리 초기화
            if (!qaData[language]) qaData[language] = {};
            if (!qaData[language][category]) qaData[language][category] = {};

            // ② ‘질문 텍스트’가 아니라 **고유한 ID**를 키로 사용
            if (!qaData[language][category][questionId]) {
                qaData[language][category][questionId] = {
                    id: questionId,          // 가독성을 위해 ID 한 번 더 보관
                    question,                // 실제 질문 문장
                    models: {}               // 모델별 답변 저장소
                };
            }

            // ③ 모델 이름 정제 후 답변 입력
            const modelName = model
                .replace('_vote', '')
                .replace('_no_thinking', '');

            qaData[language][category][questionId].models[modelName] = {
                answer: model_answer,
                is_correct
            };
        });
    }
    return qaData;
}

function createHTML(qaData, lang) {
    const questionsContainer = document.getElementById('questions-container');
    questionsContainer.innerHTML = ''; // Clear previous questions

    const category = 'Exercise';
    if (qaData[lang]?.[category]) {
        const allQuestions = Object.values(qaData[lang][category]);
        questionsInView = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 10);

        questionsInView.forEach((questionData, index) => {
            const { id: questionId, question, models: modelMap } = questionData;

            const questionBlock = document.createElement('div');
            questionBlock.className = 'question-block'; // Not active by default
            questionBlock.dataset.questionId = questionId;
            questionBlock.dataset.question = question;
            questionBlock.dataset.index = index;
            questionsContainer.appendChild(questionBlock);

            const questionTitle = document.createElement('h2');
            questionTitle.className = 'question-title';
            questionTitle.textContent = `Q${index + 1}: ${question}`;
            questionBlock.appendChild(questionTitle);

            const answersContainer = document.createElement('div');
            answersContainer.className = 'answers-container';
            questionBlock.appendChild(answersContainer);

            const shuffledModels = Object.entries(modelMap).sort(() => 0.5 - Math.random());

            shuffledModels.forEach(([model, modelData]) => {
                const answerCard = document.createElement('div');
                answerCard.className = 'answer-card';
                answerCard.dataset.model = model;
                answersContainer.appendChild(answerCard);

                if (modelData.is_correct !== undefined) {
                    const correctnessIndicator = document.createElement('span');
                    if (modelData.is_correct) {
                        correctnessIndicator.textContent = ' ✅';
                        correctnessIndicator.className = 'correct';
                    } else {
                        correctnessIndicator.textContent = ' ❌';
                        correctnessIndicator.className = 'incorrect';
                    }
                    answerCard.appendChild(correctnessIndicator);
                }

                const markdownContent = document.createElement('div');
                markdownContent.className = 'markdown-content';
                markdownContent.dataset.markdown = modelData.answer;
                answerCard.appendChild(markdownContent);
            });
        });
    }
}

function showQuestion(index) {
    const questions = document.querySelectorAll('.question-block');
    questions.forEach(q => q.classList.remove('active'));

    const newQuestion = document.querySelector(`.question-block[data-index="${index}"]`);
    if (newQuestion) {
        newQuestion.classList.add('active');
    }

    document.getElementById('prev-btn').disabled = index === 0;
    document.getElementById('next-btn').disabled = index === questionsInView.length - 1;
    updateProgress();
}

function updateProgress() {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get('lang') || 'en';
    const totalQuestions = questionsInView.length;
    
    const votedIds = new Set(Object.keys(userVotes[lang] || {}));
    const votedOnScreen = questionsInView.filter(q => votedIds.has(q.id));
    
    const progressText = document.getElementById('progress-text');
    if (progressText) {
        progressText.textContent = `${votedOnScreen.length} / ${totalQuestions}`;
    }

    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.disabled = votedOnScreen.length < totalQuestions;
    }
}

let userVotes = {};
let userId = '';
let currentQuestionIndex = 0;
let questionsInView = [];

function getOrCreateUserId() {
    let id = localStorage.getItem('userId');
    if (!id) {
        id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        localStorage.setItem('userId', id);
    }
    return id;
}

// --- 투표 처리 방식 선택 ---
// [방법 1: 실시간 저장] 사용자가 답변을 클릭할 때마다 서버에 즉시 저장합니다. (기본값)
// [방법 2: 일괄 제출] 사용자가 '제출' 버튼을 누를 때 모든 답변을 한 번에 서버에 저장합니다.
// 방법을 변경하려면 아래의 해당 코드 블록의 주석을 해제하고, 다른 블록을 주석 처리하세요.
// 서버의 server.js 파일에서도 동일한 방식으로 라우트 핸들러를 수정해야 합니다.

/*
// --- [방법 1: 실시간 저장] ---
async function handleVote(questionId, model, cardElement) {
    const params = new URLSearchParams(window.location.search);
    let lang = params.get('lang') || 'en';

    try {
        const response = await fetch('/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questionId, model, userId, language: lang }),
        });
        const result = await response.json();

        if (result.success) {
            if (!userVotes[lang]) userVotes[lang] = {};

            if (result.userVote) {
                userVotes[lang][questionId] = result.userVote;
            } else {
                delete userVotes[lang][questionId];
            }

            const questionBlock = cardElement.closest('.question-block');
            questionBlock.querySelectorAll('.answer-card').forEach(card => card.classList.remove('selected-vote'));

            if (userVotes[lang][questionId]) {
                const selectedCard = questionBlock.querySelector(`.answer-card[data-model="${userVotes[lang][questionId]}"]`);
                if (selectedCard) selectedCard.classList.add('selected-vote');
            }
            updateProgress();
        } else {
            alert(result.message || 'Could not submit vote.');
        }
    } catch (error) {
        console.error('Error submitting vote:', error);
        alert('An error occurred while submitting your vote.');
    }
}
// --- [방법 1] 끝 ---
*/

// --- [방법 2: 일괄 제출] ---

function handleVote(questionId, model, cardElement) {
    const params = new URLSearchParams(window.location.search);
    let lang = params.get('lang') || 'en';

    if (!userVotes[lang]) userVotes[lang] = {};

    if (userVotes[lang][questionId] === model) {
        delete userVotes[lang][questionId];
    } else {
        userVotes[lang][questionId] = model;
    }

    const questionBlock = cardElement.closest('.question-block');
    questionBlock.querySelectorAll('.answer-card').forEach(card => card.classList.remove('selected-vote'));

    if (userVotes[lang][questionId]) {
        const selectedCard = questionBlock.querySelector(`.answer-card[data-model="${userVotes[lang][questionId]}"]`);
        if (selectedCard) selectedCard.classList.add('selected-vote');
    }
    updateProgress();
}

async function submitVotes() {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get('lang') || 'en';
    const votesToSubmit = userVotes[lang] || {};

    try {
        const response = await fetch('/submit-votes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                language: lang,
                votes: votesToSubmit
            }),
        });
        const result = await response.json();
        if (result.success) {
            return true;
        } else {
            alert('Submission failed: ' + (result.message || 'Unknown error'));
            return false;
        }
    } catch (error) {
        console.error('Error submitting votes:', error);
        alert('An error occurred while submitting your votes.');
        return false;
    }
}

// --- [방법 2] 끝 ---

function setLanguage(lang) {
    if (translations[lang]) {
        document.title = translations[lang].title;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang][key]) {
                el.innerHTML = translations[lang][key];
            }
        });
    }
}
if (typeof marked !== 'undefined') {
    marked.use({
        renderer: {
            del(text) {
                // text가 객체이고 text.text 속성이 존재하면 그 값을 사용, 아니면 원래 text 사용
                const innerText = (typeof text === 'object' && text.text) ? text.text : text;
                return `~${innerText}~`;
            }
        }
    });
}



document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    let lang = params.get('lang') || 'en';
    if (!translations[lang]) {
        lang = 'en';
    }
    
    userId = getOrCreateUserId();

    // 서버에 사용자 투표 상태 확인
    try {
        const response = await fetch(`/user-status/${userId}`);
        const data = await response.json();

        if (data.hasVoted) {
            // 서버에서 투표했다고 확인되면, submitted.html로 리디렉션
            localStorage.setItem('hasVoted', 'true'); // 로컬스토리지 상태 동기화
            window.location.href = `submitted.html?lang=${lang}`;
            return; // 리디렉션 후 스크립트 실행 중지
        } else {
            // 서버에 투표 기록이 없으면, 로컬스토리지의 'hasVoted'를 제거
            localStorage.removeItem('hasVoted');
        }
    } catch (error) {
        console.error('Error checking user vote status:', error);
        // 에러 발생 시 투표 페이지를 그냥 보여줄 수 있지만, 사용자에게 알리는 것이 좋을 수 있음
    }

    const qaData = await loadQAData();

    if (!qaData[lang]) {
        lang = Object.keys(qaData)[0];
        const url = new URL(window.location);
        url.searchParams.set('lang', lang);
        window.history.replaceState({}, '', url);
    }

    createHTML(qaData, lang);
    setLanguage(lang);

    try {
        const myVotesRes = await fetch(`/my-votes/${userId}`);
        const parseJSON = async res => {
            if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
                return res.json();
            }
            console.warn('Non‑JSON or error response:', res.status, res.url);
            return {};
        };
        userVotes = await parseJSON(myVotesRes);

        if (userVotes[lang]) {
            Object.keys(userVotes[lang]).forEach(questionId => {
                const model = userVotes[lang][questionId];
                if (model) {
                    const questionBlock = document.querySelector(`.question-block[data-question-id="${questionId}"]`);
                    if (questionBlock) {
                        const selectedCard = questionBlock.querySelector(`.answer-card[data-model="${model}"]`);
                        if (selectedCard) {
                            selectedCard.classList.add('selected-vote');
                        }
                    }
                }
            });
        }

    } catch (error) {
        console.error('Error fetching initial vote data:', error);
    }

    showQuestion(0); // Show the first question initially

    document.querySelectorAll(".markdown-content").forEach(el => {
        const md = el.getAttribute("data-markdown") || "";
        if (typeof marked !== "undefined") {
            el.innerHTML = marked.parse(md);
        } else {
            el.textContent = md;
        }
    });

    document.querySelectorAll('.answer-card').forEach(card => {
        card.addEventListener('click', () => {
            const questionId = card.closest('.question-block').dataset.questionId;
            const model = card.dataset.model;
            handleVote(questionId, model, card);
        });
    });

    document.getElementById('next-btn').addEventListener('click', () => {
        if (currentQuestionIndex < questionsInView.length - 1) {
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex);
        }
    });

    document.getElementById('prev-btn').addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showQuestion(currentQuestionIndex);
        }
    });

    // --- 제출 버튼 이벤트 리스너 ---
    // 위에서 선택한 투표 처리 방식에 맞춰 아래 리스너의 주석을 수정하세요.

    /*
    // [방법 1: 실시간 저장] 사용 시 (기본값)
    document.getElementById('submit-btn').addEventListener('click', () => {
        const params = new URLSearchParams(window.location.search);
        const lang = params.get('lang') || 'en';
        if (confirm(translations[lang].submit_confirm)) {
            window.location.href = `submitted.html?lang=${lang}`;
        }
    });
    */
    // [방법 2: 일괄 제출] 사용 시
    document.getElementById('submit-btn').addEventListener('click', async () => {
        const params = new URLSearchParams(window.location.search);
        const lang = params.get('lang') || 'en';
        if (confirm(translations[lang].submit_confirm)) {
            const success = await submitVotes();
            if (success) {
                localStorage.setItem('hasVoted', 'true'); // 투표 완료 기록
                window.location.href = `submitted.html?lang=${lang}`;
            }
        }
    });
});