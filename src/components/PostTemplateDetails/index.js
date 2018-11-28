import React from 'react'
import { Link } from 'gatsby'
import moment from 'moment'
import Links from '../Links'
import profilePic from '../../assets/avatar.png'
import './style.scss'

class PostTemplateDetails extends React.Component {
  render() {
    const { author, subtitle, url } = this.props.data.site.siteMetadata
    const post = this.props.data.markdownRemark
    const tags = post.fields.tagSlugs

    const homeBlock = (
      <div>
        <Link className="post-single__home-button" to="/">
          All Posts
        </Link>
      </div>
    )

    const tagsBlock = (
      <div className="post-single__tags">
        <ul className="post-single__tags-list">
          {tags &&
            tags.map((tag, i) => (
              <li className="post-single__tags-list-item" key={tag}>
                <Link to={tag} className="post-single__tags-list-item-link">
                  {post.frontmatter.tags[i]}
                </Link>
              </li>
            ))}
        </ul>
      </div>
    )

    return (
      <div>
        {homeBlock}
        <div className="post-single">
          <div className="post-single__inner">
            <h1 className="post-single__title">{post.frontmatter.title}</h1>
            <div
              className="post-single__body"
              /* eslint-disable-next-line react/no-danger */
              dangerouslySetInnerHTML={{ __html: post.html }}
            />
            <div className="post-single__date">
              <em>
                Published {moment(post.frontmatter.date).format('D MMM YYYY')}
              </em>
            </div>
          </div>
          <div className="post-single__footer">
            {tagsBlock}
            <hr />
            <div className="post-single__footer-bio-container">
              <div className="post-single__footer-bio">
                <div className="post-single__footer-bio-avatar">
                  <img
                    src={profilePic}
                    width="75"
                    height="75"
                    alt={author.name}
                  />
                </div>
                <div className="post-single__footer-bio-desc">
                  <h4>Zach Schneider</h4>
                  {subtitle}
                  <Links siteUrl={url} data={author} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default PostTemplateDetails
