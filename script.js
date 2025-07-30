const translations = {
    en: {
        title: "Model Answer Correctness Comparison",
        h1: "Evaluation of Model's Answer",
        korean: "Korean",
        english: "English",
        japanese: "Japanese",
        chinese: "Traditional Chinese",
    },
    ko: {
        title: "모델 답변 정확도 비교",
        h1: "모델의 답변 평가",
        korean: "한국어",
        english: "영어",
        japanese: "일본어",
        chinese: "중국어 번체",
    },
    ja: {
        title: "モデル回答の正解率比較",
        h1: "モデルの回答評価",
        korean: "韓国語",
        english: "英語",
        japanese: "日本語",
        chinese: "繁体字中国語",
    },
    'zh-Hant': {
        title: "模型答案正確性比較",
        h1: "模型的答案評估",
        korean: "韓語",
        english: "英語",
        japanese: "日語",
        chinese: "繁體中文",
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
    const container = document.querySelector('.container');
    container.innerHTML = `<h1 data-i18n="h1">${translations[lang].h1}</h1>`;

    const langContent = document.createElement('div');
    langContent.id = lang;
    langContent.className = 'lang-tabcontent';
    langContent.style.display = 'block';
    container.appendChild(langContent);

    const category = 'Exercise';
    const categoryContent = document.createElement('div');
    categoryContent.id = `${lang}-${category}`;
    categoryContent.className = 'category-content'; // No longer a tab content
    langContent.appendChild(categoryContent);

    let questionCount = 1;
    if (qaData[lang]?.[category]) {
        Object.values(qaData[lang][category]).forEach(questionData => {
            const { id: questionId, question, models: modelMap } = questionData;

            const questionBlock = document.createElement('div');
            questionBlock.className = 'question-block active'; // Always expanded
            questionBlock.dataset.questionId = questionId;
            questionBlock.dataset.question = question;
            categoryContent.appendChild(questionBlock);

            const questionTitle = document.createElement('h2');
            questionTitle.className = 'question-title';
            questionTitle.textContent = `Q${questionCount++}: ${question}`;
            questionBlock.appendChild(questionTitle);

            const answersContainer = document.createElement('div');
            answersContainer.className = 'answers-container';
            questionBlock.appendChild(answersContainer);


            Object.entries(modelMap).forEach(([model, modelData]) => {
                const answerCard = document.createElement('div');
                answerCard.className = 'answer-card';
                answerCard.dataset.model = model;
                answersContainer.appendChild(answerCard);

                const modelTitle = document.createElement('h4');
                modelTitle.textContent = model;

                if (modelData.is_correct !== undefined) {
                    const correctnessIndicator = document.createElement('span');
                    if (modelData.is_correct) {
                        correctnessIndicator.textContent = ' ✅';
                        correctnessIndicator.className = 'correct';
                    } else {
                        correctnessIndicator.textContent = ' ❌';
                        correctnessIndicator.className = 'incorrect';
                    }
                    modelTitle.appendChild(correctnessIndicator);
                }

                answerCard.appendChild(modelTitle);

                const markdownContent = document.createElement('div');
                markdownContent.className = 'markdown-content';
                markdownContent.dataset.markdown = modelData.answer;  // 변수 이름 통일
                answerCard.appendChild(markdownContent);
            });
        });
    }
}

let userVotes = {};
let userId = '';

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

async function handleVote(questionId, model, cardElement) {
    const params = new URLSearchParams(window.location.search);
    let lang = params.get('lang') || 'en';

    try {
        const response = await fetch('/vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ questionId, model, userId, language: lang }),
        });
        const result = await response.json();

        if (result.success) {
            if (!userVotes[lang]) {
                userVotes[lang] = {};
            }

            if (result.userVote) {
                userVotes[lang][questionId] = result.userVote;
            } else {
                delete userVotes[lang][questionId];
            }

            const questionBlock = cardElement.closest('.question-block');
            questionBlock.querySelectorAll('.answer-card').forEach(card => card.classList.remove('selected-vote'));

            if (userVotes[lang][questionId]) {
                const selectedCard = questionBlock.querySelector(`.answer-card[data-model="${userVotes[lang][questionId]}"]`);
                if (selectedCard) {
                    selectedCard.classList.add('selected-vote');
                }
            }

        } else {
            alert(result.message || 'Could not submit vote.');
        }
    } catch (error) {
        console.error('Error submitting vote:', error);
        alert('An error occurred while submitting your vote.');
    }
}

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
        const [totalVotesRes, myVotesRes] = await Promise.all([
            fetch('/votes'),
            fetch(`/my-votes/${userId}`)
        ]);
        const parseJSON = async res => {
            if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
                return res.json();
            }
            console.warn('Non‑JSON or error response:', res.status, res.url);
            return {};         // 파싱 실패 시 빈 객체 반환
        };
        const totalVotes = await parseJSON(totalVotesRes);
        const myVotes = await parseJSON(myVotesRes);

        userVotes = myVotes;

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
});