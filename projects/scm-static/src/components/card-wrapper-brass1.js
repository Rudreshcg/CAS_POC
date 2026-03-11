import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './card-wrapper-brass1.css'

const CardWrapperBrass1 = (props) => {
  return (
    <div
      className={`card-wrapper-brass1-thq-card-wrapper-brass1-elm ${props.rootClassName} `}
    >
      <div className="card-wrapper-brass1-thq-top-accent-bar-elm"></div>
      <div className="card-wrapper-brass1-thq-card-body-elm">
        <span className="card-wrapper-brass1-thq-eye-brow-elm">
          {props.eyeBrow ?? (
            <Fragment>
              <span className="card-wrapper-brass1-text4">Operational AI</span>
            </Fragment>
          )}
        </span>
        <span className="card-wrapper-brass1-thq-title-elm">
          {props.title ?? (
            <Fragment>
              <span className="card-wrapper-brass1-text5">
                Automated Quote Initiation &amp; Selection
              </span>
            </Fragment>
          )}
        </span>
        <span className="card-wrapper-brass1-thq-body-text-elm">
          {props.bodyText ?? (
            <Fragment>
              <span className="card-wrapper-brass1-text2">
                The AI agent uses MRP output, initiates RFQ and compares the
                emails from suppliers or the uploads to Ariba
              </span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="card-wrapper-brass1-thq-card-footer-elm">
        <span className="card-wrapper-brass1-thq-tag-elm">
          {props.tag ?? (
            <Fragment>
              <span className="card-wrapper-brass1-text3">AQS Agent</span>
            </Fragment>
          )}
        </span>
        <span className="card-wrapper-brass1-thq-link-elm">
          {props.link ?? (
            <Fragment>
              <span className="card-wrapper-brass1-text1">Explore-&gt;</span>
            </Fragment>
          )}
        </span>
      </div>
    </div>
  )
}

CardWrapperBrass1.defaultProps = {
  link: undefined,
  bodyText: undefined,
  tag: undefined,
  rootClassName: '',
  eyeBrow: undefined,
  title: undefined,
}

CardWrapperBrass1.propTypes = {
  link: PropTypes.element,
  bodyText: PropTypes.element,
  tag: PropTypes.element,
  rootClassName: PropTypes.string,
  eyeBrow: PropTypes.element,
  title: PropTypes.element,
}

export default CardWrapperBrass1
