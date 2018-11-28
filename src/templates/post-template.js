import React from 'react'
import Helmet from 'react-helmet'
import { graphql } from 'gatsby'
import Layout from '../components/Layout'
import PostTemplateDetails from '../components/PostTemplateDetails'

class PostTemplate extends React.Component {
  render() {
    const { title, subtitle, url } = this.props.data.site.siteMetadata
    const post = this.props.data.markdownRemark
    const { title: postTitle, description: postDescription } = post.frontmatter
    const description = postDescription !== null ? postDescription : subtitle

    return (
      <Layout>
        <div>
          <Helmet>
            <title>{`${postTitle} - ${title}`}</title>
            <meta name="description" content={description} />
            <meta name="og:title" content={postTitle} />
            <meta name="og:description" content={description} />
            <meta name="og:url" content={url + post.fields.slug} />
            <meta name="og:site_name" content={title} />
            <meta name="og:type" content="article" />
          </Helmet>
          <PostTemplateDetails {...this.props} />
        </div>
      </Layout>
    )
  }
}

export default PostTemplate

export const pageQuery = graphql`
  query PostBySlug($slug: String!) {
    site {
      siteMetadata {
        title
        subtitle
        url
        copyright
        author {
          name
          email
          twitter
          github
          linkedin
        }
        url
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      html
      excerpt
      fields {
        slug
        tagSlugs
      }
      frontmatter {
        title
        tags
        date
      }
    }
  }
`
