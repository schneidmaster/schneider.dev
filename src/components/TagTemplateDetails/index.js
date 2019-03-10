import React from 'react'
import Post from '../Post'

class TagTemplateDetails extends React.Component {
  render() {
    const tagTitle = this.props.pageContext.tag
    const posts = this.props.data.allMarkdownRemark.edges

    return (
      <div className="content">
        <div className="content__inner">
          <div className="page">
            <h1 className="page__title">
              All posts tagged as &quot;{tagTitle}&quot;
            </h1>
            <div className="page__body">
              {posts.map(post => (
                <Post
                  data={post}
                  key={post.node.fields.slug}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default TagTemplateDetails
