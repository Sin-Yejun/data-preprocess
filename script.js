const translations = {
    en: {
        title: "BurnFit New Ai Agent",
        h1: "Introducing the New AI for the new BurnFit",
        description: "The new AI agent for BurnFit helps with your records and habits,<br>analyzes your progress, and recommends ways for clearer growth.<br>Please <strong>choose the more useful and preferred answer</strong> from the two options below.<br>With just a simple choice, you can help us build a better BurnFit together.<br><br><em>*Estimated time: about 1-2 minutes / Feel free to participate!</em>",
        prev: "Previous",
        next: "Next",
        submit: "Submit",
        submit_dialog_title: "Confirm Submission",
        submit_confirm: "Are you sure you want to submit? You cannot return to the evaluation page after submission.",
        dialog_cancel: "Cancel",
        dialog_confirm: "Confirm",
        submitted_title: "Submission Complete",
        submitted_h1: "Your submission is complete.",
        submitted_p: "Thank you for your participation!",
    },
    ko: {
        title: "BurnFit New Ai Agent",
        h1: "새로운 번핏을 위한, New Ai 등장",
        description: "번핏에 도입될 새로운 AI 에이전트는 여러분의 기록과 습관을 돕고,<br>기록을 분석하며, 더 선명한 성장을 위한 방법을 추천합니다.<br>아래 제시된 두 개의 답변 중, <strong>더 유용하고 마음에 드는 답변을 선택</strong>해주세요.<br>간단한 선택만으로도, 더 나은 번핏을 함께 만들어갈 수 있습니다.<br><br><em>*소요 시간 : 약 1~2분 / 부담 없이 참여해주세요!</em>",
        prev: "이전",
        next: "다음",
        submit: "제출",
        submit_dialog_title: "제출 확인",
        submit_confirm: "제출하시겠습니까? 제출 후에는 평가 페이지로 돌아올 수 없습니다.",
        dialog_cancel: "취소",
        dialog_confirm: "확인",
        submitted_title: "제출 완료",
        submitted_h1: "제출이 완료되었습니다.",
        submitted_p: "참여해주셔서 감사합니다!",
    },
    ja: {
        title: "BurnFit 新AIエージェント",
        h1: "新しいBurnFitのための、New Ai登場",
        description: "BurnFitに導入される新しいAIエージェントは、あなたの記録と習慣をサポートし、<br>記録を分析し、より明確な成長のための方法を推奨します。<br>以下に提示された2つの回答の中から、<strong>より有用で気に入った回答を選択</strong>してください。<br>簡単な選択だけでも、より良いBurnFitを一緒に作っていくことができます。<br><br><em>*所要時間：約1〜2分 / お気軽にご参加ください！</em>",
        prev: "前へ",
        next: "次へ",
        submit: "提出",
        submit_dialog_title: "提出の確認",
        submit_confirm: "提出しますか？提出後は評価ページに戻れません。",
        dialog_cancel: "キャンセル",
        dialog_confirm: "確認",
        submitted_title: "提出完了",
        submitted_h1: "提出が完了しました。",
        submitted_p: "ご協力いただきありがとうございます！",
    },
    'zh-Hant': {
        title: "BurnFit 全新 Ai 代理",
        h1: "為全新的 BurnFit， New Ai 登場",
        description: "即將引入 BurnFit 的全新 AI 代理，將幫助您記錄和養成習慣，<br>分析您的記錄，並推薦更清晰的成長方法。<br>請從下面提出的兩個答案中，<strong>選擇您認為更有用、更喜歡的答案</strong>。<br>僅需簡單的選擇，就能與我們共同打造一個更好的 BurnFit。<br><br><em>*預計時間：約 1-2 分鐘 / 歡迎輕鬆參與！</em>",
        prev: "上一頁",
        next: "下一頁",
        submit: "提交",
        submit_dialog_title: "確認提交",
        submit_confirm: "確定要提交嗎？提交後將無法返回評估頁面。",
        dialog_cancel: "取消",
        dialog_confirm: "確認",
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

            const labels = ['A', 'B'];
            shuffledModels.forEach(([model, modelData], modelIndex) => {
                const answerCard = document.createElement('div');
                answerCard.className = 'answer-card';
                answerCard.dataset.model = model;
                answersContainer.appendChild(answerCard);

                const modelLabel = document.createElement('div');
                modelLabel.className = 'model-label';
                modelLabel.textContent = labels[modelIndex];
                answerCard.appendChild(modelLabel);

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

function showQuestion(index, previousIndex = -1) {
    const questions = document.querySelectorAll('.question-block');
    const currentQuestion = document.querySelector(`.question-block[data-index="${previousIndex}"]`);
    const newQuestion = document.querySelector(`.question-block[data-index="${index}"]`);

    if (currentQuestion) {
        currentQuestion.classList.add('fade-out');
        currentQuestion.addEventListener('animationend', () => {
            currentQuestion.classList.remove('active');
            currentQuestion.classList.remove('fade-out');
            
            if (newQuestion) {
                newQuestion.classList.add('active');
                newQuestion.classList.add('fade-in');
                newQuestion.addEventListener('animationend', () => {
                    newQuestion.classList.remove('fade-in');
                }, { once: true });
            }
        }, { once: true });
    } else if (newQuestion) {
        // Initial load, no fade-out needed
        newQuestion.classList.add('active');
    }

    updateProgress();
}

function updateProgress() {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get('lang') || 'en';
    const totalQuestions = questionsInView.length;
    
    const votedIds = new Set(Object.keys(userVotes[lang] || {}));
    const votedCount = questionsInView.filter(q => votedIds.has(q.id)).length;
    
    const progressText = document.getElementById('progress-text');
    const progressBarForeground = document.getElementById('progress-bar-foreground');

    if (progressText && progressBarForeground) {
        const percentage = totalQuestions > 0 ? (votedCount / totalQuestions) * 100 : 0;
        
        progressText.textContent = `${votedCount} / ${totalQuestions}`;
        progressBarForeground.style.width = `${percentage}%`;
    }

    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.disabled = votedCount < totalQuestions;
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

    // Disable voting on the current question to prevent multiple quick votes
    const currentQuestionBlock = cardElement.closest('.question-block');
    const answerCards = currentQuestionBlock.querySelectorAll('.answer-card');
    answerCards.forEach(card => card.style.pointerEvents = 'none');


    if (!userVotes[lang]) userVotes[lang] = {};

    // If the user clicks the same answer again, we don't unvote, just proceed.
    // The primary action is to move forward.
    userVotes[lang][questionId] = model;
    
    // Visually select the card
    currentQuestionBlock.querySelectorAll('.answer-card').forEach(card => card.classList.remove('selected-vote'));
    const selectedCard = currentQuestionBlock.querySelector(`.answer-card[data-model="${model}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected-vote');
    }
    
    updateProgress();

    // Automatically move to the next question after a short delay
    setTimeout(() => {
        if (currentQuestionIndex < questionsInView.length - 1) {
            const previousIndex = currentQuestionIndex;
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex, previousIndex);
        }
        // Re-enable voting on the new question (or all for simplicity)
        document.querySelectorAll('.answer-card').forEach(card => card.style.pointerEvents = 'auto');
    }, 250); // 0.25 second delay to match animation
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

    // --- 제출 버튼 이벤트 리스너 ---
    document.getElementById('submit-btn').addEventListener('click', async () => {
        const params = new URLSearchParams(window.location.search);
        const lang = params.get('lang') || 'en';
        
        showCustomConfirm(
            translations[lang].submit_dialog_title, 
            translations[lang].submit_confirm, 
            async () => {
                const success = await submitVotes();
                if (success) {
                    localStorage.setItem('hasVoted', 'true'); // 투표 완료 기록
                    window.location.href = `submitted.html?lang=${lang}`;
                }
            }
        );
    });
});

function showCustomConfirm(title, message, onConfirm) {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get('lang') || 'en';

    const dialogOverlay = document.getElementById('custom-dialog-overlay');
    const titleEl = document.getElementById('custom-dialog-title');
    const messageEl = document.getElementById('custom-dialog-message');
    const confirmBtn = document.getElementById('dialog-confirm-btn');
    const cancelBtn = document.getElementById('dialog-cancel-btn');

    titleEl.textContent = title;
    messageEl.textContent = message;

    // Set button text from translations
    if (translations[lang]) {
        confirmBtn.textContent = translations[lang].dialog_confirm || 'Confirm';
        cancelBtn.textContent = translations[lang].dialog_cancel || 'Cancel';
    }

    dialogOverlay.classList.remove('hidden');

    const confirmHandler = () => {
        onConfirm();
        cleanup();
    };

    const cancelHandler = () => {
        cleanup();
    };

    const cleanup = () => {
        dialogOverlay.classList.add('hidden');
        confirmBtn.removeEventListener('click', confirmHandler);
        cancelBtn.removeEventListener('click', cancelHandler);
        dialogOverlay.removeEventListener('click', overlayClickHandler);
    };
    
    const overlayClickHandler = (e) => {
        if (e.target === dialogOverlay) {
            cleanup();
        }
    };

    confirmBtn.addEventListener('click', confirmHandler);
    cancelBtn.addEventListener('click', cancelHandler);
    dialogOverlay.addEventListener('click', overlayClickHandler);
}