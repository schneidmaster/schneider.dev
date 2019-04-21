import React from "react";
import Post from "../Post";

class CategoryTemplateDetails extends React.Component {
  render() {
    const { category } = this.props.pageContext;
    const posts = this.props.data.allMarkdownRemark.edges;

    return (
      <div className="content">
        <div className="content__inner">
          <div className="page">
            <h1 className="page__title">{category}</h1>
            <div className="page__body">
              {posts.map((post) => (
                <Post data={post} key={post.node.fields.slug} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CategoryTemplateDetails;
