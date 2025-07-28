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
                qaData[language][category][question] = {};
            }
            qaData[language][category][question][model] = { answer: model_answer, is_correct: is_correct };
        });
    }
    return qaData;
}

function createHTML(qaData) {
    const container = document.querySelector('.container');
    container.innerHTML = '<h1>Evaluation of Model\'s Answer</h1>';

    const langTab = document.createElement('div');
    langTab.className = 'lang-tab';
    container.appendChild(langTab);

    const langMap = {
        'ko': 'Korean',
        'en': 'English',
        'ja': 'Japanese',
        'zh-Hant': 'Traditional Chinese'
    };

    Object.keys(qaData).forEach((lang, index) => {
        const langButton = document.createElement('button');
        langButton.className = 'lang-tablinks';
        langButton.textContent = langMap[lang] || lang;
        langButton.onclick = (event) => openLang(event, lang);
        if (index === 0) {
            langButton.id = 'defaultOpenLang';
        }
        langTab.appendChild(langButton);
    });

    const expandCollapseContainer = document.createElement('div');
    expandCollapseContainer.className = 'expand-collapse-buttons';
    expandCollapseContainer.innerHTML = 
        '<button id="expand-all" class="control-button">전체 펼치기</button>' +
        '<button id="collapse-all" class="control-button">전체 닫기</button>';
    langTab.appendChild(expandCollapseContainer);

    Object.keys(qaData).forEach((lang, index) => {
        const langContent = document.createElement('div');
        langContent.id = lang;
        langContent.className = 'lang-tabcontent';
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
                const questionBlock = document.createElement('div');
                questionBlock.className = 'question-block';
                categoryContent.appendChild(questionBlock);

                const questionTitle = document.createElement('h2');
                questionTitle.className = 'question-title';
                questionTitle.textContent = `Q${questionCount++}: ${question}`;
                questionBlock.appendChild(questionTitle);

                const answersContainer = document.createElement('div');
                answersContainer.className = 'answers-container';
                questionBlock.appendChild(answersContainer);

                Object.keys(qaData[lang][category][question]).forEach(model => {
                    const modelData = qaData[lang][category][question][model];
                    const answerCard = document.createElement('div');
                    answerCard.className = 'answer-card';
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
                    markdownContent.setAttribute('data-markdown', modelData.answer);
                    answerCard.appendChild(markdownContent);
                });
            });
        });
    });
}


function openLang(evt, lang) {
    var i, langtabcontent, langtablinks;
    langtabcontent = document.getElementsByClassName("lang-tabcontent");
    for (i = 0; i < langtabcontent.length; i++) {
        langtabcontent[i].style.display = "none";
    }
    langtablinks = document.getElementsByClassName("lang-tablinks");
    for (i = 0; i < langtablinks.length; i++) {
        langtablinks[i].className = langtablinks[i].className.replace(" active", "");
    }
    document.getElementById(lang).style.display = "block";
    evt.currentTarget.className += " active";

    var defaultCategory = document.querySelector('#' + lang + ' .defaultOpenCat');
    if (defaultCategory) {
        defaultCategory.click();
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

document.addEventListener("DOMContentLoaded", async () => {
    const qaData = await loadQAData();
    createHTML(qaData);

    document.getElementById("defaultOpenLang").click();

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
});