import React from 'react'
import ReactMarkdown from 'react-markdown'

const markdownComponents = {
  a: ({ children, href, ...otherProps }) => {
    // add rel and target for external links so we don't leak information :)
    const externalLinkProps = /^https?:\/\//i.test(href)
      ? { rel: 'nofollow noreferrer noopener', target: '_blank' }
      : {}

    return (
      <a {...otherProps} href={href} {...externalLinkProps}>
        {children}
      </a>
    )
  },
}

const Markdown = ({ children }) => (
  <ReactMarkdown components={markdownComponents}>{children}</ReactMarkdown>
)

export default Markdown
