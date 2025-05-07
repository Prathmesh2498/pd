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
        loadHTML('home.html');
    } else if (tab === "projects") {
        body.classList.remove('blog-page');
        loadMarkdown('resume/resume.html');
    } else if (tab === "blogs") {
        body.classList.add('blog-page');
        loadMarkdown('blogs/blogIndex.md', 'blog-content');
    }
}

function loadHTML(filePath) {
    fetch(filePath)
        .then(response => response.text())
        .then(data => {
            document.getElementById("content").innerHTML = data;
        });
}

function loadMarkdown(filePath, contentClass = 'container') {
    fetch(filePath)
        .then(response => response.text())
        .then(data => {
            // Convert Markdown to HTML (simple)
            const html = markdownToHTML(data);
            if (contentClass != 'container') {
                contentClass = 'container ' + contentClass;
            } else {
                contentClass ='';
            }
            document.getElementById("content").innerHTML = `<div class="${contentClass}">${html}</div>`;
        });
}

function markdownToHTML(markdown) {
    let html = markdown
        .replace(/^#\s(.+)/gm, '<h1>$1</h1>')
        .replace(/^##\s(.+)/gm, '<h2>$1</h2>')
        .replace(/^###\s(.+)/gm, '<h3>$1</h3>')
        .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.+?)\*/g, '<i>$1</i>')
        .replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="Image_Assets/$2" />')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="addUnderline">$1</a>');

    // Handle nested lists and paragraphs
    let listStack = [];
    let inList = false;
    html = html.replace(/^(\s*)(?:(-|\d+\.)\s+(.+)|(.+))$/gm, function(match, indent, listType, listContent, paraContent) {
        let result = '';

        if (listType) {
            // This is a list item
            let indentLevel = indent.length / 2;
            let listTag = listType === '-' ? 'ul' : 'ol';

            // Close any lists that are no longer needed
            while (listStack.length > indentLevel) {
                let lastList = listStack.pop();
                result += `</${lastList}>`;
            }

            // Open new lists if needed
            while (listStack.length < indentLevel) {
                result += `<${listTag}>`;
                listStack.push(listTag);
            }

            // Add the list item
            result += `<li>${listContent}</li>`;
            inList = true;
        } else if (paraContent) {
            // This is a paragraph
            if (inList) {
                // Close all open lists
                while (listStack.length > 0) {
                    let lastList = listStack.pop();
                    result += `</${lastList}>`;
                }
                inList = false;
            }
            result += `<p>${paraContent}</p>`;
        }

        return result;
    });

    // Close any remaining open lists
    while (listStack.length > 0) {
        let lastList = listStack.pop();
        html += `</${lastList}>`;
    }

    return html;
}

