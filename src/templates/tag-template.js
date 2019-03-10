import React from 'react'
import Helmet from 'react-helmet'
import { graphql } from 'gatsby'
import Layout from '../components/Layout'
import Sidebar from '../components/Sidebar'
import TagTemplateDetails from '../components/TagTemplateDetails'

class TagTemplate extends React.Component {
  render() {
    const { title } = this.props.data.site.siteMetadata
    const { tag } = this.props.pageContext

    return (
      <Layout>
        <div>
          <Helmet title={`All posts tagged as "${tag}" - ${title}`} />
          <Sidebar {...this.props} />
          <TagTemplateDetails {...this.props} />
        </div>
      </Layout>
    )
  }
}

export default TagTemplate

export const pageQuery = graphql`
  query TagPage($tag: String) {
    site {
      siteMetadata {
        title
        subtitle
        copyright
        url
        menu {
          label
          path
        }
        author {
          name
          email
          twitter
          github
          linkedin
        }
      }
    }
    allMarkdownRemark(
      limit: 1000
      filter: {
        frontmatter: {
          tags: { in: [$tag] }
          layout: { eq: "post" }
          draft: { ne: true }
        }
      }
      sort: { order: DESC, fields: [frontmatter___date] }
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
            title
            date
            category
          }
        }
      }
    }
  }
`
