import React from 'react'
import Helmet from 'react-helmet'
import { graphql, Link } from 'gatsby'
import Layout from '../components/Layout'
import Post from '../components/Post'
import Sidebar from '../components/Sidebar'

class IndexRoute extends React.Component {
  render() {
    const items = []
    const { title, subtitle, url } = this.props.data.site.siteMetadata
    const {
      group: posts,
      index,
      pageCount,
    } = this.props.pageContext
    posts.forEach(post => {
      items.push(<Post data={post} key={post.node.fields.slug} />)
    })

    return (
      <Layout>
        <div>
          <Helmet>
            <title>{title}</title>
            <meta name="description" content={subtitle} />
            <meta name="og:title" content={title} />
            <meta name="og:description" content={subtitle} />
            <meta name="og:url" content={url} />
            <meta name="og:site_name" content={title} />
            <meta name="og:type" content="website" />
          </Helmet>
          <Sidebar {...this.props} />
          <div className="content">
            <div className="content__inner">
              {items}

              <div className="content__links">
                {
                  index > 1 &&
                  <Link to={`/${index === 2 ? '' : index - 1}`} rel="prev">
                    ← Previous page
                  </Link>
                }

                {
                  index < pageCount &&
                  <Link to={`/${index + 1}`} rel="next">
                    Next page →
                  </Link>
                }
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }
}

export default IndexRoute

export const pageQuery = graphql`
  query IndexQuery {
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
  }
`
