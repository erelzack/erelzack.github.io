const postStatus = document.querySelector("#postStatus");
const postTitle = document.querySelector("#postTitle");
const postDate = document.querySelector("#postDate");
const postContent = document.querySelector("#postContent");

const params = new URLSearchParams(window.location.search);
const requestedSlug = params.get("post");

loadPost();

async function loadPost() {
  if (!requestedSlug) {
    showError("No post was selected.");
    return;
  }

  try {
    const postsResponse = await fetch("posts.json");

    if (!postsResponse.ok) {
      throw new Error("Could not load posts.json");
    }

    const posts = await postsResponse.json();
    const post = posts.find((item) => item.slug === requestedSlug);

    if (!post) {
      throw new Error("Post was not found in posts.json");
    }

    const texResponse = await fetch(post.file);

    if (!texResponse.ok) {
      throw new Error(`Could not load ${post.file}`);
    }

    const tex = await texResponse.text();
    const parsedPost = parseLatexPost(tex);

    document.title = post.title || parsedPost.title || "Blog Post";
    postTitle.textContent = post.title || parsedPost.title || "Untitled Post";
    postDate.textContent = post.date || parsedPost.date || "";
    postContent.innerHTML = parsedPost.html;
    postStatus.textContent = "";

    if (window.MathJax) {
      window.MathJax.typesetPromise([postContent]);
    }
  } catch (error) {
    showError("Could not load this post. Make sure it exists in posts.json and the .tex file path is correct.");
  }
}

function showError(message) {
  postTitle.textContent = "Post not found";
  postDate.textContent = "";
  postContent.innerHTML = "";
  postStatus.textContent = message;
}

function parseLatexPost(tex) {
  const title = readLatexCommand(tex, "title");
  const date = readLatexCommand(tex, "date");
  let body = getDocumentBody(tex);

  body = stripLatexComments(body);
  body = body
    .replace(/\\maketitle/g, "")
    .replace(/\\tableofcontents/g, "")
    .replace(/\\newpage/g, "")
    .trim();

  const protectedMath = protectMathBlocks(body);
  const html = latexTextToHtml(protectedMath.text, protectedMath.math);

  return { title, date, html };
}

function readLatexCommand(tex, command) {
  const match = tex.match(new RegExp(`\\\\${command}\\{([^}]*)\\}`));
  return match ? match[1].trim() : "";
}

function getDocumentBody(tex) {
  const match = tex.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
  return match ? match[1] : tex;
}

function stripLatexComments(tex) {
  return tex
    .split("\n")
    .map((line) => line.replace(/(^|[^\\])%.*/, "$1").trimEnd())
    .join("\n");
}

function protectMathBlocks(text) {
  const math = [];
  const patterns = [
    /\\begin\{(?:equation|equation\*|align|align\*|gather|gather\*|multline|multline\*)\}[\s\S]*?\\end\{(?:equation|equation\*|align|align\*|gather|gather\*|multline|multline\*)\}/g,
    /\\\[[\s\S]*?\\\]/g,
    /\$\$[\s\S]*?\$\$/g,
    /\\\([\s\S]*?\\\)/g,
  ];

  let protectedText = text;

  patterns.forEach((pattern) => {
    protectedText = protectedText.replace(pattern, (match) => {
      const token = `@@MATH_${math.length}@@`;
      math.push(match);
      return token;
    });
  });

  return { text: protectedText, math };
}

function latexTextToHtml(text, math) {
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block) => latexBlockToHtml(block, math)).join("\n");
}

function latexBlockToHtml(block, math) {
  if (block.startsWith("\\section")) {
    return headingHtml(block, "section", "h2", math);
  }

  if (block.startsWith("\\subsection")) {
    return headingHtml(block, "subsection", "h3", math);
  }

  if (block.startsWith("\\subsubsection")) {
    return headingHtml(block, "subsubsection", "h4", math);
  }

  if (block.startsWith("\\begin{itemize}")) {
    return listHtml(block, "itemize", "ul", math);
  }

  if (block.startsWith("\\begin{enumerate}")) {
    return listHtml(block, "enumerate", "ol", math);
  }

  if (block.startsWith("\\begin{quote}")) {
    return quoteHtml(block, math);
  }

  if (block.startsWith("@@MATH_") && block.endsWith("@@")) {
    return `<div class="math-block">${restoreMath(block, math)}</div>`;
  }

  return `<p>${inlineLatexToHtml(block, math)}</p>`;
}

function headingHtml(block, command, tag, math) {
  const content = readBlockArgument(block, command);
  return `<${tag}>${inlineLatexToHtml(content, math)}</${tag}>`;
}

function listHtml(block, environment, tag, math) {
  const content = block
    .replace(new RegExp(`^\\\\begin\\{${environment}\\}`), "")
    .replace(new RegExp(`\\\\end\\{${environment}\\}$`), "")
    .trim();

  const items = content
    .split(/\\item/g)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `<li>${inlineLatexToHtml(item, math)}</li>`)
    .join("");

  return `<${tag}>${items}</${tag}>`;
}

function quoteHtml(block, math) {
  const content = block
    .replace(/^\\begin\{quote\}/, "")
    .replace(/\\end\{quote\}$/, "")
    .trim();

  return `<blockquote>${inlineLatexToHtml(content, math)}</blockquote>`;
}

function readBlockArgument(block, command) {
  const match = block.match(new RegExp(`^\\\\${command}\\*?\\{([\\s\\S]*)\\}$`));
  return match ? match[1].trim() : block;
}

function inlineLatexToHtml(text, math) {
  let html = escapeHtml(text)
    .replace(/\\LaTeX\{\}/g, "LaTeX")
    .replace(/\\TeX\{\}/g, "TeX")
    .replace(/\\textbf\{([^{}]*)\}/g, "<strong>$1</strong>")
    .replace(/\\emph\{([^{}]*)\}/g, "<em>$1</em>")
    .replace(/\\textit\{([^{}]*)\}/g, "<em>$1</em>")
    .replace(/\\href\{([^{}]*)\}\{([^{}]*)\}/g, '<a href="$1">$2</a>')
    .replace(/\\url\{([^{}]*)\}/g, '<a href="$1">$1</a>')
    .replace(/``/g, "&ldquo;")
    .replace(/''/g, "&rdquo;")
    .replace(/---/g, "&mdash;")
    .replace(/--/g, "&ndash;")
    .replace(/\\ /g, " ")
    .replace(/\\\\/g, "<br>");

  html = html.replace(/@@MATH_(\d+)@@/g, (match, index) => restoreMathByIndex(Number(index), math));

  return html;
}

function restoreMath(token, math) {
  return token.replace(/@@MATH_(\d+)@@/g, (match, index) => restoreMathByIndex(Number(index), math));
}

function restoreMathByIndex(index, math) {
  return escapeHtml(math[index] || "");
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
