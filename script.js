const helloButton = document.querySelector("#helloButton");
const message = document.querySelector("#message");
const blogToggle = document.querySelector("#blogToggle");
const blogSection = document.querySelector("#blog");
const closeBlogButton = document.querySelector("#closeBlogButton");
const blogStatus = document.querySelector("#blogStatus");
const blogList = document.querySelector("#blogList");

let blogPostsLoaded = false;

helloButton.addEventListener("click", () => {
  message.textContent = "Your JavaScript is working!";
});

blogToggle.addEventListener("click", async () => {
  const isOpening = blogSection.hidden;

  blogSection.hidden = !isOpening;
  blogToggle.setAttribute("aria-expanded", String(isOpening));

  if (isOpening) {
    blogSection.scrollIntoView({ behavior: "smooth" });
    await loadBlogPosts();
  }
});

closeBlogButton.addEventListener("click", () => {
  blogSection.hidden = true;
  blogToggle.setAttribute("aria-expanded", "false");
});

async function loadBlogPosts() {
  if (blogPostsLoaded) {
    return;
  }

  try {
    const response = await fetch("blog/posts.json");

    if (!response.ok) {
      throw new Error("Could not load blog/posts.json");
    }

    const posts = await response.json();
    renderBlogPosts(posts);
    blogPostsLoaded = true;
  } catch (error) {
    blogStatus.textContent = "Could not load blog posts. Check that blog/posts.json exists.";
  }
}

function renderBlogPosts(posts) {
  blogList.innerHTML = "";

  if (!posts.length) {
    blogStatus.textContent = "No blog posts yet.";
    return;
  }

  blogStatus.textContent = "";

  posts.forEach((post) => {
    const postLink = document.createElement("a");
    postLink.className = "blog-post";
    postLink.href = post.url;

    postLink.innerHTML = `
      <h3>${post.title}</h3>
      <p class="blog-meta">${post.date}</p>
      <p>${post.description}</p>
    `;

    blogList.appendChild(postLink);
  });
}
