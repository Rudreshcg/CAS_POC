import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './card-wrapper-teal.css'

const CardWrapperTeal = (props) => {
  return (
    <div
      className={`card-wrapper-teal-thq-card-wrapper-teal-elm ${props.rootClassName} `}
    >
      <div className="card-wrapper-teal-thq-top-accent-bar-elm"></div>
      <div className="card-wrapper-teal-thq-card-body-elm">
        <span className="card-wrapper-teal-thq-eye-brow-elm">
          {props.eyeBrow ?? (
            <Fragment>
              <span className="card-wrapper-teal-text1">Operational AI</span>
            </Fragment>
          )}
        </span>
        <span className="card-wrapper-teal-thq-title-elm">
          {props.title ?? (
            <Fragment>
              <span className="card-wrapper-teal-text2">
                Automated Quote Initiation &amp; Selection
              </span>
            </Fragment>
          )}
        </span>
        <span className="card-wrapper-teal-thq-body-text-elm">
          {props.bodyText ?? (
            <Fragment>
              <span className="card-wrapper-teal-text4">
                The AI agent uses MRP output, initiates RFQ and compares the
                emails from suppliers or the uploads to Ariba
              </span>
            </Fragment>
          )}
        </span>
      </div>
      <div className="card-wrapper-teal-thq-card-footer-elm">
        <span className="card-wrapper-teal-thq-tag-elm">
          {props.tag ?? (
            <Fragment>
              <span className="card-wrapper-teal-text5">AQS Agent</span>
            </Fragment>
          )}
        </span>
        <span className="card-wrapper-teal-thq-link-elm">
          {props.link ?? (
            <Fragment>
              <span className="card-wrapper-teal-text3">Explore-&gt;</span>
            </Fragment>
          )}
        </span>
      </div>
    </div>
  )
}

CardWrapperTeal.defaultProps = {
  rootClassName: '',
  eyeBrow: undefined,
  title: undefined,
  link: undefined,
  bodyText: undefined,
  tag: undefined,
}

CardWrapperTeal.propTypes = {
  rootClassName: PropTypes.string,
  eyeBrow: PropTypes.element,
  title: PropTypes.element,
  link: PropTypes.element,
  bodyText: PropTypes.element,
  tag: PropTypes.element,
}

export default CardWrapperTeal
