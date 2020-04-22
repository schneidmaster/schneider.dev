import React, { Fragment } from "react";
import { Link } from "gatsby";
import moment from "moment";
import Disqus from "../Disqus";
import Links from "../Links";
import profilePic from "../../assets/avatar.png";
import "./style.scss";

class PostTemplateDetails extends React.Component {
  render() {
    const { author, subtitle, siteUrl } = this.props.data.site.siteMetadata;
    const post = this.props.data.markdownRemark;
    const tags = post.fields.tagSlugs;
    const readingTime = post.fields.readingTime.text;

    return (
      <div>
        <div>
          <Link className="post-single__home-button" to="/">
            All posts
          </Link>
        </div>
        <div className="post-single">
          <div className="post-single__inner">
            <h1 className="post-single__title">{post.frontmatter.title}</h1>
            <div className="post-single__dateline">
              {moment(post.frontmatter.date).format("MMMM D, YYYY")}
              {"\xa0\u2022\xa0"}
              {readingTime}
            </div>
            <div
              className="post-single__body"
              /* eslint-disable-next-line react/no-danger */
              dangerouslySetInnerHTML={{ __html: post.html }}
            />
            <div className="post-single__tags">
              <em>Tags:</em>
              {"\xa0"}
              {tags.map((tag, i) => (
                <Fragment key={tag}>
                  <Link key={tag} to={tag} className="post-single__tag">
                    {post.frontmatter.tags[i]}
                  </Link>
                  {i + 1 < tags.length && ",\xa0"}
                </Fragment>
              ))}
            </div>
          </div>
          <div className="post-single__footer">
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
                  <Links siteUrl={siteUrl} data={author} />
                </div>
              </div>
            </div>

            <Disqus
              postNode={post}
              siteMetadata={this.props.data.site.siteMetadata}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default PostTemplateDetails;
