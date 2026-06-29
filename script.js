const helloButton = document.querySelector("#helloButton");
const message = document.querySelector("#message");
const blogToggle = document.querySelector("#blogToggle");
const blogSection = document.querySelector("#blog");
const closeBlogButton = document.querySelector("#closeBlogButton");
const blogStatus = document.querySelector("#blogStatus");
const blogList = document.querySelector("#blogList");

let blogPostsLoaded = false;

const fallbackPosts = [
  {
    title: "Sample Blog Post",
    date: "2026-06-29",
    description: "A first example post. Later this can point to a page generated from LaTeX.",
    url: "blog/posts/sample-post.html",
  },
];

if (helloButton && message) {
  helloButton.addEventListener("click", () => {
    message.textContent = "Your JavaScript is working!";
  });
}

if (blogToggle && blogSection) {
  blogToggle.addEventListener("click", async (event) => {
    event.preventDefault();

    if (blogSection.classList.contains("is-hidden")) {
      await openBlog();
    } else {
      closeBlog();
    }
  });
}

if (closeBlogButton) {
  closeBlogButton.addEventListener("click", closeBlog);
}

async function openBlog() {
  blogSection.classList.remove("is-hidden");
  blogToggle.setAttribute("aria-expanded", "true");
  blogSection.scrollIntoView({ behavior: "smooth" });
  await loadBlogPosts();
}

function closeBlog() {
  blogSection.classList.add("is-hidden");
  blogToggle.setAttribute("aria-expanded", "false");
}

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
    renderBlogPosts(fallbackPosts);
    blogStatus.textContent = "Showing sample posts. If you opened this with file://, use GitHub Pages or a local server to load blog/posts.json.";
    blogPostsLoaded = true;
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
    const postTitle = document.createElement("h3");
    const postDate = document.createElement("p");
    const postDescription = document.createElement("p");

    postLink.className = "blog-post";
    postLink.href = post.url;

    postTitle.textContent = post.title;
    postDate.className = "blog-meta";
    postDate.textContent = post.date;
    postDescription.textContent = post.description;

    postLink.append(postTitle, postDate, postDescription);
    blogList.appendChild(postLink);
  });
}
