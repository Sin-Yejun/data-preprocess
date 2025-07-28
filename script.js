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

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("defaultOpenLang").click();

  document.querySelectorAll(".markdown-content").forEach(el => {
    const md = el.getAttribute("data-markdown") || "";
    if (typeof marked !== "undefined") {
      el.innerHTML = marked.parse(md);
    } else {
      // marked가 없으면 그냥 텍스트로 넣기
      el.textContent = md;
    }
  });

  // 이 부분이 실행돼야 질문 토글이 동작합니다
  document.querySelectorAll(".question-title").forEach(title => {
    title.addEventListener("click", () => {
      title.closest(".question-block").classList.toggle("active");
    });
  });
});


