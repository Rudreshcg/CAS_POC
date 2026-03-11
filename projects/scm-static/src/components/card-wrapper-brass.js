import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './card-wrapper-brass.css'

const CardWrapperBrass = (props) => {
  return (
    <div
      className={`card-wrapper-brass-thq-card-wrapper-elm ${props.rootClassName} `}
    >
      <div className="card-wrapper-brass-thq-top-accent-bar-elm"></div>
      <div className="card-wrapper-brass-thq-card-body-elm">
        <span className="card-wrapper-brass-thq-eye-brow-elm">
          {props.eyeBrow ?? (
            <Fragment>
              <span className="card-wrapper-brass-text5">Operational AI</span>
            </Fragment>
          )}
        </span>
        <span className="card-wrapper-brass-thq-title-elm">
          {props.title ?? (
            <Fragment>
              <span className="card-wrapper-brass-text3">
                Automated Quote Initiation &amp; Selection
              </span>
            </Fragment>
          )}
        </span>
        <span className="card-wrapper-brass-thq-body-text-elm">
          {props.bodyText ?? (
            <Fragment>
              <span className="card-wrapper-brass-text2">
                The AI agent uses MRP output, initiates RFQ and compares the
                emails from suppliers or the uploads to Ariba
              </span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="card-wrapper-brass-thq-card-footer-elm">
        <span className="card-wrapper-brass-thq-tag-elm">
          {props.tag ?? (
            <Fragment>
              <span className="card-wrapper-brass-text1">AQS Agent</span>
            </Fragment>
          )}
        </span>
        <span className="card-wrapper-brass-thq-link-elm">
          {props.link ?? (
            <Fragment>
              <span className="card-wrapper-brass-text4">Explore-&gt;</span>
            </Fragment>
          )}
        </span>
      </div>
    </div>
  )
}

CardWrapperBrass.defaultProps = {
  tag: undefined,
  bodyText: undefined,
  title: undefined,
  link: undefined,
  rootClassName: '',
  eyeBrow: undefined,
}

CardWrapperBrass.propTypes = {
  tag: PropTypes.element,
  bodyText: PropTypes.element,
  title: PropTypes.element,
  link: PropTypes.element,
  rootClassName: PropTypes.string,
  eyeBrow: PropTypes.element,
}

export default CardWrapperBrass
