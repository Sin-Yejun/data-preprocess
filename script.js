const translations = {
    en: {
        title: "Model Answer Correctness Comparison",
        h1: "Evaluation of Model's Answer",
        korean: "Korean",
        english: "English",
        japanese: "Japanese",
        chinese: "Traditional Chinese",
        expandAll: "Expand All",
        collapseAll: "Collapse All",
    },
    ko: {
        title: "모델 답변 정확도 비교",
        h1: "모델의 답변 평가",
        korean: "한국어",
        english: "영어",
        japanese: "일본어",
        chinese: "중국어 번체",
        expandAll: "전체 펼치기",
        collapseAll: "전체 닫기",
    },
    ja: {
        title: "モデル回答の正解率比較",
        h1: "モデルの回答評価",
        korean: "韓国語",
        english: "英語",
        japanese: "日本語",
        chinese: "繁体字中国語",
        expandAll: "すべて展開",
        collapseAll: "すべて折りたたむ",
    },
    'zh-Hant': {
        title: "模型答案正確性比較",
        h1: "模型的答案評估",
        korean: "韓語",
        english: "英語",
        japanese: "日語",
        chinese: "繁體中文",
        expandAll: "全部展開",
        collapseAll: "全部收合",
    }
};

async function loadQAData() {
    const models = ['gemma', 'qwen2.5', 'qwen3'];
    const qaData = {};

    for (const model of models) {
        const response = await fetch(`final_data/QA_${model}.json`);
        const data = await response.json();
        data.forEach(item => {
            const { language, id, question, model_answer, is_correct } = item;
            let category;
            const questionNumber = parseInt(id.split('_')[1]);
            const questionId = `q${String(questionNumber).padStart(3, '0')}`;

            if (questionNumber >= 1 && questionNumber <= 50) {
                category = 'General';
            } else if (questionNumber >= 51 && questionNumber <= 100) {
                category = 'Exercise';
            } else if (questionNumber >= 101 && questionNumber <= 125) {
                category = 'Calculation';
            } else {
                category = 'Other';
            }

            if (!qaData[language]) {
                qaData[language] = {};
            }
            if (!qaData[language][category]) {
                qaData[language][category] = {};
            }
            if (!qaData[language][category][question]) {
                qaData[language][category][question] = { id: questionId, models: {} };
            }
            qaData[language][category][question].models[model] = { answer: model_answer, is_correct: is_correct };
        });
    }
    return qaData;
}

function createHTML(qaData, lang) {
    const container = document.querySelector('.container');
    container.innerHTML = `<h1 data-i18n="h1">${translations[lang].h1}</h1>`;

    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'controls-container';
    container.appendChild(controlsContainer);

    const expandCollapseContainer = document.createElement('div');
    expandCollapseContainer.className = 'expand-collapse-buttons';
    expandCollapseContainer.innerHTML = 
        `<button id="expand-all" class="control-button" data-i18n="expandAll">${translations[lang].expandAll}</button>` +
        `<button id="collapse-all" class="control-button" data-i18n="collapseAll">${translations[lang].collapseAll}</button>`;
    controlsContainer.appendChild(expandCollapseContainer);

    const langContent = document.createElement('div');
    langContent.id = lang;
    langContent.className = 'lang-tabcontent';
    langContent.style.display = 'block'; // Show current language content
    container.appendChild(langContent);

    const categoryTab = document.createElement('div');
    categoryTab.className = 'category-tab';
    langContent.appendChild(categoryTab);

    const categoryOrder = ['General', 'Exercise', 'Calculation', 'Other'];
    const sortedCategories = Object.keys(qaData[lang]).sort((a, b) => {
        return categoryOrder.indexOf(a) - categoryOrder.indexOf(b);
    });

    sortedCategories.forEach((category, catIndex) => {
        const categoryButton = document.createElement('button');
        categoryButton.className = 'category-tablinks';
        categoryButton.textContent = category;
        categoryButton.onclick = (event) => openCategory(event, `${lang}-${category}`, lang);
        if (catIndex === 0) {
            categoryButton.classList.add('defaultOpenCat');
        }
        categoryTab.appendChild(categoryButton);

        const categoryContent = document.createElement('div');
        categoryContent.id = `${lang}-${category}`;
        categoryContent.className = 'category-tabcontent';
        langContent.appendChild(categoryContent);

        let questionCount = 1;
        Object.keys(qaData[lang][category]).forEach(question => {
            const questionData = qaData[lang][category][question];
            const questionId = questionData.id;

            const questionBlock = document.createElement('div');
            questionBlock.className = 'question-block';
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

            const models = Object.keys(questionData.models);
            models.forEach(model => {
                const modelData = questionData.models[model];
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
                
                const voteCount = document.createElement('span');
                voteCount.className = 'vote-count';
                voteCount.textContent = '(0 votes)';
                modelTitle.appendChild(voteCount);

                answerCard.appendChild(modelTitle);

                const markdownContent = document.createElement('div');
                markdownContent.className = 'markdown-content';
                markdownContent.setAttribute('data-markdown', modelData.answer);
                answerCard.appendChild(markdownContent);
            });
        });
    });
}

function updateVoteCounts(questionId, votes) {
    const questionBlock = document.querySelector(`.question-block[data-question-id="${questionId}"]`);
    if (questionBlock) {
        const allVoteCounts = questionBlock.querySelectorAll('.vote-count');
        allVoteCounts.forEach(vc => {
            const modelName = vc.closest('.answer-card').dataset.model;
            if (!votes || !votes[modelName]) {
                vc.textContent = '(0 votes)';
            }
        });

        if (votes) {
            Object.keys(votes).forEach(model => {
                const voteCountEl = questionBlock.querySelector(`.answer-card[data-model="${model}"] .vote-count`);
                if (voteCountEl) {
                    voteCountEl.textContent = `(${votes[model]} votes)`;
                }
            });
        }
    }
}

let userVotes = {};
let userId = '';

function getOrCreateUserId() {
    let id = localStorage.getItem('userId');
    if (!id) {
        id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
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
            updateVoteCounts(questionId, result.votes);

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

function openCategory(evt, categoryName, lang) {
    var i, categorytabcontent, categorytablinks;
    categorytabcontent = document.querySelectorAll('#' + lang + ' .category-tabcontent');
    for (i = 0; i < categorytabcontent.length; i++) {
        categorytabcontent[i].style.display = "none";
    }
    categorytablinks = document.querySelectorAll('#' + lang + ' .category-tablinks');
    for (i = 0; i < categorytablinks.length; i++) {
        categorytablinks[i].className = categorytablinks[i].className.replace(" active", "");
    }
    document.getElementById(categoryName).style.display = "block";
    evt.currentTarget.className += " active";
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

        const totalVotes = await totalVotesRes.json();
        const myVotes = await myVotesRes.json();
        
        userVotes = myVotes;

        if (totalVotes[lang]) {
            Object.keys(totalVotes[lang]).forEach(questionId => {
                updateVoteCounts(questionId, totalVotes[lang][questionId]);
            });
        }

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

    const defaultCategory = document.querySelector('.defaultOpenCat');
    if (defaultCategory) {
        defaultCategory.click();
    }

    document.querySelectorAll(".markdown-content").forEach(el => {
        const md = el.getAttribute("data-markdown") || "";
        if (typeof marked !== "undefined") {
            el.innerHTML = marked.parse(md);
        } else {
            el.textContent = md;
        }
    });

    document.getElementById("expand-all").addEventListener("click", () => {
        document.querySelectorAll(".question-block").forEach(block => {
            block.classList.add("active");
        });
    });

    document.getElementById("collapse-all").addEventListener("click", () => {
        document.querySelectorAll(".question-block").forEach(block => {
            block.classList.remove("active");
        });
    });

    document.querySelectorAll(".question-title").forEach(title => {
        title.addEventListener("click", () => {
            title.closest(".question-block").classList.toggle("active");
        });
    });

    document.querySelectorAll('.answer-card').forEach(card => {
        card.addEventListener('click', () => {
            const questionId = card.closest('.question-block').dataset.questionId;
            const model = card.dataset.model;
            handleVote(questionId, model, card);
        });
    });
});