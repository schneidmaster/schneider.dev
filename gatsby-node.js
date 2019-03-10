const _ = require('lodash');
const Promise = require('bluebird');
const path = require('path');
const { createFilePath } = require('gatsby-source-filesystem');
const createPaginatedPages = require('gatsby-paginate');
const slash = require('slash');

exports.createPages = ({ graphql, actions }) => {
  const { createPage } = actions;

  return new Promise((resolve, reject) => {
    const postTemplate = path.resolve('./src/templates/post-template.js');
    const pageTemplate = path.resolve('./src/templates/page-template.js');
    const tagTemplate = path.resolve('./src/templates/tag-template.js');
    const categoryTemplate = path.resolve(
      './src/templates/category-template.js'
    );

    graphql(`
      {
        allMarkdownRemark(
          limit: 1000
          filter: { frontmatter: { draft: { ne: true } } }
          sort: { fields: [frontmatter___date], order: DESC }
        ) {
          edges {
            node {
              excerpt
              fields {
                slug
                categorySlug
                readingTime {
                  text
                }
              }
              frontmatter {
                layout
                title
                date
                tags
                category
              }
            }
          }
        }
      }
    `).then((result) => {
      if (result.errors) {
        console.log(result.errors);
        reject(result.errors);
      }

      const results = result.data.allMarkdownRemark.edges;
      const pages = results.filter(
        (page) => page.node.frontmatter.layout === 'page'
      );
      const posts = results.filter(
        (post) => post.node.frontmatter.layout === 'post'
      );

      // Create the paginated post indexes.
      createPaginatedPages({
        edges: posts,
        pageTemplate: 'src/templates/home-template.js',
        createPage,
      });

      // Create the pages.
      pages.forEach((page) => {
        createPage({
          path: page.node.fields.slug,
          component: slash(pageTemplate),
          context: { slug: page.node.fields.slug },
        });
      });

      // And the posts.
      posts.forEach((post) => {
        createPage({
          path: post.node.fields.slug,
          component: slash(postTemplate),
          context: { slug: post.node.fields.slug },
        });

        let tags = [];
        if (_.get(post, 'node.frontmatter.tags')) {
          tags = tags.concat(post.node.frontmatter.tags);
        }

        tags = _.uniq(tags);
        _.each(tags, (tag) => {
          const tagPath = `/tags/${_.kebabCase(tag)}/`;
          createPage({
            path: tagPath,
            component: tagTemplate,
            context: { tag },
          });
        });

        let categories = [];
        if (_.get(post, 'node.frontmatter.category')) {
          categories = categories.concat(post.node.frontmatter.category);
        }

        categories = _.uniq(categories);
        _.each(categories, (category) => {
          const categoryPath = `/categories/${_.kebabCase(category)}/`;
          createPage({
            path: categoryPath,
            component: categoryTemplate,
            context: { category },
          });
        });
      });

      resolve();
    });
  });
};

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;

  if (node.internal.type === 'File') {
    const parsedFilePath = path.parse(node.absolutePath);
    const slug = `/${parsedFilePath.dir.split('---')[1]}/`;
    createNodeField({ node, name: 'slug', value: slug });
  } else if (node.internal.type === 'MarkdownRemark') {
    const value = createFilePath({ node, getNode });
    createNodeField({
      node,
      name: 'slug',
      value: value.replace(/pages\//, '').replace(/\d\d\d\d-\d\d-\d\d-/, ''),
    });

    if (node.frontmatter.tags) {
      const tagSlugs = node.frontmatter.tags.map(
        (tag) => `/tags/${_.kebabCase(tag)}/`
      );
      createNodeField({ node, name: 'tagSlugs', value: tagSlugs });
    }

    if (typeof node.frontmatter.category !== 'undefined') {
      const categorySlug = `/categories/${_.kebabCase(
        node.frontmatter.category
      )}/`;
      createNodeField({ node, name: 'categorySlug', value: categorySlug });
    }
  }
};
