import React from "react";
import Helmet from "react-helmet";
import { graphql } from "gatsby";
import Layout from "../components/Layout";
import PostTemplateDetails from "../components/PostTemplateDetails";

class PostTemplate extends React.Component {
  render() {
    const {
      title,
      subtitle,
      siteUrl,
      author: { twitter },
    } = this.props.data.site.siteMetadata;
    const post = this.props.data.markdownRemark;
    const { title: postTitle, description: postDescription } = post.frontmatter;
    const description = postDescription !== null ? postDescription : subtitle;

    return (
      <Layout>
        <div>
          <Helmet>
            <title>{`${postTitle} - ${title}`}</title>
            <meta name="description" content={description} />
            <meta property="og:title" content={postTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={siteUrl + post.fields.slug} />
            <meta property="og:site_name" content={title} />
            <meta property="og:type" content="article" />
            <meta
              property="og:image"
              content={`${siteUrl}${post.fields.slug}twitter-card.jpg`}
            />
            <meta property="og:image:alt" content={postTitle} />
            <meta name="twitter:creator" content={`@${twitter}`} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={postTitle} />
            <meta name="twitter:description" content={description} />
            <meta
              name="twitter:image"
              content={`${siteUrl}${post.fields.slug}twitter-card.jpg`}
            />
          </Helmet>
          <PostTemplateDetails {...this.props} />
        </div>
      </Layout>
    );
  }
}

export default PostTemplate;

export const pageQuery = graphql`
  query PostBySlug($slug: String!) {
    site {
      siteMetadata {
        title
        subtitle
        siteUrl
        copyright
        author {
          name
          email
          twitter
          github
          linkedin
        }
        disqusShortname
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      html
      excerpt
      fields {
        slug
        tagSlugs
        readingTime {
          text
        }
      }
      frontmatter {
        title
        tags
        date
      }
    }
  }
`;
