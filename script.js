window.onload = function () {
    // Clean up URL - remove index.html if present
    if (window.location.pathname.includes('index.html')) {
        const cleanPath = window.location.pathname.replace(/index\.html$/, '') || '/';
        window.history.replaceState(null, '', cleanPath + window.location.search + window.location.hash);
    }
    
    // Check for hash on page load
    const hash = window.location.hash.substring(1); // Remove the #
    if (hash) {
        showTab(hash);
    } else {
        showTab('home'); // Load home by default
    }
};

// Listen for hash changes (back/forward buttons)
window.addEventListener('hashchange', function() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        showTab(hash);
    }
});

function showTab(tab) {
    const content = document.getElementById("content");
    const body = document.body;

    // Valid routes
    const validRoutes = ['home', 'projects', 'blogs', 'blog-index'];
    
    // If invalid route, redirect to home
    if (tab && !validRoutes.includes(tab)) {
        window.location.hash = 'home';
        showTab('home');
        return;
    }

    // Update URL hash with clean URL (no index.html)
    if (tab === 'home' && !window.location.hash) {
        // Don't add hash for home on initial load
    } else {
        // Ensure we use clean URL without index.html
        const cleanPath = window.location.pathname.replace(/index\.html$/, '') || '/';
        window.history.replaceState(null, '', cleanPath + window.location.search + '#' + tab);
    }

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
    } else if (tab === "blog-index") {
        body.classList.add('blog-page');
        loadHTML('components/blog-index.html');
    }
}

function loadHTML(filePath) {
    fetch(filePath)
        .then(response => response.text())
        .then(data => {
            document.getElementById("content").innerHTML = data;
            // Execute any scripts in the loaded content
            const scripts = document.getElementById("content").querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });
                newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                oldScript.parentNode.replaceChild(newScript, oldScript);
            });
            // If blog-index was loaded, parse the markdown
            if (filePath === 'components/blog-index.html') {
                loadBlogIndex();
            }
            // If blog.html was loaded, the hash-based routing will handle the link
        });
}

async function loadBlogIndex() {
    try {
        const response = await fetch('data/index.md');
        const markdown = await response.text();
        const container = document.getElementById('blog-index-content');
        if (!container) return;
        
        let html = '';
        const lines = markdown.split('\n');
        let inList = false;
        let currentItem = null;
        let inSection = false;
        let inSubsection = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (!line) {
                if (inList && currentItem) {
                    html += currentItem + '</li>';
                    currentItem = null;
                }
                continue;
            }
            
            if (line.startsWith('# ')) {
                html += `<h1>${line.substring(2)}</h1>`;
            }
            else if (line.startsWith('## ')) {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                // Close previous subsection if exists
                if (inSubsection) {
                    html += '</div></div></div>';
                    inSubsection = false;
                }
                // Close previous section if exists
                if (inSection) {
                    html += '</div></div>';
                }
                const sectionTitle = line.substring(3);
                const sectionId = sectionTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                html += `<div class="section-wrapper">
                    <h2 class="section-header" data-section="${sectionId}">
                        <i class="fas fa-chevron-right collapse-icon"></i>
                        <span>${sectionTitle}</span>
                    </h2>
                    <div class="collapsible-section collapsed" id="section-${sectionId}">
                        <div class="section-content">`;
                inSection = true;
            }
            else if (line.startsWith('### ')) {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                // Close previous subsection if exists
                if (inSubsection) {
                    html += '</div></div></div>';
                }
                const subsectionTitle = line.substring(4);
                const subsectionId = 'sub-' + subsectionTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                html += `<div class="subsection-wrapper">
                    <h3 class="subsection-header" data-subsection="${subsectionId}">
                        <i class="fas fa-chevron-right collapse-icon"></i>
                        <span>${subsectionTitle}</span>
                    </h3>
                    <div class="collapsible-subsection collapsed" id="subsection-${subsectionId}">
                        <div class="subsection-content">`;
                inSubsection = true;
            }
            else if (line.startsWith('---')) {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
            }
            else if (line.startsWith('- ')) {
                if (!inList) {
                    html += '<ul>';
                    inList = true;
                }
                
                const content = line.substring(2);
                const boldMatch = content.match(/\*\*(.*?)\*\*/);
                
                if (boldMatch) {
                    const title = boldMatch[1];
                    const afterTitle = content.substring(content.indexOf('**') + title.length + 4).trim();
                    const urlRegex = /https?:\/\/[^\s]+/g;
                    const urls = afterTitle.match(urlRegex) || [];
                    
                    if (currentItem) {
                        html += currentItem + '</li>';
                    }
                    
                    currentItem = `<li><strong>${title}</strong>`;
                    
                    if (urls.length > 0) {
                        currentItem += '<br>';
                        urls.forEach((url, idx) => {
                            if (idx > 0) currentItem += '<br>';
                            currentItem += `<a href="${url}" target="_blank" class="addUnderline">${url}</a>`;
                        });
                    }
                } else {
                    if (currentItem) {
                        html += currentItem + '</li>';
                    }
                    currentItem = `<li>${content}`;
                }
            }
            else if (line.match(/https?:\/\/[^\s]+/)) {
                if (currentItem) {
                    const urls = line.match(/https?:\/\/[^\s]+/g) || [];
                    urls.forEach((url, idx) => {
                        if (idx > 0) currentItem += '<br>';
                        currentItem += `<br><a href="${url}" target="_blank" class="addUnderline">${url}</a>`;
                    });
                }
            }
            else if (!line.startsWith('#') && !line.startsWith('-') && !line.startsWith('---')) {
                if (inList && currentItem && (lines[i].match(/^\s+/) || line.startsWith('*') || line.startsWith('_'))) {
                    currentItem += ' ' + line;
                } else {
                    if (inList && currentItem) {
                        html += currentItem + '</li>';
                        currentItem = null;
                    }
                    if (!inList) {
                        html += `<p>${line}</p>`;
                    }
                }
            }
        }
        
        if (currentItem) {
            html += currentItem + '</li>';
            currentItem = null;
        }
        if (inList) {
            html += '</ul>';
            inList = false;
        }
        
        // Close last subsection if exists
        if (inSubsection) {
            html += '</div></div></div>';
        }
        // Close last section if exists
        if (inSection) {
            html += '</div></div>';
        }
        
        container.innerHTML = html;
        
        // Add click handlers for collapsible H2 sections
        const sectionHeaders = container.querySelectorAll('.section-header');
        sectionHeaders.forEach(header => {
            header.addEventListener('click', function() {
                const sectionId = this.getAttribute('data-section');
                const section = document.getElementById(`section-${sectionId}`);
                const icon = this.querySelector('.collapse-icon');
                
                if (section.classList.contains('collapsed')) {
                    section.classList.remove('collapsed');
                    this.classList.remove('collapsed');
                    icon.classList.remove('fa-chevron-right');
                    icon.classList.add('fa-chevron-down');
                } else {
                    section.classList.add('collapsed');
                    this.classList.add('collapsed');
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-right');
                }
            });
        });
        
        // Add click handlers for collapsible H3 subsections
        const subsectionHeaders = container.querySelectorAll('.subsection-header');
        subsectionHeaders.forEach(header => {
            header.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const subsectionId = this.getAttribute('data-subsection');
                const subsection = document.getElementById(`subsection-${subsectionId}`);
                const icon = this.querySelector('.collapse-icon');
                
                if (!subsection) {
                    return;
                }
                
                const hasCollapsed = subsection.classList.contains('collapsed');
                
                if (hasCollapsed) {
                    subsection.classList.remove('collapsed');
                    icon.classList.remove('fa-chevron-right');
                    icon.classList.add('fa-chevron-down');
                } else {
                    subsection.classList.add('collapsed');
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-right');
                }
            });
        });
    } catch (error) {
        const container = document.getElementById('blog-index-content');
        if (container) {
            container.innerHTML = '<p>Error loading index. Please try again later.</p>';
        }
    }
}

