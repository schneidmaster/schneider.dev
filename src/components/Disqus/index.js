import React from "react";
import ReactDisqusComments from "react-disqus-comments";

const Disqus = ({ postNode, siteMetadata }) => {
  const post = postNode.frontmatter;
  const url = siteMetadata.siteUrl + postNode.fields.slug;
  return (
    <ReactDisqusComments
      shortname={siteMetadata.disqusShortname}
      identifier={postNode.fields.slug.replace(/\/$/, "")}
      title={post.title}
      url={url}
    />
  );
};

export default Disqus;
