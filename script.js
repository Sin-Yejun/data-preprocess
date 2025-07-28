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

    // Open the default category for the selected language
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

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("defaultOpenLang").click();
    
    var markdownContent = document.querySelectorAll('.markdown-content');
    markdownContent.forEach(function(element) {
        var markdownText = element.getAttribute('data-markdown');
        element.innerHTML = marked.parse(markdownText);
    });

    // Add click event listener to question titles for accordion functionality
    const questionTitles = document.querySelectorAll('.question-title');
    questionTitles.forEach(title => {
        title.addEventListener('click', () => {
            const questionBlock = title.closest('.question-block');
            questionBlock.classList.toggle('collapsed');
            title.classList.toggle('collapsed');
        });
    });
});