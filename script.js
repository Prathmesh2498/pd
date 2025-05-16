window.onload = function () {
    showTab('home'); // Load home by default
};

function showTab(tab) {
    const content = document.getElementById("content");
    const body = document.body;

    // Remove 'active' from all nav links
    document.querySelectorAll('.navbar a').forEach(link => {
        link.classList.remove('active');
    });

    // Add 'active' to the clicked link
    const clickedLink = Array.from(document.querySelectorAll('.navbar a')).find(link => link.textContent.toLowerCase() === tab);
    if (clickedLink) clickedLink.classList.add('active');

    // Load content based on tab
    if (tab === "home") {
        body.classList.remove('blog-page');
        loadHTML('components/home.html');
    } else if (tab === "projects") {
        body.classList.remove('blog-page');
        loadHTML('components/resume.html');
    } else if (tab === "blogs") {
        body.classList.add('blog-page');
        loadHTML('components/blog.html');
    }
}

function loadHTML(filePath) {
    fetch(filePath)
        .then(response => response.text())
        .then(data => {
            document.getElementById("content").innerHTML = data;
        });
}

