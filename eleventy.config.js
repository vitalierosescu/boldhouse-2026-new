require('dotenv').config()

const imageUrlBuilder = require('@sanity/image-url').default
const { toHTML, escapeHTML } = require('@portabletext/to-html')

const imageBuilder = imageUrlBuilder({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || 'production',
})

module.exports = function (eleventyConfig) {
  // Build an optimised Sanity image URL. Usage: {{ image | sanityImage(1600) }}
  eleventyConfig.addFilter('sanityImage', (source, width, height) => {
    if (!source || !source.asset) return '';
    let b = imageBuilder.image(source).auto('format').fit('max');
    if (width) b = b.width(Number(width));
    if (height) b = b.height(Number(height));
    return b.url();
  });

  // Render Portable Text (manifesto, terms) to HTML.
  eleventyConfig.addFilter('portableText', (blocks) => (blocks ? toHTML(blocks) : ''));

  // Convert newlines to <br> for headlines that wrap lines in the design.
  eleventyConfig.addFilter('breaks', (str) => (str ? String(str).replace(/\r?\n/g, '<br>') : ''));

  // Render Portable Text as a single inline run (strong marks kept, blocks
  // joined by <br><br>) — for the manifesto hero, which is one <p> the
  // SplitText animation targets.
  eleventyConfig.addFilter('richInline', (blocks) => {
    if (!blocks) return '';
    return blocks
      .map((block) =>
        (block.children || [])
          .map((s) => {
            const text = escapeHTML(s.text || '');
            return (s.marks || []).includes('strong') ? `<strong>${text}</strong>` : text;
          })
          .join('')
      )
      .join('<br><br>');
  });

  // Static assets are served verbatim — the Webflow CSS, images, fonts and the
  // js/ folder. The Vite-built main.js is loaded at runtime via the smart
  // script loader (localhost:4000 or Vercel), so it is NOT part of this build.
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("fonts");
  eleventyConfig.addPassthroughCopy("js");

  // Preserve flat .html URLs (club.html, not /club/) so the existing
  // href="*.html" links and Barba's page fetching keep working unchanged.
  eleventyConfig.addGlobalData("eleventyComputed", {
    permalink: (data) => `${data.page.filePathStem}.html`,
  });

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    // Webflow exports are .html — process them through Nunjucks so pages can
    // use a layout + {% include %} partials. Pages without front matter pass
    // through unchanged.
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["html", "njk"],
  };
};
