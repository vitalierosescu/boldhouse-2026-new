require('dotenv').config()

module.exports = function (eleventyConfig) {
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
